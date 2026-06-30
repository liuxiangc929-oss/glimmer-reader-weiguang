import assert from "node:assert/strict";
import test from "node:test";
import { resolveTaskTimeoutMs, runAiTask } from "./aiGateway";
import { normalizeAiError } from "./aiErrors";
import {
  buildContextualAnswerInput,
  normalizeDailySummaryInput,
  normalizeDirectQuestionInput,
} from "./inputNormalizers";
import { selectModelForTask } from "./modelRouter";
import { callDeepSeekChat } from "./deepseekProvider";
import { createTelemetryRecorder } from "./aiTelemetry";
import { getPromptDefinition } from "./prompts";
import { createDailySummaryCacheKey, MemorySummaryCacheStore } from "./summaryCache";
import {
  validateContextualAnswer,
  validateDailySummary,
  validateDirectAnswer,
  validateAnswerFeedback,
  validateReviewQuestions,
} from "./aiSchemas";
import { AI_TASKS } from "./types";

test("defines the complete AI task boundary for the reading loop", () => {
  assert.deepEqual(AI_TASKS, [
    "direct_question",
    "contextual_answer",
    "daily_summary",
    "review_questions",
    "answer_feedback",
  ]);
});

test("routes small tasks to flash without thinking and complex tasks to pro with thinking", () => {
  const small = selectModelForTask({
    task: "direct_question",
    inputCharCount: 42,
    text: "蔡加尼克效应是什么？",
  });
  const complex = selectModelForTask({
    task: "contextual_answer",
    inputCharCount: 2200,
    text: "请比较这几段里作者对注意力边界的论证，并分析为什么硬撑不起作用。",
  });

  assert.equal(small.model, "deepseek-v4-flash");
  assert.equal(small.tier, "flash");
  assert.equal(small.thinking.type, "disabled");
  assert.equal(complex.model, "deepseek-v4-pro");
  assert.equal(complex.tier, "pro");
  assert.equal(complex.thinking.type, "enabled");
  assert.equal(complex.reasoningEffort, "high");
});

test("normalizes direct questions and flags questions that need original text", () => {
  const direct = normalizeDirectQuestionInput("   蔡加尼克效应是什么？   ");
  const contextDependent = normalizeDirectQuestionInput("这里作者为什么这么说？");
  const vagueShortQuestion = normalizeDirectQuestionInput("这个什么意思");

  assert.equal(direct.ok, true);
  if (direct.ok) {
    assert.equal(direct.value.question, "蔡加尼克效应是什么？");
    assert.equal(direct.value.needsContext, false);
  }

  assert.equal(contextDependent.ok, false);
  if (!contextDependent.ok) {
    assert.equal(contextDependent.errorType, "needs_context");
    assert.equal(contextDependent.suggestContextMode, true);
  }

  assert.equal(vagueShortQuestion.ok, false);
  if (!vagueShortQuestion.ok) {
    assert.equal(vagueShortQuestion.errorType, "needs_context");
    assert.equal(vagueShortQuestion.suggestContextMode, true);
  }
});

test("normalizes daily summary input with complete confirmed excerpts", () => {
  const result = normalizeDailySummaryInput({
    bookTitle: "注意力的边界",
    author: "卢门·莱特",
    startPage: 1,
    endPage: 6,
    readingMinutes: 8,
    excerpts: Array.from({ length: 20 }, (_, index) => `第 ${index + 1} 段：${"专注力".repeat(160)}`),
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.excerpts.length, 20);
    assert.equal(result.value.promptVersion, "daily_summary_v1");
  }
});

test("validates structured output for summary, direct answer, contextual answer, and review questions", () => {
  assert.deepEqual(
    validateDailySummary({
      quote: "慢慢读，也是在往前走。",
      items: ["先开始比读很多更重要。", "硬撑会继续消耗注意力。", "可以用小环境保护专注。"],
    }),
    {
      quote: "慢慢读，也是在往前走。",
      items: ["先开始比读很多更重要。", "硬撑会继续消耗注意力。", "可以用小环境保护专注。"],
    },
  );

  assert.deepEqual(
    validateDirectAnswer({
      answer: "它指未完成的事情更容易占住注意力。",
      example: "",
      returnHint: "理解概念后，可以回到原文继续阅读。",
      needsContext: false,
      suggestContextMode: false,
    }),
    {
      answer: "它指未完成的事情更容易占住注意力。",
      example: "",
      returnHint: "理解概念后，可以回到原文继续阅读。",
      needsContext: false,
      suggestContextMode: false,
    },
  );

  assert.deepEqual(
    validateContextualAnswer({
      answer: "这段是在说明硬撑不是意志问题，而是注意力资源已经下降。",
      citedSnippet: "硬撑，是专注力管理中最大的谎言。",
      returnHint: "可以带着这个理解继续往下读。",
    }),
    {
      answer: "这段是在说明硬撑不是意志问题，而是注意力资源已经下降。",
      citedSnippet: "硬撑，是专注力管理中最大的谎言。",
      returnHint: "可以带着这个理解继续往下读。",
    },
  );

  assert.deepEqual(
    validateReviewQuestions({
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
    }),
    {
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
    },
  );

  assert.throws(() => validateDailySummary({ quote: "太少", items: ["只有一个"] }), /schema_error/);
  assert.throws(
    () =>
      validateReviewQuestions({
        understanding: { id: "action", title: "理解", question: "问题", placeholder: "提示" },
        extraction: { id: "extraction", title: "提炼", question: "问题", placeholder: "提示" },
        action: { id: "action", title: "行动", question: "问题", placeholder: "提示" },
      }),
    /schema_error/,
  );

  assert.deepEqual(
    validateAnswerFeedback({
      acknowledgedPoints: ["你已经抓住了注意力有边界这一点。"],
      canAddOneThing: "还可以补充一个你今天读到的具体例子。",
      actionRecordCandidate: "明天阅读前把手机放到另一个房间。",
      gentleClosing: "先留下这一点就很好，不用一次想得很完整。",
    }),
    {
      acknowledgedPoints: ["你已经抓住了注意力有边界这一点。"],
      canAddOneThing: "还可以补充一个你今天读到的具体例子。",
      actionRecordCandidate: "明天阅读前把手机放到另一个房间。",
      gentleClosing: "先留下这一点就很好，不用一次想得很完整。",
    },
  );

  assert.throws(
    () =>
      validateDirectAnswer({
        answer: "解释",
        example: "",
        returnHint: "继续阅读。",
        needsContext: "false",
        suggestContextMode: false,
      }),
    /schema_error/,
  );
  assert.throws(
    () =>
      validateContextualAnswer({
        answer: "解释",
        citedSnippet: "",
        returnHint: "继续阅读。",
      }),
    /schema_error/,
  );
  assert.throws(
    () =>
      validateAnswerFeedback({
        acknowledgedPoints: [],
        canAddOneThing: "补一点。",
        actionRecordCandidate: "",
        gentleClosing: "慢慢来。",
      }),
    /schema_error/,
  );
});

test("maps DeepSeek provider errors into internal error types", () => {
  assert.equal(normalizeAiError({ status: 401 }).type, "invalid_api_key");
  assert.equal(normalizeAiError({ status: 402 }).type, "insufficient_balance");
  assert.equal(normalizeAiError({ status: 429 }).type, "rate_limited");
  assert.equal(normalizeAiError(new DOMException("slow", "AbortError")).type, "timeout");
});

test("calls DeepSeek chat completions with JSON mode and thinking controls", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];

  const response = await callDeepSeekChat({
    apiKey: "test-key",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-v4-pro",
    messages: [{ role: "user", content: "用 JSON 回答" }],
    maxTokens: 300,
    thinking: { type: "enabled" },
    reasoningEffort: "high",
    responseFormat: { type: "json_object" },
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init: init as RequestInit });
      return new Response(
        JSON.stringify({
          model: "deepseek-v4-pro",
          usage: { prompt_tokens: 12, completion_tokens: 20, total_tokens: 32 },
          choices: [{ message: { content: "{\"answer\":\"好\"}", reasoning_content: "hidden" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  assert.equal(response.content, "{\"answer\":\"好\"}");
  assert.equal(response.reasoningContent, "hidden");
  assert.equal(calls[0].url, "https://api.deepseek.com/chat/completions");
  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, "Bearer test-key");

  const body = JSON.parse(String(calls[0].init.body));
  assert.equal(body.model, "deepseek-v4-pro");
  assert.equal(body.thinking.type, "enabled");
  assert.equal(body.reasoning_effort, "high");
  assert.equal(body.response_format.type, "json_object");
  assert.equal(body.stream, false);
});

test("normalizes every trailing slash in the DeepSeek base URL and forwards the abort signal", async () => {
  const controller = new AbortController();
  let calledUrl = "";
  let calledSignal: AbortSignal | null | undefined;

  await callDeepSeekChat({
    apiKey: "test-key",
    baseUrl: "https://api.deepseek.com///",
    model: "deepseek-v4-flash",
    messages: [{ role: "user", content: "回答" }],
    maxTokens: 100,
    thinking: { type: "disabled" },
    signal: controller.signal,
    fetchImpl: async (url, init) => {
      calledUrl = String(url);
      calledSignal = init?.signal;
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "{\"answer\":\"好\"}" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  assert.equal(calledUrl, "https://api.deepseek.com/chat/completions");
  assert.equal(calledSignal, controller.signal);
});

test("routes threshold and task-specific complexity with configured model names", () => {
  const directAtLimit = selectModelForTask({
    task: "direct_question",
    inputCharCount: 180,
    text: "普通概念",
    smallModel: "flash-custom",
    proModel: "pro-custom",
  });
  const directOverLimit = selectModelForTask({
    task: "direct_question",
    inputCharCount: 181,
    text: "普通概念",
    smallModel: "flash-custom",
    proModel: "pro-custom",
  });
  const feedback = selectModelForTask({
    task: "answer_feedback",
    inputCharCount: 20,
    smallModel: "flash-custom",
    proModel: "pro-custom",
  });
  const comparison = selectModelForTask({
    task: "direct_question",
    inputCharCount: 40,
    text: "认知负荷和注意力残留有什么区别？",
    smallModel: "flash-custom",
    proModel: "pro-custom",
  });
  const shortSummaryWithCommonInfluenceWord = selectModelForTask({
    task: "daily_summary",
    inputCharCount: 400,
    text: "专注力会受到睡眠、情绪和环境影响。",
    smallModel: "flash-custom",
    proModel: "pro-custom",
  });

  assert.equal(directAtLimit.model, "flash-custom");
  assert.equal(directAtLimit.thinking.type, "disabled");
  assert.equal(directOverLimit.model, "pro-custom");
  assert.equal(directOverLimit.thinking.type, "enabled");
  assert.equal(feedback.model, "pro-custom");
  assert.equal(comparison.model, "pro-custom");
  assert.equal(comparison.thinking.type, "enabled");
  assert.equal(shortSummaryWithCommonInfluenceWord.model, "flash-custom");
  assert.equal(shortSummaryWithCommonInfluenceWord.thinking.type, "disabled");
});

test("gateway routes direct questions by the user question instead of the full prompt", async () => {
  let requestedModel = "";

  await runAiTask({
    task: "direct_question",
    mode: "live",
    apiKey: "test-key",
    smallModel: "flash-custom",
    proModel: "pro-custom",
    messages: [
      { role: "system", content: "system guidance ".repeat(30) },
      { role: "user", content: "What is the Zeigarnik effect?" },
    ],
    inputText: `${"system guidance ".repeat(30)}\nWhat is the Zeigarnik effect?`,
    routingText: "What is the Zeigarnik effect?",
    fallback: { answer: "fallback" },
    fetchImpl: async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as { model?: string };
      requestedModel = body.model || "";
      return new Response(
        JSON.stringify({
          model: requestedModel,
          choices: [{ message: { content: "live" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  assert.equal(requestedModel, "flash-custom");
});

test("gateway gives thinking-enabled direct questions enough output budget", async () => {
  let requestedMaxTokens = 0;

  await runAiTask({
    task: "direct_question",
    mode: "live",
    apiKey: "test-key",
    smallModel: "flash-custom",
    proModel: "pro-custom",
    messages: [{ role: "user", content: "Compare several concepts and explain their causal relationship.".repeat(4) }],
    routingText: "Compare several concepts and explain their causal relationship.".repeat(4),
    fallback: { answer: "fallback" },
    fetchImpl: async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as { max_tokens?: number };
      requestedMaxTokens = body.max_tokens || 0;
      return new Response(
        JSON.stringify({
          model: "pro-custom",
          choices: [{ message: { content: "live" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  assert.equal(requestedMaxTokens, 1_200);
});

test("gateway keeps flash timeout short and gives thinking-enabled pro tasks more time", () => {
  assert.equal(resolveTaskTimeoutMs(false, 12_000, 30_000), 12_000);
  assert.equal(resolveTaskTimeoutMs(true, 12_000, 30_000), 30_000);
  assert.equal(resolveTaskTimeoutMs(true, 40_000, 30_000), 40_000);
});

test("gateway keeps mock default and falls back without exposing provider errors", async () => {
  const mock = await runAiTask({
    task: "direct_question",
    mode: "mock",
    messages: [{ role: "user", content: "蔡加尼克效应是什么？" }],
    fallback: { answer: "先给你一版轻量解释。", needsContext: false, suggestContextMode: false },
  });

  const missingKey = await runAiTask({
    task: "direct_question",
    mode: "live",
    apiKey: "",
    messages: [{ role: "user", content: "蔡加尼克效应是什么？" }],
    fallback: { answer: "先给你一版轻量解释。", needsContext: false, suggestContextMode: false },
    fetchImpl: async () => {
      throw new Error("fetch should not run without a key");
    },
  });

  assert.equal(mock.mode, "mock");
  assert.equal(mock.fallbackReason, "mock_mode");
  assert.equal(missingKey.mode, "mock");
  assert.equal(missingKey.fallbackReason, "missing_api_key");
});

test("gateway returns live parsed data and falls back on schema errors", async () => {
  const live = await runAiTask({
    task: "direct_question",
    mode: "live",
    apiKey: "test-key",
    messages: [{ role: "user", content: "概念是什么？" }],
    fallback: { answer: "fallback" },
    parse: (content) => JSON.parse(content) as { answer: string },
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          model: "deepseek-v4-flash",
          choices: [{ message: { content: "{\"answer\":\"live\"}" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
  });

  const schemaFallback = await runAiTask({
    task: "direct_question",
    mode: "live",
    apiKey: "test-key",
    messages: [{ role: "user", content: "概念是什么？" }],
    fallback: { answer: "fallback" },
    parse: () => {
      throw new Error("schema_error: invalid response");
    },
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "{}" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
  });

  assert.equal(live.mode, "live");
  assert.deepEqual(live.data, { answer: "live" });
  assert.equal(schemaFallback.mode, "mock");
  assert.equal(schemaFallback.fallbackReason, "schema_error");
  assert.equal(schemaFallback.errorType, "schema_error");
});

test("provides prompt definitions for all planned AI tasks", () => {
  assert.equal(getPromptDefinition("daily_summary", "daily_summary_v1").promptVersion, "daily_summary_v1");
  assert.equal(getPromptDefinition("direct_question", "direct_question_v1").promptVersion, "direct_question_v1");
  assert.equal(getPromptDefinition("contextual_answer", "contextual_answer_v1").promptVersion, "contextual_answer_v1");
  assert.equal(getPromptDefinition("review_questions", "review_questions_v1").promptVersion, "review_questions_v1");
  assert.equal(getPromptDefinition("answer_feedback", "answer_feedback_v1").promptVersion, "answer_feedback_v1");
});

test("daily summary keeps every confirmed excerpt without truncation", () => {
  const result = normalizeDailySummaryInput({
    task: "daily_summary",
    bookId: "attention",
    bookTitle: "注意力的边界",
    author: "卢门",
    chapterTitle: "重新认识专注",
    startPage: 1,
    endPage: 20,
    readingMinutes: 8,
    excerpts: Array.from({ length: 20 }, (_, index) => `第 ${index + 1} 段：${"专注力".repeat(160)}`),
    userGoal: "今天先读 5 分钟",
    promptVersion: "daily_summary_v1",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.excerpts.length, 20);
    assert.ok(result.value.excerpts.every((excerpt) => excerpt.includes("专注力".repeat(160))));
    assert.equal(result.value.promptVersion, "daily_summary_v1");
  }
});

test("builds contextual answer input from current page and adjacent paragraphs only", () => {
  const result = buildContextualAnswerInput({
    question: "作者这里为什么说硬撑没用？",
    bookId: "attention",
    bookTitle: "注意力的边界",
    chapterTitle: "重新认识专注",
    pageNumber: 3,
    previousParagraphs: ["前一页最后一段"],
    currentParagraphs: ["当前页第一段", "当前页第二段"],
    nextParagraphs: ["后一页第一段", "后一页第二段"],
    promptVersion: "contextual_answer_v1",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.value.contextParagraphs, ["前一页最后一段", "当前页第一段", "当前页第二段", "后一页第一段"]);
    assert.equal(result.value.promptVersion, "contextual_answer_v1");
  }
});

test("telemetry records metadata without raw content", () => {
  const events: unknown[] = [];
  const telemetry = createTelemetryRecorder((level, event) => events.push({ level, event }));

  telemetry.record({
    requestId: "req_1",
    feature: "reading-assist",
    task: "direct_question",
    mode: "live",
    promptVersion: "direct_question_v1",
    model: "deepseek-v4-flash",
    modelTier: "flash",
    thinkingEnabled: false,
    latencyMs: 123,
    inputCharCount: 8,
    outputCharCount: 20,
    usage: { totalTokens: 18 },
    createdAt: "2026-06-23T00:00:00.000Z",
  });

  const serialized = JSON.stringify(events);
  assert.match(serialized, /direct_question/);
  assert.doesNotMatch(serialized, /蔡加尼克效应是什么/);
  assert.doesNotMatch(serialized, /test-key|Bearer|Authorization/);
});

test("daily summary cache key includes range, prompt version, model, and excerpt hash", async () => {
  const store = new MemorySummaryCacheStore();
  const keyA = await createDailySummaryCacheKey({
    bookId: "attention",
    startPage: 1,
    endPage: 3,
    excerpts: ["alpha", "beta"],
    promptVersion: "daily_summary_v1",
    model: "deepseek-v4-flash",
  });
  const keyB = await createDailySummaryCacheKey({
    bookId: "attention",
    startPage: 1,
    endPage: 3,
    excerpts: ["alpha", "changed"],
    promptVersion: "daily_summary_v1",
    model: "deepseek-v4-flash",
  });

  assert.notEqual(keyA, keyB);
  assert.equal(await store.get(keyA), undefined);

  await store.set(keyA, { quote: "慢慢读也很好。", items: ["a", "b", "c"] });
  assert.deepEqual(await store.get(keyA), { quote: "慢慢读也很好。", items: ["a", "b", "c"] });
});
