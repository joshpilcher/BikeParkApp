-- App uses anon key without staff login — full CRUD on operational tables for desk workflows.
-- Tighten (scoped policies or auth) before production.

create policy patrons_anon_all
  on public.patrons for all
  to anon
  using (true)
  with check (true);

create policy event_attendees_anon_all
  on public.event_attendees for all
  to anon
  using (true)
  with check (true);

create policy pre_registrations_anon_all
  on public.pre_registrations for all
  to anon
  using (true)
  with check (true);

create policy pre_registration_devices_anon_all
  on public.pre_registration_devices for all
  to anon
  using (true)
  with check (true);

create policy visits_anon_all
  on public.visits for all
  to anon
  using (true)
  with check (true);

create policy devices_anon_all
  on public.devices for all
  to anon
  using (true)
  with check (true);

create policy release_events_anon_all
  on public.release_events for all
  to anon
  using (true)
  with check (true);

create policy events_anon_update
  on public.events for update
  to anon
  using (true)
  with check (true);
