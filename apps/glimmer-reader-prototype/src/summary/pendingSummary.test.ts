import assert from "node:assert/strict";
import test from "node:test";
import { createPendingSummaryEntry } from "./pendingSummary";

test("keeps the actual book and confirmed range for read-later summary", () => {
  const entry = createPendingSummaryEntry({
    bookId: "attention",
    startPage: 3,
    endPage: 6,
  });

  assert.deepEqual(entry, {
    bookId: "attention",
    startPage: 3,
    endPage: 6,
  });
});

test("normalizes a reversed range without replacing it with a fixed demo range", () => {
  const entry = createPendingSummaryEntry({
    bookId: "attention",
    startPage: 6,
    endPage: 3,
  });

  assert.equal(entry.startPage, 3);
  assert.equal(entry.endPage, 6);
});
