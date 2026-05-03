-- Home screen reads events without staff login (anon key). Remove or tighten when auth returns.

create policy events_anon_select
  on public.events
  for select
  to anon
  using (true);
