export interface DailySummarySchema {
  quote: string;
  items: string[];
}

export interface DirectAnswerSchema {
  answer: string;
  example: string;
  returnHint: string;
  needsContext: boolean;
  suggestContextMode: boolean;
}

export interface ContextualAnswerSchema {
  answer: string;
  citedSnippet: string;
  returnHint: string;
}

export type ReviewQuestionKind = "understanding" | "extraction" | "action";

export interface ReviewQuestionSchema {
  id: ReviewQuestionKind;
  title: string;
  question: string;
  placeholder: string;
}

export interface ReviewQuestionsSchema {
  understanding: ReviewQuestionSchema;
  extraction: ReviewQuestionSchema;
  action: ReviewQuestionSchema;
}

export interface AnswerFeedbackSchema {
  acknowledgedPoints: string[];
  canAddOneThing: string;
  actionRecordCandidate: string;
  gentleClosing: string;
}

export function validateDailySummary(value: unknown): DailySummarySchema {
  const record = requireRecord(value);
  const quote = requireString(record.quote);
  const items = Array.isArray(record.items)
    ? record.items.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  if (items.length !== 3) {
    throw new Error("schema_error: daily_summary requires exactly three items");
  }

  return {
    quote: quote.trim(),
    items: items.map((item) => item.trim()),
  };
}

export function validateDirectAnswer(value: unknown): DirectAnswerSchema {
  const record = requireRecord(value);

  return {
    answer: requireString(record.answer).trim(),
    example: requireStringAllowEmpty(record.example).trim(),
    returnHint: requireString(record.returnHint).trim(),
    needsContext: requireBoolean(record.needsContext),
    suggestContextMode: requireBoolean(record.suggestContextMode),
  };
}

export function validateContextualAnswer(value: unknown): ContextualAnswerSchema {
  const record = requireRecord(value);

  return {
    answer: requireString(record.answer).trim(),
    citedSnippet: requireString(record.citedSnippet).trim(),
    returnHint: requireString(record.returnHint).trim(),
  };
}

export function validateReviewQuestions(value: unknown): ReviewQuestionsSchema {
  const record = requireRecord(value);

  return {
    understanding: validateReviewQuestion(record.understanding, "understanding"),
    extraction: validateReviewQuestion(record.extraction, "extraction"),
    action: validateReviewQuestion(record.action, "action"),
  };
}

export function validateAnswerFeedback(value: unknown): AnswerFeedbackSchema {
  const record = requireRecord(value);
  const acknowledgedPoints = Array.isArray(record.acknowledgedPoints)
    ? record.acknowledgedPoints.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  if (acknowledgedPoints.length === 0) {
    throw new Error("schema_error: answer feedback requires acknowledged points");
  }

  return {
    acknowledgedPoints: acknowledgedPoints.map((item) => item.trim()),
    canAddOneThing: requireString(record.canAddOneThing).trim(),
    actionRecordCandidate: typeof record.actionRecordCandidate === "string"
      ? record.actionRecordCandidate.trim()
      : "",
    gentleClosing: requireString(record.gentleClosing).trim(),
  };
}

function validateReviewQuestion(value: unknown, expectedId: ReviewQuestionKind): ReviewQuestionSchema {
  const record = requireRecord(value);
  const id = requireString(record.id).trim();

  if (id !== expectedId) {
    throw new Error(`schema_error: expected review question id ${expectedId}`);
  }

  return {
    id: expectedId,
    title: requireString(record.title).trim(),
    question: requireString(record.question).trim(),
    placeholder: requireString(record.placeholder).trim(),
  };
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new Error("schema_error: expected object");
  }

  return value as Record<string, unknown>;
}

function requireString(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("schema_error: expected non-empty string");
  }

  return value;
}

function requireStringAllowEmpty(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("schema_error: expected string");
  }

  return value;
}

function requireBoolean(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new Error("schema_error: expected boolean");
  }

  return value;
}
