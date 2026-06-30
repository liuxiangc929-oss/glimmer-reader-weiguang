export type AiRequestStatus = "idle" | "loading" | "success" | "fallback" | "error";

export interface AiRequestState<T, TTask = never> {
  task: TTask | null;
  status: AiRequestStatus;
  data: T | null;
  message: string;
}

interface AiRequestResult {
  mode: "live" | "mock";
  reason?: string;
}

export function createAiRequestState<T, TTask = never>(): AiRequestState<T, TTask> {
  return {
    task: null,
    status: "idle",
    data: null,
    message: "",
  };
}

export function createAiRequestLoading<T, TTask = never>(
  message = "",
  task: TTask | null = null,
): AiRequestState<T, TTask> {
  return {
    task,
    status: "loading",
    data: null,
    message,
  };
}

export function createAiRequestSuccess<T extends AiRequestResult, TTask = never>(
  data: T,
  task: TTask | null = null,
): AiRequestState<T, TTask> {
  return {
    task,
    status: isFallbackResult(data) ? "fallback" : "success",
    data,
    message: "",
  };
}

export function createAiRequestError<T, TTask = never>(
  message: string,
  data: T | null = null,
  task: TTask | null = null,
): AiRequestState<T, TTask> {
  return {
    task,
    status: "error",
    data,
    message,
  };
}

function isFallbackResult(result: AiRequestResult): boolean {
  return Boolean(result.reason && result.reason !== "mock_mode");
}
