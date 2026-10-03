-- 10·10·10 — persist the voting-plan method + free-text plan for signed-in users.
-- The V1 Voting screen gained an adaptive planner (method choice + a short
-- "election day plan"); those two fields now sync alongside voting_checklist.

alter table public.progress add column if not exists voting_method text;
alter table public.progress add column if not exists voting_plan jsonb not null default '{}'::jsonb;

do $$ begin
  alter table public.progress
    add constraint progress_voting_method_chk
    check (voting_method is null or voting_method in ('election_day', 'early', 'mail'));
exception when duplicate_object then null;
end $$;

-- Extend the per-user snapshot with the two new fields.
create or replace function public.app_snapshot()
returns json language sql security definer set search_path = public stable as $$
  select json_build_object(
    'reach',  coalesce(p.reach, 0),
    'spread', coalesce(p.spread, 0),
    'bring',  coalesce(p.bring, 0),
    'voting_checklist', coalesce(p.voting_checklist, '{}'::jsonb),
    'voting_method', p.voting_method,
    'voting_plan',   coalesce(p.voting_plan, '{}'::jsonb),
    'own_state', pr.state,
    'referral_code', pr.referral_code,
    'friends_started', (
      select count(*) from public.referrals r where r.referrer_user_id = auth.uid()
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
