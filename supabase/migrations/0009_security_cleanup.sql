-- Challenge History is delivered by app_snapshot(); clients do not need table reads.
revoke select on table public.challenge_history from public, anon, authenticated;
revoke select (
  user_id, challenge_cycle, started_at, completed_at, election_id, election_name,
  election_date, election_type, jurisdiction, reach_final, share_final, bring_final,
  total_actions, server_validated
) on table public.challenge_history from public, anon, authenticated;

-- The progress trigger checks the archive internally. SECURITY DEFINER keeps
-- that read available after direct client SELECT is revoked; its body is unchanged.
create or replace function public.guard_progress_cycle()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
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

-- Trigger invocation does not require client EXECUTE; the trigger remains attached.
revoke execute on function public.guard_progress_cycle() from public;
revoke execute on function public.guard_progress_cycle() from anon;
revoke execute on function public.guard_progress_cycle() from authenticated;
