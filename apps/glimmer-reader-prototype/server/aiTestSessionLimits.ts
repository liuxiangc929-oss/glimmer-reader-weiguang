import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

export type AiTestSessionFeature = "daily-summary" | "reading-assist-direct";

interface AiTestSessionRecord {
  counts: Partial<Record<AiTestSessionFeature, number>>;
  updatedAt: number;
}

export interface AiTestSessionLimitOptions {
  feature: AiTestSessionFeature;
  limit: number;
  mode?: string;
}

export interface AiTestSessionLimitResult {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
}

const SESSION_COOKIE_NAME = "gr_ai_test_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const sessions = new Map<string, AiTestSessionRecord>();

export function enforceAiTestSessionLimit(
  req: IncomingMessage,
  res: ServerResponse,
  options: AiTestSessionLimitOptions,
): AiTestSessionLimitResult {
  if (options.mode?.toLowerCase() !== "live") {
    return {
      allowed: true,
      limit: options.limit,
      used: 0,
      remaining: options.limit,
    };
  }

  const sessionId = readSessionId(req) || createSessionId();
  writeSessionCookie(res, sessionId);

  const record = sessions.get(sessionId) ?? { counts: {}, updatedAt: Date.now() };
  const used = record.counts[options.feature] ?? 0;

  if (used >= options.limit) {
    record.updatedAt = Date.now();
    sessions.set(sessionId, record);
    return {
      allowed: false,
      limit: options.limit,
      used,
      remaining: 0,
    };
  }

  const nextUsed = used + 1;
  record.counts[options.feature] = nextUsed;
  record.updatedAt = Date.now();
  sessions.set(sessionId, record);

  return {
    allowed: true,
    limit: options.limit,
    used: nextUsed,
    remaining: Math.max(options.limit - nextUsed, 0),
  };
}

export function resetAiTestSessionLimitsForTests(): void {
  sessions.clear();
}

function readSessionId(req: IncomingMessage): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(";")) {
    const [name, ...rawValue] = part.trim().split("=");
    if (name === SESSION_COOKIE_NAME) {
      const value = rawValue.join("=");
      return /^[a-zA-Z0-9_-]{16,80}$/.test(value) ? value : undefined;
    }
  }

  return undefined;
}

function createSessionId(): string {
  return randomUUID().replace(/-/g, "");
}

function writeSessionCookie(res: ServerResponse, sessionId: string): void {
  const cookie = [
    `${SESSION_COOKIE_NAME}=${sessionId}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ].join("; ");
  const existing = res.getHeader("Set-Cookie");

  if (!existing) {
    res.setHeader("Set-Cookie", cookie);
    return;
  }

  if (Array.isArray(existing)) {
    res.setHeader("Set-Cookie", [...existing, cookie]);
    return;
  }

  res.setHeader("Set-Cookie", [String(existing), cookie]);
}
