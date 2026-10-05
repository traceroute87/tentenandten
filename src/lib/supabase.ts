import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const env = import.meta.env ?? {};
const url = env.VITE_SUPABASE_URL as string | undefined;
const anon = env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Backend is optional at build time; account features hide when unset. */
export const backendConfigured = Boolean(url && anon);

export const supabase: SupabaseClient | null = backendConfigured
  ? createClient(url!, anon!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
