import { postAiJson } from "./aiRequestClient";

export interface DirectQuestionRequest {
  task: "direct_question";
  question: string;
  promptVersion: "direct_question_v1";
}

export interface DirectQuestionResponse {
  mode: "live" | "mock";
  reason?: string;
  answer: string;
  example: string;
  returnHint: string;
  needsContext: boolean;
  suggestContextMode: boolean;
}

export interface ContextualAnswerRequest {
  task: "contextual_answer";
  question: string;
  bookId: string;
  bookTitle: string;
  chapterTitle: string;
  pageNumber: number;
  contextParagraphs: string[];
  promptVersion: "contextual_answer_v1";
}

export interface ContextualAnswerResponse {
  mode: "live" | "mock";
  reason?: string;
  answer: string;
  citedSnippet: string;
  returnHint: string;
}

const DIRECT_FALLBACK: DirectQuestionResponse = {
  mode: "mock",
  reason: "api_error",
  answer: "这个问题暂时没有想清楚，你可以先继续读，稍后再试一次。",
  example: "",
  returnHint: "如果它和当前原文有关，可以改用“基于原文回答”。",
  needsContext: false,
  suggestContextMode: false,
};

const CONTEXTUAL_FALLBACK: ContextualAnswerResponse = {
  mode: "mock",
  reason: "api_error",
  answer: "这段内容暂时没能解释清楚。可以先回到原文继续读，稍后再试一次。",
  citedSnippet: "",
  returnHint: "不用停太久，先把这一页读完也很好。",
};

export const DIRECT_QUESTION_TIMEOUT_MS = 20_000;

export function requestDirectQuestion(
  payload: DirectQuestionRequest,
  options: { signal?: AbortSignal } = {},
): Promise<DirectQuestionResponse> {
  return postAiJson({
    url: "/api/reading-assist/direct",
    payload,
    timeoutMs: DIRECT_QUESTION_TIMEOUT_MS,
    signal: options.signal,
    fallback: DIRECT_FALLBACK,
  });
}

export async function requestContextualAnswer(payload: ContextualAnswerRequest): Promise<ContextualAnswerResponse> {
  return postJson("/api/reading-assist/contextual", payload, CONTEXTUAL_FALLBACK);
}

async function postJson<T>(url: string, payload: unknown, fallback: T): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`${url} failed with ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.warn("Reading assist request failed, using local fallback.", error);
    return fallback;
  } finally {
    window.clearTimeout(timeout);
  }
}
