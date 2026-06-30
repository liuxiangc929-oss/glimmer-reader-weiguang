import assert from "node:assert/strict";
import test from "node:test";
import {
  createAiRequestError,
  createAiRequestLoading,
  createAiRequestState,
  createAiRequestSuccess,
} from "./aiRequestState";

test("creates the five-state AI request lifecycle", () => {
  assert.deepEqual(createAiRequestState<string>(), {
    task: null,
    status: "idle",
    data: null,
    message: "",
  });

  assert.deepEqual(createAiRequestLoading<string, "direct_question">("正在准备回答...", "direct_question"), {
    task: "direct_question",
    status: "loading",
    data: null,
    message: "正在准备回答...",
  });

  assert.deepEqual(
    createAiRequestSuccess(
      { mode: "mock" as const, reason: "mock_mode", value: "mock questions" },
      "direct_question",
    ),
    {
      task: "direct_question",
      status: "success",
      data: { mode: "mock", reason: "mock_mode", value: "mock questions" },
      message: "",
    },
  );

  assert.deepEqual(
    createAiRequestSuccess(
      { mode: "mock" as const, reason: "missing_api_key", value: "fallback answer" },
      "contextual_answer",
    ),
    {
      task: "contextual_answer",
      status: "fallback",
      data: { mode: "mock", reason: "missing_api_key", value: "fallback answer" },
      message: "",
    },
  );

  assert.deepEqual(createAiRequestSuccess({ mode: "live" as const, value: "live questions" }), {
    task: null,
    status: "success",
    data: { mode: "live", value: "live questions" },
    message: "",
  });

  assert.deepEqual(createAiRequestError<string>("今天的问题暂时没准备好。"), {
    task: null,
    status: "error",
    data: null,
    message: "今天的问题暂时没准备好。",
  });
});

test("treats usable validation guidance as fallback instead of error", () => {
  assert.deepEqual(
    createAiRequestSuccess({
      mode: "mock" as const,
      reason: "needs_context",
      value: "请改用基于原文回答。",
    }),
    {
      task: null,
      status: "fallback",
      data: {
        mode: "mock",
        reason: "needs_context",
        value: "请改用基于原文回答。",
      },
      message: "",
    },
  );
});
