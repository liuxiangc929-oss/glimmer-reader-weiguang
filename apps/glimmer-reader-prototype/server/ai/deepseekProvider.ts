import { AiProviderError } from "./aiErrors";
import type { AiMessage, AiReasoningEffort, AiThinkingConfig, AiUsage } from "./types";

interface DeepSeekChatOptions {
  apiKey: string;
  baseUrl?: string;
  model: string;
  messages: AiMessage[];
  maxTokens: number;
  thinking: AiThinkingConfig;
  reasoningEffort?: AiReasoningEffort;
  responseFormat?: { type: "json_object" };
  userId?: string;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

interface DeepSeekChatResult {
  content: string;
  reasoningContent?: string;
  model: string;
  usage?: AiUsage;
  latencyMs: number;
  rawStatus: number;
}

export async function callDeepSeekChat(options: DeepSeekChatOptions): Promise<DeepSeekChatResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = (options.baseUrl || process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
  const startedAt = Date.now();

  const response = await fetchImpl(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      stream: false,
      max_tokens: options.maxTokens,
      thinking: options.thinking,
      ...(options.reasoningEffort ? { reasoning_effort: options.reasoningEffort } : {}),
      ...(options.responseFormat ? { response_format: options.responseFormat } : {}),
      ...(options.userId ? { user_id: options.userId } : {}),
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    throw new AiProviderError(`DeepSeek request failed with ${response.status}`, response.status);
  }

  const payload = await response.json();
  const choice = Array.isArray(payload.choices) ? payload.choices[0] : undefined;
  const message = choice?.message;
  const content = typeof message?.content === "string" ? message.content : "";

  if (!content.trim()) {
    throw new AiProviderError("DeepSeek response did not include content.", response.status);
  }

  return {
    content,
    reasoningContent: typeof message?.reasoning_content === "string" ? message.reasoning_content : undefined,
    model: typeof payload.model === "string" ? payload.model : options.model,
    usage: normalizeUsage(payload.usage),
    latencyMs: Date.now() - startedAt,
    rawStatus: response.status,
  };
}

function normalizeUsage(value: unknown): AiUsage | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const record = value as Record<string, unknown>;

  return {
    promptTokens: typeof record.prompt_tokens === "number" ? record.prompt_tokens : undefined,
    completionTokens: typeof record.completion_tokens === "number" ? record.completion_tokens : undefined,
    totalTokens: typeof record.total_tokens === "number" ? record.total_tokens : undefined,
  };
}
