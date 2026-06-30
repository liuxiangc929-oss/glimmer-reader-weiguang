import type { AiMode, AiTask, AiUsage } from "./types";

export interface AiTelemetryEvent {
  requestId: string;
  feature: string;
  task: AiTask;
  mode: AiMode;
  promptVersion: string;
  model?: string;
  modelTier?: "flash" | "pro";
  thinkingEnabled?: boolean;
  latencyMs?: number;
  inputCharCount: number;
  outputCharCount: number;
  usage?: AiUsage;
  fallbackReason?: string;
  errorType?: string;
  createdAt: string;
}

type TelemetrySink = (level: "info" | "warn", event: AiTelemetryEvent) => void;

export function createTelemetryRecorder(sink: TelemetrySink = defaultSink) {
  return {
    record(event: AiTelemetryEvent): void {
      const level = event.errorType || event.fallbackReason ? "warn" : "info";
      sink(level, sanitizeEvent(event));
    },
  };
}

export function createRequestId(prefix = "ai"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeEvent(event: AiTelemetryEvent): AiTelemetryEvent {
  return {
    requestId: event.requestId,
    feature: event.feature,
    task: event.task,
    mode: event.mode,
    promptVersion: event.promptVersion,
    model: event.model,
    modelTier: event.modelTier,
    thinkingEnabled: event.thinkingEnabled,
    latencyMs: event.latencyMs,
    inputCharCount: event.inputCharCount,
    outputCharCount: event.outputCharCount,
    usage: event.usage,
    fallbackReason: event.fallbackReason,
    errorType: event.errorType,
    createdAt: event.createdAt,
  };
}

function defaultSink(level: "info" | "warn", event: AiTelemetryEvent): void {
  const message = JSON.stringify({ type: "ai_telemetry", ...event });
  if (level === "warn") {
    console.warn(message);
    return;
  }

  console.info(message);
}
