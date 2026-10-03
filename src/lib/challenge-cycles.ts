import { UPCOMING_ELECTIONS } from "../data.ts";

export type ChallengeCounts = { reach: number; spread: number; bring: number };
export type ElectionContext = {
  electionId: string;
  electionName: string;
  electionDate: string;
  electionType: "presidential" | "midterm" | "federal_primary" | "state" | "local" | "special" | "runoff" | "ballot_measure";
  jurisdiction?: string;
};
export type ChallengeCycleSnapshot = ChallengeCounts & {
  challengeCycle: number;
  startedAt: string | null;
  completedAt: string | null;
  electionContext: ElectionContext | null;
};
export type ChallengeHistoryRecord = {
  challengeCycle: number;
  startedAt: string | null;
  completedAt: string | null;
  electionContext: ElectionContext | null;
  reachFinal: number;
  spreadFinal: number;
  bringFinal: number;
  totalActions: number;
};

const ELECTION_TYPES = new Set<ElectionContext["electionType"]>([
  "presidential", "midterm", "federal_primary", "state", "local", "special", "runoff", "ballot_measure",
]);
const timestamp = (value: unknown): string | null => typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : null;
const count = (value: unknown): number => Math.max(0, Math.min(10, Math.floor(Number(value) || 0)));

export function completionTimestampFromActionLogs(tracks: Record<"reach" | "spread" | "bring", { count: number; log: unknown }>): string | null {
  const timestamps = Object.values(tracks).flatMap(({ count: completed, log }) => {
    if (completed !== 10 || !Array.isArray(log) || log.length !== completed) return [];
    return log.map((entry) => entry && typeof entry === "object" ? (entry as Record<string, unknown>).ts : null);
  });
  if (timestamps.length !== 30 || timestamps.some((value) => typeof value !== "number" || !Number.isFinite(value) || value <= 0)) return null;
  try {
    return new Date(Math.max(...timestamps as number[])).toISOString();
  } catch {
    return null;
  }
}

export function normalizeElectionContext(value: unknown): ElectionContext | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const date = typeof source.electionDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(source.electionDate) ? source.electionDate : "";
  if (typeof source.electionId !== "string" || !source.electionId || typeof source.electionName !== "string" || !source.electionName || !date || !ELECTION_TYPES.has(source.electionType as ElectionContext["electionType"])) return null;
  const verified = UPCOMING_ELECTIONS.find((election) => election.id === source.electionId);
  if (!verified || source.electionName !== verified.name || date !== verified.date || source.electionType !== verified.type || (source.jurisdiction !== undefined && source.jurisdiction !== verified.stateCode)) return null;
  return {
    electionId: verified.id,
    electionName: verified.name,
    electionDate: verified.date,
    electionType: verified.type,
    ...(verified.stateCode ? { jurisdiction: verified.stateCode } : {}),
  };
}

export function mergeChallengeCycles(local: ChallengeCycleSnapshot, remote: ChallengeCycleSnapshot): ChallengeCycleSnapshot {
  if (remote.challengeCycle > local.challengeCycle) return { ...remote, electionContext: normalizeElectionContext(remote.electionContext) };
  if (local.challengeCycle > remote.challengeCycle) return { ...local, electionContext: normalizeElectionContext(local.electionContext) };
  return {
    challengeCycle: local.challengeCycle,
    reach: Math.max(count(local.reach), count(remote.reach)),
    spread: Math.max(count(local.spread), count(remote.spread)),
    bring: Math.max(count(local.bring), count(remote.bring)),
    startedAt: local.startedAt ?? remote.startedAt,
    completedAt: local.completedAt ?? remote.completedAt,
    electionContext: normalizeElectionContext(local.electionContext) ?? normalizeElectionContext(remote.electionContext),
  };
}

function mergeRecord(a: ChallengeHistoryRecord, b: ChallengeHistoryRecord): ChallengeHistoryRecord {
  return {
    challengeCycle: a.challengeCycle,
    startedAt: a.startedAt ?? b.startedAt,
    completedAt: a.completedAt ?? b.completedAt,
    electionContext: normalizeElectionContext(a.electionContext) ?? normalizeElectionContext(b.electionContext),
    reachFinal: Math.max(count(a.reachFinal), count(b.reachFinal)),
    spreadFinal: Math.max(count(a.spreadFinal), count(b.spreadFinal)),
    bringFinal: Math.max(count(a.bringFinal), count(b.bringFinal)),
    totalActions: 30,
  };
}

export function sortChallengeHistory(records: ChallengeHistoryRecord[]): ChallengeHistoryRecord[] {
  return [...records].sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "") || b.challengeCycle - a.challengeCycle);
}

export function mergeChallengeHistory(...groups: ChallengeHistoryRecord[][]): ChallengeHistoryRecord[] {
  const records = new Map<number, ChallengeHistoryRecord>();
  for (const record of groups.flat()) {
    if (record.reachFinal + record.spreadFinal + record.bringFinal !== 30) continue;
    const prior = records.get(record.challengeCycle);
    records.set(record.challengeCycle, prior ? mergeRecord(prior, record) : { ...record, electionContext: normalizeElectionContext(record.electionContext) });
  }
  return sortChallengeHistory([...records.values()]);
}

export function archiveCompletedCycle(history: ChallengeHistoryRecord[], cycle: ChallengeCycleSnapshot): ChallengeHistoryRecord[] {
  if (cycle.reach + cycle.spread + cycle.bring !== 30) return sortChallengeHistory(history);
  const record: ChallengeHistoryRecord = {
    challengeCycle: cycle.challengeCycle,
    startedAt: timestamp(cycle.startedAt),
    completedAt: timestamp(cycle.completedAt),
    electionContext: normalizeElectionContext(cycle.electionContext),
    reachFinal: count(cycle.reach),
    spreadFinal: count(cycle.spread),
    bringFinal: count(cycle.bring),
    totalActions: 30,
  };
  return mergeChallengeHistory(history, [record]);
}

export function newChallengeCycle(cycle: ChallengeCycleSnapshot, startedAt: string, electionContext: ElectionContext | null): ChallengeCycleSnapshot {
  return {
    challengeCycle: cycle.challengeCycle + 1,
    startedAt: timestamp(startedAt),
    completedAt: null,
    electionContext: normalizeElectionContext(electionContext),
    reach: 0,
    spread: 0,
    bring: 0,
  };
}

export type RemoteChallengeHistory = {
  challenge_cycle: number;
  started_at: string | null;
  completed_at: string | null;
  election_id: string | null;
  election_name: string | null;
  election_date: string | null;
  election_type: ElectionContext["electionType"] | null;
  jurisdiction: string | null;
  reach_final: number;
  share_final: number;
  bring_final: number;
  total_actions: number;
};

export function historyFromRemote(value: unknown): ChallengeHistoryRecord[] {
  if (!Array.isArray(value)) return [];
  const records = value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const challengeCycle = Math.floor(Number(row.challenge_cycle));
    const reachFinal = count(row.reach_final);
    const spreadFinal = count(row.share_final);
    const bringFinal = count(row.bring_final);
    if (!Number.isInteger(challengeCycle) || challengeCycle < 1 || reachFinal + spreadFinal + bringFinal !== 30) return [];
    return [{
      challengeCycle,
      startedAt: timestamp(row.started_at),
      completedAt: timestamp(row.completed_at),
      electionContext: normalizeElectionContext({
        electionId: row.election_id,
        electionName: row.election_name,
        electionDate: typeof row.election_date === "string" ? row.election_date.slice(0, 10) : "",
        electionType: row.election_type,
        jurisdiction: row.jurisdiction,
      }),
      reachFinal, spreadFinal, bringFinal, totalActions: 30,
    }];
  });
  return mergeChallengeHistory(records);
}

export function historyFromLocal(value: unknown): ChallengeHistoryRecord[] {
  if (!Array.isArray(value)) return [];
  const records = value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const challengeCycle = Math.floor(Number(row.challengeCycle));
    const reachFinal = count(row.reachFinal);
    const spreadFinal = count(row.spreadFinal);
    const bringFinal = count(row.bringFinal);
    if (!Number.isInteger(challengeCycle) || challengeCycle < 1 || reachFinal + spreadFinal + bringFinal !== 30) return [];
    return [{
      challengeCycle,
      startedAt: timestamp(row.startedAt),
      completedAt: timestamp(row.completedAt),
      electionContext: normalizeElectionContext(row.electionContext),
      reachFinal, spreadFinal, bringFinal, totalActions: 30,
    }];
  });
  return mergeChallengeHistory(records);
}

export function historyToRemote(record: ChallengeHistoryRecord): RemoteChallengeHistory {
  return {
    challenge_cycle: record.challengeCycle,
    started_at: record.startedAt,
    completed_at: record.completedAt,
    election_id: record.electionContext?.electionId ?? null,
    election_name: record.electionContext?.electionName ?? null,
    election_date: record.electionContext?.electionDate ?? null,
    election_type: record.electionContext?.electionType ?? null,
    jurisdiction: record.electionContext?.jurisdiction ?? null,
    reach_final: 10,
    share_final: 10,
    bring_final: 10,
    total_actions: 30,
  };
}
