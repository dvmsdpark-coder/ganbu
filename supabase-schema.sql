create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  division_id text not null,
  rank text not null check (rank in ('minister', 'vice', 'secretary', 'director', 'manager')),
  person text not null,
  date date not null,
  start_time time not null,
  end_time time,
  title text not null,
  location text not null default '',
  memo text not null default '',
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

create table if not exists public.event_history (
  id uuid primary key default gen_random_uuid(),
  division_id text not null,
  action text not null,
  title text not null,
  actor text not null default '',
  detail text not null default '',
  changed_at timestamptz not null default now()
);

create index if not exists events_division_date_idx on public.events (division_id, date, start_time);
create index if not exists events_deleted_idx on public.events (deleted);
create index if not exists event_history_division_changed_idx on public.event_history (division_id, changed_at desc);

alter table public.events enable row level security;
alter table public.event_history enable row level security;

drop policy if exists "prototype events select" on public.events;
drop policy if exists "prototype events insert" on public.events;
drop policy if exists "prototype events update" on public.events;
drop policy if exists "prototype history select" on public.event_history;
drop policy if exists "prototype history insert" on public.event_history;

create policy "prototype events select"
on public.events for select
to anon, authenticated
using (true);

create policy "prototype events insert"
on public.events for insert
to anon, authenticated
with check (true);

create policy "prototype events update"
on public.events for update
to anon, authenticated
using (true)
with check (true);

create policy "prototype history select"
on public.event_history for select
to anon, authenticated
using (true);

create policy "prototype history insert"
on public.event_history for insert
to anon, authenticated
with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.events to anon, authenticated;
grant select, insert on public.event_history to anon, authenticated;
