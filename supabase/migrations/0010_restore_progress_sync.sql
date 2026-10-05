-- PostgREST upsert updates every supplied payload column on conflict,
-- including progress.user_id. 0008 grants UPDATE on progress columns except
-- user_id, so the authenticated sync POST fails when it executes that upsert.
-- Add only the missing column privilege; owner-scoped RLS still controls rows.
grant update (user_id) on table public.progress to authenticated;
