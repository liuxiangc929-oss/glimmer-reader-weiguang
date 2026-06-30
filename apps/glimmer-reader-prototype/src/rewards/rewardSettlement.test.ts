import assert from "node:assert/strict";
import test from "node:test";
import { createAiRequestError } from "../ai/aiRequestState";
import {
  createRewardSettlementRecord,
  getSettledRewards,
  settleReward,
} from "./rewardSettlement";

test("settles rewards by completed behavior without duplicates", () => {
  let record = createRewardSettlementRecord();

  assert.deepEqual(getSettledRewards(record), []);

  record = settleReward(record, "reading");
  record = settleReward(record, "summary");
  record = settleReward(record, "questions");

  assert.deepEqual(getSettledRewards(record), ["reading", "summary", "questions"]);
  assert.equal(settleReward(record, "questions"), record);
});

test("keeps completed rewards when later AI feedback fails", () => {
  let record = createRewardSettlementRecord();
  record = settleReward(record, "reading");
  record = settleReward(record, "summary");
  record = settleReward(record, "questions");

  const feedbackState = createAiRequestError("反馈暂时没生成好。");

  assert.equal(feedbackState.status, "error");
  assert.deepEqual(getSettledRewards(record), ["reading", "summary", "questions"]);
});
