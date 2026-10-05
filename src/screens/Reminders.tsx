import { useEffect, useRef, useState } from "react";
import { NATIONAL, activeMilestone } from "../data";
import { useStore, setReminders, getActiveAccountId, getState } from "../store";
import { useAuth } from "../auth";
import { supabase } from "../lib/supabase";
import { logSyncFailure } from "../lib/sync-diagnostics";
import { IcoCalendar } from "../lib/icons";

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
async function saveReminderPrefs(userId: string, prefs: { enabled: boolean }) {
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
  const [prefsError, setPrefsError] = useState("");
  const changedRef = useRef(false);

  const save = (userId: string) => {
    const prefs = { enabled: getState().reminders.enabled };
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
        const { data, error } = await supabase.from("reminder_prefs").select("enabled").eq("user_id", userId).maybeSingle();
        if (error) throw error;
        if (!active || changedRef.current || getActiveAccountId() !== userId) return;
        if (data) setReminders({ enabled: data.enabled }, false);
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
        Reminders appear as a banner on Home around key dates — registration, early
        voting, and Election Day. Nothing is sent to your phone or email.
      </p>
      {prefsError && <p className="note" role="status">{prefsError}</p>}

      <label className="menu-row" style={{ cursor: "pointer", borderTop: "1px solid var(--u-border)" }}>
        <span className="menu-row__label">
          Show election reminders on Home
          <span style={{ display: "block", fontSize: 12, color: "var(--u-text-dim)", fontWeight: 400 }}>
            Show timely election-date reminders in the app when you visit Home.
          </span>
        </span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => { setReminders({ enabled: e.target.checked }); changed(); }}
          style={{ width: 22, height: 22, accentColor: "var(--red)" }}
        />
      </label>

      {!session && (
        <p className="note">
          Create an account to keep this setting across devices.
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
