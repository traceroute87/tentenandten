-- Only server-stored challenge progress can promote a referral to verified.
create or replace function public.mark_challenge_started()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actions integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select
    coalesce(reach, 0) +
    coalesce(spread, 0) +
    coalesce(bring, 0)
  into v_actions
  from public.progress
  where user_id = auth.uid();

  if coalesce(v_actions, 0) < 1 then
    raise exception 'challenge has not started';
  end if;

  update public.progress
  set challenge_started_at = coalesce(challenge_started_at, now())
  where user_id = auth.uid();

  update public.referrals
  set
    status = 'challenge_started',
    challenge_started_at = coalesce(challenge_started_at, now())
  where
    referred_user_id = auth.uid()
    and status = 'account_created';
end;
$$;

revoke all on function public.mark_challenge_started() from public, anon;
grant execute on function public.mark_challenge_started() to authenticated;


-- Free-text voting logistics stay local. Keep the non-sensitive method field.
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
    'voting_method', p.voting_method,
    'own_state', pr.state,
    'referral_code', pr.referral_code,

    'friends_started', (
      select count(*)
      from public.referrals r
      where
        r.referrer_user_id = auth.uid()
        and r.status = 'challenge_started'
    ),

    'verified_referrals', (
      select count(*)
      from public.referrals r
      where
        r.referrer_user_id = auth.uid()
        and r.status = 'challenge_started'
    )
  )
  from public.profiles pr
  left join public.progress p
    on p.user_id = pr.id
  where pr.id = auth.uid();
$$;

revoke all on function public.app_snapshot() from public, anon;
grant execute on function public.app_snapshot() to authenticated;


-- Free-text voting plan details stay local-only.
alter table public.progress
drop column if exists voting_plan;


-- Remove historical account and raw referral-code linkage from analytics.
update public.analytics_events
set
  user_id = null,
  props = case
    when event = 'referral_visit' then props - 'code'
    else props
  end
where
  user_id is not null
  or (event = 'referral_visit' and props ? 'code');