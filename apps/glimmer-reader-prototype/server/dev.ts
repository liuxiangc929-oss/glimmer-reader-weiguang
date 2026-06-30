import "dotenv/config";
import express from "express";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { createServer as createViteServer } from "vite";
import { createDailySummaryMiddleware } from "./dailySummaryMiddleware";
import {
  createReadingAssistContextualMiddleware,
  createReadingAssistDirectMiddleware,
} from "./readingAssistMiddleware";
import { createReviewQuestionsMiddleware } from "./reviewQuestionsMiddleware";
import { createAnswerFeedbackMiddleware } from "./answerFeedbackMiddleware";

const HOST = "127.0.0.1";
const PORT = 3002;

const app = express();

app.use("/api/daily-summary", createDailySummaryMiddleware(process.env));
app.use("/api/reading-assist/direct", createReadingAssistDirectMiddleware(process.env));
app.use("/api/reading-assist/contextual", createReadingAssistContextualMiddleware(process.env));
app.use("/api/review-questions", createReviewQuestionsMiddleware());
app.use("/api/answer-feedback", createAnswerFeedbackMiddleware());

const vite = await createViteServer({
  configFile: false,
  root: process.cwd(),
  plugins: [react(), tailwindcss()],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(process.cwd(), "."),
    },
  },
  server: {
    middlewareMode: true,
    hmr: process.env.DISABLE_HMR !== "true",
    watch: process.env.DISABLE_HMR === "true" ? null : {},
  },
  appType: "spa",
});

app.use(vite.middlewares);

app.listen(PORT, HOST, () => {
  console.log(`Glimmer Reader dev server running at http://${HOST}:${PORT}/`);
});
