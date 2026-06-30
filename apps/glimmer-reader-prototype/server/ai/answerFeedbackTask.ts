import {
  validateAnswerFeedback,
  validateReviewQuestions,
  type AnswerFeedbackSchema,
  type ReviewQuestionsSchema,
} from "./aiSchemas";
import { getPromptDefinition } from "./prompts";

export interface ReviewAnswers {
  understanding: string;
  extraction: string;
  action: string;
}

export interface AnswerFeedbackInput {
  task: "answer_feedback";
  promptVersion: "answer_feedback_v1";
  questions: ReviewQuestionsSchema;
  answers: ReviewAnswers;
}

export interface AnswerFeedbackResult {
  mode: "mock";
  reason: "mock_mode" | "invalid_input";
  feedback: AnswerFeedbackSchema;
}

export async function generateAnswerFeedback(value: unknown): Promise<AnswerFeedbackResult> {
  const input = normalizeAnswerFeedbackInput(value);
  const fallbackInput = input ?? createFallbackInput();
  const prompt = getPromptDefinition<AnswerFeedbackInput, AnswerFeedbackSchema>(
    "answer_feedback",
    "answer_feedback_v1",
  );

  return {
    mode: "mock",
    reason: input ? "mock_mode" : "invalid_input",
    feedback: validateAnswerFeedback(prompt.fallback(fallbackInput)),
  };
}

function normalizeAnswerFeedbackInput(value: unknown): AnswerFeedbackInput | null {
  if (!isRecord(value) || value.task !== "answer_feedback" || value.promptVersion !== "answer_feedback_v1") {
    return null;
  }

  if (!isRecord(value.answers)) {
    return null;
  }

  const answerKeys = ["understanding", "extraction", "action"] as const;
  if (!answerKeys.every((key) => typeof value.answers[key] === "string")) {
    return null;
  }

  try {
    return {
      task: "answer_feedback",
      promptVersion: "answer_feedback_v1",
      questions: validateReviewQuestions(value.questions),
      answers: {
        understanding: String(value.answers.understanding).trim(),
        extraction: String(value.answers.extraction).trim(),
        action: String(value.answers.action).trim(),
      },
    };
  } catch {
    return null;
  }
}

function createFallbackInput(): AnswerFeedbackInput {
  const questions = getPromptDefinition<unknown, ReviewQuestionsSchema>(
    "review_questions",
    "review_questions_v1",
  ).fallback({});

  return {
    task: "answer_feedback",
    promptVersion: "answer_feedback_v1",
    questions,
    answers: {
      understanding: "",
      extraction: "",
      action: "",
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
