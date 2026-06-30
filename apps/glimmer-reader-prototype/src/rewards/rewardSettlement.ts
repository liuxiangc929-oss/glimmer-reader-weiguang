export const REWARD_KINDS = ["reading", "summary", "questions", "action_review"] as const;

export type RewardKind = (typeof REWARD_KINDS)[number];
export type RewardSettlementRecord = Record<RewardKind, boolean>;

export function createRewardSettlementRecord(): RewardSettlementRecord {
  return {
    reading: false,
    summary: false,
    questions: false,
    action_review: false,
  };
}

export function settleReward(
  record: RewardSettlementRecord,
  kind: RewardKind,
): RewardSettlementRecord {
  if (record[kind]) {
    return record;
  }

  return {
    ...record,
    [kind]: true,
  };
}

export function getSettledRewards(record: RewardSettlementRecord): RewardKind[] {
  return REWARD_KINDS.filter((kind) => record[kind]);
}
