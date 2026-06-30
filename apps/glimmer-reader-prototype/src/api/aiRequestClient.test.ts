import assert from "node:assert/strict";
import test from "node:test";
import {
  AiRequestCancelledError,
  postAiJson,
} from "./aiRequestClient";
import { DAILY_SUMMARY_TIMEOUT_MS } from "./dailySummary";
import { DIRECT_QUESTION_TIMEOUT_MS } from "./readingAssist";

test("uses the task timeout and returns fallback after timeout", async () => {
  const fallback = { mode: "mock" as const, reason: "api_error" };
  const result = await postAiJson({
    url: "/api/test",
    payload: {},
    timeoutMs: 5,
    fallback,
    fetchImpl: async (_url, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("aborted", "AbortError"));
        });
      }),
  });

  assert.deepEqual(result, fallback);
});

test("distinguishes caller cancellation from timeout fallback", async () => {
  const controller = new AbortController();
  const request = postAiJson({
    url: "/api/test",
    payload: {},
    timeoutMs: 100,
    signal: controller.signal,
    fallback: { mode: "mock" as const, reason: "api_error" },
    fetchImpl: async (_url, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("aborted", "AbortError"));
        });
      }),
  });

  controller.abort();

  await assert.rejects(request, AiRequestCancelledError);
});

test("uses separate user-facing timeouts for summary and direct question", () => {
  assert.equal(DIRECT_QUESTION_TIMEOUT_MS, 20_000);
  assert.equal(DAILY_SUMMARY_TIMEOUT_MS, 35_000);
});
