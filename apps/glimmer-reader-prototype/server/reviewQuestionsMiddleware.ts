import type { IncomingMessage, ServerResponse } from "node:http";
import { generateReviewQuestions } from "./ai/reviewQuestionsTask";
import { readJsonBody, sendJson } from "./dailySummaryMiddleware";

export function createReviewQuestionsMiddleware() {
  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    try {
      sendJson(res, 200, await generateReviewQuestions(await readJsonBody(req)));
    } catch (error) {
      console.warn("Review questions middleware failed.", error);
      sendJson(res, 200, await generateReviewQuestions({}));
    }
  };
}
