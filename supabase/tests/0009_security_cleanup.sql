begin;
select plan(13);

select ok(not has_table_privilege('authenticated', 'public.challenge_history', 'SELECT'), 'authenticated has no table-level history SELECT');
select ok(not has_any_column_privilege('authenticated', 'public.challenge_history', 'SELECT'), 'authenticated has no column-level history SELECT');
select ok(not has_table_privilege('anon', 'public.challenge_history', 'SELECT') and not has_any_column_privilege('anon', 'public.challenge_history', 'SELECT'), 'anon cannot directly read history');
select ok((select relrowsecurity from pg_class where oid = 'public.challenge_history'::regclass), 'history RLS remains enabled');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'challenge_history' and cmd = 'SELECT' and qual like '%auth.uid()%'), 'owner-scoped read policy remains in place');
select ok(position('challenge_history' in pg_get_functiondef('public.app_snapshot()'::regprocedure)) > 0 and position('auth.uid()' in pg_get_functiondef('public.app_snapshot()'::regprocedure)) > 0, 'app_snapshot returns only the caller history');
select ok((select prosecdef and exists (select 1 from unnest(proconfig) setting where setting like 'search_path=pg_catalog%') from pg_proc where oid = 'public.app_snapshot()'::regprocedure), 'app_snapshot remains SECURITY DEFINER with a pinned path');
select ok(has_function_privilege('authenticated', 'public.app_snapshot()', 'EXECUTE') and not has_function_privilege('anon', 'public.app_snapshot()', 'EXECUTE'), 'snapshot execute grant is authenticated-only');
select ok((select prosecdef and exists (select 1 from unnest(proconfig) setting where setting like 'search_path=pg_catalog%') from pg_proc where oid = 'public.guard_progress_cycle()'::regprocedure), 'cycle trigger function uses SECURITY DEFINER and a pinned path');
select ok(not exists (
  select 1 from pg_proc p cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
  where p.oid = 'public.guard_progress_cycle()'::regprocedure and a.grantee = 0 and a.privilege_type = 'EXECUTE'
), 'cycle trigger function has no PUBLIC execute grant');
select ok(not has_function_privilege('anon', 'public.guard_progress_cycle()', 'EXECUTE'), 'anon cannot directly execute the trigger function');
select ok(not has_function_privilege('authenticated', 'public.guard_progress_cycle()', 'EXECUTE'), 'authenticated cannot directly execute the trigger function');
select ok(exists (
  select 1 from pg_trigger t
  where t.tgrelid = 'public.progress'::regclass
    and t.tgfoid = 'public.guard_progress_cycle()'::regprocedure
    and not t.tgisinternal and t.tgenabled in ('O','A')
), 'progress cycle trigger remains enabled and attached');

select * from finish();
rollback;
