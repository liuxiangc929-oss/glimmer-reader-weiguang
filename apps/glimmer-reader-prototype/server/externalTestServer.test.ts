import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createServer } from "node:http";
import test from "node:test";
import { createExternalTestApp } from "./externalTestServer";

test("external test server serves built app and keeps AI API routes", async () => {
  const distDir = mkdtempSync(path.join(tmpdir(), "glimmer-external-test-"));
  writeFileSync(path.join(distDir, "index.html"), "<!doctype html><div id=\"root\"></div>");

  const app = createExternalTestApp({
    distDir,
    env: { AI_MODE: "mock" },
  });
  const server = createServer(app);

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Failed to start external test server.");
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const page = await fetch(`${baseUrl}/`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /id="root"/);

    const api = await fetch(`${baseUrl}/api/daily-summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: "daily_summary",
        bookId: "attention",
        bookTitle: "Attention",
        author: "Demo",
        chapterTitle: "Focus",
        startPage: 1,
        endPage: 1,
        readingMinutes: 5,
        excerpts: ["Focused reading starts small."],
        userGoal: "Read for 5 minutes",
        promptVersion: "daily_summary_v1",
      }),
    });
    const body = (await api.json()) as Record<string, unknown>;

    assert.equal(api.status, 200);
    assert.equal(body.mode, "mock");
    assert.equal(body.reason, "mock_mode");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
});
