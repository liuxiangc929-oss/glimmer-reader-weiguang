export interface PostAiJsonOptions<T> {
  url: string;
  payload: unknown;
  timeoutMs: number;
  fallback: T;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

export class AiRequestCancelledError extends Error {
  constructor() {
    super("AI request was cancelled by the caller.");
    this.name = "AiRequestCancelledError";
  }
}

export async function postAiJson<T>(options: PostAiJsonOptions<T>): Promise<T> {
  const controller = new AbortController();
  const fetchImpl = options.fetchImpl ?? fetch;
  let callerCancelled = options.signal?.aborted ?? false;

  const handleCallerAbort = () => {
    callerCancelled = true;
    controller.abort();
  };

  options.signal?.addEventListener("abort", handleCallerAbort, { once: true });
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    if (callerCancelled) {
      throw new AiRequestCancelledError();
    }

    const response = await fetchImpl(options.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options.payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      return options.fallback;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (callerCancelled) {
      throw new AiRequestCancelledError();
    }

    return options.fallback;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", handleCallerAbort);
  }
}
