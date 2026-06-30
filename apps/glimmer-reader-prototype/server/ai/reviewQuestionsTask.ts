import { validateReviewQuestions, type ReviewQuestionsSchema } from "./aiSchemas";
import { getPromptDefinition } from "./prompts";

export interface ReviewQuestionsInput {
  task: "review_questions";
  promptVersion: "review_questions_v1";
  bookId: string;
  bookTitle: string;
  summary: {
    quote: string;
    items: string[];
  };
}

export interface ReviewQuestionsResult {
  mode: "mock";
  reason: "mock_mode" | "invalid_input";
  questions: ReviewQuestionsSchema;
}

export async function generateReviewQuestions(value: unknown): Promise<ReviewQuestionsResult> {
  const input = normalizeReviewQuestionsInput(value);
  const prompt = getPromptDefinition<ReviewQuestionsInput, ReviewQuestionsSchema>(
    "review_questions",
    "review_questions_v1",
  );

  return {
    mode: "mock",
    reason: input ? "mock_mode" : "invalid_input",
    questions: validateReviewQuestions(prompt.fallback(input ?? createFallbackInput())),
  };
}

function normalizeReviewQuestionsInput(value: unknown): ReviewQuestionsInput | null {
  if (!isRecord(value) || value.task !== "review_questions" || value.promptVersion !== "review_questions_v1") {
    return null;
  }

  if (!isNonEmptyString(value.bookId) || !isNonEmptyString(value.bookTitle) || !isRecord(value.summary)) {
    return null;
  }

  const items = Array.isArray(value.summary.items)
    ? value.summary.items.filter(isNonEmptyString).map((item) => item.trim())
    : [];

  if (items.length === 0) {
    return null;
  }

  return {
    task: "review_questions",
    promptVersion: "review_questions_v1",
    bookId: value.bookId.trim(),
    bookTitle: value.bookTitle.trim(),
    summary: {
      quote: isNonEmptyString(value.summary.quote) ? value.summary.quote.trim() : "",
      items,
    },
  };
}

function createFallbackInput(): ReviewQuestionsInput {
  return {
    task: "review_questions",
    promptVersion: "review_questions_v1",
    bookId: "unknown",
    bookTitle: "今天的阅读",
    summary: {
      quote: "",
      items: ["今天完成了一段阅读。"],
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
