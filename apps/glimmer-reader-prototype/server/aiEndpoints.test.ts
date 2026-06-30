import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import test, { after } from "node:test";
import { createAnswerFeedbackMiddleware } from "./answerFeedbackMiddleware";
import { createDailySummaryMiddleware } from "./dailySummaryMiddleware";
import {
  createReadingAssistContextualMiddleware,
  createReadingAssistDirectMiddleware,
} from "./readingAssistMiddleware";
import { createReviewQuestionsMiddleware } from "./reviewQuestionsMiddleware";

type Middleware = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;

const routes = new Map<string, Middleware>([
  ["/api/daily-summary", createDailySummaryMiddleware({ AI_MODE: "mock" })],
  ["/api/reading-assist/direct", createReadingAssistDirectMiddleware({ AI_MODE: "mock" })],
  ["/api/reading-assist/contextual", createReadingAssistContextualMiddleware({ AI_MODE: "mock" })],
  ["/api/review-questions", createReviewQuestionsMiddleware()],
  ["/api/answer-feedback", createAnswerFeedbackMiddleware()],
]);

const server = createServer((req, res) => {
  const pathname = new URL(req.url || "/", "http://127.0.0.1").pathname;
  const middleware = routes.get(pathname);

  if (!middleware) {
    res.statusCode = 404;
    res.end();
    return;
  }

  void middleware(req, res);
});

await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();

if (!address || typeof address === "string") {
  throw new Error("Failed to start endpoint smoke-test server.");
}

const baseUrl = `http://127.0.0.1:${address.port}`;

after(() => {
  server.close();
});

const dailySummaryPayload = {
  task: "daily_summary",
  bookId: "attention",
  bookTitle: "注意力的边界",
  author: "卢门",
  chapterTitle: "重新认识专注",
  startPage: 1,
  endPage: 3,
  readingMinutes: 6,
  excerpts: ["专注力不是可以无限硬撑的资源。"],
  userGoal: "今天先读 5 分钟",
  promptVersion: "daily_summary_v1",
};

const reviewQuestionsPayload = {
  task: "review_questions",
  promptVersion: "review_questions_v1",
  bookId: "attention",
  bookTitle: "注意力的边界",
  summary: {
    quote: "慢慢读，也是在往前走。",
    items: ["专注有真实边界。", "疲惫是需要调整的信号。", "降低启动难度比责备自己更有用。"],
  },
};

const questions = {
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

const endpointCases = [
  {
    path: "/api/daily-summary",
    payload: dailySummaryPayload,
    assertBody(body: Record<string, unknown>) {
      assert.equal(body.mode, "mock");
      assert.equal(body.reason, "mock_mode");
      assert.equal(typeof body.cached, "boolean");
      const summary = body.summary as { quote?: unknown; items?: unknown };
      assert.equal(typeof summary.quote, "string");
      assert.equal(Array.isArray(summary.items), true);
      assert.equal((summary.items as unknown[]).length, 3);
    },
  },
  {
    path: "/api/reading-assist/direct",
    payload: {
      task: "direct_question",
      question: "蔡加尼克效应是什么？",
      promptVersion: "direct_question_v1",
    },
    assertBody(body: Record<string, unknown>) {
      assert.equal(body.mode, "mock");
      assert.equal(body.reason, "mock_mode");
      assert.equal(typeof body.answer, "string");
      assert.equal(typeof body.needsContext, "boolean");
      assert.equal(typeof body.suggestContextMode, "boolean");
    },
  },
  {
    path: "/api/reading-assist/contextual",
    payload: {
      task: "contextual_answer",
      question: "作者为什么说硬撑没有用？",
      bookId: "attention",
      bookTitle: "注意力的边界",
      chapterTitle: "重新认识专注",
      pageNumber: 3,
      contextParagraphs: ["硬撑不是意志问题，而是注意力资源已经下降。"],
      promptVersion: "contextual_answer_v1",
    },
    assertBody(body: Record<string, unknown>) {
      assert.equal(body.mode, "mock");
      assert.equal(body.reason, "mock_mode");
      assert.equal(typeof body.answer, "string");
      assert.equal(typeof body.citedSnippet, "string");
      assert.equal(typeof body.returnHint, "string");
    },
  },
  {
    path: "/api/review-questions",
    payload: reviewQuestionsPayload,
    assertBody(body: Record<string, unknown>) {
      assert.equal(body.mode, "mock");
      assert.equal(body.reason, "mock_mode");
      const responseQuestions = body.questions as Record<string, { id?: unknown }>;
      assert.deepEqual(Object.keys(responseQuestions), ["understanding", "extraction", "action"]);
      assert.equal(responseQuestions.action.id, "action");
    },
  },
  {
    path: "/api/answer-feedback",
    payload: {
      task: "answer_feedback",
      promptVersion: "answer_feedback_v1",
      questions,
      answers: {
        understanding: "注意力不是无限资源。",
        extraction: "比起硬撑，更重要的是保护精力。",
        action: "明天阅读前把手机放到另一个房间。",
      },
    },
    assertBody(body: Record<string, unknown>) {
      assert.equal(body.mode, "mock");
      assert.equal(body.reason, "mock_mode");
      const feedback = body.feedback as { acknowledgedPoints?: unknown; actionRecordCandidate?: unknown };
      assert.equal(Array.isArray(feedback.acknowledgedPoints), true);
      assert.equal(feedback.actionRecordCandidate, "明天阅读前把手机放到另一个房间。");
    },
  },
] as const;

test("all five AI endpoints return stable mock responses", async () => {
  for (const endpoint of endpointCases) {
    const response = await postJson(endpoint.path, endpoint.payload);
    assert.equal(response.status, 200, endpoint.path);
    endpoint.assertBody((await response.json()) as Record<string, unknown>);
  }
});

test("all five AI endpoints reject non-POST requests", async () => {
  for (const endpoint of endpointCases) {
    const response = await fetch(`${baseUrl}${endpoint.path}`);
    assert.equal(response.status, 405, endpoint.path);
    assert.deepEqual(await response.json(), { error: "Method not allowed" });
  }
});

test("invalid endpoint input falls back without exposing secrets or provider details", async () => {
  for (const endpoint of endpointCases) {
    const response = await postJson(endpoint.path, {
      malformed: true,
      DEEPSEEK_API_KEY: "should-never-appear",
    });
    const body = await response.text();

    assert.equal(response.status, 200, endpoint.path);
    assert.doesNotMatch(body, /should-never-appear|Bearer|Authorization|stack|DeepSeek request failed/i);
    assert.match(body, /"mode":"mock"/);
  }
});

test("live direct ask is limited to 20 calls per test session", async () => {
  const { baseUrl: liveBaseUrl, close } = await startEndpointServer(
    "/api/reading-assist/direct",
    createReadingAssistDirectMiddleware({ AI_ASSIST_MODE: "live" }),
  );

  try {
    let cookie = "";
    for (let index = 0; index < 20; index += 1) {
      const response = await postJsonTo(liveBaseUrl, "/api/reading-assist/direct", {
        task: "direct_question",
        question: `What is attention residue? ${index}`,
        promptVersion: "direct_question_v1",
      }, cookie);
      cookie = readSetCookie(response) || cookie;
      const body = (await response.json()) as Record<string, unknown>;

      assert.equal(response.status, 200);
      assert.notEqual(body.reason, "rate_limited");
    }

    const blocked = await postJsonTo(liveBaseUrl, "/api/reading-assist/direct", {
      task: "direct_question",
      question: "What is attention residue after the limit?",
      promptVersion: "direct_question_v1",
    }, cookie);
    const blockedBody = (await blocked.json()) as Record<string, unknown>;

    assert.equal(blocked.status, 200);
    assert.equal(blockedBody.mode, "mock");
    assert.equal(blockedBody.reason, "rate_limited");
    assert.equal(typeof blockedBody.answer, "string");
    assert.equal(blockedBody.needsContext, false);
    assert.equal(blockedBody.suggestContextMode, false);
  } finally {
    await close();
  }
});

test("live daily summary is limited to 6 calls per test session", async () => {
  const { baseUrl: liveBaseUrl, close } = await startEndpointServer(
    "/api/daily-summary",
    createDailySummaryMiddleware({ AI_SUMMARY_MODE: "live" }),
  );

  try {
    let cookie = "";
    for (let index = 0; index < 6; index += 1) {
      const response = await postJsonTo(liveBaseUrl, "/api/daily-summary", {
        ...dailySummaryPayload,
        startPage: index + 1,
        endPage: index + 1,
      }, cookie);
      cookie = readSetCookie(response) || cookie;
      const body = (await response.json()) as Record<string, unknown>;

      assert.equal(response.status, 200);
      assert.notEqual(body.reason, "rate_limited");
    }

    const blocked = await postJsonTo(liveBaseUrl, "/api/daily-summary", {
      ...dailySummaryPayload,
      startPage: 7,
      endPage: 7,
    }, cookie);
    const blockedBody = (await blocked.json()) as Record<string, unknown>;
    const summary = blockedBody.summary as { quote?: unknown; items?: unknown };

    assert.equal(blocked.status, 200);
    assert.equal(blockedBody.mode, "mock");
    assert.equal(blockedBody.reason, "rate_limited");
    assert.equal(blockedBody.cached, false);
    assert.equal(typeof summary.quote, "string");
    assert.equal(Array.isArray(summary.items), true);
    assert.equal((summary.items as unknown[]).length, 3);
  } finally {
    await close();
  }
});

function postJson(path: string, payload: unknown): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

function postJsonTo(base: string, path: string, payload: unknown, cookie = ""): Promise<Response> {
  return fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(payload),
  });
}

async function startEndpointServer(path: string, middleware: Middleware): Promise<{
  baseUrl: string;
  close: () => Promise<void>;
}> {
  const testServer = createServer((req, res) => {
    const pathname = new URL(req.url || "/", "http://127.0.0.1").pathname;

    if (pathname !== path) {
      res.statusCode = 404;
      res.end();
      return;
    }

    void middleware(req, res);
  });

  await new Promise<void>((resolve) => testServer.listen(0, "127.0.0.1", resolve));
  const testAddress = testServer.address();

  if (!testAddress || typeof testAddress === "string") {
    throw new Error("Failed to start endpoint test server.");
  }

  return {
    baseUrl: `http://127.0.0.1:${testAddress.port}`,
    close: () => new Promise<void>((resolve, reject) => {
      testServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    }),
  };
}

function readSetCookie(response: Response): string {
  const setCookie = response.headers.get("set-cookie");
  return setCookie?.split(";")[0] || "";
}
