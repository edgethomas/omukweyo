create or replace function private.current_auth_uid()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select (select auth.uid())::text
$$;

grant execute on function private.current_auth_uid() to authenticated;

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
    or "supabaseUserId" = private.current_auth_uid()
    or ("companyId" is not null and private.has_company_access("companyId"))
  );

create policy "users create own app profile"
  on public."User"
  for insert
  to authenticated
  with check (
    "supabaseUserId" = private.current_auth_uid()
    and "role"::text in ('CUSTOMER', 'RUNNER', 'COMPANY_OWNER')
  );

create policy "users update own app profile"
  on public."User"
  for update
  to authenticated
  using ("supabaseUserId" = private.current_auth_uid() or private.is_super_admin())
  with check ("supabaseUserId" = private.current_auth_uid() or private.is_super_admin());

create policy "users delete own app profile"
  on public."User"
  for delete
  to authenticated
  using ("supabaseUserId" = private.current_auth_uid() and "role"::text <> 'SUPER_ADMIN');
