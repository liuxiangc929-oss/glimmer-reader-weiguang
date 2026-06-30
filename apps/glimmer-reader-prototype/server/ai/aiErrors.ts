import type { AiErrorType } from "./types";

export class AiProviderError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "AiProviderError";
    this.status = status;
  }
}

export interface NormalizedAiError {
  type: AiErrorType;
  status?: number;
  message: string;
}

export function normalizeAiError(error: unknown): NormalizedAiError {
  if (error instanceof DOMException && error.name === "AbortError") {
    return { type: "timeout", message: "AI request timed out." };
  }

  const status = extractStatus(error);

  if (status === 400 || status === 422) return { type: "invalid_request", status, message: "AI request is invalid." };
  if (status === 401) return { type: "invalid_api_key", status, message: "AI API key is invalid." };
  if (status === 402) return { type: "insufficient_balance", status, message: "AI account balance is insufficient." };
  if (status === 429) return { type: "rate_limited", status, message: "AI provider is rate limited." };
  if (status === 503) return { type: "provider_overloaded", status, message: "AI provider is overloaded." };
  if (typeof status === "number" && status >= 500) return { type: "provider_error", status, message: "AI provider failed." };

  if (error instanceof Error && error.message.includes("schema_error")) {
    return { type: "schema_error", message: error.message };
  }

  return { type: "provider_error", status, message: error instanceof Error ? error.message : "AI request failed." };
}

function extractStatus(error: unknown): number | undefined {
  if (error instanceof AiProviderError) return error.status;
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}
