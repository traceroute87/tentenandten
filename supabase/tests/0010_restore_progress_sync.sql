begin;
select plan(18);

select ok(has_column_privilege('authenticated', 'public.progress', 'user_id', 'UPDATE'), 'authenticated upsert can update its conflict key');
select ok(not has_table_privilege('authenticated', 'public.progress', 'INSERT'), 'progress insert remains column-scoped');
select ok(not has_table_privilege('authenticated', 'public.progress', 'UPDATE'), 'progress update remains column-scoped');
select ok(not has_table_privilege('anon', 'public.progress', 'INSERT') and not has_any_column_privilege('anon', 'public.progress', 'INSERT'), 'anon cannot insert progress');
select ok(not has_table_privilege('anon', 'public.progress', 'UPDATE') and not has_any_column_privilege('anon', 'public.progress', 'UPDATE'), 'anon cannot update progress');
select ok(not has_table_privilege('authenticated', 'public.progress', 'DELETE'), 'authenticated cannot delete progress');
select ok(not has_table_privilege('anon', 'public.progress', 'DELETE'), 'anon cannot delete progress');
select ok((select relrowsecurity from pg_class where oid = 'public.progress'::regclass), 'progress RLS remains enabled');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'progress' and cmd = 'ALL' and qual like '%auth.uid()%' and with_check like '%auth.uid()%'), 'progress policy remains owner-scoped for reads and writes');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00100000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sync-a-0010@test.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00100000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sync-b-0010@test.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

select set_config('request.jwt.claim.sub', '00100000-0000-0000-0000-000000000010', true);
set local role authenticated;

select lives_ok($$insert into public.progress (
  user_id, reach, spread, bring, voting_checklist, own_state, challenge_cycle,
  challenge_started_at, challenge_completed_at, election_id, election_name,
  election_date, election_type, jurisdiction, updated_at
) values (
  auth.uid(), 10, 10, 10, '{}'::jsonb, null, 1, now(), now(), null, null,
  null, null, null, now()
) on conflict (user_id) do update set
  user_id = excluded.user_id, reach = excluded.reach, spread = excluded.spread,
  bring = excluded.bring, voting_checklist = excluded.voting_checklist,
  own_state = excluded.own_state, challenge_cycle = excluded.challenge_cycle,
  challenge_started_at = excluded.challenge_started_at,
  challenge_completed_at = excluded.challenge_completed_at,
  election_id = excluded.election_id, election_name = excluded.election_name,
  election_date = excluded.election_date, election_type = excluded.election_type,
  jurisdiction = excluded.jurisdiction, updated_at = excluded.updated_at$$,
  'authenticated can execute the exact client progress upsert');
select lives_ok($$update public.progress set reach = 9, spread = 10, bring = 10 where user_id = auth.uid()$$, 'authenticated can update its own progress row');
select throws_ok($$update public.progress set challenge_cycle = 99 where user_id = auth.uid()$$,
  'P0001', 'new challenge cycle is not available', 'progress cycle guard still blocks invalid cycle jumps');
select throws_ok($$insert into public.progress(user_id, reach, spread, bring) values ('00100000-0000-0000-0000-000000000011', 1, 0, 0) on conflict (user_id) do update set user_id = excluded.user_id$$,
  '42501', 'new row violates row-level security policy for table "progress"', 'authenticated cannot insert or upsert another user row');
select lives_ok($$update public.progress set reach = 0 where user_id = '00100000-0000-0000-0000-000000000011'$$, 'authenticated update of another user row is filtered by RLS');

reset role;
select is((select reach from public.progress where user_id = '00100000-0000-0000-0000-000000000011'), 0, 'another user progress row remains unchanged');
select ok(not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'progress' and column_name = 'voting_method'), 'voting_method remains absent');
select ok(not has_table_privilege('authenticated', 'public.challenge_history', 'SELECT') and not has_any_column_privilege('authenticated', 'public.challenge_history', 'SELECT'), 'direct challenge history access remains revoked');
select ok(exists (select 1 from pg_trigger where tgrelid = 'public.progress'::regclass and tgname = 'progress_cycle_guard' and not tgisinternal and tgenabled in ('O','A')), 'progress cycle guard remains enabled');

select * from finish();
rollback;
