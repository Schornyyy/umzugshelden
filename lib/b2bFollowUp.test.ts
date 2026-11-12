import assert from "node:assert/strict";
import test from "node:test";
import { DAY_IN_MS, nextB2bFollowUp } from "./b2bFollowUp";

test("first sent email schedules the follow-up after three days", () => {
  assert.deepEqual(nextB2bFollowUp(1_000, 0), {
    followUpDays: 3,
    nextFollowUpAt: 1_000 + 3 * DAY_IN_MS,
  });
});

test("every later sent email schedules the follow-up after seven days", () => {
  for (const previousEmailCount of [1, 2, 20]) {
    assert.deepEqual(nextB2bFollowUp(1_000, previousEmailCount), {
      followUpDays: 7,
      nextFollowUpAt: 1_000 + 7 * DAY_IN_MS,
    });
  }
});

test("invalid activity counts are rejected", () => {
  assert.throws(() => nextB2bFollowUp(1_000, -1), /Anzahl/);
  assert.throws(() => nextB2bFollowUp(1_000, 1.5), /Anzahl/);
});

