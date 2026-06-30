import type { DailySummary } from "./dailySummary";

export type ReviewQuestionKind = "understanding" | "extraction" | "action";

export interface ReviewQuestion {
  id: ReviewQuestionKind;
  title: string;
  question: string;
  placeholder: string;
}

export interface ReviewQuestions {
  understanding: ReviewQuestion;
  extraction: ReviewQuestion;
  action: ReviewQuestion;
}

export interface ReviewQuestionsRequest {
  task: "review_questions";
  promptVersion: "review_questions_v1";
  bookId: string;
  bookTitle: string;
  summary: DailySummary;
}

export interface ReviewQuestionsResponse {
  mode: "live" | "mock";
  reason?: string;
  questions: ReviewQuestions;
}

export const DEFAULT_REVIEW_QUESTIONS: ReviewQuestions = {
  understanding: {
    id: "understanding",
    title: "理解",
    question: "今天的阅读内容主要讲了什么？",
    placeholder: "不用写很多，先留下你的理解。",
  },
  extraction: {
    id: "extraction",
    title: "提炼",
    question: "今天最值得带走的一点是什么？",
    placeholder: "试着收成一句自己的话。",
  },
  action: {
    id: "action",
    title: "行动",
    question: "明天可以尝试哪一个小行动？",
    placeholder: "写下一个足够轻的小尝试。",
  },
};

export async function requestReviewQuestions(payload: ReviewQuestionsRequest): Promise<ReviewQuestionsResponse> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch("/api/review-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Review questions request failed with ${response.status}`);
    }

    return (await response.json()) as ReviewQuestionsResponse;
  } catch (error) {
    console.warn("Review questions request failed, using local fallback.", error);
    return {
      mode: "mock",
      reason: "api_error",
      questions: DEFAULT_REVIEW_QUESTIONS,
    };
  } finally {
    window.clearTimeout(timeout);
  }
}
