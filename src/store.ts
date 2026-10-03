/* Local-first challenge state. localStorage is the offline source of truth;
   when signed in, auth.tsx mirrors this to Supabase and merges back. */
import { useSyncExternalStore } from "react";
import { track } from "./analytics";
import { mergeProgress } from "./lib/merge";
import {
  archiveCompletedCycle,
  completionTimestampFromActionLogs,
  historyFromLocal,
  historyFromRemote,
  historyToRemote,
  mergeChallengeCycles,
  mergeChallengeHistory,
  newChallengeCycle,
  normalizeElectionContext,
  type ChallengeCycleSnapshot,
  type ChallengeHistoryRecord,
  type ElectionContext,
} from "./lib/challenge-cycles";

export type TrackId = "reach" | "spread" | "bring";
export type LogEntry = { ts: number; kind: string };
export type ChallengeTrack = { count: number; log: LogEntry[] };
export type BringRidePlan = { method: "election_day" | "early"; pickupTime?: string; notes?: string };
export type { ChallengeHistoryRecord, ElectionContext };

export type State = {
  version: 2;
  profile: {
    name?: string;
    state?: string; // 2-letter, user's own
    referralCode?: string; // set only when signed in (server-authoritative)
    referredBy?: string; // captured from ?r= on first visit
    createdAt: number;
  };
  challenge: Record<TrackId, ChallengeTrack>;
  challengeCycle: number;
  challengeStartedAt: string | null;
  challengeCompletedAt: string | null;
  challengeElection: ElectionContext | null;
  challengeHistory: ChallengeHistoryRecord[];
  bringRidePlans: Record<number, BringRidePlan>;
  voting: {
    state?: string;
    checklist: Record<string, boolean>;
    method?: "election_day" | "early" | "mail";
    plan: { where?: string; datetime?: string; transport?: string; bring?: string };
  };
  reminders: { enabled: boolean; state?: string };
  referrals: { verified: number; friendsStarted: number }; // from server; 0 for guests
  flags: { challengeStartedAt?: number; installDismissed?: boolean; stateSetupDismissed?: boolean };
};

const KEY = "t10.state";
const GOAL = 10;

const emptyTrack = (): ChallengeTrack => ({ count: 0, log: [] });

function fresh(): State {
  return {
    version: 2,
    profile: { createdAt: Date.now() },
    challenge: { reach: emptyTrack(), spread: emptyTrack(), bring: emptyTrack() },
    challengeCycle: 1,
    challengeStartedAt: null,
    challengeCompletedAt: null,
    challengeElection: null,
    challengeHistory: [],
    bringRidePlans: {},
    voting: { checklist: {}, plan: {} },
    reminders: { enabled: false },
    referrals: { verified: 0, friendsStarted: 0 },
    flags: {},
  };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const p = JSON.parse(raw) as Partial<State>;
    if (!p || typeof p !== "object") return fresh();
    const f = fresh();
    const readTrack = (id: TrackId): ChallengeTrack => {
      const t = p.challenge?.[id];
      const count = Math.max(0, Math.min(GOAL, Math.floor(Number(t?.count) || 0)));
      return { count, log: Array.isArray(t?.log) ? t.log : [] };
    };
    const challenge = { reach: readTrack("reach"), spread: readTrack("spread"), bring: readTrack("bring") };
    const oldStart = Number(p.flags?.challengeStartedAt);
    const challengeCycle = Math.max(1, Math.floor(Number(p.challengeCycle) || 1));
    const challengeStartedAt = typeof p.challengeStartedAt === "string"
      ? p.challengeStartedAt
      : oldStart > 0 ? new Date(oldStart).toISOString() : null;
    let challengeHistory = historyFromLocal(p.challengeHistory);
    const savedCompletedAt = typeof p.challengeCompletedAt === "string" && Number.isFinite(Date.parse(p.challengeCompletedAt))
      ? p.challengeCompletedAt
      : null;
    const completedAt = savedCompletedAt ?? completionTimestampFromActionLogs(challenge);
    const cycle: ChallengeCycleSnapshot = {
      challengeCycle,
      startedAt: challengeStartedAt,
      completedAt,
      electionContext: normalizeElectionContext(p.challengeElection),
      reach: challenge.reach.count,
      spread: challenge.spread.count,
      bring: challenge.bring.count,
    };
    // Legacy 30/30 state has no reliable finish time. Preserve it in history with an unknown date.
    if (cycle.reach + cycle.spread + cycle.bring === 30) challengeHistory = archiveCompletedCycle(challengeHistory, cycle);
    const loaded: State = {
      ...f,
      ...p,
      version: 2,
      profile: { ...f.profile, ...p.profile },
      challenge,
      challengeCycle,
      challengeStartedAt,
      challengeCompletedAt: cycle.completedAt,
      challengeElection: cycle.electionContext,
      challengeHistory,
      bringRidePlans: p.bringRidePlans ?? f.bringRidePlans,
      voting: { ...f.voting, ...p.voting, plan: { ...f.voting.plan, ...p.voting?.plan } },
      reminders: { ...f.reminders, ...p.reminders },
      referrals: { ...f.referrals, ...p.referrals },
      flags: { ...f.flags, ...p.flags },
    };
    if (completedAt && completedAt !== p.challengeCompletedAt) {
      try { localStorage.setItem(KEY, JSON.stringify(loaded)); } catch { /* private mode / quota */ }
    }
    return loaded;
  } catch {
    return fresh();
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function commit(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota — in-memory only */
  }
  listeners.forEach((l) => l());
}

export const getState = () => state;
export const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

/* ---------- derived ---------- */
export const trackDone = (t: ChallengeTrack) => t.count >= GOAL;
export const totalActions = (s: State) =>
  s.challenge.reach.count + s.challenge.spread.count + s.challenge.bring.count;
export const nextTrack = (s: State): TrackId => {
  const order: TrackId[] = ["reach", "spread", "bring"];
  return order.find((id) => !trackDone(s.challenge[id])) ?? "reach";
};

/* ---------- mutations ---------- */
export function completeAction(id: TrackId, kind: string) {
  if (state.challengeCompletedAt) return;
  const t = state.challenge[id];
  if (t.count >= GOAL) return;
  const startedFirst = totalActions(state) === 0;
  const now = new Date().toISOString();
  const challenge = {
    ...state.challenge,
    [id]: { count: t.count + 1, log: [...t.log, { ts: Date.now(), kind }] },
  };
  const counts = { reach: challenge.reach.count, spread: challenge.spread.count, bring: challenge.bring.count };
  const completed = counts.reach + counts.spread + counts.bring === 30;
  const challengeCycle = {
    challengeCycle: state.challengeCycle,
    startedAt: state.challengeStartedAt ?? now,
    completedAt: completed ? now : null,
    electionContext: state.challengeElection,
    ...counts,
  };
  commit({
    ...state,
    challenge,
    challengeStartedAt: challengeCycle.startedAt,
    challengeCompletedAt: challengeCycle.completedAt,
    challengeHistory: completed ? archiveCompletedCycle(state.challengeHistory, challengeCycle) : state.challengeHistory,
    flags: {
      ...state.flags,
      challengeStartedAt: state.flags.challengeStartedAt ?? Date.parse(now),
    },
  });
  track("action_completed", { track: id, kind, n: state.challenge[id].count });
  if (startedFirst) track("challenge_started");
  if (trackDone(state.challenge[id])) track("track_completed", { track: id });
  if (completed) track("challenge_completed");
}

export function startNewChallenge(electionContext: ElectionContext | null = null): boolean {
  if (totalActions(state) !== 30) return false;
  const next = newChallengeCycle({
    challengeCycle: state.challengeCycle,
    startedAt: state.challengeStartedAt,
    completedAt: state.challengeCompletedAt,
    electionContext: state.challengeElection,
    reach: state.challenge.reach.count,
    spread: state.challenge.spread.count,
    bring: state.challenge.bring.count,
  }, new Date().toISOString(), electionContext);
  commit({
    ...state,
    challenge: { reach: emptyTrack(), spread: emptyTrack(), bring: emptyTrack() },
    challengeCycle: next.challengeCycle,
    challengeStartedAt: next.startedAt,
    challengeCompletedAt: null,
    challengeElection: next.electionContext,
    flags: { ...state.flags, challengeStartedAt: Date.parse(next.startedAt ?? "") || Date.now() },
  });
  track("challenge_started", { cycle: next.challengeCycle });
  return true;
}

export function setChallengeElectionContext(electionContext: ElectionContext | null): boolean {
  if (totalActions(state) !== 0) return false;
  commit({ ...state, challengeElection: normalizeElectionContext(electionContext) });
  return true;
}

export function saveBringRidePlan(person: number, plan: BringRidePlan) {
  if (!Number.isInteger(person) || person < 1 || person > GOAL) return;
  commit({ ...state, bringRidePlans: { ...state.bringRidePlans, [person]: plan } });
}
export function removeBringRidePlan(person: number) {
  const bringRidePlans = { ...state.bringRidePlans };
  delete bringRidePlans[person];
  commit({ ...state, bringRidePlans });
}

export function undoLast(id: TrackId) {
  if (state.challengeCompletedAt || totalActions(state) === 30) return;
  const t = state.challenge[id];
  if (t.count === 0) return;
  commit({
    ...state,
    challenge: {
      ...state.challenge,
      [id]: { count: t.count - 1, log: t.log.slice(0, -1) },
    },
  });
  track("action_undone", { track: id });
}

export function toggleChecklist(stepId: string) {
  const on = !state.voting.checklist[stepId];
  commit({
    ...state,
    voting: {
      ...state.voting,
      checklist: { ...state.voting.checklist, [stepId]: on },
    },
  });
}

export function setVotingState(st: string) {
  setOwnState(st);
}
export function setVotingMethod(method: State["voting"]["method"]) {
  commit({ ...state, voting: { ...state.voting, method } });
}
export function setVotingPlan(patch: Partial<State["voting"]["plan"]>) {
  commit({ ...state, voting: { ...state.voting, plan: { ...state.voting.plan, ...patch } } });
}
export function setOwnState(st: string) {
  commit({
    ...state,
    profile: { ...state.profile, state: st },
    voting: { ...state.voting, state: st },
  });
}
export function setName(name: string) {
  commit({ ...state, profile: { ...state.profile, name } });
}
export function setReminders(next: { enabled: boolean; state?: string }, record = true) {
  commit({ ...state, reminders: { ...state.reminders, ...next } });
  if (record) track("reminders_set", { enabled: next.enabled });
}
export function setReferredBy(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  if (state.profile.referredBy || !/^[A-HJ-NP-Z2-9]{6}$/.test(normalized)) return false;
  commit({ ...state, profile: { ...state.profile, referredBy: normalized } });
  return true;
}
export function dismissInstall() {
  commit({ ...state, flags: { ...state.flags, installDismissed: true } });
}
export function dismissStateSetup() {
  commit({ ...state, flags: { ...state.flags, stateSetupDismissed: true } });
}

/* ---------- server merge (called by auth.tsx) ---------- */
export type RemoteSnapshot = {
  reach: number;
  spread: number;
  bring: number;
  voting_checklist: Record<string, boolean>;
  referral_code?: string;
  own_state?: string | null;
  verified_referrals: number;
  friends_started: number;
  challenge_cycle?: number;
  challenge_started_at?: string | null;
  challenge_completed_at?: string | null;
  election_id?: string | null;
  election_name?: string | null;
  election_date?: string | null;
  election_type?: ElectionContext["electionType"] | null;
  jurisdiction?: string | null;
  challenge_history?: unknown;
};

/** Merge counters by cycle; a later cycle always supersedes old-device counters. */
export function mergeRemote(r: RemoteSnapshot) {
  const m = mergeProgress({ reach: 0, spread: 0, bring: 0, checklist: state.voting.checklist }, {
    reach: 0, spread: 0, bring: 0, checklist: r.voting_checklist ?? {},
  });
  const remote: ChallengeCycleSnapshot = {
    challengeCycle: Math.max(1, Math.floor(Number(r.challenge_cycle) || 1)),
    startedAt: r.challenge_started_at ?? null,
    completedAt: r.challenge_completed_at ?? null,
    electionContext: normalizeElectionContext({
      electionId: r.election_id, electionName: r.election_name, electionDate: r.election_date,
      electionType: r.election_type, jurisdiction: r.jurisdiction,
    }),
    reach: r.reach, spread: r.spread, bring: r.bring,
  };
  const local: ChallengeCycleSnapshot = {
    challengeCycle: state.challengeCycle,
    startedAt: state.challengeStartedAt,
    completedAt: state.challengeCompletedAt,
    electionContext: state.challengeElection,
    reach: state.challenge.reach.count, spread: state.challenge.spread.count, bring: state.challenge.bring.count,
  };
  const cycle = mergeChallengeCycles(local, remote);
  const cycleChanged = cycle.challengeCycle !== state.challengeCycle;
  let history = mergeChallengeHistory(state.challengeHistory, historyFromRemote(r.challenge_history));
  history = archiveCompletedCycle(history, remote);
  history = archiveCompletedCycle(history, cycle);
  const withCount = (t: ChallengeTrack, n: number): ChallengeTrack =>
    n === t.count ? t : { count: n, log: t.log };
  commit({
    ...state,
    challengeCycle: cycle.challengeCycle,
    challengeStartedAt: cycle.startedAt,
    challengeCompletedAt: cycle.completedAt,
    challengeElection: cycle.electionContext,
    challengeHistory: history,
    challenge: {
      reach: cycleChanged ? { count: cycle.reach, log: [] } : withCount(state.challenge.reach, cycle.reach),
      spread: cycleChanged ? { count: cycle.spread, log: [] } : withCount(state.challenge.spread, cycle.spread),
      bring: cycleChanged ? { count: cycle.bring, log: [] } : withCount(state.challenge.bring, cycle.bring),
    },
    voting: {
      ...state.voting,
      checklist: m.checklist,
    },
    profile: {
      ...state.profile,
      referralCode: r.referral_code ?? state.profile.referralCode,
      state: state.profile.state ?? r.own_state ?? undefined,
    },
    referrals: {
      verified: r.verified_referrals,
      friendsStarted: r.friends_started,
    },
  });
}

/** Snapshot to push to the server (progress row upsert). */
export function localProgress() {
  const election = state.challengeElection;
  const challengeHistory = state.challengeHistory.map(historyToRemote);
  return {
    reach: state.challenge.reach.count,
    spread: state.challenge.spread.count,
    bring: state.challenge.bring.count,
    voting_checklist: state.voting.checklist,
    own_state: state.profile.state ?? null,
    challenge_cycle: state.challengeCycle,
    challenge_started_at: state.challengeStartedAt,
    challenge_completed_at: state.challengeCompletedAt,
    election_id: election?.electionId ?? null,
    election_name: election?.electionName ?? null,
    election_date: election?.electionDate ?? null,
    election_type: election?.electionType ?? null,
    jurisdiction: election?.jurisdiction ?? null,
    challenge_history: challengeHistory,
  };
}

export function clearAccountFields() {
  commit({
    ...state,
    profile: { ...state.profile, referralCode: undefined },
    referrals: { verified: 0, friendsStarted: 0 },
  });
}
