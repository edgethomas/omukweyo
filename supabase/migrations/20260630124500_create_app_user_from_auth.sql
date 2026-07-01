create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  user_role text;
begin
  user_role := coalesce(new.raw_user_meta_data ->> 'role', new.raw_app_meta_data ->> 'role', 'CUSTOMER');
  if user_role not in ('SUPER_ADMIN', 'COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF', 'CUSTOMER', 'RUNNER') then
    user_role := 'CUSTOMER';
  end if;

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
    coalesce(new.raw_app_meta_data ->> 'omukweyo_user_id', new.raw_user_meta_data ->> 'omukweyoUserId'),
    user_role,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), ''),
    coalesce(new.email, ''),
    coalesce(nullif(new.phone, ''), new.raw_user_meta_data ->> 'phone'),
    coalesce(nullif(new.raw_user_meta_data ->> 'destination', ''), '/customer'),
    coalesce(new.raw_app_meta_data ->> 'customer_id', new.raw_user_meta_data ->> 'customerId'),
    coalesce(new.raw_app_meta_data ->> 'company_id', new.raw_user_meta_data ->> 'companyId'),
    coalesce(new.raw_app_meta_data ->> 'staff_id', new.raw_user_meta_data ->> 'staffId'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'avatarUrl')
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

create or replace function private.handle_app_user_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  app_user_id text;
  app_role text;
  app_name text;
  app_destination text;
  app_phone text;
  app_company_id text;
  app_customer_id text;
  app_staff_id text;
begin
  app_role := coalesce(new.raw_user_meta_data ->> 'role', 'CUSTOMER');
  if app_role not in ('CUSTOMER', 'RUNNER', 'COMPANY_OWNER') then
    app_role := 'CUSTOMER';
  end if;

  app_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Omukweyo user'
  );
  app_destination := coalesce(
    nullif(new.raw_user_meta_data ->> 'destination', ''),
    case app_role
      when 'COMPANY_OWNER' then '/dashboard'
      when 'RUNNER' then '/runner/work'
      else '/customer'
    end
  );
  app_phone := coalesce(nullif(new.phone, ''), nullif(new.raw_user_meta_data ->> 'phone', ''));
  app_company_id := case when app_role = 'COMPANY_OWNER' then coalesce(nullif(new.raw_user_meta_data ->> 'companyId', ''), nullif(new.raw_user_meta_data ->> 'company_id', '')) else null end;
  app_customer_id := case when app_role = 'CUSTOMER' then coalesce(nullif(new.raw_user_meta_data ->> 'customerId', ''), nullif(new.raw_user_meta_data ->> 'customer_id', '')) else null end;
  app_staff_id := case when app_role = 'COMPANY_OWNER' then coalesce(nullif(new.raw_user_meta_data ->> 'staffId', ''), nullif(new.raw_user_meta_data ->> 'staff_id', '')) else null end;

  select id
    into app_user_id
    from public."User"
    where "supabaseUserId" = new.id::text
       or email = lower(coalesce(new.email, ''))
    order by case when "supabaseUserId" = new.id::text then 0 else 1 end
    limit 1;

  if app_user_id is null then
    insert into public."User" (
      id,
      role,
      name,
      email,
      "supabaseUserId",
      phone,
      "passwordHash",
      destination,
      "emailVerified",
      "companyId",
      "customerId",
      "staffId",
      "avatarUrl"
    )
    values (
      'usr_' || replace(gen_random_uuid()::text, '-', ''),
      app_role::public."Role",
      app_name,
      lower(coalesce(new.email, '')),
      new.id::text,
      app_phone,
      'supabase-auth',
      app_destination,
      new.email_confirmed_at is not null,
      app_company_id,
      app_customer_id,
      app_staff_id,
      coalesce(new.raw_user_meta_data ->> 'avatarUrl', new.raw_user_meta_data ->> 'avatar_url')
    );
  else
    update public."User"
       set role = case when role = 'SUPER_ADMIN' then role else app_role::public."Role" end,
           name = app_name,
           email = lower(coalesce(new.email, email)),
           "supabaseUserId" = new.id::text,
           phone = app_phone,
           "passwordHash" = 'supabase-auth',
           destination = app_destination,
           "emailVerified" = new.email_confirmed_at is not null,
           "companyId" = coalesce(app_company_id, "companyId"),
           "customerId" = coalesce(app_customer_id, "customerId"),
           "staffId" = coalesce(app_staff_id, "staffId"),
           "avatarUrl" = coalesce(new.raw_user_meta_data ->> 'avatarUrl', new.raw_user_meta_data ->> 'avatar_url', "avatarUrl"),
           "updatedAt" = now()
     where id = app_user_id;
  end if;

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;
revoke all on function private.handle_app_user_from_auth() from public, anon, authenticated;

drop trigger if exists on_auth_user_app_profile_saved on auth.users;
create trigger on_auth_user_app_profile_saved
  after insert or update of email, email_confirmed_at, phone, raw_user_meta_data on auth.users
  for each row execute function private.handle_app_user_from_auth();
