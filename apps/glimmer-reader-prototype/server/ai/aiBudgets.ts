import type { AiTask } from "./types";

export const AI_BUDGETS: Record<
  AiTask,
  { maxInputChars: number; maxOutputTokens: number; thinkingMaxOutputTokens?: number }
> = {
  direct_question: { maxInputChars: 500, maxOutputTokens: 500, thinkingMaxOutputTokens: 1_200 },
  contextual_answer: { maxInputChars: 2_400, maxOutputTokens: 800 },
  daily_summary: { maxInputChars: 2_200, maxOutputTokens: 700 },
  review_questions: { maxInputChars: 2_800, maxOutputTokens: 800 },
  answer_feedback: { maxInputChars: 3_200, maxOutputTokens: 900 },
};

export const DAILY_SUMMARY_EXCERPT_LIMIT = Number.POSITIVE_INFINITY;
export const DAILY_SUMMARY_EXCERPT_CHAR_LIMIT = Number.POSITIVE_INFINITY;

export function clipText(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? normalized.slice(0, maxLength) : normalized;
}
