create schema if not exists private;

create table if not exists public.profiles (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  local_user_id text unique,
  role text not null default 'CUSTOMER'
    check (role in ('SUPER_ADMIN', 'COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF', 'CUSTOMER', 'RUNNER')),
  name text not null default '',
  email text not null,
  phone text,
  destination text not null default '/customer',
  customer_id text,
  company_id text,
  staff_id text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name, phone, avatar_url, updated_at) on public.profiles to authenticated;

drop policy if exists "profiles select own row" on public.profiles;
create policy "profiles select own row"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = auth_user_id);

drop policy if exists "profiles update own editable fields" on public.profiles;
create policy "profiles update own editable fields"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = auth_user_id)
  with check ((select auth.uid()) = auth_user_id);

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (
    auth_user_id,
    local_user_id,
    role,
    name,
    email,
    phone,
    destination,
    customer_id,
    company_id,
    staff_id,
    avatar_url
  )
  values (
    new.id,
    new.raw_app_meta_data ->> 'omukweyo_user_id',
    coalesce(new.raw_app_meta_data ->> 'role', 'CUSTOMER'),
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.email, ''),
    coalesce(nullif(new.phone, ''), new.raw_user_meta_data ->> 'phone'),
    coalesce(new.raw_user_meta_data ->> 'destination', '/customer'),
    new.raw_app_meta_data ->> 'customer_id',
    new.raw_app_meta_data ->> 'company_id',
    new.raw_app_meta_data ->> 'staff_id',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (auth_user_id) do update set
    local_user_id = excluded.local_user_id,
    role = excluded.role,
    name = excluded.name,
    email = excluded.email,
    phone = excluded.phone,
    destination = excluded.destination,
    customer_id = excluded.customer_id,
    company_id = excluded.company_id,
    staff_id = excluded.staff_id,
    avatar_url = excluded.avatar_url,
    updated_at = now();

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();
