import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { generateDailySummaryWithGateway } from "../server/ai/dailySummaryTask";
import { answerDirectQuestion } from "../server/ai/readingAssistantTask";
import { runAiTask } from "../server/ai/aiGateway";
import {
  buildLiveAcceptanceConfig,
  sanitizeLiveAcceptanceReport,
  type LiveAcceptanceCheck,
} from "../server/ai/liveAcceptance";
import type { AiTelemetryEvent } from "../server/ai/aiTelemetry";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const reportPath = path.resolve(process.cwd(), "tmp", "ai-live-acceptance-report.json");
const telemetryEvents: AiTelemetryEvent[] = [];
const originalInfo = console.info;
const originalWarn = console.warn;

console.info = captureTelemetry(originalInfo);
console.warn = captureTelemetry(originalWarn);

try {
  const config = buildLiveAcceptanceConfig(process.env);
  const env = {
    AI_MODE: "live",
    AI_SUMMARY_MODE: "live",
    AI_ASSIST_MODE: "live",
    DEEPSEEK_API_KEY: config.apiKey,
    DEEPSEEK_BASE_URL: config.baseUrl,
    DEEPSEEK_SMALL_MODEL: config.smallModel,
    DEEPSEEK_PRO_MODEL: config.proModel,
    AI_TIMEOUT_MS: String(config.timeoutMs),
    AI_PRO_TIMEOUT_MS: String(config.proTimeoutMs),
  };
  const checks: LiveAcceptanceCheck[] = [];

  const smallSummaryInput = createSummaryInput([
    "专注力不是可以无限硬撑的资源。",
    "疲惫不是失败，而是边界发出的信号。",
  ]);
  const smallSummary = await withTelemetry("daily_summary_flash", async () =>
    generateDailySummaryWithGateway(smallSummaryInput, { env }),
  );
  checks.push(
    checkTaskResult("daily_summary_flash", smallSummary.result.mode === "live" && smallSummary.result.summary.items.length === 3, {
      ...smallSummary.event,
      mode: smallSummary.result.mode,
      reason: smallSummary.result.reason,
      cached: smallSummary.result.cached,
    }),
  );

  const cachedSummary = await withTelemetry("daily_summary_cache", async () =>
    generateDailySummaryWithGateway(smallSummaryInput, { env }),
  );
  checks.push(
    checkTaskResult("daily_summary_cache", cachedSummary.result.mode === "live" && cachedSummary.result.cached, {
      ...cachedSummary.event,
      mode: cachedSummary.result.mode,
      reason: cachedSummary.result.reason,
      cached: cachedSummary.result.cached,
    }),
  );

  const completeLongExcerpts = Array.from(
    { length: 8 },
    (_, index) => `第 ${index + 1} 段：${"注意力需要通过环境设计和节奏管理得到保护。".repeat(18)}`,
  );
  const longSummary = await withTelemetry("daily_summary_pro_complete_input", async () =>
    generateDailySummaryWithGateway(createSummaryInput(completeLongExcerpts), { env }),
  );
  checks.push(
    checkTaskResult(
      "daily_summary_pro_complete_input",
      longSummary.result.mode === "live" &&
        longSummary.result.summary.items.length === 3 &&
        longSummary.event?.modelTier === "pro" &&
        (longSummary.event.inputCharCount ?? 0) >= completeLongExcerpts.join("").length,
      {
        ...longSummary.event,
        mode: longSummary.result.mode,
        reason: longSummary.result.reason,
        cached: longSummary.result.cached,
      },
    ),
  );

  const directFlash = await withTelemetry("direct_question_flash", async () =>
    answerDirectQuestion(
      {
        task: "direct_question",
        question: "蔡加尼克效应是什么？",
        promptVersion: "direct_question_v1",
      },
      { env },
    ),
  );
  checks.push(
    checkTaskResult(
      "direct_question_flash",
      directFlash.result.mode === "live" &&
        directFlash.result.answer.length > 0 &&
        directFlash.result.answer.length <= 800 &&
        directFlash.result.returnHint.length > 0 &&
        directFlash.result.needsContext === false &&
        directFlash.event?.modelTier === "flash",
      {
        ...directFlash.event,
        mode: directFlash.result.mode,
        reason: directFlash.result.reason,
      },
    ),
  );

  const complexQuestion =
    "请比较蔡加尼克效应、注意力残留和任务启动阻力之间的关系，并分析它们为什么会让人反复拖延。请分别说明概念差异、可能的因果链条，以及一个低压力的应对方法。";
  const directPro = await withTelemetry("direct_question_pro", async () =>
    answerDirectQuestion(
      {
        task: "direct_question",
        question: complexQuestion.repeat(2),
        promptVersion: "direct_question_v1",
      },
      { env },
    ),
  );
  checks.push(
    checkTaskResult(
      "direct_question_pro",
      directPro.result.mode === "live" &&
        directPro.result.answer.length > 0 &&
        directPro.result.answer.length <= 1_500 &&
        directPro.event?.modelTier === "pro",
      {
        ...directPro.event,
        mode: directPro.result.mode,
        reason: directPro.result.reason,
      },
    ),
  );

  const eventCountBeforeContextBlock = telemetryEvents.length;
  const contextBlocked = await answerDirectQuestion(
    {
      task: "direct_question",
      question: "这里作者为什么这么说？",
      promptVersion: "direct_question_v1",
    },
    { env },
  );
  checks.push(
    checkTaskResult(
      "direct_question_context_guard",
      contextBlocked.mode === "mock" &&
        contextBlocked.reason === "needs_context" &&
        contextBlocked.suggestContextMode &&
        telemetryEvents.length === eventCountBeforeContextBlock,
      {
        mode: contextBlocked.mode,
        reason: contextBlocked.reason,
      },
    ),
  );

  checks.push(...(await runFallbackChecks()));

  const report = sanitizeLiveAcceptanceReport({
    createdAt: new Date().toISOString(),
    provider: "deepseek",
    status: checks.every((check) => check.outcome === "passed") ? "passed" : "failed",
    checks,
  });
  await saveReport(report);
  originalInfo(JSON.stringify(report, null, 2));
  if (report.status !== "passed") process.exitCode = 1;
} catch (error) {
  const report = sanitizeLiveAcceptanceReport({
    createdAt: new Date().toISOString(),
    provider: "deepseek",
    status: "blocked",
    checks: [
      {
        name: "live_acceptance_preflight",
        outcome: "blocked",
        reason: error instanceof Error ? error.message : "Live acceptance preflight failed.",
      },
    ],
  });
  await saveReport(report);
  originalWarn(JSON.stringify(report, null, 2));
  process.exitCode = 2;
} finally {
  console.info = originalInfo;
  console.warn = originalWarn;
}

function createSummaryInput(excerpts: string[]) {
  return {
    task: "daily_summary",
    bookId: "live-acceptance-book",
    bookTitle: "注意力的边界",
    author: "验收样例",
    chapterTitle: "重新认识专注",
    startPage: 1,
    endPage: excerpts.length,
    readingMinutes: 8,
    excerpts,
    userGoal: "今天先读 5 分钟",
    promptVersion: "daily_summary_v1",
  } as const;
}

async function withTelemetry<T>(name: string, operation: () => Promise<T>) {
  const before = telemetryEvents.length;
  const result = await operation();
  const recentEvents = telemetryEvents.slice(before);
  let event: AiTelemetryEvent | undefined;
  for (let index = recentEvents.length - 1; index >= 0; index -= 1) {
    if (recentEvents[index].task === taskForCheck(name)) {
      event = recentEvents[index];
      break;
    }
  }
  return { result, event };
}

function taskForCheck(name: string): "daily_summary" | "direct_question" {
  return name.startsWith("daily_summary") ? "daily_summary" : "direct_question";
}

function checkTaskResult(
  name: string,
  passed: boolean,
  metadata: Partial<AiTelemetryEvent> & { mode?: "live" | "mock"; reason?: string; cached?: boolean },
): LiveAcceptanceCheck {
  return {
    name,
    outcome: passed ? "passed" : "failed",
    mode: metadata.mode,
    reason: metadata.reason ?? metadata.fallbackReason,
    errorType: metadata.errorType,
    model: metadata.model,
    modelTier: metadata.modelTier,
    thinkingEnabled: metadata.thinkingEnabled,
    latencyMs: metadata.latencyMs,
    inputCharCount: metadata.inputCharCount,
    outputCharCount: metadata.outputCharCount,
    usage: metadata.usage,
    cached: metadata.cached,
  };
}

async function runFallbackChecks(): Promise<LiveAcceptanceCheck[]> {
  const fallback = { answer: "温和兜底" };
  const base = {
    task: "direct_question" as const,
    mode: "live",
    messages: [{ role: "user" as const, content: "测试" }],
    fallback,
  };
  const missingKey = await runAiTask({ ...base, apiKey: "" });
  const timeout = await runAiTask({
    ...base,
    apiKey: "test-key",
    fetchImpl: async () => {
      throw new DOMException("slow", "AbortError");
    },
  });
  const insufficientBalance = await runAiTask({
    ...base,
    apiKey: "test-key",
    fetchImpl: async () => new Response("{}", { status: 402 }),
  });
  const rateLimited = await runAiTask({
    ...base,
    apiKey: "test-key",
    fetchImpl: async () => new Response("{}", { status: 429 }),
  });

  return [
    fallbackCheck("fallback_missing_api_key", missingKey, "missing_api_key", "missing_api_key"),
    fallbackCheck("fallback_timeout", timeout, "timeout", "timeout"),
    fallbackCheck("fallback_insufficient_balance", insufficientBalance, "provider_error", "insufficient_balance"),
    fallbackCheck("fallback_rate_limited", rateLimited, "rate_limited", "rate_limited"),
  ];
}

function fallbackCheck(
  name: string,
  result: Awaited<ReturnType<typeof runAiTask<{ answer: string }>>>,
  expectedReason: string,
  expectedErrorType: string,
): LiveAcceptanceCheck {
  return {
    name,
    outcome:
      result.mode === "mock" &&
      result.fallbackReason === expectedReason &&
      (result.errorType === expectedErrorType || (expectedErrorType === "missing_api_key" && !result.errorType))
        ? "passed"
        : "failed",
    mode: result.mode,
    reason: result.fallbackReason,
    errorType: result.errorType ?? expectedErrorType,
  };
}

function captureTelemetry(fallback: typeof console.info) {
  return (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === "string") {
      try {
        const parsed = JSON.parse(first) as { type?: unknown };
        if (parsed.type === "ai_telemetry") {
          telemetryEvents.push(parsed as unknown as AiTelemetryEvent);
          return;
        }
      } catch {
        // Non-JSON application logs are passed through.
      }
    }
    fallback(...args);
  };
}

async function saveReport(report: ReturnType<typeof sanitizeLiveAcceptanceReport>): Promise<void> {
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
