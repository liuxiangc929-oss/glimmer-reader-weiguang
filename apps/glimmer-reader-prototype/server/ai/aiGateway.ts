import { AI_BUDGETS } from "./aiBudgets";
import { callDeepSeekChat } from "./deepseekProvider";
import { normalizeAiError } from "./aiErrors";
import { selectModelForTask } from "./modelRouter";
import type { AiFallbackReason, AiGatewayResult, AiMessage, AiMode, AiTask } from "./types";

interface RunAiTaskOptions<T> {
  task: AiTask;
  mode?: string;
  apiKey?: string;
  baseUrl?: string;
  smallModel?: string;
  proModel?: string;
  messages: AiMessage[];
  inputText?: string;
  routingText?: string;
  responseFormat?: { type: "json_object" };
  fallback: T;
  timeoutMs?: number;
  thinkingTimeoutMs?: number;
  fetchImpl?: typeof fetch;
  parse?: (content: string) => T;
}

export async function runAiTask<T>(options: RunAiTaskOptions<T>): Promise<AiGatewayResult<T>> {
  const mode = normalizeMode(options.mode);

  if (mode !== "live") {
    return buildFallback(options.fallback, "mock_mode");
  }

  if (!options.apiKey?.trim()) {
    return buildFallback(options.fallback, "missing_api_key");
  }

  const inputText = options.inputText || options.messages.map((message) => message.content).join("\n");
  const routingText = options.routingText || inputText;
  const route = selectModelForTask({
    task: options.task,
    inputCharCount: routingText.length,
    text: routingText,
    smallModel: options.smallModel,
    proModel: options.proModel,
  });
  const budget = AI_BUDGETS[options.task];
  const maxTokens = route.thinking.type === "enabled"
    ? budget.thinkingMaxOutputTokens ?? budget.maxOutputTokens
    : budget.maxOutputTokens;
  const timeoutMs = resolveTaskTimeoutMs(
    route.thinking.type === "enabled",
    options.timeoutMs,
    options.thinkingTimeoutMs,
  );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await callDeepSeekChat({
      apiKey: options.apiKey,
      baseUrl: options.baseUrl,
      model: route.model,
      messages: options.messages,
      maxTokens,
      thinking: route.thinking,
      reasoningEffort: route.reasoningEffort,
      responseFormat: options.responseFormat,
      signal: controller.signal,
      fetchImpl: options.fetchImpl,
    });
    const data = options.parse ? options.parse(response.content) : (response.content as T);

    return {
      mode: "live",
      data,
      model: response.model,
      modelTier: route.tier,
      thinkingEnabled: route.thinking.type === "enabled",
      latencyMs: response.latencyMs,
      usage: response.usage,
    };
  } catch (error) {
    const normalized = normalizeAiError(error);
    return {
      ...buildFallback(options.fallback, toFallbackReason(normalized.type)),
      errorType: normalized.type,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function resolveTaskTimeoutMs(
  thinkingEnabled: boolean,
  timeoutMs = 12_000,
  thinkingTimeoutMs = 30_000,
): number {
  return thinkingEnabled ? Math.max(timeoutMs, thinkingTimeoutMs) : timeoutMs;
}

function buildFallback<T>(fallback: T, reason: AiFallbackReason): AiGatewayResult<T> {
  return {
    mode: "mock",
    data: fallback,
    fallbackReason: reason,
  };
}

function normalizeMode(mode?: string): AiMode {
  return mode?.toLowerCase() === "live" ? "live" : "mock";
}

function toFallbackReason(type: string): AiFallbackReason {
  if (type === "timeout") return "timeout";
  if (type === "rate_limited") return "rate_limited";
  if (type === "schema_error") return "schema_error";
  if (type === "invalid_input") return "invalid_input";
  return "provider_error";
}
