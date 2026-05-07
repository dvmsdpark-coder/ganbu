create extension if not exists pgcrypto;

create schema if not exists app_private;

create table if not exists public.app_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  division_id text not null,
  role text not null default 'member' check (role in ('member', 'division_admin', 'super_admin')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'disabled')),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create index if not exists app_profiles_user_idx on public.app_profiles (user_id);
create index if not exists app_profiles_status_idx on public.app_profiles (status);
create index if not exists events_division_date_idx on public.events (division_id, date, start_time);
create index if not exists events_deleted_idx on public.events (deleted);
create index if not exists event_history_division_changed_idx on public.event_history (division_id, changed_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_profiles (user_id, email, display_name, division_id, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'division_id', 'policyPlanningOffice'),
    'member',
    'pending'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.app_profiles (user_id, email, display_name, division_id, role, status)
select
  users.id,
  users.email,
  coalesce(users.raw_user_meta_data ->> 'display_name', split_part(users.email, '@', 1)),
  coalesce(users.raw_user_meta_data ->> 'division_id', 'policyPlanningOffice'),
  'member',
  'pending'
from auth.users
where users.email is not null
on conflict (user_id) do nothing;

create or replace function app_private.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.app_profiles
  where user_id = auth.uid()
    and status = 'approved'
  limit 1
$$;

create or replace function app_private.current_user_division()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select division_id
  from public.app_profiles
  where user_id = auth.uid()
    and status = 'approved'
  limit 1
$$;

create or replace function app_private.is_approved_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_profiles
    where user_id = auth.uid()
      and status = 'approved'
  )
$$;

create or replace function app_private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_profiles
    where user_id = auth.uid()
      and status = 'approved'
      and role = 'super_admin'
  )
$$;

create or replace function app_private.can_manage_rank(target_rank text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    app_private.is_super_admin()
    or app_private.current_user_role() = 'division_admin'
    or target_rank in ('director', 'manager')
$$;

alter table public.app_profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_history enable row level security;

drop policy if exists "profiles select own or super" on public.app_profiles;
drop policy if exists "profiles update super" on public.app_profiles;
drop policy if exists "prototype events select" on public.events;
drop policy if exists "prototype events insert" on public.events;
drop policy if exists "prototype events update" on public.events;
drop policy if exists "events select approved division" on public.events;
drop policy if exists "events insert approved division" on public.events;
drop policy if exists "events update approved division" on public.events;
drop policy if exists "prototype history select" on public.event_history;
drop policy if exists "prototype history insert" on public.event_history;
drop policy if exists "history select approved division" on public.event_history;
drop policy if exists "history insert approved division" on public.event_history;

create policy "profiles select own or super"
on public.app_profiles for select
to authenticated
using (user_id = auth.uid() or app_private.is_super_admin());

create policy "profiles update super"
on public.app_profiles for update
to authenticated
using (app_private.is_super_admin())
with check (app_private.is_super_admin());

create policy "events select approved division"
on public.events for select
to authenticated
using (
  app_private.is_approved_user()
  and (
    app_private.is_super_admin()
    or division_id = app_private.current_user_division()
  )
);

create policy "events insert approved division"
on public.events for insert
to authenticated
with check (
  app_private.is_approved_user()
  and app_private.can_manage_rank(rank)
  and (
    app_private.is_super_admin()
    or division_id = app_private.current_user_division()
  )
);

create policy "events update approved division"
on public.events for update
to authenticated
using (
  app_private.is_approved_user()
  and (
    app_private.is_super_admin()
    or division_id = app_private.current_user_division()
  )
)
with check (
  app_private.is_approved_user()
  and app_private.can_manage_rank(rank)
  and (
    app_private.is_super_admin()
    or division_id = app_private.current_user_division()
  )
);

create policy "history select approved division"
on public.event_history for select
to authenticated
using (
  app_private.is_approved_user()
  and (
    app_private.is_super_admin()
    or division_id = app_private.current_user_division()
  )
);

create policy "history insert approved division"
on public.event_history for insert
to authenticated
with check (
  app_private.is_approved_user()
  and (
    app_private.is_super_admin()
    or division_id = app_private.current_user_division()
  )
);

create or replace function public.prune_old_schedule_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_events integer := 0;
  deleted_history integer := 0;
begin
  if not app_private.is_approved_user() then
    raise exception 'approved user required';
  end if;

  delete from public.events
  where date < current_date - interval '14 days';
  get diagnostics deleted_events = row_count;

  delete from public.event_history
  where changed_at < now() - interval '180 days';
  get diagnostics deleted_history = row_count;

  return jsonb_build_object(
    'deleted_events', deleted_events,
    'deleted_history', deleted_history
  );
end;
$$;

revoke all on public.app_profiles from anon;
revoke all on public.events from anon;
revoke all on public.event_history from anon;

grant usage on schema public to authenticated;
grant select, update on public.app_profiles to authenticated;
grant select, insert, update on public.events to authenticated;
grant select, insert on public.event_history to authenticated;
grant execute on function public.prune_old_schedule_data() to authenticated;
grant usage on schema app_private to authenticated;
grant execute on all functions in schema app_private to authenticated;
