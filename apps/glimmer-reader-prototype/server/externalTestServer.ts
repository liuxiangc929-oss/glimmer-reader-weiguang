import express, { type Express } from "express";
import dotenv from "dotenv";
import path from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createAnswerFeedbackMiddleware } from "./answerFeedbackMiddleware";
import { createDailySummaryMiddleware, type AiServerEnv } from "./dailySummaryMiddleware";
import {
  createReadingAssistContextualMiddleware,
  createReadingAssistDirectMiddleware,
} from "./readingAssistMiddleware";
import { createReviewQuestionsMiddleware } from "./reviewQuestionsMiddleware";

export interface ExternalTestAppOptions {
  distDir: string;
  env: AiServerEnv;
}

export function createExternalTestApp(options: ExternalTestAppOptions): Express {
  const app = express();

  app.use("/api/daily-summary", createDailySummaryMiddleware(options.env));
  app.use("/api/reading-assist/direct", createReadingAssistDirectMiddleware(options.env));
  app.use("/api/reading-assist/contextual", createReadingAssistContextualMiddleware(options.env));
  app.use("/api/review-questions", createReviewQuestionsMiddleware());
  app.use("/api/answer-feedback", createAnswerFeedbackMiddleware());

  app.use(express.static(options.distDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(options.distDir, "index.html"));
  });

  return app;
}

export function startExternalTestServer(): void {
  dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: false });
  dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

  const host = process.env.EXTERNAL_TEST_HOST || "127.0.0.1";
  const port = Number(process.env.EXTERNAL_TEST_PORT || 3002);
  const distDir = path.resolve(process.cwd(), "dist");

  if (!existsSync(path.join(distDir, "index.html"))) {
    throw new Error("dist/index.html not found. Run npm run build before starting external test server.");
  }

  const app = createExternalTestApp({
    distDir,
    env: process.env,
  });

  app.listen(port, host, () => {
    console.log(`Glimmer Reader external test server running at http://${host}:${port}/`);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startExternalTestServer();
}
