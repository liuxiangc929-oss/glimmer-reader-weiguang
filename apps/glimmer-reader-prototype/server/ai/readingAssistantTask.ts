import { validateContextualAnswer, validateDirectAnswer, type ContextualAnswerSchema, type DirectAnswerSchema } from "./aiSchemas";
import { runAiTask } from "./aiGateway";
import {
  buildContextualAnswerInput,
  normalizeDirectQuestionInput,
  type BuildContextualAnswerInputOptions,
  type NormalizedContextualAnswerInput,
  type NormalizedDirectQuestion,
} from "./inputNormalizers";
import { createRequestId, createTelemetryRecorder } from "./aiTelemetry";
import { getPromptDefinition } from "./prompts";
import type { AiFallbackReason, AiMode } from "./types";

interface ReadingAssistEnv {
  AI_MODE?: string;
  AI_ASSIST_MODE?: string;
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_BASE_URL?: string;
  DEEPSEEK_SMALL_MODEL?: string;
  DEEPSEEK_PRO_MODEL?: string;
  AI_TIMEOUT_MS?: string;
  AI_PRO_TIMEOUT_MS?: string;
}

interface RunReadingAssistOptions {
  env: ReadingAssistEnv;
  fetchImpl?: typeof fetch;
}

export interface DirectQuestionResponse extends DirectAnswerSchema {
  mode: AiMode;
  reason?: AiFallbackReason;
}

export interface ContextualAnswerResponse extends ContextualAnswerSchema {
  mode: AiMode;
  reason?: AiFallbackReason;
}

export async function answerDirectQuestion(
  rawInput: unknown,
  options: RunReadingAssistOptions,
): Promise<DirectQuestionResponse> {
  const question = readQuestion(rawInput);
  const normalized = normalizeDirectQuestionInput(question);

  if (normalized.ok === false) {
    const fallback = buildDirectFallback(normalized.errorType);
    return {
      mode: "mock",
      reason: normalized.errorType === "needs_context" ? "needs_context" : "invalid_input",
      ...fallback,
    };
  }

  const input = normalized.value;
  const prompt = getPromptDefinition<NormalizedDirectQuestion, DirectAnswerSchema>("direct_question", "direct_question_v1");
  const userPrompt = prompt.buildUserPrompt(input);

  return runReadingAssistTask({
    taskName: "direct_question",
    feature: "reading-assist-direct",
    promptVersion: "direct_question_v1",
    input,
    routingText: input.question,
    systemPrompt: prompt.systemPrompt,
    userPrompt,
    fallback: prompt.fallback(input),
    parse: (content) => validateDirectAnswer(parseJsonObject(content)),
    env: options.env,
    fetchImpl: options.fetchImpl,
  });
}

export async function answerContextualQuestion(
  rawInput: unknown,
  options: RunReadingAssistOptions,
): Promise<ContextualAnswerResponse> {
  const normalized = buildContextualAnswerInput(readContextualInput(rawInput));

  if (normalized.ok === false) {
    return {
      mode: "mock",
      reason: "invalid_input",
      ...buildContextualFallback(),
    };
  }

  const input = normalized.value;
  const prompt = getPromptDefinition<NormalizedContextualAnswerInput, ContextualAnswerSchema>(
    "contextual_answer",
    input.promptVersion,
  );
  const userPrompt = prompt.buildUserPrompt(input);

  return runReadingAssistTask({
    taskName: "contextual_answer",
    feature: "reading-assist-contextual",
    promptVersion: input.promptVersion,
    input,
    systemPrompt: prompt.systemPrompt,
    userPrompt,
    fallback: prompt.fallback(input),
    parse: (content) => validateContextualAnswer(parseJsonObject(content)),
    env: options.env,
    fetchImpl: options.fetchImpl,
  });
}

async function runReadingAssistTask<T extends DirectAnswerSchema | ContextualAnswerSchema>(options: {
  taskName: "direct_question" | "contextual_answer";
  feature: string;
  promptVersion: string;
  input: unknown;
  routingText?: string;
  systemPrompt: string;
  userPrompt: string;
  fallback: T;
  parse: (content: string) => T;
  env: ReadingAssistEnv;
  fetchImpl?: typeof fetch;
}): Promise<(T & { mode: AiMode; reason?: AiFallbackReason })> {
  const inputText = `${options.systemPrompt}\n${options.userPrompt}`;
  const result = await runAiTask<T>({
    task: options.taskName,
    mode: options.env.AI_ASSIST_MODE ?? options.env.AI_MODE,
    apiKey: options.env.DEEPSEEK_API_KEY,
    baseUrl: options.env.DEEPSEEK_BASE_URL,
    smallModel: options.env.DEEPSEEK_SMALL_MODEL,
    proModel: options.env.DEEPSEEK_PRO_MODEL,
    timeoutMs: Number(options.env.AI_TIMEOUT_MS || 12_000),
    thinkingTimeoutMs: Number(options.env.AI_PRO_TIMEOUT_MS || 30_000),
    messages: [
      { role: "system", content: options.systemPrompt },
      { role: "user", content: options.userPrompt },
    ],
    inputText,
    routingText: options.routingText,
    responseFormat: { type: "json_object" },
    fallback: options.fallback,
    parse: options.parse,
    fetchImpl: options.fetchImpl,
  });

  createTelemetryRecorder().record({
    requestId: createRequestId("assist"),
    feature: options.feature,
    task: options.taskName,
    mode: result.mode,
    promptVersion: options.promptVersion,
    model: result.model,
    modelTier: result.modelTier,
    thinkingEnabled: result.thinkingEnabled,
    latencyMs: result.latencyMs,
    inputCharCount: inputText.length,
    outputCharCount: JSON.stringify(result.data).length,
    usage: result.usage,
    fallbackReason: result.fallbackReason,
    errorType: result.errorType,
    createdAt: new Date().toISOString(),
  });

  return {
    mode: result.mode,
    reason: result.fallbackReason,
    ...result.data,
  };
}

function readQuestion(value: unknown): string {
  if (typeof value !== "object" || value === null) return "";
  const question = (value as Record<string, unknown>).question;
  return typeof question === "string" ? question : "";
}

function readContextualInput(value: unknown): BuildContextualAnswerInputOptions {
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const contextParagraphs = Array.isArray(record.contextParagraphs)
    ? record.contextParagraphs.filter((item): item is string => typeof item === "string")
    : [];

  return {
    question: typeof record.question === "string" ? record.question : "",
    bookId: typeof record.bookId === "string" ? record.bookId : "unknown-book",
    bookTitle: typeof record.bookTitle === "string" ? record.bookTitle : "当前阅读内容",
    chapterTitle: typeof record.chapterTitle === "string" ? record.chapterTitle : "当前章节",
    pageNumber: typeof record.pageNumber === "number" ? record.pageNumber : 1,
    previousParagraphs: Array.isArray(record.previousParagraphs)
      ? record.previousParagraphs.filter((item): item is string => typeof item === "string")
      : [],
    currentParagraphs: contextParagraphs,
    nextParagraphs: Array.isArray(record.nextParagraphs)
      ? record.nextParagraphs.filter((item): item is string => typeof item === "string")
      : [],
    promptVersion: "contextual_answer_v1",
  };
}

function buildDirectFallback(errorType?: string): DirectAnswerSchema {
  if (errorType === "needs_context") {
    return {
      answer: "这个问题可能需要结合原文来看。你可以点“基于原文回答”，我会带着当前内容一起解释。",
      example: "",
      returnHint: "如果你想问的是当前这段话，建议使用“基于原文回答”。",
      needsContext: true,
      suggestContextMode: true,
    };
  }

  return {
    answer: "先给你一版轻量解释：这个问题可以先从概念本身理解，不必急着一次弄得很完整。",
    example: "",
    returnHint: "如果你是在当前段落里看到这个词，可以用“基于原文回答”再看它在那里的具体意思。",
    needsContext: false,
    suggestContextMode: false,
  };
}

function buildContextualFallback(): ContextualAnswerSchema {
  return {
    answer: "这段内容暂时没能解释清楚。可以先回到原文继续读，稍后再试一次。",
    citedSnippet: "",
    returnHint: "不用停太久，先把这一页读完也很好。",
  };
}

function parseJsonObject(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`schema_error: invalid JSON response: ${error instanceof Error ? error.message : "unknown"}`);
  }
}
