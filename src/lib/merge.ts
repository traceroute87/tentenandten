/* Pure merge logic for local <-> server challenge progress.
   Honor-system + multi-device: never lose a completed action, so counts
   take the max of the two sides and checklist booleans OR together.
   ponytail: max-wins can't represent an intentional decrement made only on
   one device; acceptable for a self-reported challenge. */

export type Progress = {
  reach: number;
  spread: number;
  bring: number;
  checklist: Record<string, boolean>;
};

const clamp10 = (n: number) => Math.max(0, Math.min(10, Math.floor(n || 0)));

export function mergeProgress(a: Progress, b: Progress): Progress {
  const keys = new Set([...Object.keys(a.checklist), ...Object.keys(b.checklist)]);
  const checklist: Record<string, boolean> = {};
  for (const k of keys) checklist[k] = Boolean(a.checklist[k] || b.checklist[k]);
  return {
    reach: Math.max(clamp10(a.reach), clamp10(b.reach)),
    spread: Math.max(clamp10(a.spread), clamp10(b.spread)),
    bring: Math.max(clamp10(a.bring), clamp10(b.bring)),
    checklist,
  };
}
