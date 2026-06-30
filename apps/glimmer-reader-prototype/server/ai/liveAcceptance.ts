import type { AiUsage } from "./types";

export interface LiveAcceptanceConfig {
  apiKey: string;
  baseUrl: string;
  smallModel: string;
  proModel: string;
  timeoutMs: number;
  proTimeoutMs: number;
}

export interface LiveAcceptanceCheck {
  name: string;
  outcome: "passed" | "failed" | "blocked";
  mode?: "live" | "mock";
  reason?: string;
  errorType?: string;
  model?: string;
  modelTier?: "flash" | "pro";
  thinkingEnabled?: boolean;
  latencyMs?: number;
  inputCharCount?: number;
  outputCharCount?: number;
  usage?: AiUsage;
  cached?: boolean;
}

export interface LiveAcceptanceReport {
  createdAt: string;
  provider: "deepseek";
  status: "passed" | "failed" | "blocked";
  checks: LiveAcceptanceCheck[];
}

export function buildLiveAcceptanceConfig(env: Record<string, string | undefined>): LiveAcceptanceConfig {
  if (env.RUN_LIVE_AI_ACCEPTANCE?.toLowerCase() !== "true") {
    throw new Error("Live AI acceptance has not been explicitly authorized.");
  }

  if (env.AI_SUMMARY_MODE?.toLowerCase() !== "live" || env.AI_ASSIST_MODE?.toLowerCase() !== "live") {
    throw new Error("AI_SUMMARY_MODE and AI_ASSIST_MODE must both be live.");
  }

  const apiKey = env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("DeepSeek API key is missing from the local environment.");
  }

  return {
    apiKey,
    baseUrl: env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com",
    smallModel: env.DEEPSEEK_SMALL_MODEL?.trim() || "deepseek-v4-flash",
    proModel: env.DEEPSEEK_PRO_MODEL?.trim() || "deepseek-v4-pro",
    timeoutMs: Number(env.AI_TIMEOUT_MS || 12_000),
    proTimeoutMs: Number(env.AI_PRO_TIMEOUT_MS || 30_000),
  };
}

export function sanitizeLiveAcceptanceReport(value: unknown): LiveAcceptanceReport {
  const record = isRecord(value) ? value : {};
  const checks = Array.isArray(record.checks) ? record.checks : [];

  return {
    createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
    provider: "deepseek",
    status: normalizeReportStatus(record.status),
    checks: checks.map(sanitizeCheck),
  };
}

function sanitizeCheck(value: unknown): LiveAcceptanceCheck {
  const record = isRecord(value) ? value : {};
  const check: LiveAcceptanceCheck = {
    name: typeof record.name === "string" ? record.name : "unnamed_check",
    outcome: normalizeCheckOutcome(record.outcome),
  };

  if (record.mode === "live" || record.mode === "mock") check.mode = record.mode;
  if (typeof record.reason === "string") check.reason = record.reason;
  if (typeof record.errorType === "string") check.errorType = record.errorType;
  if (typeof record.model === "string") check.model = record.model;
  if (record.modelTier === "flash" || record.modelTier === "pro") check.modelTier = record.modelTier;
  if (typeof record.thinkingEnabled === "boolean") check.thinkingEnabled = record.thinkingEnabled;
  if (typeof record.latencyMs === "number") check.latencyMs = record.latencyMs;
  if (typeof record.inputCharCount === "number") check.inputCharCount = record.inputCharCount;
  if (typeof record.outputCharCount === "number") check.outputCharCount = record.outputCharCount;
  if (typeof record.cached === "boolean") check.cached = record.cached;
  if (isRecord(record.usage)) {
    const usage: AiUsage = {};
    if (typeof record.usage.promptTokens === "number") usage.promptTokens = record.usage.promptTokens;
    if (typeof record.usage.completionTokens === "number") usage.completionTokens = record.usage.completionTokens;
    if (typeof record.usage.totalTokens === "number") usage.totalTokens = record.usage.totalTokens;
    check.usage = usage;
  }

  return check;
}

function normalizeReportStatus(value: unknown): LiveAcceptanceReport["status"] {
  return value === "passed" || value === "failed" || value === "blocked" ? value : "failed";
}

function normalizeCheckOutcome(value: unknown): LiveAcceptanceCheck["outcome"] {
  return value === "passed" || value === "failed" || value === "blocked" ? value : "failed";
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}
