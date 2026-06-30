import { validateDailySummary, type DailySummarySchema } from "./aiSchemas";
import { runAiTask } from "./aiGateway";
import { normalizeDailySummaryInput, type NormalizedDailySummaryInput } from "./inputNormalizers";
import { selectModelForTask } from "./modelRouter";
import { createRequestId, createTelemetryRecorder } from "./aiTelemetry";
import { getPromptDefinition } from "./prompts";
import {
  createDailySummaryCacheKey,
  dailySummaryCacheStore,
  type SummaryCacheStore,
} from "./summaryCache";
import type { AiFallbackReason, AiMode } from "./types";

export interface DailySummaryRequest extends Partial<NormalizedDailySummaryInput> {
  excerpts?: string[];
}

export interface DailySummaryResponse {
  mode: AiMode;
  reason?: AiFallbackReason;
  cached: boolean;
  summary: DailySummarySchema;
}

interface DailySummaryEnv {
  AI_MODE?: string;
  AI_SUMMARY_MODE?: string;
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_BASE_URL?: string;
  DEEPSEEK_SMALL_MODEL?: string;
  DEEPSEEK_PRO_MODEL?: string;
  AI_TIMEOUT_MS?: string;
  AI_PRO_TIMEOUT_MS?: string;
}

interface GenerateDailySummaryOptions {
  env: DailySummaryEnv;
  fetchImpl?: typeof fetch;
  cacheStore?: SummaryCacheStore;
}

export async function generateDailySummaryWithGateway(
  rawInput: unknown,
  options: GenerateDailySummaryOptions,
): Promise<DailySummaryResponse> {
  const normalized = normalizeDailySummaryInput(rawInput);

  if (normalized.ok === false) {
    return {
      mode: "mock",
      reason: normalized.errorType === "empty_input" ? "invalid_input" : "invalid_input",
      cached: false,
      summary: buildFallbackDailySummaryFromInput(),
    };
  }

  const input = normalized.value;
  const prompt = getPromptDefinition<NormalizedDailySummaryInput, DailySummarySchema>("daily_summary", input.promptVersion);
  const userPrompt = prompt.buildUserPrompt(input);
  const inputText = `${prompt.systemPrompt}\n${userPrompt}`;
  const route = selectModelForTask({
    task: "daily_summary",
    inputCharCount: inputText.length,
    text: inputText,
    smallModel: options.env.DEEPSEEK_SMALL_MODEL,
    proModel: options.env.DEEPSEEK_PRO_MODEL,
  });
  const cacheStore = options.cacheStore ?? dailySummaryCacheStore;
  const cacheKey = await createDailySummaryCacheKey({
    bookId: input.bookId,
    startPage: input.startPage,
    endPage: input.endPage,
    excerpts: input.excerpts,
    promptVersion: input.promptVersion,
    model: route.model,
  });
  const mode = normalizeMode(options.env.AI_SUMMARY_MODE ?? options.env.AI_MODE);
  const telemetry = createTelemetryRecorder();
  const requestId = createRequestId("summary");

  if (mode === "live") {
    const cached = await cacheStore.get(cacheKey);
    if (cached) {
      telemetry.record({
        requestId,
        feature: "daily-summary",
        task: "daily_summary",
        mode: "live",
        promptVersion: input.promptVersion,
        model: route.model,
        modelTier: route.tier,
        thinkingEnabled: route.thinking.type === "enabled",
        inputCharCount: inputText.length,
        outputCharCount: JSON.stringify(cached).length,
        createdAt: new Date().toISOString(),
      });

      return {
        mode: "live",
        cached: true,
        summary: cached,
      };
    }
  }

  const result = await runAiTask<DailySummarySchema>({
    task: "daily_summary",
    mode,
    apiKey: options.env.DEEPSEEK_API_KEY,
    baseUrl: options.env.DEEPSEEK_BASE_URL,
    smallModel: options.env.DEEPSEEK_SMALL_MODEL,
    proModel: options.env.DEEPSEEK_PRO_MODEL,
    timeoutMs: Number(options.env.AI_TIMEOUT_MS || 12_000),
    thinkingTimeoutMs: Number(options.env.AI_PRO_TIMEOUT_MS || 30_000),
    messages: [
      { role: "system", content: prompt.systemPrompt },
      { role: "user", content: userPrompt },
    ],
    inputText,
    responseFormat: prompt.responseFormat,
    fallback: prompt.fallback(input),
    fetchImpl: options.fetchImpl,
    parse: (content) => validateDailySummary(parseJsonObject(content)),
  });

  if (result.mode === "live") {
    await cacheStore.set(cacheKey, result.data);
  }

  telemetry.record({
    requestId,
    feature: "daily-summary",
    task: "daily_summary",
    mode: result.mode,
    promptVersion: input.promptVersion,
    model: result.model ?? route.model,
    modelTier: result.modelTier ?? route.tier,
    thinkingEnabled: result.thinkingEnabled ?? route.thinking.type === "enabled",
    latencyMs: result.latencyMs,
    inputCharCount: inputText.length,
    outputCharCount: JSON.stringify(result.data).length,
    usage: result.usage,
    fallbackReason: result.fallbackReason,
    errorType: result.errorType,
    createdAt: new Date().toISOString(),
  });

  return {
    mode: result.mode,
    reason: result.fallbackReason,
    cached: false,
    summary: result.data,
  };
}

export function buildFallbackDailySummaryFromInput(input?: Partial<NormalizedDailySummaryInput>): DailySummarySchema {
  const bookTitle = input?.bookTitle || "今天的阅读内容";
  const startPage = input?.startPage || 1;
  const endPage = input?.endPage || startPage;
  const firstExcerpt = input?.excerpts?.find((excerpt) => excerpt.trim().length > 0)?.replace(/\s+/g, " ").trim();

  return {
    quote: "微光已经亮起，今天先读到这里也很好。",
    items: [
      `你今天读到了《${bookTitle}》第 ${startPage} 页至第 ${endPage} 页，先开始这件事本身就值得被记录。`,
      firstExcerpt ? `今天可以先记住这一点：${firstExcerpt.slice(0, 80)}` : "今天的阅读内容可以先收成一个小线索，明天再慢慢接上。",
      "如果还想继续复盘，可以等看完总结后再选择下一步问题。",
    ],
  };
}

function parseJsonObject(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`schema_error: invalid JSON response: ${error instanceof Error ? error.message : "unknown"}`);
  }
}

function normalizeMode(mode?: string): AiMode {
  return mode?.toLowerCase() === "live" ? "live" : "mock";
}
