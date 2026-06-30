import type { IncomingMessage, ServerResponse } from "node:http";
import { generateAnswerFeedback } from "./ai/answerFeedbackTask";
import { readJsonBody, sendJson } from "./dailySummaryMiddleware";

export function createAnswerFeedbackMiddleware() {
  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    try {
      sendJson(res, 200, await generateAnswerFeedback(await readJsonBody(req)));
    } catch (error) {
      console.warn("Answer feedback middleware failed.", error);
      sendJson(res, 200, await generateAnswerFeedback({}));
    }
  };
}
