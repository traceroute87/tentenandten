begin;
select plan(50);

select ok(not has_table_privilege('authenticated', 'public.challenge_history', 'INSERT'), 'clients cannot insert history rows');
select ok(not has_table_privilege('authenticated', 'public.challenge_history', 'UPDATE'), 'clients cannot update history rows');
select ok(not has_table_privilege('authenticated', 'public.challenge_history', 'DELETE'), 'clients cannot delete history rows');
select ok(not has_table_privilege('authenticated', 'public.referrals', 'SELECT'), 'referrers cannot read raw referral rows');
select ok(not has_table_privilege('anon', 'public.referrals', 'SELECT'), 'anonymous clients cannot read raw referral rows');
select ok(not has_table_privilege('authenticated', 'public.progress', 'DELETE'), 'authenticated progress DELETE is revoked');
select ok(not has_table_privilege('anon', 'public.progress', 'DELETE'), 'anonymous progress DELETE is revoked');
select ok(has_column_privilege('authenticated', 'public.reminder_prefs', 'user_id', 'SELECT'), 'account reminder reads remain available');
select ok(has_column_privilege('authenticated', 'public.reminder_prefs', 'enabled', 'INSERT'), 'account reminder inserts remain available');
select ok(has_column_privilege('authenticated', 'public.reminder_prefs', 'enabled', 'UPDATE'), 'account reminder updates remain available');
select ok(not has_table_privilege('authenticated', 'public.reminder_prefs', 'DELETE'), 'reminder DELETE is not granted');
select ok(not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'progress' and column_name = 'voting_method'), 'legacy voting_method is gone');
select ok(not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'analytics_events' and column_name = 'user_id'), 'analytics has no account UUID column');
select ok((select relrowsecurity from pg_class where oid = 'public.challenge_history'::regclass), 'history RLS remains enabled');
select ok(not has_table_privilege('authenticated', 'public.challenge_history', 'SELECT') and not has_any_column_privilege('authenticated', 'public.challenge_history', 'SELECT'), 'clients do not directly read history');
select ok(not has_column_privilege('authenticated', 'public.challenge_history', 'server_validated', 'SELECT'), 'internal archive validation flag is hidden');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'challenge_history' and cmd = 'SELECT' and qual like '%auth.uid()%'), 'history retains an owner-filtered read policy');
select ok(not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'challenge_history' and cmd in ('INSERT','UPDATE','ALL')), 'history write policies are removed');
select ok(has_function_privilege('authenticated', 'public.archive_completed_challenge()', 'EXECUTE'), 'authenticated clients can request validated archiving');
select ok(not has_function_privilege('anon', 'public.archive_completed_challenge()', 'EXECUTE'), 'anonymous clients cannot archive');
select ok(has_function_privilege('anon', 'public.record_analytics_event(text,text,jsonb)', 'EXECUTE'), 'anonymous clients can record validated telemetry');
select ok((select prosecdef and exists (select 1 from unnest(proconfig) setting where setting like 'search_path=pg_catalog%') from pg_proc where oid = 'public.archive_completed_challenge()'::regprocedure), 'archive RPC is SECURITY DEFINER with a fixed search path');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'security-0008@test.invalid', '', now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'security-referrer-0008@test.invalid', '', now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now()
);
update public.profiles set referral_code = 'REF009' where id = '10000000-0000-0000-0000-000000000009';
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000008', true);
set local role authenticated;

select lives_ok($$select public.link_referral('REF009')$$, 'referral attribution continues through the RPC');
select throws_ok($$insert into public.challenge_history(user_id,challenge_cycle,reach_final,share_final,bring_final,total_actions) values(auth.uid(),1,10,10,10,30)$$, '42501', 'permission denied for table challenge_history', 'forged history insert is denied');
select throws_ok($$update public.challenge_history set total_actions=30 where user_id=auth.uid()$$, '42501', 'permission denied for table challenge_history', 'history updates are denied');
select throws_ok($$delete from public.challenge_history where user_id=auth.uid()$$, '42501', 'permission denied for table challenge_history', 'history deletes are denied');
select throws_ok($$select * from public.referrals$$, '42501', 'permission denied for table referrals', 'raw referral UUIDs are not readable');
select throws_ok($$select public.archive_completed_challenge()$$, 'P0001', 'challenge is incomplete', 'incomplete cycles cannot be archived');
select throws_ok($$update public.progress set challenge_cycle=99 where user_id=auth.uid()$$, 'P0001', 'new challenge cycle is not available', 'arbitrary cycle jumps are rejected');
select lives_ok($$update public.progress set reach=10, spread=10, bring=10 where user_id=auth.uid()$$, 'challenge progress remains writable as self-reported');
select lives_ok($$select public.archive_completed_challenge()$$, 'complete current cycle archives');
select is(json_array_length((public.app_snapshot()->>'challenge_history')::json), 1, 'snapshot contains the archived cycle');
select lives_ok($$select public.archive_completed_challenge()$$, 'repeated archive request is safe');
select is(json_array_length((public.app_snapshot()->>'challenge_history')::json), 1, 'repeated archive does not duplicate');
select ok((public.community_stats()->>'actions_completed')::integer >= 30, 'community actions count validated archives');
select ok((public.community_stats()->>'challenges_completed')::integer >= 1, 'community challenge total includes validated archive');
select lives_ok($$select public.mark_challenge_started()$$, 'self-reported progress promotes the referral start');
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000009', true);
select is((public.app_snapshot()->>'referral_starts')::integer, 1, 'snapshot retains aggregate referral counts');
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000008', true);
reset role;
insert into public.challenge_history (user_id, challenge_cycle, started_at, completed_at, reach_final, share_final, bring_final, total_actions, server_validated)
values ('10000000-0000-0000-0000-000000000008', 2, now(), now(), 10, 10, 10, 30, false);
set local role authenticated;
select throws_ok($$update public.progress set challenge_cycle=2, reach=0, spread=0, bring=0 where user_id=auth.uid()$$, 'P0001', 'new challenge cycle is not available', 'unvalidated history cannot authorize a new cycle');
reset role;
delete from public.challenge_history where user_id = '10000000-0000-0000-0000-000000000008' and challenge_cycle = 2;
set local role authenticated;
select lives_ok($$update public.progress set challenge_cycle=2, reach=0, spread=0, bring=0 where user_id=auth.uid()$$, 'new cycle can start after archive');
select lives_ok($$update public.progress set challenge_cycle=1, reach=10, spread=10, bring=10 where user_id=auth.uid()$$, 'stale old-cycle write is ignored');
select ok((select challenge_cycle=2 and reach=0 and spread=0 and bring=0 from public.progress where user_id=auth.uid()), 'stale completion cannot restore prior-cycle counts');
select throws_ok($$select public.archive_completed_challenge()$$, 'P0001', 'challenge is incomplete', 'old completion cannot archive the new incomplete cycle');
select lives_ok($$select public.record_analytics_event('browser-00000000-0000-0000-0000-000000000099','visited','{}'::jsonb)$$, 'valid anonymous telemetry is accepted');
select throws_ok($$select public.record_analytics_event('browser-10000000-0000-0000-0000-000000000009','visited','{}'::jsonb)$$, 'P0001', 'account id is not an analytics session id', 'another account UUID cannot be used as a telemetry session');
select throws_ok($$select public.record_analytics_event('browser-00000000-0000-0000-0000-000000000099','unknown_event','{}'::jsonb)$$, 'P0001', 'event or properties not allowed', 'unknown event is rejected');
select throws_ok($$select public.record_analytics_event('browser-00000000-0000-0000-0000-000000000099','visited','{"candidate":"X"}'::jsonb)$$, 'P0001', 'event or properties not allowed', 'sensitive telemetry properties are rejected');
select throws_ok($$select public.record_analytics_event('browser-' || auth.uid()::text,'visited','{}'::jsonb)$$, 'P0001', 'account id is not an analytics session id', 'account UUID cannot be used as analytics session id');
select throws_ok($$insert into public.analytics_events(session_id,event,props) values('browser-00000000-0000-0000-0000-000000000099','visited','{}'::jsonb)$$, '42501', 'permission denied for table analytics_events', 'direct analytics inserts are denied');
select throws_ok($$delete from public.progress where user_id=auth.uid()$$, '42501', 'permission denied for table progress', 'progress deletes are denied');
reset role;

select * from finish();
rollback;
