import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { generateDailySummaryWithGateway } from "../server/ai/dailySummaryTask";
import { answerDirectQuestion } from "../server/ai/readingAssistantTask";
import type { AiTelemetryEvent } from "../server/ai/aiTelemetry";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

type ExpectedRoute = "flash" | "pro" | "blocked" | "cache";
type Feature = "direct_question" | "daily_summary";

interface QualityEvaluationRow {
  caseId: string;
  feature: Feature;
  inputType: string;
  expectedRoute: ExpectedRoute;
  mode: "live" | "mock";
  reason?: string;
  actualRoute?: "flash" | "pro";
  thinkingEnabled?: boolean;
  latencyMs?: number;
  inputCharCount?: number;
  outputCharCount?: number;
  usage?: AiTelemetryEvent["usage"];
  cached?: boolean;
  output: unknown;
  outputQuality: "待人工评分";
  styleFit: "待人工判断";
  problemType: "待归因";
  nextAction: "待根据输出质量决定";
}

const telemetryEvents: AiTelemetryEvent[] = [];
const originalInfo = console.info;
const originalWarn = console.warn;

console.info = captureTelemetry(originalInfo);
console.warn = captureTelemetry(originalWarn);

try {
  assertQualityEvalEnabled(process.env);
  const env = {
    AI_MODE: "live",
    AI_SUMMARY_MODE: "live",
    AI_ASSIST_MODE: "live",
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    DEEPSEEK_SMALL_MODEL: process.env.DEEPSEEK_SMALL_MODEL || "deepseek-v4-flash",
    DEEPSEEK_PRO_MODEL: process.env.DEEPSEEK_PRO_MODEL || "deepseek-v4-pro",
    AI_TIMEOUT_MS: process.env.AI_TIMEOUT_MS || "12000",
    AI_PRO_TIMEOUT_MS: process.env.AI_PRO_TIMEOUT_MS || "30000",
  };

  const rows: QualityEvaluationRow[] = [];
  const enabledCaseIds = readCaseFilter(process.env.AI_QUALITY_EVAL_CASES);

  for (const testCase of directQuestionCases().filter((testCase) => shouldRunCase(testCase.caseId, enabledCaseIds))) {
    const before = telemetryEvents.length;
    const result = await answerDirectQuestion(
      {
        task: "direct_question",
        question: testCase.question,
        promptVersion: "direct_question_v1",
      },
      { env },
    );
    const event = findLatestEvent("direct_question", before);
    rows.push({
      caseId: testCase.caseId,
      feature: "direct_question",
      inputType: testCase.inputType,
      expectedRoute: testCase.expectedRoute,
      mode: result.mode,
      reason: result.reason,
      actualRoute: event?.modelTier,
      thinkingEnabled: event?.thinkingEnabled,
      latencyMs: event?.latencyMs,
      inputCharCount: event?.inputCharCount,
      outputCharCount: event?.outputCharCount,
      usage: event?.usage,
      output: {
        answer: result.answer,
        example: result.example,
        returnHint: result.returnHint,
        needsContext: result.needsContext,
        suggestContextMode: result.suggestContextMode,
      },
      outputQuality: "待人工评分",
      styleFit: "待人工判断",
      problemType: "待归因",
      nextAction: "待根据输出质量决定",
    });
  }

  for (const testCase of dailySummaryCases().filter((testCase) => shouldRunCase(testCase.caseId, enabledCaseIds))) {
    const before = telemetryEvents.length;
    const result = await generateDailySummaryWithGateway(testCase.input, { env });
    const event = findLatestEvent("daily_summary", before);
    rows.push({
      caseId: testCase.caseId,
      feature: "daily_summary",
      inputType: testCase.inputType,
      expectedRoute: testCase.expectedRoute,
      mode: result.mode,
      reason: result.reason,
      actualRoute: event?.modelTier,
      thinkingEnabled: event?.thinkingEnabled,
      latencyMs: event?.latencyMs,
      inputCharCount: event?.inputCharCount,
      outputCharCount: event?.outputCharCount,
      usage: event?.usage,
      cached: result.cached,
      output: result.summary,
      outputQuality: "待人工评分",
      styleFit: "待人工判断",
      problemType: "待归因",
      nextAction: "待根据输出质量决定",
    });
  }

  const report = {
    createdAt: new Date().toISOString(),
    scope: "AI 今日总结 + 直接问质量评测",
    note: "本报告使用自写评测样例，不包含 API Key、provider 原始响应或未脱敏用户隐私。",
    filteredCaseIds: enabledCaseIds ? Array.from(enabledCaseIds) : undefined,
    rows,
  };

  await saveReport(report, Boolean(enabledCaseIds));
  originalInfo(JSON.stringify(report, null, 2));
} catch (error) {
  originalWarn(
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        status: "blocked",
        reason: error instanceof Error ? error.message : "AI quality evaluation preflight failed.",
      },
      null,
      2,
    ),
  );
  process.exitCode = 2;
} finally {
  console.info = originalInfo;
  console.warn = originalWarn;
}

function assertQualityEvalEnabled(env: Record<string, string | undefined>): void {
  if (env.RUN_LIVE_AI_QUALITY_EVAL?.toLowerCase() !== "true") {
    throw new Error("Live AI quality evaluation has not been explicitly authorized.");
  }
  if (env.AI_SUMMARY_MODE?.toLowerCase() !== "live" || env.AI_ASSIST_MODE?.toLowerCase() !== "live") {
    throw new Error("AI_SUMMARY_MODE and AI_ASSIST_MODE must both be live.");
  }
  if (!env.DEEPSEEK_API_KEY?.trim()) {
    throw new Error("DeepSeek API key is missing from the local environment.");
  }
}

function directQuestionCases(): Array<{
  caseId: string;
  inputType: string;
  question: string;
  expectedRoute: ExpectedRoute;
}> {
  return [
    { caseId: "DQ-01", inputType: "术语解释", question: "蔡加尼克效应是什么？", expectedRoute: "flash" },
    { caseId: "DQ-02", inputType: "用户访谈复现", question: "前额叶主要指大脑中的哪块区域？", expectedRoute: "flash" },
    { caseId: "DQ-03", inputType: "用户访谈复现", question: "流体智力是什么意思？", expectedRoute: "flash" },
    { caseId: "DQ-04", inputType: "用户访谈复现", question: "觉醒衰退是什么？", expectedRoute: "flash" },
    { caseId: "DQ-05", inputType: "概念对比", question: "认知负荷和注意力残留有什么区别？", expectedRoute: "pro" },
    {
      caseId: "DQ-06",
      inputType: "复杂分析",
      question: "为什么人越想开始一件重要的事，越容易拖延？请从注意力、情绪和任务启动阻力分析。",
      expectedRoute: "pro",
    },
    { caseId: "DQ-07", inputType: "上下文依赖拦截", question: "这里作者为什么这么说？", expectedRoute: "blocked" },
    { caseId: "DQ-08", inputType: "上下文依赖拦截", question: "结合这段原文解释一下它为什么重要。", expectedRoute: "blocked" },
    { caseId: "DQ-09", inputType: "过短输入", question: "这个什么意思", expectedRoute: "blocked" },
    { caseId: "DQ-10", inputType: "过长输入", question: "请解释一下".repeat(130), expectedRoute: "blocked" },
  ];
}

function readCaseFilter(value: string | undefined): Set<string> | undefined {
  const caseIds = value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return caseIds && caseIds.length > 0 ? new Set(caseIds) : undefined;
}

function shouldRunCase(caseId: string, enabledCaseIds: Set<string> | undefined): boolean {
  return !enabledCaseIds || enabledCaseIds.has(caseId);
}

function dailySummaryCases(): Array<{
  caseId: string;
  inputType: string;
  expectedRoute: ExpectedRoute;
  input: ReturnType<typeof createSummaryInput>;
}> {
  const shortAttention = [
    "专注力不是可以无限硬撑的资源，它会受到睡眠、情绪和环境干扰影响。",
    "当人感到疲惫时，注意力下降不是失败，而是大脑提醒你需要调整节奏。",
  ];
  return [
    {
      caseId: "DS-01",
      inputType: "短内容",
      expectedRoute: "flash",
      input: createSummaryInput("eval-summary-short", shortAttention),
    },
    {
      caseId: "DS-02",
      inputType: "用户场景复现",
      expectedRoute: "flash",
      input: createSummaryInput("eval-summary-low-pressure", [
        "开始阅读最难的地方，往往不是读不懂，而是任务看起来太大。",
        "把目标缩小到五分钟，可以绕开一部分心理阻力，让人先进入行动。",
        "当行动开始后，成就感会变得更具体，下一次开始也会更容易。",
      ]),
    },
    {
      caseId: "DS-03",
      inputType: "概念密集",
      expectedRoute: "pro",
      input: createSummaryInput("eval-summary-concepts", [
        "认知负荷指的是工作记忆在处理信息时承受的压力。",
        "注意力残留指人在切换任务后，部分注意力仍停留在上一个任务中。",
        "任务启动阻力会让人不断推迟开始，而未完成感又会继续占用注意力。",
        "这些机制叠加时，人会觉得自己很忙，却很难真正进入深度阅读。",
      ]),
    },
    {
      caseId: "DS-04",
      inputType: "长内容",
      expectedRoute: "pro",
      input: createSummaryInput(
        "eval-summary-long",
        Array.from(
          { length: 8 },
          (_, index) =>
            `第 ${index + 1} 段：注意力需要通过环境设计、任务拆分和节奏管理得到保护。` +
            "如果一开始就要求自己完成很大的阅读目标，用户更容易把阅读理解成压力任务。".repeat(12),
        ),
      ),
    },
    {
      caseId: "DS-05",
      inputType: "抽象内容",
      expectedRoute: "pro",
      input: createSummaryInput("eval-summary-abstract", [
        "自我调节并不是单纯依靠意志力，而是在目标、反馈和环境之间持续建立关系。",
        "当反馈过于遥远时，行动的意义会变得抽象，个体更容易回避长期任务。",
        "低门槛行动的价值，是把遥远目标转换成当下可以完成的小闭环。",
      ]),
    },
    {
      caseId: "DS-06",
      inputType: "内容不足",
      expectedRoute: "blocked",
      input: createSummaryInput("eval-summary-empty", []),
    },
    {
      caseId: "DS-07",
      inputType: "缓存复测",
      expectedRoute: "cache",
      input: createSummaryInput("eval-summary-short", shortAttention),
    },
    {
      caseId: "DS-08",
      inputType: "风格压力测试",
      expectedRoute: "flash",
      input: createSummaryInput("eval-summary-pressure-style", [
        "有些学习建议会强调必须每天坚持，否则就会落后。",
        "但对启动困难的人来说，高压语言常常会带来更多逃避。",
        "更有效的方式，是先承认已经完成的小行动，再慢慢增加阅读量。",
      ]),
    },
  ];
}

function createSummaryInput(bookId: string, excerpts: string[]) {
  return {
    task: "daily_summary",
    bookId,
    bookTitle: "注意力的边界",
    author: "评测样例",
    chapterTitle: "重新认识专注",
    startPage: 1,
    endPage: Math.max(excerpts.length, 1),
    readingMinutes: 8,
    excerpts,
    userGoal: "今天先读 5 分钟",
    promptVersion: "daily_summary_v1",
  } as const;
}

function findLatestEvent(task: Feature, startIndex: number): AiTelemetryEvent | undefined {
  const recentEvents = telemetryEvents.slice(startIndex);
  for (let index = recentEvents.length - 1; index >= 0; index -= 1) {
    if (recentEvents[index].task === task) return recentEvents[index];
  }
  return undefined;
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

async function saveReport(report: unknown, filtered: boolean): Promise<void> {
  const filename = filtered ? "ai-quality-evaluation-rerun-report.json" : "ai-quality-evaluation-report.json";
  const jsonPath = path.resolve(process.cwd(), "tmp", filename);
  await mkdir(path.dirname(jsonPath), { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
