begin;
select plan(7);

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
select lives_ok($$update public.progress set challenge_cycle = 2, reach = 0, spread = 0, bring = 0, challenge_completed_at = null where user_id = auth.uid()$$, 'cycle 2 starts at zero');
select lives_ok($$update public.progress set challenge_cycle = 1, reach = 10, spread = 10, bring = 10 where user_id = auth.uid()$$, 'stale cycle write is accepted without rolling back newer cycle');
select is((select challenge_cycle from public.progress where user_id = auth.uid()), 2, 'higher challenge cycle remains current');
select is((select reach + spread + bring from public.progress where user_id = auth.uid()), 0, 'old completed counters cannot resurrect in the new cycle');

insert into public.challenge_history (
  user_id, challenge_cycle, completed_at, reach_final, share_final, bring_final, total_actions
) values (auth.uid(), 1, '2026-11-03T18:00:00Z', 10, 10, 10, 30)
on conflict (user_id, challenge_cycle) do nothing;
insert into public.challenge_history (
  user_id, challenge_cycle, completed_at, reach_final, share_final, bring_final, total_actions
) values (auth.uid(), 1, '2026-11-03T18:00:00Z', 10, 10, 10, 30)
on conflict (user_id, challenge_cycle) do update set total_actions = excluded.total_actions;
select is((select count(*)::integer from public.challenge_history where user_id = auth.uid() and challenge_cycle = 1), 1, 'repeated archive upsert remains unique');
select is(json_array_length((public.app_snapshot() ->> 'challenge_history')::json), 1, 'history is returned by the account snapshot');

select * from finish();
rollback;
