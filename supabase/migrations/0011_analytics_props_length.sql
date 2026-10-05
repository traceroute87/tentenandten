-- 0008's record_analytics_event validates property counts with jsonb_object_length(),
-- which Postgres does not provide, so every event with properties failed (42883).
-- The function's search_path is pg_catalog, public: providing the helper in public
-- fixes it without replacing the RPC. Clients cannot call the helper directly.
create or replace function public.jsonb_object_length(p jsonb)
returns integer language sql immutable strict set search_path = pg_catalog as $$
  select count(*)::integer from jsonb_object_keys(p)
$$;

revoke all on function public.jsonb_object_length(jsonb) from public, anon, authenticated;
