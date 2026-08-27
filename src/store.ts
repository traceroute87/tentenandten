/* Local-first challenge state. localStorage is the offline source of truth;
   when signed in, auth.tsx mirrors this to Supabase and merges back. */
import { useSyncExternalStore } from "react";
import { track } from "./analytics";
import { mergeProgress } from "./lib/merge";

export type TrackId = "reach" | "spread" | "bring";
export type LogEntry = { ts: number; kind: string };
export type ChallengeTrack = { count: number; log: LogEntry[] };

export type State = {
  version: 1;
  profile: {
    name?: string;
    state?: string; // 2-letter, user's own
    referralCode?: string; // set only when signed in (server-authoritative)
    referredBy?: string; // captured from ?r= on first visit
    createdAt: number;
  };
  challenge: Record<TrackId, ChallengeTrack>;
  voting: { state?: string; checklist: Record<string, boolean> };
  reminders: { enabled: boolean; state?: string };
  referrals: { verified: number; friendsStarted: number }; // from server; 0 for guests
  flags: { challengeStartedAt?: number; installDismissed?: boolean };
};

const KEY = "t10.state";
const GOAL = 10;

const emptyTrack = (): ChallengeTrack => ({ count: 0, log: [] });

function fresh(): State {
  return {
    version: 1,
    profile: { createdAt: Date.now() },
    challenge: { reach: emptyTrack(), spread: emptyTrack(), bring: emptyTrack() },
    voting: { checklist: {} },
    reminders: { enabled: false },
    referrals: { verified: 0, friendsStarted: 0 },
    flags: {},
  };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const p = JSON.parse(raw) as State;
    // shallow heal missing branches after upgrades
    return { ...fresh(), ...p, profile: { ...fresh().profile, ...p.profile } };
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
  const t = state.challenge[id];
  if (t.count >= GOAL) return;
  const startedFirst = totalActions(state) === 0;
  commit({
    ...state,
    challenge: {
      ...state.challenge,
      [id]: { count: t.count + 1, log: [...t.log, { ts: Date.now(), kind }] },
    },
    flags: {
      ...state.flags,
      challengeStartedAt: state.flags.challengeStartedAt ?? Date.now(),
    },
  });
  track("action_completed", { track: id, kind, n: state.challenge[id].count });
  if (startedFirst) track("challenge_started");
  if (trackDone(state.challenge[id])) track("track_completed", { track: id });
  if (totalActions(state) === 30) track("challenge_completed");
}

export function undoLast(id: TrackId) {
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
  track("voting_step", { step: stepId, on });
}

export function setVotingState(st: string) {
  commit({ ...state, voting: { ...state.voting, state: st } });
  if (!state.profile.state) setOwnState(st);
}
export function setOwnState(st: string) {
  commit({ ...state, profile: { ...state.profile, state: st } });
}
export function setName(name: string) {
  commit({ ...state, profile: { ...state.profile, name } });
}
export function setReminders(next: { enabled: boolean; state?: string }) {
  commit({ ...state, reminders: { ...state.reminders, ...next } });
  track("reminders_set", { enabled: next.enabled });
}
export function setReferredBy(code: string) {
  if (state.profile.referredBy) return; // first touch wins
  commit({ ...state, profile: { ...state.profile, referredBy: code } });
}
export function dismissInstall() {
  commit({ ...state, flags: { ...state.flags, installDismissed: true } });
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
};

/** Merge remote into local without losing local increments (honor-system: max wins). */
export function mergeRemote(r: RemoteSnapshot) {
  const m = mergeProgress(
    {
      reach: state.challenge.reach.count,
      spread: state.challenge.spread.count,
      bring: state.challenge.bring.count,
      checklist: state.voting.checklist,
    },
    {
      reach: r.reach,
      spread: r.spread,
      bring: r.bring,
      checklist: r.voting_checklist ?? {},
    },
  );
  const withCount = (t: ChallengeTrack, n: number): ChallengeTrack =>
    n === t.count ? t : { count: n, log: t.log };
  commit({
    ...state,
    challenge: {
      reach: withCount(state.challenge.reach, m.reach),
      spread: withCount(state.challenge.spread, m.spread),
      bring: withCount(state.challenge.bring, m.bring),
    },
    voting: { ...state.voting, checklist: m.checklist },
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
  return {
    reach: state.challenge.reach.count,
    spread: state.challenge.spread.count,
    bring: state.challenge.bring.count,
    voting_checklist: state.voting.checklist,
    own_state: state.profile.state ?? null,
  };
}

export function clearAccountFields() {
  commit({
    ...state,
    profile: { ...state.profile, referralCode: undefined },
    referrals: { verified: 0, friendsStarted: 0 },
  });
}
