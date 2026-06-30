import { DAILY_SUMMARY_EXCERPT_CHAR_LIMIT, DAILY_SUMMARY_EXCERPT_LIMIT, clipText } from "./aiBudgets";

type NormalizeResult<T> =
  | { ok: true; value: T }
  | { ok: false; errorType: "empty_input" | "too_long" | "needs_context" | "invalid_input"; suggestContextMode?: boolean };

export interface NormalizedDirectQuestion {
  question: string;
  needsContext: boolean;
}

export interface NormalizedDailySummaryInput {
  task: "daily_summary";
  bookId: string;
  bookTitle: string;
  author: string;
  chapterTitle: string;
  startPage: number;
  endPage: number;
  readingMinutes: number;
  excerpts: string[];
  userGoal: string;
  promptVersion: "daily_summary_v1";
}

export interface NormalizedContextualAnswerInput {
  task: "contextual_answer";
  question: string;
  bookId: string;
  bookTitle: string;
  chapterTitle: string;
  pageNumber: number;
  contextParagraphs: string[];
  promptVersion: "contextual_answer_v1";
}

const CONTEXT_DEPENDENT_PATTERNS = [
  /这段/,
  /这里/,
  /这句/,
  /这一页/,
  /这个.*(什么|意思|理解|为什么|怎么)/,
  /这.*(是什么|什么意思|怎么理解|为什么)/,
  /它.*(是什么|什么意思|怎么理解|为什么)/,
  /上面/,
  /刚才/,
  /原文/,
  /作者.*(这里|这段|这句|这句话)/,
  /这句话/,
  /它为什么/,
  /结合这段/,
  /结合原文/,
  /这段/,
  /这里/,
  /这句/,
  /这页/,
  /这是什么/,
  /这是什么意思/,
  /这个什么意思/,
  /这个怎么理解/,
  /上面/,
  /刚才/,
  /原文/,
  /作者.*(这里|这段|这句)/,
  /它为什么/,
];

export function normalizeDirectQuestionInput(input: string): NormalizeResult<NormalizedDirectQuestion> {
  const question = input.replace(/\s+/g, " ").trim();

  if (!question || /^[\p{P}\p{S}\s]+$/u.test(question)) {
    return { ok: false, errorType: "empty_input" };
  }

  if (question.length > 500) {
    return { ok: false, errorType: "too_long" };
  }

  if (question.length <= 3 || CONTEXT_DEPENDENT_PATTERNS.some((pattern) => pattern.test(question))) {
    return { ok: false, errorType: "needs_context", suggestContextMode: true };
  }

  return {
    ok: true,
    value: {
      question,
      needsContext: false,
    },
  };
}

export function normalizeDailySummaryInput(value: unknown): NormalizeResult<NormalizedDailySummaryInput> {
  if (!isRecord(value)) {
    return { ok: false, errorType: "invalid_input" };
  }

  const excerpts = Array.isArray(value.excerpts)
    ? value.excerpts
        .filter((excerpt): excerpt is string => typeof excerpt === "string" && excerpt.trim().length > 0)
        .slice(0, DAILY_SUMMARY_EXCERPT_LIMIT)
        .map((excerpt) => clipText(excerpt, DAILY_SUMMARY_EXCERPT_CHAR_LIMIT))
    : [];

  if (excerpts.length === 0) {
    return { ok: false, errorType: "empty_input" };
  }

  const startPage = toPositiveNumber(value.startPage, 1);
  const endPage = toPositiveNumber(value.endPage, startPage);

  if (endPage < startPage) {
    return { ok: false, errorType: "invalid_input" };
  }

  return {
    ok: true,
    value: {
      task: "daily_summary",
      bookId: typeof value.bookId === "string" && value.bookId.trim() ? value.bookId.trim() : "unknown-book",
      bookTitle: typeof value.bookTitle === "string" && value.bookTitle.trim() ? value.bookTitle.trim() : "今天的阅读内容",
      author: typeof value.author === "string" && value.author.trim() ? value.author.trim() : "未知作者",
      chapterTitle: typeof value.chapterTitle === "string" && value.chapterTitle.trim() ? value.chapterTitle.trim() : "今日阅读章节",
      startPage,
      endPage,
      readingMinutes: toPositiveNumber(value.readingMinutes, 5),
      excerpts,
      userGoal: typeof value.userGoal === "string" && value.userGoal.trim() ? value.userGoal.trim() : "今天先读 5 分钟",
      promptVersion: "daily_summary_v1",
    },
  };
}

export interface BuildContextualAnswerInputOptions {
  question: string;
  bookId: string;
  bookTitle: string;
  chapterTitle: string;
  pageNumber: number;
  previousParagraphs: string[];
  currentParagraphs: string[];
  nextParagraphs: string[];
  promptVersion?: "contextual_answer_v1";
}

export function buildContextualAnswerInput(
  options: BuildContextualAnswerInputOptions,
): NormalizeResult<NormalizedContextualAnswerInput> {
  const question = options.question.replace(/\s+/g, " ").trim();

  if (!question || /^[\p{P}\p{S}\s]+$/u.test(question)) {
    return { ok: false, errorType: "empty_input" };
  }

  if (question.length > 500) {
    return { ok: false, errorType: "too_long" };
  }

  const contextParagraphs = [
    ...lastNonEmpty(options.previousParagraphs, 1),
    ...normalizeParagraphs(options.currentParagraphs),
    ...firstNonEmpty(options.nextParagraphs, 1),
  ];

  if (contextParagraphs.length === 0) {
    return { ok: false, errorType: "empty_input" };
  }

  return {
    ok: true,
    value: {
      task: "contextual_answer",
      question,
      bookId: options.bookId,
      bookTitle: options.bookTitle,
      chapterTitle: options.chapterTitle,
      pageNumber: options.pageNumber,
      contextParagraphs,
      promptVersion: options.promptVersion ?? "contextual_answer_v1",
    },
  };
}

function toPositiveNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeParagraphs(paragraphs: string[]): string[] {
  return paragraphs.filter((paragraph) => paragraph.trim().length > 0).map((paragraph) => paragraph.replace(/\s+/g, " ").trim());
}

function firstNonEmpty(paragraphs: string[], count: number): string[] {
  return normalizeParagraphs(paragraphs).slice(0, count);
}

function lastNonEmpty(paragraphs: string[], count: number): string[] {
  return normalizeParagraphs(paragraphs).slice(-count);
}
