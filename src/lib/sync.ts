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
