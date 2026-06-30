export interface PendingSummaryEntry {
  bookId: string;
  startPage: number;
  endPage: number;
}

export function createPendingSummaryEntry(
  input: PendingSummaryEntry,
): PendingSummaryEntry {
  return {
    bookId: input.bookId,
    startPage: Math.max(1, Math.min(input.startPage, input.endPage)),
    endPage: Math.max(1, Math.max(input.startPage, input.endPage)),
  };
}
