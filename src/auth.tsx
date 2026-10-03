/* Optional accounts (Supabase magic link). Guest-first: the app is fully
   usable with no session. On sign-in we merge local progress up, link any
   pending referral, and mirror future changes to Postgres. */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, backendConfigured } from "./lib/supabase";
import {
  getState,
  subscribe,
  mergeRemote,
  localProgress,
  clearAccountFields,
  totalActions,
  type RemoteSnapshot,
} from "./store";
import { track } from "./analytics";
import { mergeBeforeWrite } from "./lib/sync";

type AuthState = {
  configured: boolean;
  session: Session | null;
  ready: boolean;
  syncError: string;
  retrySync: () => void;
  signIn: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState>({
  configured: false,
  session: null,
  ready: true,
  syncError: "",
  retrySync: () => {},
  signIn: async () => ({ ok: false, error: "Backend not configured" }),
  signOut: async () => {},
});

export const useAuth = () => useContext(Ctx);

async function fetchSnapshot(): Promise<RemoteSnapshot> {
  if (!supabase) throw new Error("Backend not configured");
  const { data, error } = await supabase.rpc("app_snapshot");
  if (error) throw error;
  if (!data) throw new Error("Account snapshot unavailable");
  return data as RemoteSnapshot;
}

async function pushProgress(userId: string, p = localProgress()) {
  if (!supabase) throw new Error("Backend not configured");
  const { data: u, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (u.user?.id !== userId) throw new Error("Account changed during sync");
  const { error } = await supabase.from("progress").upsert(
    {
      user_id: u.user.id,
      reach: p.reach,
      spread: p.spread,
      bring: p.bring,
      voting_checklist: p.voting_checklist,
      own_state: p.own_state,
      challenge_cycle: p.challenge_cycle,
      challenge_started_at: p.challenge_started_at,
      challenge_completed_at: p.challenge_completed_at,
      election_id: p.election_id,
      election_name: p.election_name,
      election_date: p.election_date,
      election_type: p.election_type,
      jurisdiction: p.jurisdiction,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
  if (p.challenge_history.length) {
    const { error: historyError } = await supabase.from("challenge_history").upsert(
      p.challenge_history.map((record) => ({ user_id: u.user!.id, ...record })),
      { onConflict: "user_id,challenge_cycle" },
    );
    if (historyError) throw historyError;
  }
  if (p.own_state) {
    const { error: profileError } = await supabase.from("profiles").update({ state: p.own_state }).eq("id", userId);
    if (profileError) throw profileError;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!backendConfigured);
  const [syncReady, setSyncReady] = useState(!backendConfigured);
  const [syncError, setSyncError] = useState("");
  const linkedRef = useRef(false);
  const startedRef = useRef(false);
  const pushSigRef = useRef("");
  const sessionRef = useRef<Session | null>(null);
  const authEventRef = useRef(false);
  const syncRef = useRef<Promise<void> | null>(null);
  const syncUserRef = useRef("");

  // Restore the session and merge cloud state before enabling writes.
  useEffect(() => {
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      authEventRef.current = true;
      sessionRef.current = s;
      setSession(s);
      setReady(true);
      if (event === "INITIAL_SESSION") {
        if (s) queueMicrotask(() => void syncAccount(s).catch(() => {}));
        else setSyncReady(true);
      }
      if (event === "SIGNED_IN" && s) {
        track("account_created_or_signed_in");
        queueMicrotask(() => void syncAccount(s).catch(() => {}));
      }
      if (event === "SIGNED_OUT") {
        linkedRef.current = false;
        startedRef.current = false;
        pushSigRef.current = "";
        setSyncReady(true);
        setSyncError("");
        clearAccountFields();
      }
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (authEventRef.current) return;
      if (error) throw error;
      sessionRef.current = data.session;
      setSession(data.session);
      setReady(true);
      if (data.session) void syncAccount(data.session).catch(() => {});
      else setSyncReady(true);
    }).catch(() => {
      setReady(true);
      setSyncError("Could not restore your account session. Your device data is still available.");
    });

    const onOnline = () => {
      const current = sessionRef.current;
      if (current) queueMicrotask(() => void syncAccount(current).catch(() => {}));
    };
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function syncAccount(account: Session) {
    if (!supabase) return;
    if (syncRef.current) {
      if (syncUserRef.current === account.user.id) return syncRef.current;
      await syncRef.current.catch(() => {});
      return syncAccount(account);
    }

    setSyncReady(false);
    setSyncError("");
    if (syncUserRef.current !== account.user.id) pushSigRef.current = "";
    syncUserRef.current = account.user.id;
    const work = (async () => {
      if (!navigator.onLine) throw new Error("offline");
      await mergeBeforeWrite(fetchSnapshot, mergeRemote, async () => {
        const progress = localProgress();
        const signature = JSON.stringify(progress);
        if (signature !== pushSigRef.current) {
          await pushProgress(account.user.id, progress);
          pushSigRef.current = signature;
        }
      });

      const ref = getState().profile.referredBy;
      if (ref && !linkedRef.current) {
        const { error } = await supabase!.rpc("link_referral", { p_code: ref });
        if (error) throw error;
        linkedRef.current = true;
        track("referral_linked");
      }
      if (totalActions(getState()) > 0 && !startedRef.current) {
        const { error } = await supabase!.rpc("mark_challenge_started");
        if (error) throw error;
        startedRef.current = true;
      }
      if (ref || totalActions(getState()) > 0) mergeRemote(await fetchSnapshot());
    })();
    syncRef.current = work;
    try {
      await work;
      if (sessionRef.current?.user.id === account.user.id) {
        setSyncError("");
        setSyncReady(true);
      }
    } catch (error) {
      if (sessionRef.current?.user.id === account.user.id) {
        setSyncReady(false);
        setSyncError(navigator.onLine
          ? "Sync failed. Your changes are saved on this device. Retry when you have a connection."
          : "Offline. Your changes are saved on this device and will sync when you reconnect.");
      }
      throw error;
    } finally {
      if (syncRef.current === work) syncRef.current = null;
    }
  }

  // Always fetch + merge before writing; this also reconciles stale devices.
  useEffect(() => {
    if (!supabase || !session || !syncReady) return;
    let t: ReturnType<typeof setTimeout>;
    const syncIfDirty = () => {
      clearTimeout(t);
      if (JSON.stringify(localProgress()) !== pushSigRef.current)
        t = setTimeout(() => void syncAccount(session).catch(() => {}), 800);
    };
    const unsub = subscribe(syncIfDirty);
    syncIfDirty();
    return () => {
      clearTimeout(t);
      unsub();
    };
  }, [session, syncReady]);

  const value: AuthState = {
    configured: backendConfigured,
    session,
    ready,
    syncError,
    retrySync: () => {
      const current = sessionRef.current;
      if (current) void syncAccount(current).catch(() => {});
    },
    async signIn(email) {
      if (!supabase) return { ok: false, error: "Backend not configured" };
      const ref = getState().profile.referredBy;
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
            data: ref ? { referred_by_code: ref } : undefined,
          },
        });
        track("magic_link_requested");
        return error ? { ok: false, error: error.message } : { ok: true };
      } catch {
        return { ok: false, error: "Could not send the email. Check your connection and try again." };
      }
    },
    async signOut() {
      try {
        const { error } = await supabase?.auth.signOut() ?? {};
        if (error) throw error;
      } catch {
        setSyncError("Could not sign out. Check your connection and try again.");
      }
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
