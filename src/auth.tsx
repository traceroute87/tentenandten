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
  activateAccount,
  activateGuest,
  getActiveAccountId,
  totalActions,
  type RemoteSnapshot,
} from "./store";
import { track } from "./analytics";
import { mergeBeforeWrite, persistProgressAndArchive } from "./lib/sync";
import { logSyncFailure } from "./lib/sync-diagnostics";

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

async function fetchSnapshot(signal: AbortSignal): Promise<RemoteSnapshot> {
  if (!supabase) throw new Error("Backend not configured");
  const { data, error } = await supabase.rpc("app_snapshot").abortSignal(signal);
  if (error) { logSyncFailure("APP_SNAPSHOT_FAILED", error); throw error; }
  if (!data) throw new Error("Account snapshot unavailable");
  return data as RemoteSnapshot;
}

async function pushProgress(userId: string, p: ReturnType<typeof localProgress>, serverCycle: number, signal: AbortSignal, isCurrent: () => boolean) {
  if (!supabase) throw new Error("Backend not configured");
  if (!isCurrent()) throw new Error("Stale account sync");
  const { data: u, error: authError } = await supabase.auth.getUser();
  if (authError) { logSyncFailure("SESSION_CHECK_FAILED", authError); throw authError; }
  if (u.user?.id !== userId || !isCurrent()) throw new Error("Stale account sync");
  if (p.challenge_cycle > serverCycle) {
    const { error: archivePreviousError } = await supabase.rpc("archive_completed_challenge").abortSignal(signal);
    if (archivePreviousError) { logSyncFailure("ARCHIVE_CHALLENGE_FAILED", archivePreviousError); throw archivePreviousError; }
    if (!isCurrent()) throw new Error("Stale account sync");
  }
  await persistProgressAndArchive(p, async () => {
    const { error } = await supabase!.from("progress").upsert(
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
    ).abortSignal(signal);
    if (error) { logSyncFailure("PUSH_PROGRESS_FAILED", error); throw error; }
    if (!isCurrent()) throw new Error("Stale account sync");
  }, async () => {
    const { error: archiveError } = await supabase!.rpc("archive_completed_challenge").abortSignal(signal);
    if (archiveError) { logSyncFailure("ARCHIVE_CHALLENGE_FAILED", archiveError); throw archiveError; }
    if (!isCurrent()) throw new Error("Stale account sync");
  });
  if (p.own_state) {
    if (!isCurrent()) throw new Error("Stale account sync");
    const { error: profileError } = await supabase.from("profiles").update({ state: p.own_state }).eq("id", userId).abortSignal(signal);
    if (profileError) { logSyncFailure("PROFILE_SYNC_FAILED", profileError); throw profileError; }
  }
  if (!isCurrent()) throw new Error("Stale account sync");
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
  const syncWorkUserRef = useRef("");
  const syncWorkGenerationRef = useRef(-1);
  const generationRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  function activateSession(next: Session | null) {
    const nextId = next?.user.id ?? null;
    if (getActiveAccountId() === nextId) return;
    generationRef.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    pushSigRef.current = "";
    linkedRef.current = false;
    startedRef.current = false;
    if (nextId) activateAccount(nextId);
    else activateGuest();
  }

  // Restore the session and merge cloud state before enabling writes.
  useEffect(() => {
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      authEventRef.current = true;
      activateSession(s);
      sessionRef.current = s;
      setSession(s);
      setReady(true);
      if (event === "INITIAL_SESSION") {
        if (s) { setSyncReady(false); queueMicrotask(() => void syncAccount(s).catch(() => {})); }
        else setSyncReady(true);
      }
      if (event === "SIGNED_IN" && s) {
        setSyncReady(false);
        track("account_created_or_signed_in");
        queueMicrotask(() => void syncAccount(s).catch(() => {}));
      }
      if (event === "SIGNED_OUT") {
        linkedRef.current = false;
        startedRef.current = false;
        pushSigRef.current = "";
        setSyncReady(true);
        setSyncError("");
        sessionRef.current = null;
        setSession(null);
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (authEventRef.current) return;
      if (error) throw error;
      activateSession(data.session);
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
      generationRef.current++;
      abortRef.current?.abort();
      abortRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function syncAccount(account: Session) {
    if (!supabase) return;
    if (syncRef.current) {
      if (syncWorkUserRef.current === account.user.id && syncWorkGenerationRef.current === generationRef.current) return syncRef.current;
      await syncRef.current.catch(() => {});
      if (sessionRef.current?.user.id === account.user.id) return syncAccount(account);
      return;
    }

    if (getActiveAccountId() !== account.user.id || sessionRef.current?.user.id !== account.user.id) return;
    setSyncReady(false);
    setSyncError("");
    syncWorkUserRef.current = account.user.id;
    const generation = generationRef.current;
    syncWorkGenerationRef.current = generation;
    const controller = new AbortController();
    abortRef.current = controller;
    const isCurrent = () => generationRef.current === generation
      && sessionRef.current?.user.id === account.user.id
      && getActiveAccountId() === account.user.id
      && !controller.signal.aborted;
    const work = (async () => {
      if (!navigator.onLine) throw new Error("offline");
      let serverCycle = 1;
      await mergeBeforeWrite(async () => {
        const snapshot = await fetchSnapshot(controller.signal);
        serverCycle = Math.max(1, Number(snapshot.challenge_cycle) || 1);
        return snapshot;
      }, mergeRemote, async () => {
        if (!isCurrent()) throw new Error("Stale account sync");
        const progress = localProgress();
        const signature = JSON.stringify(progress);
        if (signature !== pushSigRef.current) {
          await pushProgress(account.user.id, progress, serverCycle, controller.signal, isCurrent);
          pushSigRef.current = signature;
        }
      }, isCurrent);

      if (!isCurrent()) throw new Error("Stale account sync");
      const ref = getState().profile.referredBy;
      if (ref && !linkedRef.current) {
        const { error } = await supabase!.rpc("link_referral", { p_code: ref }).abortSignal(controller.signal);
        if (error) { logSyncFailure("REFERRAL_SYNC_FAILED", error); throw error; }
        if (!isCurrent()) throw new Error("Stale account sync");
        linkedRef.current = true;
        track("referral_linked");
      }
      if (totalActions(getState()) > 0 && !startedRef.current) {
        const { error } = await supabase!.rpc("mark_challenge_started").abortSignal(controller.signal);
        if (error) { logSyncFailure("REFERRAL_SYNC_FAILED", error); throw error; }
        if (!isCurrent()) throw new Error("Stale account sync");
        startedRef.current = true;
      }
      if (ref || totalActions(getState()) > 0) {
        const snapshot = await fetchSnapshot(controller.signal);
        if (!isCurrent()) throw new Error("Stale account sync");
        mergeRemote(snapshot);
      }
    })();
    syncRef.current = work;
    try {
      await work;
      if (isCurrent()) {
        setSyncError("");
        setSyncReady(true);
      }
    } catch (error) {
      if (isCurrent()) {
        setSyncReady(false);
        setSyncError(navigator.onLine
          ? "Sync failed. Your changes are saved on this device. Retry when you have a connection."
          : "Offline. Your changes are saved on this device and will sync when you reconnect.");
      }
      throw error;
    } finally {
      if (syncRef.current === work) syncRef.current = null;
      if (abortRef.current === controller) abortRef.current = null;
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

  return <Ctx.Provider value={value}>{ready ? children : null}</Ctx.Provider>;
}
