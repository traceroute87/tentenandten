/* Minimal self-check for the merge logic. Run: npm test
   (node --experimental-strip-types, no framework). */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mergeProgress } from "../src/lib/merge.ts";
import { mergeBeforeWrite } from "../src/lib/sync.ts";
import { MESSAGE_PRESETS, renderMessageTemplate } from "../src/data/messagePresets.ts";
import { ELECTION_TYPE_LABELS, NATIONAL_VOTING_RESOURCES, RESOURCE_TYPES, STATES, STATE_ELECTION_OFFICE, STATE_RESOURCES, UPCOMING_ELECTIONS, electionCardData, electionStatus, localCalendarDate, messageResourceType, nextKnownElection, votingResource } from "../src/data.ts";
import { electionCalendar } from "../src/lib/calendar.ts";
import { installMode, isIOSSafari, IOS_INSTALL_STEPS, requestNativeInstall } from "../src/lib/install.ts";

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
assert.equal(electionCard.resources.find((r) => r.type === "ballot")?.source.status, "state-fallback");
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
assert.equal(votingResource("electionOffice", "WV").url, STATE_ELECTION_OFFICE.WV.url);
assert.equal(votingResource("electionDates", "WV").url, STATE_ELECTION_OFFICE.WV.url);
assert.ok(votingResource("electionDates", "WV").name.includes("official election resource index (fallback)"));
assert.equal(votingResource("ballot", "WV").url, STATE_ELECTION_OFFICE.WV.url); // lookup host is not government-owned
assert.ok(Object.values(STATE_RESOURCES.WV ?? {}).every((s) => s.url.startsWith("https://")));
assert.equal(Object.keys(STATE_RESOURCES).length, 51);
assert.ok(STATE_RESOURCES.SC.ballot.url.includes("vrems.scvotes.sc.gov"));
assert.equal(STATE_RESOURCES.SC.ballot.status, "direct");
assert.equal(STATE_RESOURCES.SC.ballot.validationSource, "https://scvotes.gov/voters/");
assert.ok(STATE_RESOURCES.WA.registration.url.includes("votewa.gov"));
assert.ok(STATE_RESOURCES.WI.ballot.url.includes("myvote.wi.gov"));
assert.ok(STATE_RESOURCES.WY.pollingPlace.url.includes("sos.wyo.gov"));
assert.equal(STATE_RESOURCES.SD.electionOffice.url, "https://vip.sdsos.gov/CountyAuditors.aspx");
assert.equal(STATE_RESOURCES.WV.electionOffice.status, "state-fallback");
assert.deepEqual(Object.keys(STATE_RESOURCES).sort(), STATES.map((s) => s.code).sort());
for (const state of STATES) {
  assert.deepEqual(Object.keys(STATE_RESOURCES[state.code]).sort(), RESOURCE_TYPES.slice().sort());
  for (const type of RESOURCE_TYPES) {
    const resource = STATE_RESOURCES[state.code][type];
    assert.equal(new URL(resource.url).protocol, "https:");
    assert.equal(new URL(resource.validationSource).protocol, "https:");
    assert.ok(["direct", "state-fallback"].includes(resource.status));
    if (resource.status === "direct") {
      assert.match(resource.verifiedDate, /^\d{4}-\d{2}-\d{2}$/);
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
assert.equal(resourceAudit.length, STATES.length * RESOURCE_TYPES.length + RESOURCE_TYPES.length);
assert.equal(resourceAudit.filter((row) => row.state !== "US").length, 51 * 8);
assert.equal(resourceAudit.filter((row) => row.status === "national-fallback").length, RESOURCE_TYPES.length);
assert.ok(resourceAudit.every((row) => row.url.startsWith("https://") && row.validationSource.startsWith("https://")));
assert.equal(resourceAudit.find((row) => row.state === "WV" && row.resourceType === "registration")?.url, STATE_RESOURCES.WV.registration.url);
assert.deepEqual(resourceAudit.slice(0, STATES.length * RESOURCE_TYPES.length), STATES.flatMap(({ code, name }) =>
  RESOURCE_TYPES.map((resourceType) => ({ state: code, jurisdiction: name, resourceType, ...STATE_RESOURCES[code][resourceType] })),
));
assert.deepEqual(resourceAudit.slice(-RESOURCE_TYPES.length), RESOURCE_TYPES.map((resourceType) => ({
  state: "US", jurisdiction: "United States", resourceType, ...NATIONAL_VOTING_RESOURCES[resourceType],
  status: "national-fallback", verifiedDate: "", validationSource: NATIONAL_VOTING_RESOURCES[resourceType].url,
})));
for (const row of resourceAudit) assert.ok(["direct", "state-fallback", "national-fallback"].includes(row.status));
assert.equal(STATE_RESOURCES.AZ.ballot.status, "state-fallback");
assert.equal(STATE_RESOURCES.AZ.electionDates.url, "https://azsos.gov/elections/election-information/2026-election-info");
assert.equal(STATE_RESOURCES.CA.whatToBring.url, "https://elections.cdn.sos.ca.gov/pdfs/voter-id-and-reg-requirements.pdf");
assert.equal(STATE_RESOURCES.IL.electionDates.status, "direct");
assert.ok(Object.values(STATE_RESOURCES.VT).every((resource) => resource.status === "direct" && resource.validationSource.startsWith("https://sos.vermont.gov/")));
assert.equal(STATE_RESOURCES.WI.earlyVoting.status, "direct");
assert.equal(STATE_RESOURCES.WI.electionOffice.url, "https://myvote.wi.gov/en-us/My-Municipal-Clerk");
assert.equal(STATE_RESOURCES.TN.ballot.url, "https://web.go-vote-tn.elections.tn.gov/options");
assert.equal(STATE_RESOURCES.TN.pollingPlace.validationSource, "https://sos.tn.gov/elections/services/download-the-govotetn-app");
// Obvious full-state-name host contamination guard; city/vendor hosts without a state name remain covered by manual validation metadata.
const stateNames = STATES.map(({ code, name }) => ({ code, slug: name.toLowerCase().replace(/[^a-z]/g, "") }));
for (const { code } of STATES) for (const resource of Object.values(STATE_RESOURCES[code])) {
  const hostname = new URL(resource.url).hostname.toLowerCase().replace(/[^a-z]/g, "");
  const currentSlug = stateNames.find((state) => state.code === code)!.slug;
  for (const other of stateNames) if (other.code !== code && other.slug.length >= 5 && !currentSlug.includes(other.slug) && hostname.includes(other.slug)) assert.fail(`${code} URL points at ${other.code}: ${resource.url}`);
}

console.log("selfcheck: sync, messages, election resources, local election dates, calendar, and PWA install state OK");
