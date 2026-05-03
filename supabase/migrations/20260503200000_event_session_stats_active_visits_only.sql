-- Stats match operator expectations: riders who fully picked up (visit completed) drop off counts.

create or replace function public.event_session_stats(p_event_id uuid)
returns table (still_parked bigint, checked_in_total bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    (
      select count(*)::bigint
      from public.devices d
      inner join public.visits v on v.id = d.visit_id
      where v.event_id = p_event_id
        and v.status = 'active'
        and d.status in ('checked_in', 'parked')
    ) as still_parked,
    (
      select count(*)::bigint
      from public.visits v
      where v.event_id = p_event_id
        and v.checked_in_at is not null
        and v.status = 'active'
    ) as checked_in_total;
$$;

grant execute on function public.event_session_stats(uuid) to anon;
grant execute on function public.event_session_stats(uuid) to authenticated;

comment on function public.event_session_stats(uuid) is
  'still_parked: devices on site (active visits only); checked_in_total: active visits not yet completed/cancelled.';
