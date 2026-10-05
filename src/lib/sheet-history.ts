const SHEET_STACK_KEY = "__tenTenTenSheetStack";

export function sheetStack(state: unknown): string[] {
  if (!state || typeof state !== "object") return [];
  const stack = (state as Record<string, unknown>)[SHEET_STACK_KEY];
  return Array.isArray(stack) ? stack.filter((id): id is string => typeof id === "string") : [];
}

export function stateWithSheetStack(state: unknown, stack: string[]) {
  const next = state && typeof state === "object" && !Array.isArray(state)
    ? { ...(state as Record<string, unknown>) }
    : {};
  if (stack.length) next[SHEET_STACK_KEY] = stack;
  else delete next[SHEET_STACK_KEY];
  return Object.keys(next).length ? next : null;
}
