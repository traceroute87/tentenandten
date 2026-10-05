begin;
select plan(13);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ref-a@test.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ref-b@test.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'referred@test.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'self@test.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

update public.profiles set referral_code = 'REFAAA' where id = '10000000-0000-0000-0000-000000000001';
update public.profiles set referral_code = 'REFBBB' where id = '10000000-0000-0000-0000-000000000002';
update public.profiles set referral_code = 'SELF01' where id = '10000000-0000-0000-0000-000000000004';

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select lives_ok($$select public.link_referral('REFAAA')$$, 'valid referral links');
select is((select count(*)::integer from public.referrals where referred_user_id = '10000000-0000-0000-0000-000000000003'), 1, 'only one referral row is created');
select throws_ok($$select public.mark_challenge_started()$$, 'P0001', 'challenge has not started', 'zero progress cannot mark a referral start');
select is((select status from public.referrals where referred_user_id = '10000000-0000-0000-0000-000000000003'), 'account_created', 'zero-progress referral remains unpromoted');
select lives_ok($$update public.progress set reach = 1 where user_id = '10000000-0000-0000-0000-000000000003'$$, 'server progress records a started challenge');
select lives_ok($$select public.mark_challenge_started()$$, 'positive self-reported progress marks a referral start');
select is((select status from public.referrals where referred_user_id = '10000000-0000-0000-0000-000000000003'), 'challenge_started', 'started referral has the expected status');
select lives_ok($$select public.mark_challenge_started()$$, 'repeated start promotion is safe');
select is((select count(*)::integer from public.referrals where referred_user_id = '10000000-0000-0000-0000-000000000003'), 1, 'repeated promotion does not duplicate rows');
select lives_ok($$select public.link_referral('REFBBB')$$, 'second attribution attempt is harmless');
select is((select referrer_user_id::text from public.referrals where referred_user_id = '10000000-0000-0000-0000-000000000003'), '10000000-0000-0000-0000-000000000001', 'first referral attribution is retained');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
select lives_ok($$select public.link_referral('SELF01')$$, 'self-referral attempt is harmless');
select is((select count(*)::integer from public.referrals where referred_user_id = '10000000-0000-0000-0000-000000000004'), 0, 'self-referral creates no row');

select * from finish();
rollback;
