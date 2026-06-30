import type { IncomingMessage, ServerResponse } from "node:http";
import { buildFallbackDailySummaryFromInput, generateDailySummaryWithGateway } from "./ai/dailySummaryTask";
import { normalizeDailySummaryInput } from "./ai/inputNormalizers";
import { enforceAiTestSessionLimit } from "./aiTestSessionLimits";

export interface AiServerEnv {
  AI_MODE?: string;
  AI_SUMMARY_MODE?: string;
  AI_ASSIST_MODE?: string;
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_BASE_URL?: string;
  DEEPSEEK_SMALL_MODEL?: string;
  DEEPSEEK_PRO_MODEL?: string;
  AI_TIMEOUT_MS?: string;
}

export function createDailySummaryMiddleware(env: AiServerEnv) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    try {
      const body = await readJsonBody(req);
      const mode = env.AI_SUMMARY_MODE ?? env.AI_MODE;
      const normalized = normalizeDailySummaryInput(body);

      if (normalized.ok) {
        const limit = enforceAiTestSessionLimit(req, res, {
          feature: "daily-summary",
          limit: 6,
          mode,
        });

        if (!limit.allowed) {
          sendJson(res, 200, {
            mode: "mock",
            reason: "rate_limited",
            cached: false,
            summary: buildFallbackDailySummaryFromInput(normalized.value),
          });
          return;
        }
      }

      const result = await generateDailySummaryWithGateway(body, { env });
      sendJson(res, 200, result);
    } catch (error) {
      console.warn("Daily summary middleware failed.", error);
      sendJson(res, 200, {
        mode: "mock",
        reason: "provider_error",
        cached: false,
        summary: {
          quote: "微光已经亮起，今天先读到这里也很好。",
          items: [
            "这次总结暂时没有生成成功，但你完成的阅读已经被看见了。",
            "可以先继续阅读，或者稍后再回来试一次。",
            "阅读和奖励状态不会因为这次 AI 失败而倒退。",
          ],
        },
      });
    }
  };
}

export function readJsonBody(req: IncomingMessage, maxChars = 1_000_000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";

    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > maxChars) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

export function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}
