type SyncOperation =
  | "PUSH_PROGRESS_FAILED"
  | "ARCHIVE_CHALLENGE_FAILED"
  | "APP_SNAPSHOT_FAILED"
  | "REMINDER_SYNC_FAILED"
  | "PROFILE_SYNC_FAILED"
  | "REFERRAL_SYNC_FAILED"
  | "SESSION_CHECK_FAILED";

const redact = (value: unknown) => String(value ?? "")
  .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted]")
  .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "[redacted]")
  .replace(/\b[A-HJ-NP-Z2-9]{6}\b/g, "[redacted]")
  .replace(/\bBearer\s+\S+/gi, "Bearer [redacted]")
  .slice(0, 1000);

export function safeSyncError(error: unknown) {
  const e = error && typeof error === "object" ? error as Record<string, unknown> : {};
  return {
    code: redact(e.code),
    message: redact(e.message ?? error),
    details: redact(e.details),
    hint: redact(e.hint),
    status: typeof e.status === "number" || typeof e.status === "string" ? e.status : undefined,
  };
}

export function logSyncFailure(operation: SyncOperation, error: unknown) {
  if (!import.meta.env?.DEV) return;
  console.error(`[10·10·10] ${operation}`, safeSyncError(error));
}
