import { useEffect } from "react";
import { TIMELINE, STATES, NATIONAL } from "../data";
import { useStore, setReminders, setOwnState } from "../store";
import { useAuth } from "../auth";
import { supabase } from "../lib/supabase";
import { IcoCalendar } from "../lib/icons";

const today = () => new Date().toISOString().slice(0, 10);
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

export function RemindersSheet() {
  const { session } = useAuth();
  const enabled = useStore((s) => s.reminders.enabled);
  const rstate = useStore((s) => s.reminders.state ?? s.profile.state ?? "");

  // keep server copy in sync when signed in
  useEffect(() => {
    if (!session || !supabase) return;
    void supabase
      .from("reminder_prefs")
      .upsert(
        { user_id: session.user.id, enabled, state: rstate || null },
        { onConflict: "user_id" },
      );
  }, [session, enabled, rstate]);

  return (
    <div className="stack">
      <p className="muted" style={{ fontSize: 14 }}>
        Get timely nudges as key dates approach — registration deadlines, early
        voting, and Election Day. No spam.
      </p>

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
          onChange={(e) => setReminders({ enabled: e.target.checked })}
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
