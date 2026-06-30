import type { IncomingMessage, ServerResponse } from "node:http";
import { normalizeDirectQuestionInput } from "./ai/inputNormalizers";
import { answerContextualQuestion, answerDirectQuestion } from "./ai/readingAssistantTask";
import { enforceAiTestSessionLimit } from "./aiTestSessionLimits";
import { type AiServerEnv, readJsonBody, sendJson } from "./dailySummaryMiddleware";

export function createReadingAssistDirectMiddleware(env: AiServerEnv) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    try {
      const body = await readJsonBody(req);
      const question = readQuestion(body);
      const normalized = normalizeDirectQuestionInput(question);

      if (normalized.ok) {
        const limit = enforceAiTestSessionLimit(req, res, {
          feature: "reading-assist-direct",
          limit: 20,
          mode: env.AI_ASSIST_MODE ?? env.AI_MODE,
        });

        if (!limit.allowed) {
          sendJson(res, 200, {
            mode: "mock",
            reason: "rate_limited",
            answer: "今天这轮 AI 测试次数已经用完了。你可以先继续阅读，等我关闭测试入口后再整理反馈。",
            example: "",
            returnHint: "这只是测试保护，不影响你的阅读进度和奖励。",
            needsContext: false,
            suggestContextMode: false,
          });
          return;
        }
      }

      sendJson(res, 200, await answerDirectQuestion(body, { env }));
    } catch (error) {
      console.warn("Direct reading assist middleware failed.", error);
      sendJson(res, 200, {
        mode: "mock",
        reason: "provider_error",
        answer: "这个问题暂时没有想清楚，你可以先继续读，稍后再试一次。",
        example: "",
        returnHint: "如果它和当前原文有关，可以改用“基于原文回答”。",
        needsContext: false,
        suggestContextMode: false,
      });
    }
  };
}

function readQuestion(value: unknown): string {
  if (typeof value !== "object" || value === null) return "";
  const question = (value as Record<string, unknown>).question;
  return typeof question === "string" ? question : "";
}

export function createReadingAssistContextualMiddleware(env: AiServerEnv) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    try {
      sendJson(res, 200, await answerContextualQuestion(await readJsonBody(req), { env }));
    } catch (error) {
      console.warn("Contextual reading assist middleware failed.", error);
      sendJson(res, 200, {
        mode: "mock",
        reason: "provider_error",
        answer: "这段内容暂时没能解释清楚。可以先回到原文继续读，稍后再试一次。",
        citedSnippet: "",
        returnHint: "不用停太久，先把这一页读完也很好。",
      });
    }
  };
}
