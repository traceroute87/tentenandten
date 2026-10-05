const tracks = ["reach", "spread", "bring"] as const;
const actionKinds = [
  "call", "text", "email", "already", "facebook", "x", "truth", "share", "copy",
  "register", "check", "polling", "id", "early", "mail", "ballot", "plan", "ride", "election-day", "manual",
] as const;
const channels = ["facebook", "x", "truth", "text", "email", "copy", "share", "social"] as const;

export function validAnalyticsEvent(event: string, props: unknown): boolean {
  const p = props ?? {};
  if (!p || typeof p !== "object" || Array.isArray(p)) return false;
  const row = p as Record<string, unknown>;
  const keys = Object.keys(row).sort().join(",");
  if (["visited", "referral_visit", "account_created_or_signed_in", "referral_linked", "magic_link_requested", "challenge_completed", "app_installed", "install_prompt_shown", "referral_link_copied"].includes(event)) return keys === "";
  if (event === "challenge_started") return keys === "" || (keys === "cycle" && Number.isInteger(row.cycle) && Number(row.cycle) > 0 && Number(row.cycle) < 1_000_000);
  if (event === "action_completed") return keys === "kind,n,track"
    && tracks.includes(row.track as typeof tracks[number])
    && actionKinds.includes(row.kind as typeof actionKinds[number])
    && Number.isInteger(row.n) && Number(row.n) >= 1 && Number(row.n) <= 10;
  if (event === "track_completed" || event === "action_undone") return keys === "track" && tracks.includes(row.track as typeof tracks[number]);
  if (event === "reminders_set") return keys === "enabled" && typeof row.enabled === "boolean";
  if (event === "install_prompt_result") return keys === "outcome" && ["accepted", "dismissed"].includes(String(row.outcome));
  if (event === "share") return keys === "channel" && channels.includes(row.channel as typeof channels[number]);
  return false;
}
