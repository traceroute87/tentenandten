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

type AuthState = {
  configured: boolean;
  session: Session | null;
  ready: boolean;
  signIn: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState>({
  configured: false,
  session: null,
  ready: true,
  signIn: async () => ({ ok: false, error: "Backend not configured" }),
  signOut: async () => {},
});

export const useAuth = () => useContext(Ctx);

async function fetchSnapshot(): Promise<RemoteSnapshot | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("app_snapshot");
  if (error || !data) return null;
  return data as RemoteSnapshot;
}

async function pushProgress() {
  if (!supabase) return;
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  const p = localProgress();
  await supabase.from("progress").upsert(
    {
      user_id: u.user.id,
      reach: p.reach,
      spread: p.spread,
      bring: p.bring,
      voting_checklist: p.voting_checklist,
      own_state: p.own_state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (p.own_state) {
    await supabase.from("profiles").update({ state: p.own_state }).eq("id", u.user.id);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!backendConfigured);
  const linkedRef = useRef(false);
  const startedRef = useRef(false);
  const pushSigRef = useRef("");

  // initial session + auth change subscription
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_IN" && s) void onSignedIn();
      if (event === "SIGNED_OUT") {
        linkedRef.current = false;
        startedRef.current = false;
        clearAccountFields();
      }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSignedIn() {
    if (!supabase) return;
    track("account_created_or_signed_in");
    // 1. pull remote, merge (max-wins), push merged local up
    const snap = await fetchSnapshot();
    if (snap) mergeRemote(snap);
    await pushProgress();
    // 2. link a pending referral exactly once (server-attributed)
    const ref = getState().profile.referredBy;
    if (ref && !linkedRef.current) {
      linkedRef.current = true;
      const { error } = await supabase.rpc("link_referral", { p_code: ref });
      if (!error) track("referral_linked");
    }
    // 3. if the challenge already has progress, mark it started server-side
    if (totalActions(getState()) > 0 && !startedRef.current) {
      startedRef.current = true;
      await supabase.rpc("mark_challenge_started");
    }
    // 4. re-pull so referral counts / code land in the UI
    const snap2 = await fetchSnapshot();
    if (snap2) mergeRemote(snap2);
  }

  // mirror local changes to Postgres while signed in (debounced)
  useEffect(() => {
    if (!supabase || !session) return;
    let t: ReturnType<typeof setTimeout>;
    const unsub = subscribe(() => {
      clearTimeout(t);
      t = setTimeout(async () => {
        const p = localProgress();
        const sig = JSON.stringify(p);
        if (sig === pushSigRef.current) return;
        pushSigRef.current = sig;
        await pushProgress();
        if (totalActions(getState()) > 0 && !startedRef.current) {
          startedRef.current = true;
          await supabase!.rpc("mark_challenge_started");
        }
      }, 800);
    });
    return () => {
      clearTimeout(t);
      unsub();
    };
  }, [session]);

  const value: AuthState = {
    configured: backendConfigured,
    session,
    ready,
    async signIn(email) {
      if (!supabase) return { ok: false, error: "Backend not configured" };
      const ref = getState().profile.referredBy;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
          data: ref ? { referred_by_code: ref } : undefined,
        },
      });
      track("magic_link_requested");
      return error ? { ok: false, error: error.message } : { ok: true };
    },
    async signOut() {
      await supabase?.auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
