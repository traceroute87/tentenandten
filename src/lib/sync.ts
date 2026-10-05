import type { ChallengeHistoryRecord, ElectionContext } from "./challenge-cycles.ts";

export async function mergeBeforeWrite<T>(
  fetchRemote: () => Promise<T | null>,
  merge: (remote: T) => void,
  write: () => Promise<void>,
  isCurrent: () => boolean = () => true,
): Promise<T> {
  const remote = await fetchRemote();
  if (!isCurrent()) throw new Error("Stale account sync");
  if (remote === null) throw new Error("Remote snapshot unavailable");
  merge(remote);
  if (!isCurrent()) throw new Error("Stale account sync");
  await write();
  if (!isCurrent()) throw new Error("Stale account sync");
  return remote;
}

export async function persistProgressAndArchive(
  progress: { reach: number; spread: number; bring: number },
  writeProgress: () => Promise<void>,
  archive: () => Promise<void>,
) {
  await writeProgress();
  if (progress.reach === 10 && progress.spread === 10 && progress.bring === 10) await archive();
}

type CycleRow = {
  challenge_cycle: number;
  reach: number;
  spread: number;
  bring: number;
  challenge_started_at: string | null;
  challenge_completed_at: string | null;
  election_id: string | null;
  election_name: string | null;
  election_date: string | null;
  election_type: string | null;
  jurisdiction: string | null;
};

const electionColumns = (context: ElectionContext | null) => ({
  election_id: context?.electionId ?? null,
  election_name: context?.electionName ?? null,
  election_date: context?.electionDate ?? null,
  election_type: context?.electionType ?? null,
  jurisdiction: context?.jurisdiction ?? null,
});

/** The server opens cycle N+1 only after cycle N is stored complete and archived,
    and only at zero counts. Replays that sequence for cycles the server has not
    seen finish (completed offline, or a new cycle started before the last sync). */
export async function catchUpServerCycle<P extends CycleRow>(
  progress: P,
  serverCycle: number,
  history: ChallengeHistoryRecord[],
  write: (row: P) => Promise<void>,
  archive: () => Promise<void>,
) {
  for (let cycle = serverCycle; cycle < progress.challenge_cycle; cycle++) {
    const done = history.find((record) => record.challengeCycle === cycle);
    if (!done) throw new Error(`Challenge ${cycle} is missing from local history`);
    await write({
      ...progress,
      challenge_cycle: cycle,
      reach: 10, spread: 10, bring: 10,
      challenge_started_at: done.startedAt,
      challenge_completed_at: done.completedAt,
      ...electionColumns(done.electionContext),
    });
    await archive();
    const next = cycle + 1 === progress.challenge_cycle ? null : history.find((record) => record.challengeCycle === cycle + 1);
    await write({
      ...progress,
      challenge_cycle: cycle + 1,
      reach: 0, spread: 0, bring: 0,
      challenge_completed_at: null,
      ...(next ? { challenge_started_at: next.startedAt, ...electionColumns(next.electionContext) } : {}),
    });
  }
}
