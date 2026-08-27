-- 10·10·10 — initial schema
-- Guest-first app: these tables only hold data for users who chose to create
-- an account (magic link). No contacts, no address books, minimal PII.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------------
create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  referral_code    text unique not null,
  state            text check (state is null or char_length(state) = 2),
  display_name     text,
  referred_by_code text,                       -- captured once at signup, immutable
  created_at       timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles: read own"   on public.profiles for select using (id = auth.uid());
create policy "profiles: update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles: insert own" on public.profiles for insert with check (id = auth.uid());

-- ------------------------------------------------------------------
-- progress  (one row per user; honor-system counters 0..10)
-- ------------------------------------------------------------------
create table public.progress (
  user_id             uuid primary key references auth.users (id) on delete cascade,
  reach               int  not null default 0 check (reach  between 0 and 10),
  spread              int  not null default 0 check (spread between 0 and 10),
  bring               int  not null default 0 check (bring  between 0 and 10),
  voting_checklist    jsonb not null default '{}'::jsonb,
  own_state           text,
  challenge_started_at timestamptz,
  updated_at          timestamptz not null default now()
);
alter table public.progress enable row level security;

create policy "progress: all own" on public.progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------------
-- referrals  (server-attributed; clients cannot write these directly)
-- ------------------------------------------------------------------
create table public.referrals (
  id                  uuid primary key default gen_random_uuid(),
  referrer_user_id    uuid not null references auth.users (id) on delete cascade,
  referred_user_id    uuid not null unique references auth.users (id) on delete cascade,
  status              text not null default 'account_created'
                        check (status in ('account_created', 'challenge_started')),
  created_at          timestamptz not null default now(),
  challenge_started_at timestamptz,
  check (referrer_user_id <> referred_user_id)
);
alter table public.referrals enable row level security;

-- referrer may read their own attributed referrals; nobody may write via the API
create policy "referrals: read as referrer" on public.referrals
  for select using (referrer_user_id = auth.uid());

-- ------------------------------------------------------------------
-- reminder_prefs
-- ------------------------------------------------------------------
create table public.reminder_prefs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  enabled boolean not null default false,
  state   text
);
alter table public.reminder_prefs enable row level security;

create policy "reminder_prefs: all own" on public.reminder_prefs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------------
-- analytics_events  (privacy-respecting funnel; insert-only for clients)
-- ------------------------------------------------------------------
create table public.analytics_events (
  id         bigint generated always as identity primary key,
  session_id text not null,
  user_id    uuid references auth.users (id) on delete set null,
  event      text not null,
  props      jsonb,
  ts         timestamptz not null default now()
);
alter table public.analytics_events enable row level security;

create policy "analytics: insert" on public.analytics_events
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
-- no select policy: clients never read raw events

-- ------------------------------------------------------------------
-- new-user bootstrap: profile (+ unique referral code), progress, prefs
-- ------------------------------------------------------------------
create or replace function public.gen_referral_code()
returns text language plpgsql as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no I,O,0,1
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where referral_code = code);
  end loop;
  return code;
end $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  ref_code text := nullif(upper(trim(new.raw_user_meta_data ->> 'referred_by_code')), '');
  v_referrer uuid;
begin
  insert into public.profiles (id, referral_code, referred_by_code)
  values (new.id, public.gen_referral_code(), ref_code);
  insert into public.progress (user_id) values (new.id);
  insert into public.reminder_prefs (user_id) values (new.id);

  -- if the magic-link call carried a referral code, attribute it now
  if ref_code is not null then
    select id into v_referrer from public.profiles where referral_code = ref_code;
    if v_referrer is not null and v_referrer <> new.id then
      insert into public.referrals (referrer_user_id, referred_user_id, status)
      values (v_referrer, new.id, 'account_created')
      on conflict (referred_user_id) do nothing;
    end if;
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------
-- RPCs (all security definer, callable by authenticated users)
-- ------------------------------------------------------------------

-- Aggregate view for the current user: progress + profile + referral funnel.
create or replace function public.app_snapshot()
returns json language sql security definer set search_path = public stable as $$
  select json_build_object(
    'reach',  coalesce(p.reach, 0),
    'spread', coalesce(p.spread, 0),
    'bring',  coalesce(p.bring, 0),
    'voting_checklist', coalesce(p.voting_checklist, '{}'::jsonb),
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

-- Attribute the current user to a referrer by code. Idempotent, one per user.
create or replace function public.link_referral(p_code text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_referrer uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  select id into v_referrer from public.profiles
    where referral_code = upper(trim(p_code));

  if v_referrer is null or v_referrer = auth.uid() then return; end if;
  if exists (select 1 from public.referrals where referred_user_id = auth.uid()) then return; end if;

  insert into public.referrals (referrer_user_id, referred_user_id, status)
  values (v_referrer, auth.uid(), 'account_created')
  on conflict (referred_user_id) do nothing;

  update public.profiles
    set referred_by_code = upper(trim(p_code))
    where id = auth.uid() and referred_by_code is null;
end $$;

-- Mark the current user's challenge as started; promotes an inbound referral
-- to 'challenge_started' (this is the only path to a verified referral).
create or replace function public.mark_challenge_started()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  update public.progress
    set challenge_started_at = coalesce(challenge_started_at, now())
    where user_id = auth.uid();

  update public.referrals
    set status = 'challenge_started',
        challenge_started_at = coalesce(challenge_started_at, now())
    where referred_user_id = auth.uid() and status = 'account_created';
end $$;

-- Aggregate, non-identifying community totals (safe for guests to read).
create or replace function public.community_stats()
returns json language sql security definer set search_path = public stable as $$
  select json_build_object(
    'participants',       (select count(*) from public.profiles),
    'actions_completed',  (select coalesce(sum(reach + spread + bring), 0) from public.progress),
    'challenges_completed',(select count(*) from public.progress where reach = 10 and spread = 10 and bring = 10),
    'verified_referrals', (select count(*) from public.referrals where status = 'challenge_started'),
    'states_represented', (select count(distinct state) from public.profiles where state is not null)
  );
$$;
grant execute on function public.community_stats() to anon, authenticated;

revoke all on function public.app_snapshot()          from public, anon;
revoke all on function public.link_referral(text)      from public, anon;
revoke all on function public.mark_challenge_started() from public, anon;
grant execute on function public.app_snapshot()          to authenticated;
grant execute on function public.link_referral(text)      to authenticated;
grant execute on function public.mark_challenge_started() to authenticated;
