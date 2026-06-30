alter table public.profiles
  drop constraint if exists profiles_auth_user_id_fkey;

revoke all on function public.rls_auto_enable() from public, anon, authenticated;
