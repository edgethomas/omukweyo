create or replace function private.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u."role"::text
  from public."User" u
  where u."supabaseUserId" = (select auth.uid()::text)
  limit 1
$$;

create or replace function private.current_app_company_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u."companyId"
  from public."User" u
  where u."supabaseUserId" = (select auth.uid()::text)
  limit 1
$$;

create or replace function private.current_app_customer_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u."customerId"
  from public."User" u
  where u."supabaseUserId" = (select auth.uid()::text)
  limit 1
$$;

create or replace function private.current_app_phone()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u."phone"
  from public."User" u
  where u."supabaseUserId" = (select auth.uid()::text)
  limit 1
$$;

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(private.current_app_role() = 'SUPER_ADMIN', false)
$$;

create or replace function private.has_company_access(company_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    private.is_super_admin()
    or exists (
      select 1
      from public."User" u
      where u."supabaseUserId" = (select auth.uid()::text)
        and u."companyId" = company_id
        and u."role"::text in ('COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF')
    ),
    false
  )
$$;

create or replace function private.owns_customer(customer_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    private.is_super_admin()
    or exists (
      select 1
      from public."User" u
      where u."supabaseUserId" = (select auth.uid()::text)
        and u."customerId" = customer_id
    ),
    false
  )
$$;

grant usage on schema private to authenticated;
grant execute on function private.current_app_role() to authenticated;
grant execute on function private.current_app_company_id() to authenticated;
grant execute on function private.current_app_customer_id() to authenticated;
grant execute on function private.current_app_phone() to authenticated;
grant execute on function private.is_super_admin() to authenticated;
grant execute on function private.has_company_access(text) to authenticated;
grant execute on function private.owns_customer(text) to authenticated;

do $$
declare
  app_table text;
begin
  foreach app_table in array array[
    'BillingInvoice',
    'Branch',
    'Company',
    'CompanyAsset',
    'Customer',
    'FutureReservation',
    'Notification',
    'QueueTicket',
    'ReservationEvent',
    'RunnerApplication',
    'RunnerDestination',
    'RunnerJob',
    'RunnerRequest',
    'Service',
    'Session',
    'SmsCreditPurchase',
    'StaffMember',
    'Subscription',
    'TicketEvent',
    'User',
    'WidgetInstall'
  ] loop
    execute format('drop policy if exists "authenticated app access" on public.%I', app_table);
    execute format('drop policy if exists "public create app data" on public.%I', app_table);
    execute format('drop policy if exists "public read app data" on public.%I', app_table);
  end loop;
end $$;

grant select on table public."Company", public."Branch", public."Service", public."QueueTicket", public."TicketEvent", public."FutureReservation", public."ReservationEvent", public."RunnerDestination", public."RunnerRequest" to anon;
grant insert on table public."Company", public."Branch", public."Service", public."StaffMember", public."Customer", public."FutureReservation", public."QueueTicket", public."TicketEvent", public."ReservationEvent", public."RunnerApplication", public."RunnerRequest", public."RunnerJob", public."Notification" to anon;
grant update ("liveWaiting") on table public."Branch" to anon;
grant update ("status", "counter", "position", "peopleAhead", "estimatedWaitMinutes", "calledAt", "servingAt", "servedAt") on table public."QueueTicket" to anon;
grant update ("status", "bookedAt", "ticketId") on table public."FutureReservation" to anon;

create policy "public read companies"
  on public."Company"
  for select
  to anon, authenticated
  using ("id" is not null);

create policy "public onboard companies"
  on public."Company"
  for insert
  to anon
  with check (length(trim("id")) > 0 and length(trim("slug")) > 0 and length(trim("name")) > 0);

create policy "company members update companies"
  on public."Company"
  for update
  to authenticated
  using (private.has_company_access("id"))
  with check (private.has_company_access("id"));

create policy "super admin delete companies"
  on public."Company"
  for delete
  to authenticated
  using (private.is_super_admin());

create policy "public read branches"
  on public."Branch"
  for select
  to anon, authenticated
  using ("id" is not null);

create policy "public onboard branches"
  on public."Branch"
  for insert
  to anon
  with check (length(trim("id")) > 0 and length(trim("companyId")) > 0 and length(trim("name")) > 0);

create policy "company members insert branches"
  on public."Branch"
  for insert
  to authenticated
  with check (private.has_company_access("companyId"));

create policy "company members update branches"
  on public."Branch"
  for update
  to authenticated
  using (private.has_company_access("companyId"))
  with check (private.has_company_access("companyId"));

create policy "public queue counters update branches"
  on public."Branch"
  for update
  to anon
  using ("id" is not null and "liveWaiting" >= 0)
  with check ("id" is not null and "liveWaiting" >= 0);

create policy "public read services"
  on public."Service"
  for select
  to anon, authenticated
  using ("id" is not null);

create policy "public onboard services"
  on public."Service"
  for insert
  to anon
  with check (length(trim("id")) > 0 and length(trim("companyId")) > 0 and length(trim("name")) > 0);

create policy "company members write services"
  on public."Service"
  for all
  to authenticated
  using (private.has_company_access("companyId"))
  with check (private.has_company_access("companyId"));

create policy "company members read staff"
  on public."StaffMember"
  for select
  to authenticated
  using (private.has_company_access("companyId"));

create policy "public onboard staff"
  on public."StaffMember"
  for insert
  to anon
  with check (length(trim("id")) > 0 and length(trim("companyId")) > 0 and length(trim("name")) > 0);

create policy "company members write staff"
  on public."StaffMember"
  for all
  to authenticated
  using (private.has_company_access("companyId"))
  with check (private.has_company_access("companyId"));

create policy "company members read assets"
  on public."CompanyAsset"
  for select
  to authenticated
  using (private.has_company_access("companyId"));

create policy "company members write assets"
  on public."CompanyAsset"
  for all
  to authenticated
  using (private.has_company_access("companyId"))
  with check (private.has_company_access("companyId"));

create policy "customers read own profile"
  on public."Customer"
  for select
  to authenticated
  using (private.owns_customer("id") or private.has_company_access(private.current_app_company_id()));

create policy "public create customers"
  on public."Customer"
  for insert
  to anon
  with check (length(trim("id")) > 0 and length(trim("name")) > 0 and length(trim("phone")) > 0);

create policy "authenticated create linked customers"
  on public."Customer"
  for insert
  to authenticated
  with check (length(trim("id")) > 0 and length(trim("name")) > 0 and length(trim("phone")) > 0);

create policy "customers update own profile"
  on public."Customer"
  for update
  to authenticated
  using (private.owns_customer("id"))
  with check (private.owns_customer("id"));

create policy "customers delete own profile"
  on public."Customer"
  for delete
  to authenticated
  using (private.owns_customer("id"));

create policy "public read live tickets"
  on public."QueueTicket"
  for select
  to anon, authenticated
  using ("id" is not null);

create policy "public create tickets"
  on public."QueueTicket"
  for insert
  to anon
  with check (length(trim("id")) > 0 and length(trim("branchId")) > 0 and length(trim("serviceId")) > 0 and length(trim("customerPhone")) > 0);

create policy "authenticated create tickets"
  on public."QueueTicket"
  for insert
  to authenticated
  with check (private.has_company_access("companyId") or "customerPhone" = private.current_app_phone() or private.is_super_admin());

create policy "public ticket self service updates"
  on public."QueueTicket"
  for update
  to anon
  using ("id" is not null and length(trim("customerPhone")) > 0)
  with check ("id" is not null and length(trim("customerPhone")) > 0);

create policy "company members update tickets"
  on public."QueueTicket"
  for update
  to authenticated
  using (private.has_company_access("companyId") or "customerPhone" = private.current_app_phone())
  with check (private.has_company_access("companyId") or "customerPhone" = private.current_app_phone());

create policy "company members delete tickets"
  on public."QueueTicket"
  for delete
  to authenticated
  using (private.has_company_access("companyId") or private.is_super_admin());

create policy "public read ticket events"
  on public."TicketEvent"
  for select
  to anon, authenticated
  using ("ticketId" is not null);

create policy "public create ticket events"
  on public."TicketEvent"
  for insert
  to anon
  with check (length(trim("id")) > 0 and length(trim("ticketId")) > 0 and length(trim("type")) > 0);

create policy "authenticated create ticket events"
  on public."TicketEvent"
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public."QueueTicket" t
      where t."id" = "ticketId"
        and (private.has_company_access(t."companyId") or t."customerPhone" = private.current_app_phone() or private.is_super_admin())
    )
  );

create policy "public read reservations"
  on public."FutureReservation"
  for select
  to anon, authenticated
  using ("id" is not null);

create policy "public create reservations"
  on public."FutureReservation"
  for insert
  to anon
  with check (length(trim("id")) > 0 and length(trim("branchId")) > 0 and length(trim("serviceId")) > 0 and length(trim("customerPhone")) > 0);

create policy "authenticated create reservations"
  on public."FutureReservation"
  for insert
  to authenticated
  with check (private.owns_customer("customerId") or private.has_company_access("companyId") or private.is_super_admin());

create policy "public update reservations"
  on public."FutureReservation"
  for update
  to anon
  using ("id" is not null and length(trim("customerPhone")) > 0)
  with check ("id" is not null and length(trim("customerPhone")) > 0);

create policy "authenticated update reservations"
  on public."FutureReservation"
  for update
  to authenticated
  using (private.owns_customer("customerId") or private.has_company_access("companyId") or private.is_super_admin())
  with check (private.owns_customer("customerId") or private.has_company_access("companyId") or private.is_super_admin());

create policy "public read reservation events"
  on public."ReservationEvent"
  for select
  to anon, authenticated
  using ("reservationId" is not null);

create policy "public create reservation events"
  on public."ReservationEvent"
  for insert
  to anon
  with check (length(trim("id")) > 0 and length(trim("reservationId")) > 0 and length(trim("type")) > 0);

create policy "authenticated create reservation events"
  on public."ReservationEvent"
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public."FutureReservation" r
      where r."id" = "reservationId"
        and (private.owns_customer(r."customerId") or private.has_company_access(r."companyId") or private.is_super_admin())
    )
  );

create policy "company members read notifications"
  on public."Notification"
  for select
  to authenticated
  using (
    private.is_super_admin()
    or "to" = private.current_app_phone()
    or exists (
      select 1 from public."QueueTicket" t
      where t."id" = "ticketId" and private.has_company_access(t."companyId")
    )
    or exists (
      select 1 from public."FutureReservation" r
      where r."id" = "reservationId" and private.has_company_access(r."companyId")
    )
  );

create policy "public create notifications"
  on public."Notification"
  for insert
  to anon
  with check (length(trim("id")) > 0 and length(trim("to")) > 0 and length(trim("message")) > 0);

create policy "authenticated create notifications"
  on public."Notification"
  for insert
  to authenticated
  with check (length(trim("id")) > 0 and length(trim("to")) > 0 and length(trim("message")) > 0);

create policy "public read runner destinations"
  on public."RunnerDestination"
  for select
  to anon, authenticated
  using ("id" is not null);

create policy "super admin write runner destinations"
  on public."RunnerDestination"
  for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

create policy "public create runner applications"
  on public."RunnerApplication"
  for insert
  to anon
  with check (length(trim("id")) > 0 and length(trim("name")) > 0 and length(trim("phone")) > 0);

create policy "admins read runner applications"
  on public."RunnerApplication"
  for select
  to authenticated
  using (private.is_super_admin());

create policy "admins update runner applications"
  on public."RunnerApplication"
  for update
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

create policy "runner users read jobs"
  on public."RunnerJob"
  for select
  to authenticated
  using (private.current_app_role() in ('RUNNER', 'SUPER_ADMIN'));

create policy "public create runner jobs"
  on public."RunnerJob"
  for insert
  to anon
  with check (length(trim("id")) > 0 and length(trim("customerPhone")) > 0 and length(trim("placeName")) > 0);

create policy "runner users update jobs"
  on public."RunnerJob"
  for update
  to authenticated
  using (private.current_app_role() in ('RUNNER', 'SUPER_ADMIN'))
  with check (private.current_app_role() in ('RUNNER', 'SUPER_ADMIN'));

create policy "public read runner requests"
  on public."RunnerRequest"
  for select
  to anon, authenticated
  using ("id" is not null);

create policy "public create runner requests"
  on public."RunnerRequest"
  for insert
  to anon
  with check (length(trim("id")) > 0 and length(trim("customerPhone")) > 0 and length(trim("destinationName")) > 0);

create policy "customers read own runner requests"
  on public."RunnerRequest"
  for select
  to authenticated
  using (private.owns_customer("customerId") or private.is_super_admin());

create policy "company members read billing invoices"
  on public."BillingInvoice"
  for select
  to authenticated
  using (private.has_company_access("companyId"));

create policy "company members create billing invoices"
  on public."BillingInvoice"
  for insert
  to authenticated
  with check (private.has_company_access("companyId"));

create policy "company members read sms purchases"
  on public."SmsCreditPurchase"
  for select
  to authenticated
  using (private.has_company_access("companyId"));

create policy "company members create sms purchases"
  on public."SmsCreditPurchase"
  for insert
  to authenticated
  with check (private.has_company_access("companyId"));

create policy "company members manage subscriptions"
  on public."Subscription"
  for all
  to authenticated
  using (private.has_company_access("companyId"))
  with check (private.has_company_access("companyId"));

create policy "users read scoped profiles"
  on public."User"
  for select
  to authenticated
  using (
    private.is_super_admin()
    or "supabaseUserId" = (select auth.uid()::text)
    or ("companyId" is not null and private.has_company_access("companyId"))
  );

create policy "users create own app profile"
  on public."User"
  for insert
  to authenticated
  with check (
    "supabaseUserId" = (select auth.uid()::text)
    and "role"::text in ('CUSTOMER', 'RUNNER', 'COMPANY_OWNER')
  );

create policy "users update own app profile"
  on public."User"
  for update
  to authenticated
  using ("supabaseUserId" = (select auth.uid()::text) or private.is_super_admin())
  with check ("supabaseUserId" = (select auth.uid()::text) or private.is_super_admin());

create policy "users delete own app profile"
  on public."User"
  for delete
  to authenticated
  using ("supabaseUserId" = (select auth.uid()::text) and "role"::text <> 'SUPER_ADMIN');

create policy "users read own legacy sessions"
  on public."Session"
  for select
  to authenticated
  using ("userId" = private.current_app_customer_id() or private.is_super_admin());

create policy "company members manage widgets"
  on public."WidgetInstall"
  for all
  to authenticated
  using (private.has_company_access("companyId"))
  with check (private.has_company_access("companyId"));

drop policy if exists "public read omukweyo assets" on storage.objects;
