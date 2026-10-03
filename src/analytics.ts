/* Privacy-respecting funnel analytics.
   Small capped local queue for offline delivery only, then flushed to the
   backend. No PII: a random session id, event name, and small props. */
import { supabase, backendConfigured } from "./lib/supabase";

type Event = { session_id: string; event: string; props?: Record<string, unknown>; ts: string };

const QUEUE_KEY = "t10.analytics.queue";
const SID_KEY = "t10.sid";
const CAP = 50;
const ENDPOINT = import.meta.env.VITE_ANALYTICS_URL as string | undefined;

function sid(): string {
  try {
    let v = localStorage.getItem(SID_KEY);
    if (!v) {
      v = crypto.randomUUID();
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
    if (ENDPOINT) {
      const ok = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(q),
        keepalive: true,
      }).then((r) => r.ok);
      if (ok) writeQueue([]);
    } else if (backendConfigured && supabase) {
      const { error } = await supabase.from("analytics_events").insert(q);
      if (!error) writeQueue([]);
    }
    // no backend configured: keep the last CAP events locally, nothing else to do
  } catch {
    // Keep the capped queue; the online or next-event handler retries it.
  } finally {
    flushing = false;
  }
}

export function track(event: string, props?: Record<string, unknown>) {
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
