export async function mergeBeforeWrite<T>(
  fetchRemote: () => Promise<T | null>,
  merge: (remote: T) => void,
  write: () => Promise<void>,
): Promise<T> {
  const remote = await fetchRemote();
  if (remote === null) throw new Error("Remote snapshot unavailable");
  merge(remote);
  await write();
  return remote;
}
