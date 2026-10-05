import { useEffect, useRef, useState } from "react";
import { TIMELINE, STATES, NATIONAL, localCalendarDate } from "../data";
import { useStore, setReminders, setOwnState, getActiveAccountId, getState } from "../store";
import { useAuth } from "../auth";
import { supabase } from "../lib/supabase";
import { logSyncFailure } from "../lib/sync-diagnostics";
import { IcoCalendar } from "../lib/icons";

const today = () => localCalendarDate();
const daysApart = (a: string, b: string) =>
  Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000);

/** Most relevant timeline milestone for right now, or null. */
function activeMilestone() {
  const t = today();
  return (
    TIMELINE.filter((m) => {
      const d = daysApart(m.date, t);
      return d <= 10 && d >= -3;
    }).sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0] ?? null
  );
}

export function ReminderBanner() {
  const enabled = useStore((s) => s.reminders.enabled);
  const m = activeMilestone();
  if (!enabled || !m) return null;
  return (
    <div className={`reminder ${m.urgent ? "reminder--urgent" : ""}`}>
      <IcoCalendar />
      <span>
        <b>{m.label}.</b> Deadlines vary by state — check yours.
      </span>
    </div>
  );
}

// Every account gets a reminder_prefs row at signup, so an upsert always conflicts and then
// needs UPDATE on user_id, which clients don't have. Update the allowed columns instead and
// insert only if the row is missing.
async function saveReminderPrefs(userId: string, prefs: { enabled: boolean; state: string | null }) {
  const { data, error } = await supabase!.from("reminder_prefs").update(prefs).eq("user_id", userId).select("user_id");
  if (error) throw error;
  if (data?.length) return;
  const { error: insertError } = await supabase!.from("reminder_prefs").insert({ user_id: userId, ...prefs });
  if (insertError) throw insertError;
}

// Saves outlive the dialog (closing it must not cancel one). Accounts whose last save
// failed keep their local choice instead of being overwritten by the older server row.
let lastSave: Promise<void> = Promise.resolve();
const unsavedAccounts = new Set<string>();

export function RemindersSheet() {
  const { session } = useAuth();
  const enabled = useStore((s) => s.reminders.enabled);
  const rstate = useStore((s) => s.reminders.state ?? s.profile.state ?? "");
  const [prefsError, setPrefsError] = useState("");
  const changedRef = useRef(false);

  const save = (userId: string) => {
    const local = getState().reminders;
    const prefs = { enabled: local.enabled, state: local.state ?? getState().profile.state ?? null };
    lastSave = lastSave.catch(() => {}).then(async () => {
      try {
        await saveReminderPrefs(userId, prefs);
        unsavedAccounts.delete(userId);
      } catch (error) {
        unsavedAccounts.add(userId);
        logSyncFailure("REMINDER_SYNC_FAILED", error);
        throw error;
      }
    });
    return lastSave;
  };
  const changed = () => {
    changedRef.current = true;
    if (!session || !supabase || getActiveAccountId() !== session.user.id) return;
    setPrefsError("");
    save(session.user.id).catch(() => setPrefsError("Couldn't save reminder settings yet. They're kept on this device."));
  };

  // Load the account's saved choice, unless this device holds a newer one not yet saved.
  useEffect(() => {
    if (!session || !supabase) return;
    const userId = session.user.id;
    let active = true;
    setPrefsError("");
    void (async () => {
      try {
        await lastSave.catch(() => {});
        if (!active || getActiveAccountId() !== userId) return;
        if (unsavedAccounts.has(userId)) { await save(userId); return; }
        const { data, error } = await supabase.from("reminder_prefs").select("enabled,state").eq("user_id", userId).maybeSingle();
        if (error) throw error;
        if (!active || changedRef.current || getActiveAccountId() !== userId) return;
        if (data) setReminders({ enabled: data.enabled, state: data.state ?? undefined }, false);
      } catch (error) {
        if (active && getActiveAccountId() === userId) {
          logSyncFailure("REMINDER_SYNC_FAILED", error);
          setPrefsError("Couldn't load saved reminders. Changes stay on this device until you reopen this screen.");
        }
      }
    })();
    return () => { active = false; };
  }, [session?.user.id]);

  return (
    <div className="stack">
      <p className="muted" style={{ fontSize: 14 }}>
        Get timely nudges as key dates approach — registration deadlines, early
        voting, and Election Day. No spam.
      </p>
      {prefsError && <p className="note" role="status">{prefsError}</p>}

      <label className="menu-row" style={{ cursor: "pointer", borderTop: "1px solid var(--u-border)" }}>
        <span className="menu-row__label">
          Show election reminders
          <span style={{ display: "block", fontSize: 12, color: "var(--u-text-dim)", fontWeight: 400 }}>
            Timeline alerts inside the app
          </span>
        </span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => { setReminders({ enabled: e.target.checked }); changed(); }}
          style={{ width: 22, height: 22, accentColor: "var(--red)" }}
        />
      </label>

      <label className="field">
        <span className="field__label">My state</span>
        <select
          className="select"
          value={rstate}
          onChange={(e) => {
            setOwnState(e.target.value);
            setReminders({ enabled, state: e.target.value });
            changed();
          }}
        >
          <option value="">Select a state…</option>
          {STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      {!session && (
        <p className="note">
          Create an account to keep reminders across devices.
        </p>
      )}
      <a
        className="resource__url"
        href={NATIONAL.checkStatus.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        Official deadlines: {NATIONAL.checkStatus.name}
      </a>
    </div>
  );
}
