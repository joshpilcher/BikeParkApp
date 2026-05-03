-- Allow creating events from the app without staff login (anon key). Tighten when auth returns.

create policy events_anon_insert
  on public.events
  for insert
  to anon
  with check (true);
