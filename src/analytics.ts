/* Privacy-respecting funnel analytics.
   Small capped local queue for offline delivery only, then flushed to the
   backend. No PII: a random session id, event name, and small props. */
import { supabase, backendConfigured } from "./lib/supabase.ts";
import { validAnalyticsEvent } from "./lib/analytics-schema.ts";

type Event = { session_id: string; event: string; props?: Record<string, unknown>; ts: string };

const QUEUE_KEY = "t10.analytics.queue";
const SID_KEY = "t10.sid";
const CAP = 50;

function sid(): string {
  try {
    let v = localStorage.getItem(SID_KEY);
    if (!v) {
      v = `browser-${crypto.randomUUID()}`;
      localStorage.setItem(SID_KEY, v);
    }
    return v;
  } catch {
    return "anon";
  }
}

function readQueue(): Event[] {
  try {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]") as Event[];
    return queue.map((e) => {
      // Older builds used a bare UUID; keep queued events but detach any
      // ambiguous identifier from account-shaped UUIDs before sending.
      if (!/^browser-[0-9a-f-]{36}$/.test(e.session_id) && e.session_id !== "anon") e = { ...e, session_id: "anon" };
      if (e.event !== "referral_visit" || !e.props || !("code" in e.props)) return e;
      const { code: _code, ...props } = e.props;
      return { ...e, props };
    });
  } catch {
    return [];
  }
}
function writeQueue(q: Event[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-CAP)));
  } catch {
    /* ignore */
  }
}

let flushing = false;
export async function flush() {
  if (flushing || !navigator.onLine) return;
  const q = readQueue();
  if (q.length === 0) return;
  flushing = true;
  try {
    if (backendConfigured && supabase) {
      const delivered: Event[] = [];
      for (const event of q) {
        if (!validAnalyticsEvent(event.event, event.props)) { delivered.push(event); continue; }
        const { error } = await supabase.rpc("record_analytics_event", {
          p_session_id: event.session_id,
          p_event: event.event,
          p_props: event.props ?? {},
        });
        if (error) break;
        delivered.push(event);
      }
      if (delivered.length) {
        const sent = new Set(delivered.map((event) => `${event.session_id}|${event.ts}|${event.event}`));
        writeQueue(readQueue().filter((event) => !sent.has(`${event.session_id}|${event.ts}|${event.event}`)));
      }
    }
    // no backend configured: keep the last CAP events locally, nothing else to do
  } catch {
    // Keep the capped queue; the online or next-event handler retries it.
  } finally {
    flushing = false;
  }
}

export function track(event: string, props?: Record<string, unknown>) {
  if (!validAnalyticsEvent(event, props)) return;
  const e: Event = { session_id: sid(), event, props, ts: new Date().toISOString() };
  writeQueue([...readQueue(), e]);
  void flush();
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => void flush());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush();
  });
}
