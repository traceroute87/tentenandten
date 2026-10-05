begin;
select plan(8);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'cycles@test.invalid', '', now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now()
);
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);

select lives_ok($$update public.progress set reach = 10, spread = 10, bring = 10 where user_id = auth.uid()$$, 'cycle 1 can reach completion');
select lives_ok($$select public.archive_completed_challenge()$$, 'current complete cycle is archived through the server RPC');
select lives_ok($$select public.archive_completed_challenge()$$, 'repeated archive remains idempotent');
select lives_ok($$update public.progress set challenge_cycle = 2, reach = 0, spread = 0, bring = 0, challenge_completed_at = null where user_id = auth.uid()$$, 'cycle 2 starts at zero');
select lives_ok($$update public.progress set challenge_cycle = 1, reach = 10, spread = 10, bring = 10 where user_id = auth.uid()$$, 'stale cycle write is accepted without rolling back newer cycle');
select is((select challenge_cycle from public.progress where user_id = auth.uid()), 2, 'higher challenge cycle remains current');
select is((select reach + spread + bring from public.progress where user_id = auth.uid()), 0, 'old completed counters cannot resurrect in the new cycle');
select is(json_array_length((public.app_snapshot() ->> 'challenge_history')::json), 1, 'history is returned by the account snapshot');

select * from finish();
rollback;
