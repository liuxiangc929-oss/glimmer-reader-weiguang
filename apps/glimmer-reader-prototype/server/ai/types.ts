export const AI_TASKS = [
  "direct_question",
  "contextual_answer",
  "daily_summary",
  "review_questions",
  "answer_feedback",
] as const;

export type AiTask = (typeof AI_TASKS)[number];

export type AiMode = "mock" | "live";

export type AiModelTier = "flash" | "pro";

export type AiThinkingConfig = {
  type: "enabled" | "disabled";
};

export type AiReasoningEffort = "low" | "medium" | "high";

export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiFallbackReason =
  | "mock_mode"
  | "missing_api_key"
  | "timeout"
  | "rate_limited"
  | "provider_error"
  | "schema_error"
  | "invalid_input"
  | "needs_context";

export type AiErrorType =
  | "missing_api_key"
  | "invalid_api_key"
  | "insufficient_balance"
  | "rate_limited"
  | "timeout"
  | "invalid_request"
  | "provider_overloaded"
  | "provider_error"
  | "schema_error"
  | "invalid_input";

export type AiUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type AiGatewayResult<T> = {
  mode: AiMode;
  data: T;
  model?: string;
  modelTier?: AiModelTier;
  thinkingEnabled?: boolean;
  latencyMs?: number;
  usage?: AiUsage;
  fallbackReason?: AiFallbackReason;
  errorType?: AiErrorType;
};
