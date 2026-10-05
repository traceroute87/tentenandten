/* Minimal self-check for the merge logic. Run: npm test
   (node --experimental-strip-types, no framework). */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mergeProgress } from "../src/lib/merge.ts";
import { mergeBeforeWrite, persistProgressAndArchive } from "../src/lib/sync.ts";
import { safeSyncError } from "../src/lib/sync-diagnostics.ts";
import { archiveCompletedCycle, completionTimestampFromActionLogs, historyFromLocal, historyFromRemote, historyToRemote, mergeChallengeCycles, mergeChallengeHistory, newChallengeCycle, normalizeElectionContext, sortChallengeHistory } from "../src/lib/challenge-cycles.ts";
import { MESSAGE_PRESETS, renderMessageTemplate } from "../src/data/messagePresets.ts";
import { ELECTION_TYPE_LABELS, NATIONAL_VOTING_RESOURCES, RESOURCE_TYPES, STATES, STATE_ELECTION_OFFICE, STATE_ELECTION_RESOURCES, STATE_RESOURCES, UPCOMING_ELECTIONS, electionCardData, electionStatus, localCalendarDate, messageResourceType, nextKnownElection, votingResource } from "../src/data.ts";
import { allDayDateRange, calendarActions, calendarPlatform, electionCalendar, electionDescription, googleCalendarUrl } from "../src/lib/calendar.ts";
import { installMode, isIOSSafari, IOS_INSTALL_STEPS, requestNativeInstall } from "../src/lib/install.ts";
import { validAnalyticsEvent } from "../src/lib/analytics-schema.ts";
import { sheetStack, stateWithSheetStack } from "../src/lib/sheet-history.ts";

// Sheets add same-route history entries and unwind only the top nested sheet.
const routeState = { returnTo: "impact" };
const menuSheetState = stateWithSheetStack(routeState, ["menu"]);
const nestedSheetState = stateWithSheetStack(menuSheetState, ["menu", "presets"]);
assert.deepEqual(sheetStack(nestedSheetState), ["menu", "presets"]);
assert.deepEqual(sheetStack(menuSheetState), ["menu"]); // Back first restores the underlying sheet
assert.deepEqual(stateWithSheetStack(menuSheetState, []), routeState); // closing removes only overlay metadata
assert.equal(sheetStack(null).length, 0);

// Challenge cycles archive once, keep context, and reject stale-device counter resurrection.
const completedCycle = {
  challengeCycle: 1,
  startedAt: "2026-10-01T12:00:00.000Z",
  completedAt: "2026-11-03T19:00:00.000Z",
  electionContext: { electionId: "2026-federal-midterm", electionName: "2026 Federal Midterm General Election", electionDate: "2026-11-03", electionType: "midterm" as const },
  reach: 10, spread: 10, bring: 10,
};
const onceArchived = archiveCompletedCycle([], completedCycle);
assert.equal(archiveCompletedCycle(onceArchived, completedCycle).length, 1); // completion/refresh is idempotent
const remoteHistory = onceArchived.map(historyToRemote);
assert.equal(historyFromRemote(remoteHistory).length, 1); // reconnect/second device merges by stable cycle
const guestReload = historyFromLocal(JSON.parse(JSON.stringify(onceArchived)));
assert.equal(guestReload.length, 1); // localStorage reload retains guest history
assert.equal(guestReload[0].electionContext?.electionId, "2026-federal-midterm");
assert.equal(guestReload[0].completedAt, completedCycle.completedAt); // completion date survives local reload
assert.equal(historyFromRemote(remoteHistory)[0].completedAt, completedCycle.completedAt); // and account sync
assert.equal(normalizeElectionContext({ electionId: "free-text", electionName: "Candidate X", electionDate: "2026-11-03", electionType: "midterm" }), null);
assert.deepEqual(Object.keys(remoteHistory[0]).sort(), [
  "bring_final", "challenge_cycle", "completed_at", "election_date", "election_id", "election_name",
  "election_type", "jurisdiction", "reach_final", "share_final", "started_at", "total_actions",
].sort()); // no candidate, party, ballot-choice, address, or plan fields
const newCycle = newChallengeCycle(completedCycle, "2026-11-04T15:00:00.000Z", null);
assert.deepEqual([newCycle.reach, newCycle.spread, newCycle.bring, newCycle.challengeCycle], [0, 0, 0, 2]);
const staleDeviceMerge = mergeChallengeCycles(newCycle, completedCycle);
assert.deepEqual([staleDeviceMerge.challengeCycle, staleDeviceMerge.reach, staleDeviceMerge.spread, staleDeviceMerge.bring], [2, 0, 0, 0]);
assert.equal(mergeChallengeCycles({ ...newCycle, reach: 3 }, { ...newCycle, reach: 5 }).reach, 5); // max wins only inside one cycle
const nextCompleted = archiveCompletedCycle(onceArchived, { ...completedCycle, challengeCycle: 2, completedAt: "2026-12-01T12:00:00.000Z" });
assert.equal(nextCompleted.length, 2); // starting a new challenge preserves cumulative lifetime count
assert.equal(sortChallengeHistory(nextCompleted)[0].challengeCycle, 2);
assert.equal(mergeChallengeHistory(nextCompleted, nextCompleted).length, 2); // duplicate sync remains unique
const legacyUnknownDate = archiveCompletedCycle([], { ...completedCycle, completedAt: null, electionContext: null });
assert.equal(legacyUnknownDate[0].completedAt, null); // migration does not invent a finish time
assert.equal(legacyUnknownDate[0].electionContext, null);
assert.equal(sortChallengeHistory([{ ...legacyUnknownDate[0], completedAt: undefined as unknown as string }]).length, 1); // old records without optional dates still sort
const savedActionLogs = {
  reach: { count: 10, log: Array.from({ length: 10 }, (_, i) => ({ ts: Date.UTC(2026, 9, 2, 12, i) })) },
  spread: { count: 10, log: Array.from({ length: 10 }, (_, i) => ({ ts: Date.UTC(2026, 9, 2, 13, i) })) },
  bring: { count: 10, log: Array.from({ length: 10 }, (_, i) => ({ ts: Date.UTC(2026, 9, 2, 14, i) })) },
};
assert.equal(completionTimestampFromActionLogs(savedActionLogs), "2026-10-02T14:09:00.000Z");
assert.equal(completionTimestampFromActionLogs({ ...savedActionLogs, bring: { count: 10, log: [] } }), null); // do not infer without all 30 stored actions
const recoveredArchive = archiveCompletedCycle([], { ...completedCycle, completedAt: completionTimestampFromActionLogs(savedActionLogs) });
assert.equal(historyFromLocal(JSON.parse(JSON.stringify(recoveredArchive)))[0].completedAt, "2026-10-02T14:09:00.000Z");

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

// Restored/reconnected accounts merge the server snapshot before writing.
const order: string[] = [];
let state = { reach: 1, spread: 0, bring: 0, checklist: {} };
await mergeBeforeWrite(
  async () => { order.push("fetch"); return { reach: 8, spread: 2, bring: 0, checklist: {} }; },
  (remote) => { order.push("merge"); state = mergeProgress(state, remote); },
  async () => { order.push("write"); assert.deepEqual(state, { reach: 8, spread: 2, bring: 0, checklist: {} }); },
);
assert.deepEqual(order, ["fetch", "merge", "write"]);

// A completed local cycle remains intact if the account write fails against an older snapshot.
let retainedComplete = { challengeCycle: 1, startedAt: null, completedAt: "2026-10-02T14:09:00.000Z", electionContext: null, reach: 10, spread: 10, bring: 10 };
await assert.rejects(mergeBeforeWrite(
  async () => ({ challengeCycle: 1, startedAt: null, completedAt: null, electionContext: null, reach: 9, spread: 0, bring: 0 }),
  (remote) => { retainedComplete = mergeChallengeCycles(retainedComplete, remote); },
  async () => { throw new Error("mock progress write failure"); },
));
assert.deepEqual([retainedComplete.reach, retainedComplete.spread, retainedComplete.bring], [10, 10, 10]);

// A complete cycle is archived only after its progress write succeeds; archive failure is retryable.
const syncOrder: string[] = [];
await assert.rejects(persistProgressAndArchive(retainedComplete, async () => {
  syncOrder.push("progress");
}, async () => {
  syncOrder.push("archive");
  throw new Error("mock archive failure");
}));
assert.deepEqual(syncOrder, ["progress", "archive"]);
assert.deepEqual([retainedComplete.reach, retainedComplete.spread, retainedComplete.bring], [10, 10, 10]);
const completedSyncOrder: string[] = [];
let serverHistory: ReturnType<typeof historyToRemote>[] = [];
await persistProgressAndArchive(retainedComplete, async () => { completedSyncOrder.push("progress-write"); }, async () => {
  completedSyncOrder.push("archive-rpc");
  serverHistory = [historyToRemote(onceArchived[0])];
});
const reloadedHistory = mergeChallengeHistory([], historyFromRemote(serverHistory));
assert.deepEqual(completedSyncOrder, ["progress-write", "archive-rpc"]);
assert.equal(reloadedHistory.length, 1); // archive appears in app_snapshot and survives merge
assert.equal(reloadedHistory[0].completedAt, completedCycle.completedAt);

// Diagnostics include the requested fields but redact identity-like values.
const diagnostic = safeSyncError({ code: "42501", message: "permission denied for user@example.com", details: "referrer 12345678-1234-1234-1234-123456789abc", hint: "QWERTY", status: 403 });
assert.equal(diagnostic.code, "42501");
assert.equal(diagnostic.status, 403);
assert.ok(!JSON.stringify(diagnostic).includes("user@example.com"));
assert.ok(!JSON.stringify(diagnostic).includes("12345678-1234-1234-1234-123456789abc"));
assert.ok(!JSON.stringify(diagnostic).includes("QWERTY"));

// Offline failure blocks writes; reconnect re-fetches, merges, then persists.
let online = false;
let writes = 0;
const fetchRemote = async () => {
  if (!online) throw new Error("offline");
  return { reach: 4, spread: 7, bring: 1, checklist: {} };
};
await assert.rejects(mergeBeforeWrite(fetchRemote, (remote) => {
  state = mergeProgress(state, remote);
}, async () => { writes++; }));
assert.equal(writes, 0);
online = true;
await mergeBeforeWrite(fetchRemote, (remote) => {
  state = mergeProgress(state, remote);
}, async () => { writes++; });
assert.equal(state.reach, 8); // stale local never lowers the remote count
assert.equal(state.spread, 7);
assert.equal(state.bring, 1);
assert.equal(writes, 1);

// A response from an account that signed out cannot merge or start a write.
let currentSync = true;
let staleMerges = 0;
let staleWrites = 0;
let finishFetch!: (value: { account: string }) => void;
const pendingFetch = new Promise<{ account: string }>((resolve) => { finishFetch = resolve; });
const staleFetch = mergeBeforeWrite(() => pendingFetch, () => { staleMerges++; }, async () => { staleWrites++; }, () => currentSync);
currentSync = false; // logout and a new account becoming active
finishFetch({ account: "A" });
await assert.rejects(staleFetch, /Stale account sync/);
assert.equal(staleMerges, 0);
assert.equal(staleWrites, 0);

// A session change while the network write is pending is fenced after it settles.
currentSync = true;
let finishWrite!: () => void;
const pendingWrite = new Promise<void>((resolve) => { finishWrite = resolve; });
const staleWrite = mergeBeforeWrite(async () => ({ account: "A" }), () => { staleMerges++; }, () => pendingWrite, () => currentSync);
await Promise.resolve();
await Promise.resolve();
currentSync = false;
finishWrite();
await assert.rejects(staleWrite, /Stale account sync/);
assert.equal(staleWrites, 0);

// Account namespaces never reuse another account's progress, cycle, or history.
class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
  removeItem(key: string) { this.values.delete(key); }
}
const memoryStorage = new MemoryStorage();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: memoryStorage });
Object.defineProperty(globalThis, "navigator", { configurable: true, value: { onLine: false } });
const accountStore = await import("../src/store.ts");
accountStore.completeAction("reach", "call"); // guest progress is deliberately adopted by first account
const guestCount = accountStore.totalActions(accountStore.getState());
accountStore.activateAccount("account-A");
assert.equal(accountStore.totalActions(accountStore.getState()), guestCount);
for (let i = 0; i < 10; i++) accountStore.completeAction("reach", "call");
for (let i = 0; i < 10; i++) accountStore.completeAction("spread", "share");
for (let i = 0; i < 10; i++) accountStore.completeAction("bring", "plan");
assert.equal(accountStore.getState().challengeHistory.length, 1);
assert.equal(accountStore.startNewChallenge(), true);
assert.equal(accountStore.getState().challengeCycle, 2);
assert.equal(accountStore.totalActions(accountStore.getState()), 0);
accountStore.activateGuest();
assert.equal(accountStore.totalActions(accountStore.getState()), guestCount); // sign-out restores guest namespace
accountStore.activateAccount("account-B"); // A -> logout -> B
assert.equal(accountStore.totalActions(accountStore.getState()), 0);
assert.equal(accountStore.getState().challengeHistory.length, 0);
accountStore.completeAction("spread", "share");
accountStore.activateAccount("account-A"); // B -> A restores A's cycle/history
assert.equal(accountStore.totalActions(accountStore.getState()), 0);
assert.equal(accountStore.getState().challengeCycle, 2);
assert.equal(accountStore.getState().challengeHistory.length, 1);
accountStore.activateAccount("account-B");
assert.equal(accountStore.totalActions(accountStore.getState()), 1);
assert.equal(accountStore.getState().challengeCycle, 1);
assert.equal(accountStore.getState().challengeHistory.length, 0);
assert.ok(memoryStorage.getItem("t10.state.account.account-A"));
assert.ok(memoryStorage.getItem("t10.state.account.account-B"));

// Server RPC mirrors this allowlist; sensitive/arbitrary client props fail locally too.
assert.equal(validAnalyticsEvent("action_completed", { track: "reach", kind: "call", n: 1 }), true);
assert.equal(validAnalyticsEvent("action_completed", { track: "reach", kind: "call", n: 1, address: "x" }), false);
assert.equal(validAnalyticsEvent("share", { channel: "x", referral_code: "ABC123" }), false);
assert.equal(validAnalyticsEvent("visited", { user_id: "uuid" }), false);
for (const props of [
  { address: "123 Main St" }, { candidate: "X" }, { party: "Y" }, { voting_method: "mail" },
  { location: "polling place" }, { election_date: "2026-11-03" }, { transport: "ride" },
  { free_text: "private plan" }, { referral_code: "QWERTY" },
]) assert.equal(validAnalyticsEvent("visited", props), false);

// Message placeholders render into an editable copy without changing templates.
const friendly = MESSAGE_PRESETS.find((p) => p.id === "text-friendly")!;
const template = friendly.body;
const preview = renderMessageTemplate(template, {
  first_name: " Lee", state: "Oregon", election_date: "November 3, 2026",
  official_link: "https://oregon.gov/elections", site_link: "https://tentenandten.com/",
});
assert.match(preview, /Hey Lee/);
assert.match(preview, /https:\/\/oregon\.gov\/elections/);
const edited = preview.replace("Hey Lee", "Hi Lee");
assert.notEqual(edited, template);
assert.equal(friendly.body, template);
assert.equal(MESSAGE_PRESETS.filter((p) => p.id.endsWith("-challenge")).every((p) => p.body.includes("Reach 10. Share 10. Bring 10.")), true);

// Upcoming election card model supplies official links and tolerates missing optional details.
const nextElection = nextKnownElection("2026-10-01")!;
assert.equal(nextElection.id, "2026-federal-midterm");
assert.equal(ELECTION_TYPE_LABELS[nextElection.type], "Midterm / Congressional");
const electionCard = electionCardData(nextElection, "OR");
assert.equal(electionCard.resources.length, 7);
assert.equal(electionCard.resources.filter((r) => r.type === "ballot").length, 1);
assert.equal(electionCard.resources.find((r) => r.type === "ballot")?.label, "Sample ballot / What’s on my ballot");
assert.equal(electionCard.resources.find((r) => r.type === "ballot")?.source.status, "direct");
assert.ok(electionCard.resources.every((r) => r.source.url.startsWith("https://")));
assert.deepEqual(electionStatus(UPCOMING_ELECTIONS[0], "2026-12-01"), { expired: true });
assert.equal(nextKnownElection("2026-12-01")?.id, "2028-presidential-general");
const sparseElection = electionCardData({ ...UPCOMING_ELECTIONS[0], registrationDeadline: undefined }, "OR");
assert.equal(sparseElection.registrationDeadline, undefined);
assert.equal(sparseElection.resources.length, 7);

// State-specific lookups use only verified URLs; missing state tools use an explicit official index fallback.
assert.equal(votingResource("registration", "WV").url, "https://apps.sos.wv.gov/Elections/Voter/AmIRegisteredToVote");
assert.equal(votingResource("earlyVoting", "WV").url, "https://sos.wv.gov/early-voting-locations");
assert.equal(votingResource("absentee", "WV").url, "https://sos.wv.gov/absentee-voting-information");
assert.equal(votingResource("pollingPlace", "WV").url, "https://apps.sos.wv.gov/Elections/Voter/FindMyPollingPlace");
assert.equal(votingResource("whatToBring", "WV").url, "https://sos.wv.gov/be-registered-and-ready");
assert.equal(votingResource("electionOffice", "WV").url, "https://sos.wv.gov/west-virginia-county-clerk-directory");
assert.equal(votingResource("electionDates", "WV").url, "https://sos.wv.gov/govotewv");
assert.equal(STATE_RESOURCES.WV.electionDates.status, "direct");
assert.equal(votingResource("ballot", "WV").url, "https://wv.omniballot.us/sites/54/ballot/app/sb/vr"); // vendor tool linked from the official WV SOS voter page
assert.equal(STATE_RESOURCES.WV.ballot.status, "direct");
assert.ok(Object.values(STATE_RESOURCES.WV ?? {}).every((s) => s.url.startsWith("https://")));
assert.equal(Object.keys(STATE_RESOURCES).length, 51);
assert.ok(STATE_RESOURCES.SC.ballot.url.includes("vrems.scvotes.sc.gov"));
assert.equal(STATE_RESOURCES.SC.ballot.status, "direct");
assert.equal(STATE_RESOURCES.SC.ballot.validationSource, "https://scvotes.gov/voters/");
assert.ok(STATE_RESOURCES.WA.registration.url.includes("votewa.gov"));
assert.ok(STATE_RESOURCES.WI.ballot.url.includes("myvote.wi.gov"));
assert.ok(STATE_RESOURCES.WY.pollingPlace.url.includes("sos.wyo.gov"));
assert.equal(STATE_RESOURCES.SD.electionOffice.url, "https://vip.sdsos.gov/CountyAuditors.aspx");
assert.equal(STATE_RESOURCES.WV.electionOffice.url, "https://sos.wv.gov/west-virginia-county-clerk-directory");
assert.equal(STATE_RESOURCES.WV.electionOffice.status, "direct");
assert.deepEqual(Object.keys(STATE_RESOURCES).sort(), STATES.map((s) => s.code).sort());
for (const state of STATES) {
  assert.deepEqual(Object.keys(STATE_RESOURCES[state.code]).sort(), RESOURCE_TYPES.slice().sort());
  for (const type of RESOURCE_TYPES) {
    const resource = STATE_RESOURCES[state.code][type];
    assert.equal(new URL(resource.url).protocol, "https:");
    assert.equal(new URL(resource.validationSource).protocol, "https:");
    assert.ok(["direct", "state-fallback"].includes(resource.status));
    assert.ok(["verified", "browser_verified", "unverified_due_to_access_limit"].includes(resource.verificationStatus));
    if (resource.status === "direct") {
      if (resource.verificationStatus === "unverified_due_to_access_limit") assert.equal(resource.verifiedDate, "");
      else assert.match(resource.verifiedDate, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(resource.validationSource.length > 0);
    } else {
      assert.equal(resource.verifiedDate, "");
    }
  }
}
assert.equal(STATE_RESOURCES.AK.pollingPlace.status, "direct");
assert.equal(STATE_RESOURCES.AR.ballot.url, STATE_RESOURCES.AR.pollingPlace.url); // one state-linked VoterView tool provides both
assert.equal(STATE_RESOURCES.WV.registration.url, "https://apps.sos.wv.gov/Elections/Voter/AmIRegisteredToVote");

// No-state and invalid-state cases use the specific official federal destination for each resource type.
for (const type of ["electionDates", "registration", "earlyVoting", "absentee", "ballot", "pollingPlace", "whatToBring", "electionOffice"] as const) {
  assert.equal(votingResource(type).url, NATIONAL_VOTING_RESOURCES[type].url);
  assert.equal(votingResource(type, "XX").url, NATIONAL_VOTING_RESOURCES[type].url);
  assert.equal("lastChecked" in votingResource(type), false);
}
assert.equal(votingResource("registration").url, "https://vote.gov/register");
assert.equal(votingResource("earlyVoting").url, "https://www.usa.gov/early-voting");
assert.equal(votingResource("absentee").url, "https://www.usa.gov/absentee-voting");
assert.equal(votingResource("ballot").url, "https://www.usa.gov/who-you-can-vote-for");
assert.equal(votingResource("pollingPlace").url, "https://www.usa.gov/find-polling-place");
assert.equal(votingResource("whatToBring").url, "https://www.eac.gov/voters");
assert.equal(votingResource("electionOffice").url, "https://www.usa.gov/state-election-office");
assert.equal(messageResourceType("social-reminder"), "pollingPlace");
assert.equal(messageResourceType("text-info"), "electionOffice");
assert.equal(votingResource(messageResourceType("text-friendly"), "WV").url, votingResource("registration", "WV").url);

// Los Angeles is still on Election Day at 23:30 local time on November 3 (already Nov 4 UTC).
const originalTZ = process.env.TZ;
process.env.TZ = "America/Los_Angeles";
try {
  const localElectionDay = localCalendarDate(new Date("2026-11-04T07:30:00Z"));
  assert.equal(localElectionDay, "2026-11-03");
  assert.equal(nextKnownElection(localElectionDay)?.id, "2026-federal-midterm");
  const followingLocalDay = localCalendarDate(new Date("2026-11-04T08:30:00Z"));
  assert.equal(followingLocalDay, "2026-11-04");
  assert.equal(nextKnownElection(followingLocalDay)?.id, "2028-presidential-general");
} finally {
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
}

// Address-dependent polling lookup goes to an official resource; no address is modeled or stored.
const pollingLookup = electionCard.resources.find((r) => r.type === "pollingPlace")!;
assert.equal(pollingLookup.source.status, "state-fallback");
assert.equal("streetAddress" in electionCard, false);
assert.equal("address" in electionCard, false);

const ics = electionCalendar("2026 Federal Midterm General Election", "2026-11-03", "https://www.usa.gov/midterm-elections");
const unfoldedIcs = ics.replace(/\r\n /g, "");
assert.match(unfoldedIcs, /BEGIN:VCALENDAR\r\nVERSION:2.0/);
assert.match(unfoldedIcs, /DTSTART;VALUE=DATE:20261103/);
assert.match(unfoldedIcs, /https:\/\/www\.usa\.gov\/midterm-elections/);
assert.ok(ics.split("\r\n").every((line) => new TextEncoder().encode(line).length <= 75));

// Install actions only appear for native-install browsers or iOS Safari instructions.
const unavailable = { standalone: false, installed: false, promptAvailable: false, iosSafari: false };
assert.equal(installMode({ ...unavailable, standalone: true, iosSafari: true }), "hidden");
assert.equal(installMode({ ...unavailable, promptAvailable: true }), "native");
assert.equal(installMode({ ...unavailable, iosSafari: true }), "manual");
assert.equal(installMode(unavailable), "hidden"); // unsupported desktop browsers have no dead CTA
assert.equal(installMode({ ...unavailable, installed: true, promptAvailable: true }), "hidden"); // appinstalled
assert.equal(isIOSSafari("Mozilla/5.0 (iPhone) Version/17.0 Mobile Safari/604.1", "iPhone", 5), true);
assert.equal(isIOSSafari("Mozilla/5.0 (iPhone) CriOS/120.0 Mobile Safari/604.1", "iPhone", 5), false);
assert.deepEqual(IOS_INSTALL_STEPS, ["Tap the Share button.", "Choose “Add to Home Screen.”", "Tap “Add.”"]);
let promptCalls = 0;
const dismissed = await requestNativeInstall({ prompt: async () => { promptCalls++; }, userChoice: Promise.resolve({ outcome: "dismissed" as const }) });
assert.equal(promptCalls, 1);
assert.equal(dismissed, "dismissed"); // one-shot event is cleared, Home remains usable
assert.equal(installMode({ ...unavailable, promptAvailable: false }), "hidden");
assert.equal(await requestNativeInstall({ prompt: async () => {}, userChoice: Promise.resolve({ outcome: "accepted" as const }) }), "accepted");
assert.equal(installMode({ ...unavailable, installed: true }), "hidden");
const pwaConfig = await readFile(new URL("../vite.config.ts", import.meta.url), "utf8");
assert.match(pwaConfig, /name:\s*"10·10·10"/);
assert.match(pwaConfig, /short_name:\s*"10·10·10"/);
assert.match(pwaConfig, /display:\s*"standalone"/);
assert.match(pwaConfig, /start_url:\s*"\/\?app=1"/);
assert.match(pwaConfig, /scope:\s*"\/"/);
assert.match(pwaConfig, /icon-192\.png/);
assert.match(pwaConfig, /icon-512\.png/);
assert.match(pwaConfig, /purpose:\s*"maskable"/);

const resourceAudit = JSON.parse(await readFile(new URL("../state-election-resources.json", import.meta.url), "utf8")) as Array<Record<string, string>>;
const jurisdictionAudit = JSON.parse(await readFile(new URL("../state-election-resource-audit.json", import.meta.url), "utf8")) as Array<Record<string, string>>;
assert.equal(jurisdictionAudit.length, 51 * 7);
assert.equal(new Set(jurisdictionAudit.map((row) => row.state)).size, 51);
assert.ok(jurisdictionAudit.every((row) => ["electionDates", "registration", "earlyVoting", "absentee", "ballot", "pollingPlace", "electionOffice"].includes(row.resourceType)));
assert.equal(resourceAudit.length, STATES.length * RESOURCE_TYPES.length + RESOURCE_TYPES.length);
assert.equal(resourceAudit.filter((row) => row.state !== "US").length, 51 * 8);
assert.equal(resourceAudit.filter((row) => row.state === "US" && row.quality === "fallback").length, RESOURCE_TYPES.length);
assert.ok(resourceAudit.every((row) => row.url.startsWith("https://") && row.sourceAuthority.startsWith("https://")));
assert.equal(resourceAudit.find((row) => row.state === "WV" && row.resourceType === "registration")?.url, STATE_RESOURCES.WV.registration.url);
assert.deepEqual(resourceAudit.slice(0, STATES.length * RESOURCE_TYPES.length), STATE_ELECTION_RESOURCES);
assert.deepEqual(resourceAudit.slice(-RESOURCE_TYPES.length), RESOURCE_TYPES.map((resourceType) => ({
  state: "US", jurisdiction: "United States", resourceType,
  label: NATIONAL_VOTING_RESOURCES[resourceType].name,
  url: NATIONAL_VOTING_RESOURCES[resourceType].url,
  sourceAuthority: NATIONAL_VOTING_RESOURCES[resourceType].url,
  lastChecked: "", quality: "fallback",
  verificationStatus: "verified",
})));
for (const row of resourceAudit) {
  assert.ok(["direct", "directory", "fallback"].includes(row.quality));
  assert.ok(["verified", "browser_verified", "unverified_due_to_access_limit"].includes(row.verificationStatus));
  assert.match(row.lastChecked, /^(|\d{4}-\d{2}-\d{2})$/);
  assert.equal(new URL(row.url).protocol, "https:");
  assert.equal(new URL(row.sourceAuthority).protocol, "https:");
  if (row.quality === "fallback") assert.equal(row.lastChecked, "");
  if (row.verificationStatus === "unverified_due_to_access_limit") assert.equal(row.lastChecked, "");
}
assert.equal(STATE_RESOURCES.NM.registration.url, "https://www.nmvote.gov/");
assert.equal(STATE_RESOURCES.NM.pollingPlace.url, "https://www.nmvote.gov/");
assert.equal(STATE_RESOURCES.FL.pollingPlace.url, "https://dos.fl.gov/elections/for-voters/check-your-voter-status-and-polling-place/voter-precinct-lookup");
assert.equal(STATE_RESOURCES.OK.ballot.url, "https://okvoterportal.okelections.us/");
assert.equal(STATE_RESOURCES.WY.whatToBring.url, "https://sos.wyo.gov/Elections/VoterID/");
assert.equal(STATE_RESOURCES.WI.registration.verificationStatus, "unverified_due_to_access_limit");
assert.equal(STATE_RESOURCES.AZ.ballot.status, "state-fallback");
assert.equal(STATE_RESOURCES.CT.registration.url, "https://portaldir.ct.gov/sots/LookUp.aspx");
assert.equal(STATE_RESOURCES.CT.pollingPlace.url, "https://portaldir.ct.gov/sots/LookUp.aspx");
assert.equal(STATE_RESOURCES.MD.ballot.url, "https://voterservices.elections.maryland.gov/VoterSearch");
assert.equal(STATE_RESOURCES.MA.ballot.url, "https://www.sec.state.ma.us/WhereDoIVoteMA/WhereDoIVote");
assert.equal(STATE_RESOURCES.MA.ballot.status, "direct");
assert.equal(STATE_RESOURCES.KS.ballot.url, "https://kansasvoterinfo.gov/VoterView");
assert.equal(STATE_RESOURCES.AK.whatToBring.status, "state-fallback");
assert.equal(STATE_RESOURCES.AR.electionOffice.url, "https://www.sos.arkansas.gov/uploads/elections/ARCountyClerks.pdf");
assert.equal(STATE_RESOURCES.DC.whatToBring.url, "https://www.dcboe.org/faqs/early-voting-and-election-day");
assert.equal(STATE_RESOURCES.ID.registration.url, "https://voteidaho.gov/voter-registration/");
assert.equal(STATE_RESOURCES.KY.earlyVoting.url, "https://govote.ky.gov/");
assert.equal(STATE_RESOURCES.MT.electionDates.url, "https://sosmt.gov/elections/calendars/");
assert.equal(STATE_RESOURCES.WA.whatToBring.url, "https://www.sos.wa.gov/elections/voters/helpful-information/frequently-asked-questions-voting-mail");
assert.equal(STATE_RESOURCES.CO.electionOffice.url, "https://www.sos.state.co.us/pubs/elections/Resources/files/CountyClerkRosterWebsite.pdf");
assert.equal(STATE_RESOURCES.CO.earlyVoting.status, "state-fallback");
assert.equal(STATE_RESOURCES.CO.absentee.status, "state-fallback");
assert.equal(STATE_RESOURCES.NM.registration.url, "https://www.nmvote.gov/");
assert.equal(STATE_RESOURCES.NM.registration.status, "state-fallback");
assert.equal(STATE_RESOURCES.NM.ballot.url, "https://www.nmvote.gov/");
assert.equal(STATE_RESOURCES.NM.pollingPlace.url, "https://www.nmvote.gov/");
assert.equal(STATE_RESOURCES.NM.registration.verificationStatus, "browser_verified");
assert.equal(STATE_RESOURCES.NM.registration.verifiedDate, "");
assert.equal(STATE_RESOURCES.NM.electionOffice.url, "https://www.sos.nm.gov/voting-and-elections/county-clerk-information/");
assert.equal(STATE_RESOURCES.MN.ballot.url, "https://myballotmn.sos.mn.gov/");
assert.equal(STATE_RESOURCES.MN.pollingPlace.url, "https://pollfinder.sos.mn.gov/");
assert.equal(STATE_RESOURCES.SC.electionDates.url, "https://scvotes.gov/elections-statistics/general-election-calendars/");
assert.equal(STATE_RESOURCES.TX.registration.url, "https://goelect.txelections.civixapps.com/ivis-mvp-ui/");
assert.equal(STATE_RESOURCES.IA.electionOffice.url, "https://sos.iowa.gov/auditors");
assert.equal(STATE_RESOURCES.IA.ballot.status, "state-fallback");
assert.equal(STATE_RESOURCES.IA.ballot.url, "https://sos.iowa.gov/auditors");
assert.equal(STATE_RESOURCES.OH.electionDates.url, "https://www.ohiosos.gov/elections/voting-schedule-text-only");
assert.equal(STATE_RESOURCES.LA.electionOffice.url, "https://voterportal.sos.la.gov/Registrar");
assert.equal(STATE_RESOURCES.AZ.electionDates.url, "https://azsos.gov/elections/election-information/2026-election-info");
assert.equal(STATE_RESOURCES.CA.whatToBring.url, "https://elections.cdn.sos.ca.gov/pdfs/voter-id-and-reg-requirements.pdf");
assert.equal(STATE_RESOURCES.IL.electionDates.status, "direct");
assert.equal(STATE_RESOURCES.IL.registration.url, "https://ova.elections.il.gov/RegistrationLookup.aspx");
assert.equal(STATE_RESOURCES.IL.registration.status, "direct");
assert.ok(Object.values(STATE_RESOURCES.VT).every((resource) => resource.status === "direct" && resource.validationSource.startsWith("https://sos.vermont.gov/")));
assert.equal(STATE_RESOURCES.WI.earlyVoting.status, "direct");
assert.equal(STATE_RESOURCES.WI.electionOffice.url, "https://myvote.wi.gov/en-us/My-Municipal-Clerk");
assert.equal(STATE_RESOURCES.TN.ballot.url, "https://web.go-vote-tn.elections.tn.gov/options");
assert.equal(STATE_RESOURCES.TN.electionDates.url, "https://sos.tn.gov/elections/calendar");
assert.equal(STATE_RESOURCES.TN.absentee.url, "https://sos.tn.gov/elections/guides/guide-to-absentee-voting");
assert.equal(STATE_RESOURCES.TN.whatToBring.url, "https://sos.tn.gov/elections/faqs/what-id-is-required-when-voting");
assert.equal(STATE_RESOURCES.TN.pollingPlace.validationSource, "https://sos.tn.gov/elections/services/download-the-govotetn-app");

const cycleMigration = await readFile(new URL("../supabase/migrations/0007_challenge_history.sql", import.meta.url), "utf8");
assert.match(cycleMigration, /primary key \(user_id, challenge_cycle\)/);
assert.match(cycleMigration, /if new\.challenge_cycle < old\.challenge_cycle then/);
assert.match(cycleMigration, /new\.challenge_cycle := old\.challenge_cycle/);
assert.match(cycleMigration, /create policy "challenge history: read own"/);
assert.match(cycleMigration, /completed_at timestamptz/);
assert.doesNotMatch(cycleMigration, /candidate_choice|party_preference|voting_location|street_address/i);
const authSource = await readFile(new URL("../src/auth.tsx", import.meta.url), "utf8");
assert.match(authSource, /archive_completed_challenge/);
assert.match(authSource, /rpc\("app_snapshot"\)/);
assert.doesNotMatch(authSource, /\.from\(\s*["']challenge_history["']\s*\)/);
assert.match(authSource, /getActiveAccountId\(\)/);
assert.match(authSource, /abortRef\.current\?\.abort\(\)/);
assert.match(authSource, /syncWorkGenerationRef\.current === generationRef\.current/);
const storeSource = await readFile(new URL("../src/store.ts", import.meta.url), "utf8");
const completeActionSource = storeSource.match(/export function completeAction\([\s\S]*?\n}/)?.[0] ?? "";
assert.match(completeActionSource, /completedAt: completed \? now : null/);
assert.match(completeActionSource, /archiveCompletedCycle\(state\.challengeHistory, challengeCycle\)/);
assert.match(storeSource, /challengeCompletedAt: cycle\.completedAt/); // reload retains completion timestamp
assert.match(storeSource, /completionTimestampFromActionLogs\(challenge\)/);
assert.match(storeSource, /t10\.state\.guest/);
assert.match(storeSource, /t10\.state\.account\./);
assert.match(storeSource, /activateAccount\(userId: string\)/);
assert.match(storeSource, /activateGuest\(\)/);
assert.match(storeSource, /LEGACY_QUARANTINE_KEY/);
assert.match(storeSource, /challengeHistory: ChallengeHistoryRecord\[\]/);
assert.match(storeSource, /historyFromRemote\(r\.challenge_history\)/);
const historyScreen = await readFile(new URL("../src/screens/ChallengeHistory.tsx", import.meta.url), "utf8");
assert.match(historyScreen, /sortChallengeHistory/);
assert.match(historyScreen, /Completed \{completedDate\}/);
assert.match(historyScreen, /\{item\.reachFinal\}\/10/);
assert.match(historyScreen, /\{item\.spreadFinal\}\/10/);
assert.match(historyScreen, /\{item\.bringFinal\}\/10/);
assert.match(historyScreen, /card card--paper challenge-history__item/);
assert.match(historyScreen, /useStore\(\(state\) => state\.challengeHistory\)/);
assert.doesNotMatch(historyScreen, /date unavailable/);
const homeSource = await readFile(new URL("../src/screens/Home.tsx", import.meta.url), "utf8");
assert.match(homeSource, /onClick=\{\(\) => setHistoryOpen\(true\)\}/);
assert.match(homeSource, /<ChallengeHistoryList \/>/);
assert.doesNotMatch(homeSource, /Choose election context \(optional\)/);
assert.match(homeSource, /if \(total === 0\)[\s\S]*?setNewChallengeOpen\(true\)/);
assert.match(homeSource, /title=\{historyOpen \? "Challenge History" : completed \? "Start a new challenge\?" : "Start a 10·10·10"\}/);
assert.match(homeSource, /Start Challenge/);
assert.match(homeSource, /Optional — this only labels the challenge in your Challenge History/);
assert.match(homeSource, /setChallengeElectionContext\(context\)[\s\S]*?nav\(`\/challenge\/\$\{nextTrack\(s\)\}`\)/);
assert.match(homeSource, /startNewChallenge\(context\)/);
assert.match(homeSource, /\?\? "General turnout challenge"/);
assert.match(homeSource, /role="radiogroup"/);
assert.match(homeSource, /className="context-option"/);
assert.doesNotMatch(homeSource, /<select className="select"/);
assert.doesNotMatch(homeSource, /nav\("\/challenge-history"\)/);
const sharedSheetSource = await readFile(new URL("../src/components/ui.tsx", import.meta.url), "utf8");
assert.match(sharedSheetSource, /closeButton\?: boolean/);
assert.match(sharedSheetSource, /createPortal\([\s\S]*?document\.body/);
assert.match(sharedSheetSource, /distance >= 110/);
assert.match(sharedSheetSource, /setDragY\(0\)/);
const sheetStyles = await readFile(new URL("../src/styles/app.css", import.meta.url), "utf8");
assert.match(sheetStyles, /\.sheet-backdrop[\s\S]*?z-index: 1000/);
assert.match(sheetStyles, /max-height: min\(86dvh, calc\(100dvh - var\(--safe-top\) - 12px\)\)/);
assert.match(sheetStyles, /\.sheet__content[\s\S]*?overflow-y: auto/);
const settingsSource = await readFile(new URL("../src/screens/Menu.tsx", import.meta.url), "utf8");
assert.match(settingsSource, /className="card--paper menu-signin"/);
assert.match(sheetStyles, /\.sheet--wide \.menu-signin\s*\{\s*padding-inline: 18px;/);
assert.match(sheetStyles, /\.sheet--wide \.menu-signin :is\(\.input, \.btn--block\)[\s\S]*?width: 100%;[\s\S]*?max-width: 100%;[\s\S]*?box-sizing: border-box/);
assert.match(sheetStyles, /\.sheet--wide \.sheet__content\s*\{\s*padding-right: 14px;/);
assert.match(sheetStyles, /calc\(var\(--safe-bottom\) \+ 20px\)/);
assert.match(sheetStyles, /@keyframes sheet-down\s*\{\s*to \{ transform: translateY\(100%\)/);
assert.doesNotMatch(homeSource, /\bdark\s+fullHeight/);

const securityMigration = await readFile(new URL("../supabase/migrations/0008_security_hardening.sql", import.meta.url), "utf8");
assert.match(securityMigration, /revoke all on public\.progress[\s\S]*public\.analytics_events from public, anon, authenticated/);
assert.match(securityMigration, /revoke delete on public\.progress from anon, authenticated/);
assert.match(securityMigration, /drop column if exists voting_method/);
assert.match(securityMigration, /drop policy if exists "referrals: read as referrer"/);
assert.match(securityMigration, /create or replace function public\.archive_completed_challenge\(\)/);
assert.match(securityMigration, /for update/);
assert.match(securityMigration, /on conflict \(user_id, challenge_cycle\) do update set/);
assert.match(securityMigration, /server_validated boolean not null default false/);
assert.match(securityMigration, /reach_final = 10, share_final = 10, bring_final = 10, total_actions = 30/);
assert.match(securityMigration, /challenge_cycle = old\.challenge_cycle and h\.server_validated/);
assert.match(securityMigration, /where server_validated/);
assert.match(securityMigration, /create or replace function public\.record_analytics_event/);
assert.match(securityMigration, /jsonb_object_length\(p_props\)/);
assert.match(securityMigration, /id::text = substring\(p_session_id from 9\)/);
assert.match(securityMigration, /referral_starts/);
assert.doesNotMatch(securityMigration, /'verified_referrals'/);
const securitySqlTests = await readFile(new URL("../supabase/tests/0008_security_hardening.sql", import.meta.url), "utf8");
assert.match(securitySqlTests, /unvalidated history cannot authorize a new cycle/);
assert.match(securitySqlTests, /another account UUID cannot be used as a telemetry session/);
assert.match(securitySqlTests, /clients do not directly read history/);
const cleanupMigration = await readFile(new URL("../supabase/migrations/0009_security_cleanup.sql", import.meta.url), "utf8");
assert.match(cleanupMigration, /revoke select on table public\.challenge_history/);
assert.match(cleanupMigration, /revoke execute on function public\.guard_progress_cycle\(\) from public/);
assert.match(cleanupMigration, /security definer set search_path = pg_catalog, public/);
const cleanupSqlTests = await readFile(new URL("../supabase/tests/0009_security_cleanup.sql", import.meta.url), "utf8");
assert.match(cleanupSqlTests, /progress cycle trigger remains enabled and attached/);
const progressSyncMigration = await readFile(new URL("../supabase/migrations/0010_restore_progress_sync.sql", import.meta.url), "utf8");
assert.match(progressSyncMigration, /grant update \(user_id\) on table public\.progress to authenticated/i);
assert.doesNotMatch(progressSyncMigration, /grant\s+(?:insert|update|delete)\s+on table public\.progress/i);
const progressSyncSqlTests = await readFile(new URL("../supabase/tests/0010_restore_progress_sync.sql", import.meta.url), "utf8");
assert.match(progressSyncSqlTests, /authenticated can execute the exact client progress upsert/);
assert.match(progressSyncSqlTests, /authenticated cannot insert or upsert another user row/);
assert.match(progressSyncSqlTests, /authenticated cannot delete progress/);
const snapshotDefinition = securityMigration.match(/create or replace function public\.app_snapshot\(\)[\s\S]*?\$\$;/)?.[0] ?? "";
assert.doesNotMatch(snapshotDefinition, /voting_method/);
const analyticsSource = await readFile(new URL("../src/analytics.ts", import.meta.url), "utf8");
assert.match(analyticsSource, /record_analytics_event/);
assert.doesNotMatch(analyticsSource, /analytics_events"\)\.insert/);
assert.doesNotMatch(analyticsSource, /VITE_ANALYTICS_URL/);
const trustSource = await readFile(new URL("../src/screens/Trust.tsx", import.meta.url), "utf8");
assert.match(trustSource, /reminder settings/);
const reminderSource = await readFile(new URL("../src/screens/Reminders.tsx", import.meta.url), "utf8");
assert.match(reminderSource, /getActiveAccountId\(\) !== session\.user\.id/);
assert.match(reminderSource, /abortSignal\(controller\.signal\)/);
const referralUi = await readFile(new URL("../src/screens/Menu.tsx", import.meta.url), "utf8");
assert.doesNotMatch(referralUi, /verified referral/i);

const eventTitle = "2026 Federal Midterm Election";
const eventDate = "2026-11-03";
const eventSource = "https://www.usa.gov/when-to-vote?topic=dates & deadlines";
const eventDescription = electionDescription(eventSource);
const googleEvent = new URL(googleCalendarUrl(eventTitle, eventDate, eventSource));
assert.equal(googleEvent.origin, "https://calendar.google.com");
assert.equal(googleEvent.searchParams.get("action"), "TEMPLATE");
assert.equal(googleEvent.searchParams.get("text"), eventTitle);
assert.equal(googleEvent.searchParams.get("dates"), "20261103/20261104");
assert.equal(googleEvent.searchParams.get("details"), eventDescription);
assert.ok(googleEvent.searchParams.get("details")?.includes(eventSource));
assert.deepEqual(allDayDateRange(eventDate), { start: "20261103", end: "20261104" });
const priorTimezone = process.env.TZ;
for (const timezone of ["Pacific/Kiritimati", "America/Adak", "Europe/Berlin"]) {
  process.env.TZ = timezone;
  assert.deepEqual(allDayDateRange(eventDate), { start: "20261103", end: "20261104" });
  assert.equal(new URL(googleCalendarUrl(eventTitle, eventDate, eventSource)).searchParams.get("dates"), "20261103/20261104");
}
if (priorTimezone === undefined) delete process.env.TZ;
else process.env.TZ = priorTimezone;
assert.throws(() => allDayDateRange("2026-02-30"), RangeError);
const icsEvent = electionCalendar(eventTitle, eventDate, eventSource);
assert.match(icsEvent, /DTSTART;VALUE=DATE:20261103\r\nDTEND;VALUE=DATE:20261104/);
assert.match(icsEvent, /SUMMARY:2026 Federal Midterm Election/);
assert.ok(icsEvent.replace(/\r\n /g, "").includes(eventSource));
assert.ok(icsEvent.includes("\r\n"));
assert.deepEqual(calendarActions("android"), ["google", "ics"]);
assert.deepEqual(calendarActions("desktop"), ["google", "ics"]);
assert.deepEqual(calendarActions("ios"), ["ics"]);
assert.deepEqual(calendarActions("android", false), ["google"]);
assert.deepEqual(calendarActions("desktop", false), ["google"]);
assert.deepEqual(calendarActions("ios", false), []);
assert.equal(calendarPlatform("Mozilla/5.0 (Linux; Android 15)"), "android");
assert.equal(calendarPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)"), "ios");
assert.equal(calendarPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X)", "MacIntel", 5), "ios");
const upcomingSource = await readFile(new URL("../src/components/UpcomingElections.tsx", import.meta.url), "utf8");
assert.match(upcomingSource, /onClick=\{\(\) => setCalendarOpen\(true\)\}>Add to Calendar/);
assert.equal((upcomingSource.match(/>Add to Calendar<\/button>/g) ?? []).length, 1);
assert.equal((upcomingSource.match(/downloadCalendar\(election\.name/g) ?? []).length, 1);
// Obvious full-state-name host contamination guard; city/vendor hosts without a state name remain covered by manual validation metadata.
const stateNames = STATES.map(({ code, name }) => ({ code, slug: name.toLowerCase().replace(/[^a-z]/g, "") }));
for (const { code } of STATES) for (const resource of Object.values(STATE_RESOURCES[code])) {
  const hostname = new URL(resource.url).hostname.toLowerCase().replace(/[^a-z]/g, "");
  const currentSlug = stateNames.find((state) => state.code === code)!.slug;
  for (const other of stateNames) if (other.code !== code && other.slug.length >= 5 && !currentSlug.includes(other.slug) && hostname.includes(other.slug)) assert.fail(`${code} URL points at ${other.code}: ${resource.url}`);
}

console.log("selfcheck: challenge cycles/history, sync, messages, election resources, local election dates, calendar, and PWA install state OK");
