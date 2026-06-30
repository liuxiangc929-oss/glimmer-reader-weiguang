import assert from "node:assert/strict";
import test from "node:test";
import { generateDailySummaryWithGateway } from "./ai/dailySummaryTask";
import { MemorySummaryCacheStore } from "./ai/summaryCache";
import { answerContextualQuestion, answerDirectQuestion } from "./ai/readingAssistantTask";
import { generateReviewQuestions } from "./ai/reviewQuestionsTask";
import { generateAnswerFeedback } from "./ai/answerFeedbackTask";

const dailySummaryInput = {
  task: "daily_summary",
  bookId: "attention",
  bookTitle: "注意力的边界",
  author: "卢门",
  chapterTitle: "重新认识专注",
  startPage: 1,
  endPage: 3,
  readingMinutes: 6,
  excerpts: ["专注力不是可以无限硬撑的资源。", "疲惫不是失败，而是边界发出的信号。"],
  userGoal: "今天先读 5 分钟",
  promptVersion: "daily_summary_v1",
};

test("daily summary defaults to mock mode", async () => {
  const result = await generateDailySummaryWithGateway(dailySummaryInput, { env: {} });

  assert.equal(result.mode, "mock");
  assert.equal(result.reason, "mock_mode");
  assert.equal(result.cached, false);
  assert.equal(result.summary.items.length, 3);
});

test("daily summary live mode falls back when DeepSeek key is missing", async () => {
  const result = await generateDailySummaryWithGateway(dailySummaryInput, {
    env: { AI_SUMMARY_MODE: "live", DEEPSEEK_API_KEY: "" },
    fetchImpl: async () => {
      throw new Error("fetch should not run without a key");
    },
  });

  assert.equal(result.mode, "mock");
  assert.equal(result.reason, "missing_api_key");
});

test("daily summary cache avoids repeated live provider calls", async () => {
  const cacheStore = new MemorySummaryCacheStore();
  let fetchCount = 0;

  const first = await generateDailySummaryWithGateway(dailySummaryInput, {
    env: { AI_SUMMARY_MODE: "live", DEEPSEEK_API_KEY: "test-key" },
    cacheStore,
    fetchImpl: async () => {
      fetchCount += 1;
      return new Response(
        JSON.stringify({
          model: "deepseek-v4-flash",
          usage: { total_tokens: 30 },
          choices: [
            {
              message: {
                content: JSON.stringify({
                  quote: "慢慢读，也是在把注意力带回身边。",
                  items: ["专注有真实边界。", "疲惫是需要调整的信号。", "降低启动难度比责备自己更有用。"],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  const second = await generateDailySummaryWithGateway(dailySummaryInput, {
    env: { AI_SUMMARY_MODE: "live", DEEPSEEK_API_KEY: "test-key" },
    cacheStore,
    fetchImpl: async () => {
      throw new Error("cache should avoid the second fetch");
    },
  });

  assert.equal(first.mode, "live");
  assert.equal(first.cached, false);
  assert.equal(second.mode, "live");
  assert.equal(second.cached, true);
  assert.equal(fetchCount, 1);
});

test("direct question does not send context-dependent questions to live AI", async () => {
  const result = await answerDirectQuestion(
    { task: "direct_question", question: "这里作者为什么这么说？", promptVersion: "direct_question_v1" },
    {
      env: { AI_ASSIST_MODE: "live", DEEPSEEK_API_KEY: "test-key" },
      fetchImpl: async () => {
        throw new Error("fetch should not run for context-dependent direct questions");
      },
    },
  );

  assert.equal(result.mode, "mock");
  assert.equal(result.reason, "needs_context");
  assert.equal(result.needsContext, true);
  assert.equal(result.suggestContextMode, true);
});

test("contextual answer refuses empty original-text context before live AI", async () => {
  const result = await answerContextualQuestion(
    {
      task: "contextual_answer",
      question: "作者为什么这么说？",
      bookId: "attention",
      bookTitle: "注意力的边界",
      chapterTitle: "重新认识专注",
      pageNumber: 3,
      contextParagraphs: [],
      promptVersion: "contextual_answer_v1",
    },
    {
      env: { AI_ASSIST_MODE: "live", DEEPSEEK_API_KEY: "test-key" },
      fetchImpl: async () => {
        throw new Error("fetch should not run without original text context");
      },
    },
  );

  assert.equal(result.mode, "mock");
  assert.equal(result.reason, "invalid_input");
});

test("review questions expose a stable mock schema without calling a provider", async () => {
  const result = await generateReviewQuestions({
    task: "review_questions",
    promptVersion: "review_questions_v1",
    bookId: "attention",
    bookTitle: "注意力的边界",
    summary: {
      quote: "慢慢读，也是在往前走。",
      items: ["专注有真实边界。", "疲惫是需要调整的信号。", "降低启动难度比责备自己更有用。"],
    },
  });

  assert.equal(result.mode, "mock");
  assert.equal(result.reason, "mock_mode");
  assert.deepEqual(Object.keys(result.questions), ["understanding", "extraction", "action"]);
  assert.equal(result.questions.understanding.id, "understanding");
  assert.equal(result.questions.extraction.id, "extraction");
  assert.equal(result.questions.action.id, "action");
});

test("answer feedback keeps the submitted action as a record candidate", async () => {
  const questionsResult = await generateReviewQuestions({
    task: "review_questions",
    promptVersion: "review_questions_v1",
    bookId: "attention",
    bookTitle: "注意力的边界",
    summary: {
      quote: "慢慢读，也是在往前走。",
      items: ["专注有真实边界。"],
    },
  });

  const result = await generateAnswerFeedback({
    task: "answer_feedback",
    promptVersion: "answer_feedback_v1",
    questions: questionsResult.questions,
    answers: {
      understanding: "注意力不是无限资源。",
      extraction: "比起硬撑，更重要的是保护精力。",
      action: "明天阅读前把手机放到另一个房间。",
    },
  });

  assert.equal(result.mode, "mock");
  assert.equal(result.reason, "mock_mode");
  assert.ok(result.feedback.acknowledgedPoints.length > 0);
  assert.equal(result.feedback.actionRecordCandidate, "明天阅读前把手机放到另一个房间。");
  assert.ok(result.feedback.gentleClosing.length > 0);
});
