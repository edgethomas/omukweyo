drop policy if exists "users read scoped profiles" on public."User";
drop policy if exists "users create own app profile" on public."User";
drop policy if exists "users update own app profile" on public."User";
drop policy if exists "users delete own app profile" on public."User";

create policy "users read scoped profiles"
  on public."User"
  for select
  to authenticated
  using (
    private.is_super_admin()
    or "supabaseUserId" = (select (auth.uid())::text)
    or ("companyId" is not null and private.has_company_access("companyId"))
  );

create policy "users create own app profile"
  on public."User"
  for insert
  to authenticated
  with check (
    "supabaseUserId" = (select (auth.uid())::text)
    and "role"::text in ('CUSTOMER', 'RUNNER', 'COMPANY_OWNER')
  );

create policy "users update own app profile"
  on public."User"
  for update
  to authenticated
  using ("supabaseUserId" = (select (auth.uid())::text) or private.is_super_admin())
  with check ("supabaseUserId" = (select (auth.uid())::text) or private.is_super_admin());

create policy "users delete own app profile"
  on public."User"
  for delete
  to authenticated
  using ("supabaseUserId" = (select (auth.uid())::text) and "role"::text <> 'SUPER_ADMIN');

drop policy if exists "company members write assets" on public."CompanyAsset";
create policy "company members create assets"
  on public."CompanyAsset"
  for insert
  to authenticated
  with check (private.has_company_access("companyId"));

create policy "company members update assets"
  on public."CompanyAsset"
  for update
  to authenticated
  using (private.has_company_access("companyId"))
  with check (private.has_company_access("companyId"));

create policy "company members delete assets"
  on public."CompanyAsset"
  for delete
  to authenticated
  using (private.has_company_access("companyId"));

drop policy if exists "super admin write runner destinations" on public."RunnerDestination";
create policy "super admin create runner destinations"
  on public."RunnerDestination"
  for insert
  to authenticated
  with check (private.is_super_admin());

create policy "super admin update runner destinations"
  on public."RunnerDestination"
  for update
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

create policy "super admin delete runner destinations"
  on public."RunnerDestination"
  for delete
  to authenticated
  using (private.is_super_admin());

drop policy if exists "public read runner requests" on public."RunnerRequest";
create policy "public read runner requests"
  on public."RunnerRequest"
  for select
  to anon
  using ("id" is not null);

drop policy if exists "company members write services" on public."Service";
create policy "company members create services"
  on public."Service"
  for insert
  to authenticated
  with check (private.has_company_access("companyId"));

create policy "company members update services"
  on public."Service"
  for update
  to authenticated
  using (private.has_company_access("companyId"))
  with check (private.has_company_access("companyId"));

create policy "company members delete services"
  on public."Service"
  for delete
  to authenticated
  using (private.has_company_access("companyId"));

drop policy if exists "company members write staff" on public."StaffMember";
create policy "company members create staff"
  on public."StaffMember"
  for insert
  to authenticated
  with check (private.has_company_access("companyId"));

create policy "company members update staff"
  on public."StaffMember"
  for update
  to authenticated
  using (private.has_company_access("companyId"))
  with check (private.has_company_access("companyId"));

create policy "company members delete staff"
  on public."StaffMember"
  for delete
  to authenticated
  using (private.has_company_access("companyId"));
