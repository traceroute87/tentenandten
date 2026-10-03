-- Voting method stays on-device; retain the legacy column without exposing it
-- through the account snapshot.
create or replace function public.app_snapshot()
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'reach', coalesce(p.reach, 0),
    'spread', coalesce(p.spread, 0),
    'bring', coalesce(p.bring, 0),
    'voting_checklist', coalesce(p.voting_checklist, '{}'::jsonb),
    'own_state', pr.state,
    'referral_code', pr.referral_code,
    'friends_started', (
      select count(*) from public.referrals r
      where r.referrer_user_id = auth.uid() and r.status = 'challenge_started'
    ),
    'verified_referrals', (
      select count(*) from public.referrals r
      where r.referrer_user_id = auth.uid() and r.status = 'challenge_started'
    )
  )
  from public.profiles pr
  left join public.progress p on p.user_id = pr.id
  where pr.id = auth.uid();
$$;

revoke all on function public.app_snapshot() from public, anon;
grant execute on function public.app_snapshot() to authenticated;
