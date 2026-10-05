-- Account data remains private; completion and telemetry writes cross narrow RPCs.

-- Remove legacy cloud voting-method values before removing the unused column.
update public.progress set voting_method = null where voting_method is not null;

drop policy if exists "referrals: read as referrer" on public.referrals;
drop policy if exists "analytics: insert" on public.analytics_events;
drop policy if exists "challenge history: insert own" on public.challenge_history;
drop policy if exists "challenge history: update own" on public.challenge_history;
drop trigger if exists challenge_history_merge on public.challenge_history;
drop function if exists public.merge_challenge_history_record();

alter table public.challenge_history add column if not exists server_validated boolean not null default false;
update public.challenge_history h set
  server_validated = true,
  reach_final = 10, share_final = 10, bring_final = 10, total_actions = 30,
  election_id = case when p.election_id = '2026-federal-midterm' and p.election_name = '2026 Federal Midterm General Election'
    and p.election_date = date '2026-11-03' and p.election_type = 'midterm' then p.election_id
    when p.election_id = '2028-presidential-general' and p.election_name = '2028 Presidential General Election'
    and p.election_date = date '2028-11-07' and p.election_type = 'presidential' then p.election_id else null end,
  election_name = case when p.election_id = '2026-federal-midterm' and p.election_name = '2026 Federal Midterm General Election'
    and p.election_date = date '2026-11-03' and p.election_type = 'midterm' then p.election_name
    when p.election_id = '2028-presidential-general' and p.election_name = '2028 Presidential General Election'
    and p.election_date = date '2028-11-07' and p.election_type = 'presidential' then p.election_name else null end,
  election_date = case when p.election_id = '2026-federal-midterm' and p.election_name = '2026 Federal Midterm General Election'
    and p.election_date = date '2026-11-03' and p.election_type = 'midterm' then p.election_date
    when p.election_id = '2028-presidential-general' and p.election_name = '2028 Presidential General Election'
    and p.election_date = date '2028-11-07' and p.election_type = 'presidential' then p.election_date else null end,
  election_type = case when p.election_id = '2026-federal-midterm' and p.election_name = '2026 Federal Midterm General Election'
    and p.election_date = date '2026-11-03' and p.election_type = 'midterm' then p.election_type
    when p.election_id = '2028-presidential-general' and p.election_name = '2028 Presidential General Election'
    and p.election_date = date '2028-11-07' and p.election_type = 'presidential' then p.election_type else null end,
  jurisdiction = null
  from public.progress p
  where p.user_id = h.user_id and p.challenge_cycle = h.challenge_cycle
    and p.reach = 10 and p.spread = 10 and p.bring = 10;
update public.challenge_history set
  election_id = null, election_name = null, election_date = null, election_type = null, jurisdiction = null
  where not coalesce(
    (election_id = '2026-federal-midterm' and election_name = '2026 Federal Midterm General Election' and election_date = date '2026-11-03' and election_type = 'midterm')
    or (election_id = '2028-presidential-general' and election_name = '2028 Presidential General Election' and election_date = date '2028-11-07' and election_type = 'presidential'), false
  );
update public.challenge_history set jurisdiction = null where jurisdiction is not null;

-- Earlier clients could send arbitrary telemetry fields. Retain only event
-- names from the app's small allowlist and discard old props/IDs.
update public.analytics_events set
  session_id = 'anon', props = '{}'::jsonb,
  event = case when event in (
    'visited','referral_visit','account_created_or_signed_in','referral_linked','magic_link_requested',
    'challenge_completed','app_installed','install_prompt_shown','referral_link_copied','challenge_started',
    'action_completed','track_completed','action_undone','reminders_set','install_prompt_result','share'
  ) then event else 'legacy_unvalidated' end;

-- Replace snapshot before dropping the legacy column, and expose only aggregates.
create or replace function public.app_snapshot()
returns json language sql security definer set search_path = pg_catalog, public stable as $$
  select json_build_object(
    'reach', coalesce(p.reach, 0), 'spread', coalesce(p.spread, 0), 'bring', coalesce(p.bring, 0),
    'challenge_cycle', coalesce(p.challenge_cycle, 1),
    'challenge_started_at', p.challenge_started_at, 'challenge_completed_at', p.challenge_completed_at,
    'election_id', p.election_id, 'election_name', p.election_name, 'election_date', p.election_date,
    'election_type', p.election_type, 'jurisdiction', p.jurisdiction,
    'challenge_history', coalesce((
      select json_agg(to_jsonb(h) - 'user_id' - 'server_validated' order by h.completed_at desc nulls last, h.challenge_cycle desc)
      from public.challenge_history h where h.user_id = auth.uid()
    ), '[]'::json),
    'voting_checklist', coalesce(p.voting_checklist, '{}'::jsonb),
    'own_state', pr.state, 'referral_code', pr.referral_code,
    'friends_started', (select count(*) from public.referrals r where r.referrer_user_id = auth.uid() and r.status = 'challenge_started'),
    'referral_starts', (select count(*) from public.referrals r where r.referrer_user_id = auth.uid() and r.status = 'challenge_started')
  )
  from public.profiles pr left join public.progress p on p.user_id = pr.id
  where pr.id = auth.uid();
$$;

alter table public.progress drop column if exists voting_method;
alter table public.analytics_events drop column if exists user_id;

-- The server archives only the authenticated user's complete current cycle.
create or replace function public.archive_completed_challenge()
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  p public.progress%rowtype;
  v_id text;
  v_name text;
  v_date date;
  v_type text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into p from public.progress where user_id = auth.uid() for update;
  if not found then raise exception 'current progress unavailable'; end if;
  if p.reach < 10 or p.spread < 10 or p.bring < 10 then raise exception 'challenge is incomplete'; end if;

  if (p.election_id, p.election_name, p.election_date, p.election_type) =
     ('2026-federal-midterm', '2026 Federal Midterm General Election', date '2026-11-03', 'midterm') then
    v_id := p.election_id; v_name := p.election_name; v_date := p.election_date; v_type := p.election_type;
  elsif (p.election_id, p.election_name, p.election_date, p.election_type) =
        ('2028-presidential-general', '2028 Presidential General Election', date '2028-11-07', 'presidential') then
    v_id := p.election_id; v_name := p.election_name; v_date := p.election_date; v_type := p.election_type;
  end if;

  insert into public.challenge_history as current_history (
    user_id, challenge_cycle, started_at, completed_at, election_id, election_name,
    election_date, election_type, jurisdiction, reach_final, share_final, bring_final, total_actions, server_validated
  ) values (
    auth.uid(), p.challenge_cycle, p.challenge_started_at, now(), v_id, v_name,
    v_date, v_type, null, 10, 10, 10, 30, true
  ) on conflict (user_id, challenge_cycle) do update set
    started_at = coalesce(current_history.started_at, excluded.started_at),
    completed_at = case when current_history.server_validated then current_history.completed_at else excluded.completed_at end,
    election_id = case when current_history.server_validated then current_history.election_id else excluded.election_id end,
    election_name = case when current_history.server_validated then current_history.election_name else excluded.election_name end,
    election_date = case when current_history.server_validated then current_history.election_date else excluded.election_date end,
    election_type = case when current_history.server_validated then current_history.election_type else excluded.election_type end,
    jurisdiction = case when current_history.server_validated then current_history.jurisdiction else excluded.jurisdiction end,
    reach_final = 10, share_final = 10, bring_final = 10, total_actions = 30, server_validated = true;
  return found;
end;
$$;

-- A new cycle must be the next cycle and the prior one must already be archived.
create or replace function public.guard_progress_cycle()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if new.challenge_cycle < old.challenge_cycle then
    new.challenge_cycle := old.challenge_cycle;
    new.reach := old.reach; new.spread := old.spread; new.bring := old.bring;
    new.challenge_started_at := old.challenge_started_at; new.challenge_completed_at := old.challenge_completed_at;
    new.election_id := old.election_id; new.election_name := old.election_name; new.election_date := old.election_date;
    new.election_type := old.election_type; new.jurisdiction := old.jurisdiction;
  elsif new.challenge_cycle = old.challenge_cycle then
    new.reach := greatest(old.reach, new.reach); new.spread := greatest(old.spread, new.spread); new.bring := greatest(old.bring, new.bring);
    new.challenge_started_at := coalesce(old.challenge_started_at, new.challenge_started_at);
    new.challenge_completed_at := coalesce(old.challenge_completed_at, new.challenge_completed_at);
    new.election_id := coalesce(old.election_id, new.election_id); new.election_name := coalesce(old.election_name, new.election_name);
    new.election_date := coalesce(old.election_date, new.election_date); new.election_type := coalesce(old.election_type, new.election_type);
    new.jurisdiction := coalesce(old.jurisdiction, new.jurisdiction);
  else
    if new.challenge_cycle <> old.challenge_cycle + 1
       or old.reach < 10 or old.spread < 10 or old.bring < 10
       or not exists (select 1 from public.challenge_history h where h.user_id = old.user_id and h.challenge_cycle = old.challenge_cycle and h.server_validated)
       or new.reach <> 0 or new.spread <> 0 or new.bring <> 0 then
      raise exception 'new challenge cycle is not available';
    end if;
  end if;
  if not coalesce((
    (new.election_id = '2026-federal-midterm' and new.election_name = '2026 Federal Midterm General Election' and new.election_date = date '2026-11-03' and new.election_type = 'midterm')
    or (new.election_id = '2028-presidential-general' and new.election_name = '2028 Presidential General Election' and new.election_date = date '2028-11-07' and new.election_type = 'presidential')
  ), false) then
    new.election_id := null; new.election_name := null; new.election_date := null; new.election_type := null; new.jurisdiction := null;
  end if;
  new.jurisdiction := null;
  return new;
end;
$$;

-- Keep existing SECURITY DEFINER entry points on a fixed, trusted search path.
create or replace function public.link_referral(p_code text)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_referrer uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select id into v_referrer from public.profiles where referral_code = upper(trim(p_code));
  if v_referrer is null or v_referrer = auth.uid() then return; end if;
  insert into public.referrals (referrer_user_id, referred_user_id, status)
  values (v_referrer, auth.uid(), 'account_created') on conflict (referred_user_id) do nothing;
  update public.profiles set referred_by_code = upper(trim(p_code))
    where id = auth.uid() and referred_by_code is null;
end;
$$;

create or replace function public.mark_challenge_started()
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_actions integer;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select coalesce(reach, 0) + coalesce(spread, 0) + coalesce(bring, 0)
    into v_actions from public.progress where user_id = auth.uid();
  if coalesce(v_actions, 0) < 1 then raise exception 'challenge has not started'; end if;
  update public.progress set challenge_started_at = coalesce(challenge_started_at, now()) where user_id = auth.uid();
  update public.referrals set status = 'challenge_started', challenge_started_at = coalesce(challenge_started_at, now())
    where referred_user_id = auth.uid() and status = 'account_created';
end;
$$;

create or replace function public.gen_referral_code()
returns text language plpgsql set search_path = pg_catalog, public as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
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
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  ref_code text := nullif(upper(trim(new.raw_user_meta_data ->> 'referred_by_code')), '');
  v_referrer uuid;
begin
  insert into public.profiles (id, referral_code, referred_by_code)
    values (new.id, public.gen_referral_code(), ref_code);
  insert into public.progress (user_id) values (new.id);
  insert into public.reminder_prefs (user_id) values (new.id);
  if ref_code is not null then
    select id into v_referrer from public.profiles where referral_code = ref_code;
    if v_referrer is not null and v_referrer <> new.id then
      insert into public.referrals (referrer_user_id, referred_user_id, status)
        values (v_referrer, new.id, 'account_created') on conflict (referred_user_id) do nothing;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.community_stats()
returns json language sql security definer set search_path = pg_catalog, public stable as $$
  select json_build_object(
    'participants', (select count(*) from public.profiles),
    'actions_completed', coalesce((select sum(total_actions) from public.challenge_history where server_validated), 0),
    'challenges_completed', (select count(*) from public.challenge_history where server_validated),
    'referral_starts', (select count(*) from public.referrals where status = 'challenge_started'),
    'states_represented', (select count(distinct state) from public.profiles where state is not null)
  );
$$;

-- Validate the narrow, anonymous product-event schema at the database boundary.
create or replace function public.record_analytics_event(p_session_id text, p_event text, p_props jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  valid boolean := false;
  v_track text := p_props->>'track';
  v_kind text := p_props->>'kind';
  v_channel text := p_props->>'channel';
begin
  if p_session_id is null or p_session_id <> 'anon' and p_session_id !~ '^browser-[0-9a-f-]{36}$' then raise exception 'invalid session id'; end if;
  if (auth.uid() is not null and position(auth.uid()::text in p_session_id) > 0)
     or (p_session_id like 'browser-%' and exists (
       select 1 from public.profiles where id::text = substring(p_session_id from 9)
     )) then raise exception 'account id is not an analytics session id'; end if;
  if p_props is null or jsonb_typeof(p_props) <> 'object' then raise exception 'invalid event properties'; end if;
  if p_event in ('visited','referral_visit','account_created_or_signed_in','referral_linked','magic_link_requested','challenge_completed','app_installed','install_prompt_shown','referral_link_copied') then
    valid := p_props = '{}'::jsonb;
  elsif p_event = 'challenge_started' then
    valid := p_props = '{}'::jsonb or (
      p_props = jsonb_build_object('cycle', p_props->'cycle') and jsonb_typeof(p_props->'cycle') = 'number'
      and (p_props->>'cycle') ~ '^[1-9][0-9]{0,5}$'
    );
  elsif p_event = 'action_completed' then
    valid := p_props ?& array['track','kind','n'] and jsonb_object_length(p_props) = 3
      and jsonb_typeof(p_props->'track') = 'string' and jsonb_typeof(p_props->'kind') = 'string'
      and jsonb_typeof(p_props->'n') = 'number' and (p_props->>'n') ~ '^(10|[1-9])$'
      and ((v_track = 'reach' and v_kind in ('call','text','email','already','manual'))
        or (v_track = 'spread' and v_kind in ('facebook','x','truth','share','text','email','copy','manual'))
        or (v_track = 'bring' and v_kind in ('register','check','polling','id','early','mail','ballot','plan','ride','election-day','manual')));
  elsif p_event in ('track_completed','action_undone') then
    valid := p_props ? 'track' and jsonb_object_length(p_props) = 1 and v_track in ('reach','spread','bring');
  elsif p_event = 'reminders_set' then
    valid := p_props ? 'enabled' and jsonb_object_length(p_props) = 1 and jsonb_typeof(p_props->'enabled') = 'boolean';
  elsif p_event = 'install_prompt_result' then
    valid := p_props ? 'outcome' and jsonb_object_length(p_props) = 1 and p_props->>'outcome' in ('accepted','dismissed');
  elsif p_event = 'share' then
    valid := p_props ? 'channel' and jsonb_object_length(p_props) = 1 and v_channel in ('facebook','x','truth','text','email','copy','share','social');
  end if;
  if not valid then raise exception 'event or properties not allowed'; end if;
  insert into public.analytics_events(session_id, event, props, ts)
    values (p_session_id, p_event, p_props, now());
end;
$$;

-- Clients use progress upsert, own profile state update, read-only history, and RPCs.
revoke all on public.progress, public.profiles, public.referrals, public.reminder_prefs,
  public.challenge_history, public.analytics_events from public, anon, authenticated;
revoke delete on public.progress from anon, authenticated;
grant select on public.progress to authenticated;
grant insert (user_id, reach, spread, bring, voting_checklist, own_state, challenge_cycle, challenge_started_at,
  challenge_completed_at, election_id, election_name, election_date, election_type, jurisdiction, updated_at)
  on public.progress to authenticated;
grant update (reach, spread, bring, voting_checklist, own_state, challenge_cycle, challenge_started_at,
  challenge_completed_at, election_id, election_name, election_date, election_type, jurisdiction, updated_at)
  on public.progress to authenticated;
grant update (state) on public.profiles to authenticated;
grant select (id) on public.profiles to authenticated;
grant select (user_id, enabled, state) on public.reminder_prefs to authenticated;
grant insert (user_id, enabled, state) on public.reminder_prefs to authenticated;
grant update (enabled, state) on public.reminder_prefs to authenticated;
grant select (user_id, challenge_cycle, started_at, completed_at, election_id, election_name,
  election_date, election_type, jurisdiction, reach_final, share_final, bring_final, total_actions)
  on public.challenge_history to authenticated;

revoke all on function public.app_snapshot() from public, anon;
revoke all on function public.community_stats() from public;
revoke all on function public.link_referral(text) from public, anon;
revoke all on function public.mark_challenge_started() from public, anon;
revoke all on function public.archive_completed_challenge() from public, anon;
revoke all on function public.record_analytics_event(text, text, jsonb) from public;
revoke all on function public.gen_referral_code() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.app_snapshot() to authenticated;
grant execute on function public.community_stats() to anon, authenticated;
grant execute on function public.link_referral(text) to authenticated;
grant execute on function public.mark_challenge_started() to authenticated;
grant execute on function public.archive_completed_challenge() to authenticated;
grant execute on function public.record_analytics_event(text, text, jsonb) to anon, authenticated;
