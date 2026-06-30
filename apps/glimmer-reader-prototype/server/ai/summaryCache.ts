import { createHash } from "node:crypto";
import type { DailySummarySchema } from "./aiSchemas";

export interface DailySummaryCacheKeyInput {
  bookId: string;
  startPage: number;
  endPage: number;
  excerpts: string[];
  promptVersion: string;
  model: string;
}

export interface SummaryCacheStore {
  get(key: string): Promise<DailySummarySchema | undefined>;
  set(key: string, value: DailySummarySchema): Promise<void>;
}

export class MemorySummaryCacheStore implements SummaryCacheStore {
  private readonly cache = new Map<string, DailySummarySchema>();

  async get(key: string): Promise<DailySummarySchema | undefined> {
    return this.cache.get(key);
  }

  async set(key: string, value: DailySummarySchema): Promise<void> {
    this.cache.set(key, value);
  }
}

export const dailySummaryCacheStore = new MemorySummaryCacheStore();

export async function createDailySummaryCacheKey(input: DailySummaryCacheKeyInput): Promise<string> {
  const excerptHash = createHash("sha256").update(input.excerpts.join("\n\n"), "utf8").digest("hex").slice(0, 16);

  return [
    "daily_summary",
    input.bookId,
    input.startPage,
    input.endPage,
    excerptHash,
    input.promptVersion,
    input.model,
  ].join(":");
}
