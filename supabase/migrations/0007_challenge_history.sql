-- Durable, repeatable challenge cycles. History contains only election context,
-- dates, and completed action totals; no ballot, party, or location details.
alter table public.progress
  add column challenge_cycle integer not null default 1 check (challenge_cycle > 0),
  add column challenge_completed_at timestamptz,
  add column election_id text,
  add column election_name text,
  add column election_date date,
  add column election_type text check (election_type is null or election_type in (
    'presidential', 'midterm', 'federal_primary', 'state', 'local', 'special', 'runoff', 'ballot_measure'
  )),
  add column jurisdiction text;

create table public.challenge_history (
  user_id uuid not null references auth.users (id) on delete cascade,
  challenge_cycle integer not null check (challenge_cycle > 0),
  started_at timestamptz,
  completed_at timestamptz,
  election_id text,
  election_name text,
  election_date date,
  election_type text check (election_type is null or election_type in (
    'presidential', 'midterm', 'federal_primary', 'state', 'local', 'special', 'runoff', 'ballot_measure'
  )),
  jurisdiction text,
  reach_final integer not null check (reach_final between 0 and 10),
  share_final integer not null check (share_final between 0 and 10),
  bring_final integer not null check (bring_final between 0 and 10),
  total_actions integer not null check (total_actions = 30),
  primary key (user_id, challenge_cycle),
  check (reach_final + share_final + bring_final = total_actions)
);
alter table public.challenge_history enable row level security;
create policy "challenge history: read own" on public.challenge_history
  for select to authenticated using (user_id = auth.uid());
create policy "challenge history: insert own" on public.challenge_history
  for insert to authenticated with check (user_id = auth.uid());
create policy "challenge history: update own" on public.challenge_history
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update on public.challenge_history to authenticated;

-- Preserve legacy 30/30 accomplishments without inventing a completion date.
insert into public.challenge_history (
  user_id, challenge_cycle, started_at, completed_at,
  reach_final, share_final, bring_final, total_actions
)
select user_id, challenge_cycle, challenge_started_at, challenge_completed_at,
       reach, spread, bring, 30
from public.progress
where reach = 10 and spread = 10 and bring = 10
on conflict (user_id, challenge_cycle) do nothing;

create or replace function public.guard_progress_cycle()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.challenge_cycle < old.challenge_cycle then
    -- Stale clients may still update checklist/state, but never roll back cycles.
    new.challenge_cycle := old.challenge_cycle;
    new.reach := old.reach;
    new.spread := old.spread;
    new.bring := old.bring;
    new.challenge_started_at := old.challenge_started_at;
    new.challenge_completed_at := old.challenge_completed_at;
    new.election_id := old.election_id;
    new.election_name := old.election_name;
    new.election_date := old.election_date;
    new.election_type := old.election_type;
    new.jurisdiction := old.jurisdiction;
  elsif new.challenge_cycle = old.challenge_cycle then
    new.reach := greatest(old.reach, new.reach);
    new.spread := greatest(old.spread, new.spread);
    new.bring := greatest(old.bring, new.bring);
    new.challenge_started_at := coalesce(old.challenge_started_at, new.challenge_started_at);
    new.challenge_completed_at := coalesce(old.challenge_completed_at, new.challenge_completed_at);
    new.election_id := coalesce(old.election_id, new.election_id);
    new.election_name := coalesce(old.election_name, new.election_name);
    new.election_date := coalesce(old.election_date, new.election_date);
    new.election_type := coalesce(old.election_type, new.election_type);
    new.jurisdiction := coalesce(old.jurisdiction, new.jurisdiction);
  end if;
  return new;
end $$;
create trigger progress_cycle_guard before update on public.progress
  for each row execute function public.guard_progress_cycle();

create or replace function public.merge_challenge_history_record()
returns trigger language plpgsql set search_path = public as $$
begin
  new.started_at := coalesce(old.started_at, new.started_at);
  new.completed_at := coalesce(old.completed_at, new.completed_at);
  new.election_id := coalesce(old.election_id, new.election_id);
  new.election_name := coalesce(old.election_name, new.election_name);
  new.election_date := coalesce(old.election_date, new.election_date);
  new.election_type := coalesce(old.election_type, new.election_type);
  new.jurisdiction := coalesce(old.jurisdiction, new.jurisdiction);
  new.reach_final := greatest(old.reach_final, new.reach_final);
  new.share_final := greatest(old.share_final, new.share_final);
  new.bring_final := greatest(old.bring_final, new.bring_final);
  new.total_actions := 30;
  return new;
end $$;
create trigger challenge_history_merge before update on public.challenge_history
  for each row execute function public.merge_challenge_history_record();

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
    'challenge_cycle', coalesce(p.challenge_cycle, 1),
    'challenge_started_at', p.challenge_started_at,
    'challenge_completed_at', p.challenge_completed_at,
    'election_id', p.election_id,
    'election_name', p.election_name,
    'election_date', p.election_date,
    'election_type', p.election_type,
    'jurisdiction', p.jurisdiction,
    'challenge_history', coalesce((
      select json_agg(to_jsonb(h) - 'user_id' order by h.completed_at desc nulls last, h.challenge_cycle desc)
      from public.challenge_history h where h.user_id = auth.uid()
    ), '[]'::json),
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

create or replace function public.community_stats()
returns json language sql security definer set search_path = public stable as $$
  select json_build_object(
    'participants', (select count(*) from public.profiles),
    'actions_completed', (
      select coalesce((select sum(total_actions) from public.challenge_history), 0)
        + coalesce((
          select sum(p.reach + p.spread + p.bring)
          from public.progress p
          where not exists (
            select 1 from public.challenge_history h
            where h.user_id = p.user_id and h.challenge_cycle = p.challenge_cycle
          )
        ), 0)
    ),
    'challenges_completed', (
      select count(*) from public.challenge_history
    ) + (
      select count(*) from public.progress p
      where p.reach = 10 and p.spread = 10 and p.bring = 10
        and not exists (
          select 1 from public.challenge_history h
          where h.user_id = p.user_id and h.challenge_cycle = p.challenge_cycle
        )
    ),
    'verified_referrals', (select count(*) from public.referrals where status = 'challenge_started'),
    'states_represented', (select count(distinct state) from public.profiles where state is not null)
  );
$$;
grant execute on function public.community_stats() to anon, authenticated;
