/*
  BikePark — initial schema
  - Single desk per event: visits attach to events directly (no session table).
  - Lanyards 1–300 per event; reusable once visit.status leaves active.
*/

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------

create table public.events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  starts_at   timestamptz,
  ends_at     timestamptz,
  status      text not null default 'draft'
    check (status in ('draft', 'published', 'live', 'closed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger events_set_updated_at
  before update on public.events
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- patrons (riders)
-- ---------------------------------------------------------------------------

create table public.patrons (
  id              uuid primary key default gen_random_uuid(),
  full_name       text not null,
  mobile_e164     text not null,
  email           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint patrons_mobile_e164_key unique (mobile_e164)
);

create index patrons_mobile_e164_idx on public.patrons (mobile_e164);

create trigger patrons_set_updated_at
  before update on public.patrons
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- who is on the pre-reg list for an event
-- ---------------------------------------------------------------------------

create table public.event_attendees (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  patron_id   uuid not null references public.patrons (id) on delete cascade,
  source      text not null default 'pre_register'
    check (source in ('pre_register', 'import', 'manual')),
  created_at  timestamptz not null default now(),
  constraint event_attendees_event_patron_key unique (event_id, patron_id)
);

create index event_attendees_event_id_idx on public.event_attendees (event_id);
create index event_attendees_patron_id_idx on public.event_attendees (patron_id);

-- ---------------------------------------------------------------------------
-- pre-registration (before event)
-- ---------------------------------------------------------------------------

create table public.pre_registrations (
  id                    uuid primary key default gen_random_uuid(),
  event_id              uuid not null references public.events (id) on delete cascade,
  patron_id             uuid not null references public.patrons (id) on delete cascade,
  expected_device_count int not null
    check (expected_device_count >= 1 and expected_device_count <= 6),
  terms_accepted_at     timestamptz not null,
  submitted_at          timestamptz not null default now(),
  constraint pre_registrations_event_patron_key unique (event_id, patron_id)
);

create index pre_registrations_event_id_idx on public.pre_registrations (event_id);

create table public.pre_registration_devices (
  id                    uuid primary key default gen_random_uuid(),
  pre_registration_id   uuid not null references public.pre_registrations (id) on delete cascade,
  sort_order            int not null default 0,
  kind_label            text not null default '',
  detail_notes          text not null default ''
);

create index pre_registration_devices_pre_registration_id_idx
  on public.pre_registration_devices (pre_registration_id);

-- ---------------------------------------------------------------------------
-- visits (check-in / parking stint per patron per event)
-- ---------------------------------------------------------------------------

create table public.visits (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events (id) on delete cascade,
  patron_id       uuid not null references public.patrons (id) on delete restrict,
  entry_method    text not null
    check (entry_method in ('walk_up', 'pre_registered')),
  lanyard_number  smallint
    check (lanyard_number is null or (lanyard_number >= 1 and lanyard_number <= 300)),
  staff_notes     text,
  status          text not null default 'active'
    check (status in ('active', 'completed', 'cancelled')),
  checked_in_at   timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index visits_event_id_idx on public.visits (event_id);
create index visits_patron_id_idx on public.visits (patron_id);

create trigger visits_set_updated_at
  before update on public.visits
  for each row execute procedure public.set_updated_at();

-- At most one active assignment per lanyard per event (pool reuse after completed/cancelled).
create unique index visits_one_active_lanyard_per_event
  on public.visits (event_id, lanyard_number)
  where status = 'active' and lanyard_number is not null;

-- ---------------------------------------------------------------------------
-- devices (gear checked in under a visit)
-- ---------------------------------------------------------------------------

create table public.devices (
  id              uuid primary key default gen_random_uuid(),
  visit_id        uuid not null references public.visits (id) on delete cascade,
  category_key    text,
  kind_label      text not null default '',
  detail_notes    text not null default '',
  bay_zone        text,
  status          text not null default 'checked_in'
    check (status in ('expected', 'checked_in', 'parked', 'released', 'cancelled')),
  checked_in_at   timestamptz,
  released_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index devices_visit_id_idx on public.devices (visit_id);
create index devices_status_idx on public.devices (status);

create trigger devices_set_updated_at
  before update on public.devices
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- pick-up release audit (optional detail)
-- ---------------------------------------------------------------------------

create table public.release_events (
  id              uuid primary key default gen_random_uuid(),
  device_id       uuid not null references public.devices (id) on delete cascade,
  released_at     timestamptz not null default now(),
  operator_note   text
);

create index release_events_device_id_idx on public.release_events (device_id);

-- ---------------------------------------------------------------------------
-- Row Level Security — tighten for production; MVP allows authenticated app.
-- Service role bypasses RLS. Use Supabase Auth "authenticated" for operators.
-- ---------------------------------------------------------------------------

alter table public.events enable row level security;
alter table public.patrons enable row level security;
alter table public.event_attendees enable row level security;
alter table public.pre_registrations enable row level security;
alter table public.pre_registration_devices enable row level security;
alter table public.visits enable row level security;
alter table public.devices enable row level security;
alter table public.release_events enable row level security;

create policy events_authenticated_all
  on public.events for all
  to authenticated
  using (true)
  with check (true);

create policy patrons_authenticated_all
  on public.patrons for all
  to authenticated
  using (true)
  with check (true);

create policy event_attendees_authenticated_all
  on public.event_attendees for all
  to authenticated
  using (true)
  with check (true);

create policy pre_registrations_authenticated_all
  on public.pre_registrations for all
  to authenticated
  using (true)
  with check (true);

create policy pre_registration_devices_authenticated_all
  on public.pre_registration_devices for all
  to authenticated
  using (true)
  with check (true);

create policy visits_authenticated_all
  on public.visits for all
  to authenticated
  using (true)
  with check (true);

create policy devices_authenticated_all
  on public.devices for all
  to authenticated
  using (true)
  with check (true);

create policy release_events_authenticated_all
  on public.release_events for all
  to authenticated
  using (true)
  with check (true);

comment on table public.events is 'Council event; single desk uses one row as the live context.';
comment on column public.visits.lanyard_number is 'Physical lanyard 1–300; reusable after status is not active.';
comment on index public.visits_one_active_lanyard_per_event is 'Enforces one active holder per lanyard per event.';
