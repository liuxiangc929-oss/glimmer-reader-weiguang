import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLiveAcceptanceConfig,
  sanitizeLiveAcceptanceReport,
} from "./liveAcceptance";

test("live acceptance requires explicit authorization, live modes, and a local API key", () => {
  assert.throws(
    () =>
      buildLiveAcceptanceConfig({
        RUN_LIVE_AI_ACCEPTANCE: "false",
        AI_SUMMARY_MODE: "live",
        AI_ASSIST_MODE: "live",
        DEEPSEEK_API_KEY: "local-key",
      }),
    /explicitly authorized/,
  );

  assert.throws(
    () =>
      buildLiveAcceptanceConfig({
        RUN_LIVE_AI_ACCEPTANCE: "true",
        AI_SUMMARY_MODE: "mock",
        AI_ASSIST_MODE: "live",
        DEEPSEEK_API_KEY: "local-key",
      }),
    /must both be live/,
  );

  assert.throws(
    () =>
      buildLiveAcceptanceConfig({
        RUN_LIVE_AI_ACCEPTANCE: "true",
        AI_SUMMARY_MODE: "live",
        AI_ASSIST_MODE: "live",
        DEEPSEEK_API_KEY: "",
      }),
    /API key is missing/,
  );
});

test("live acceptance report keeps metadata and removes all content and secrets", () => {
  const report = sanitizeLiveAcceptanceReport({
    createdAt: "2026-06-24T00:00:00.000Z",
    provider: "deepseek",
    status: "passed",
    apiKey: "secret-key",
    headers: { Authorization: "Bearer secret-key" },
    prompt: "完整原文",
    question: "用户问题",
    answer: "模型回答",
    checks: [
      {
        name: "daily_summary_flash",
        outcome: "passed",
        model: "deepseek-v4-flash",
        modelTier: "flash",
        thinkingEnabled: false,
        latencyMs: 123,
        inputCharCount: 456,
        outputCharCount: 120,
        usage: { totalTokens: 80 },
        prompt: "不应保留",
      },
    ],
  });

  assert.deepEqual(report, {
    createdAt: "2026-06-24T00:00:00.000Z",
    provider: "deepseek",
    status: "passed",
    checks: [
      {
        name: "daily_summary_flash",
        outcome: "passed",
        model: "deepseek-v4-flash",
        modelTier: "flash",
        thinkingEnabled: false,
        latencyMs: 123,
        inputCharCount: 456,
        outputCharCount: 120,
        usage: { totalTokens: 80 },
      },
    ],
  });

  const serialized = JSON.stringify(report);
  assert.doesNotMatch(serialized, /secret-key|Authorization|完整原文|用户问题|模型回答|不应保留/);
});
