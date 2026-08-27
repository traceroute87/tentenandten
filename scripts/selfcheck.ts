/* Minimal self-check for the merge logic. Run: npm test
   (node --experimental-strip-types, no framework). */
import assert from "node:assert/strict";
import { mergeProgress } from "../src/lib/merge.ts";

// local ahead on reach, remote ahead on spread -> keep the higher of each
let m = mergeProgress(
  { reach: 7, spread: 2, bring: 0, checklist: { registration: true } },
  { reach: 3, spread: 9, bring: 0, checklist: { method: true } },
);
assert.equal(m.reach, 7);
assert.equal(m.spread, 9);
assert.deepEqual(m.checklist, { registration: true, method: true });

// checklist OR: true on either side wins
m = mergeProgress(
  { reach: 0, spread: 0, bring: 0, checklist: { id: true } },
  { reach: 0, spread: 0, bring: 0, checklist: { id: false } },
);
assert.equal(m.checklist.id, true);

// clamp + garbage input
m = mergeProgress(
  { reach: 99, spread: -4, bring: NaN as unknown as number, checklist: {} },
  { reach: 1, spread: 1, bring: 1, checklist: {} },
);
assert.equal(m.reach, 10);
assert.equal(m.spread, 1);
assert.equal(m.bring, 1);

console.log("selfcheck: merge logic OK");
