import { postAiJson } from "./aiRequestClient";

export interface DailySummaryRequest {
  task: "daily_summary";
  bookId: string;
  bookTitle: string;
  author: string;
  chapterTitle: string;
  startPage: number;
  endPage: number;
  readingMinutes: number;
  excerpts: string[];
  userGoal: string;
  promptVersion: "daily_summary_v1";
}

export interface DailySummary {
  quote: string;
  items: string[];
}

export interface DailySummaryResponse {
  mode: "live" | "mock";
  reason?: string;
  cached: boolean;
  summary: DailySummary;
}

export const DEFAULT_DAILY_SUMMARY: DailySummary = {
  quote: "微光已经亮起。今天先读到这里，也已经很好。",
  items: [
    "你完成了一段有效阅读，先开始这件事本身就值得被记录。",
    "今天的要点可以先收成一个小线索，明天再慢慢接上。",
    "如果还想继续复盘，可以等看完总结后再选择下一步问题。",
  ],
};

export const DAILY_SUMMARY_TIMEOUT_MS = 35_000;

export function requestDailySummary(payload: DailySummaryRequest): Promise<DailySummaryResponse> {
  return postAiJson({
    url: "/api/daily-summary",
    payload,
    timeoutMs: DAILY_SUMMARY_TIMEOUT_MS,
    fallback: {
      mode: "mock",
      reason: "api_error",
      cached: false,
      summary: DEFAULT_DAILY_SUMMARY,
    },
  });
}
