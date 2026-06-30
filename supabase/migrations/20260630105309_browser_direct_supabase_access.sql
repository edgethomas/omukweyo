drop trigger if exists on_auth_user_created on auth.users;

do $$
declare
  app_table text;
  all_app_tables text[] := array[
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
  ];
  public_read_tables text[] := array[
    'Branch',
    'Company',
    'QueueTicket',
    'RunnerDestination',
    'Service',
    'TicketEvent'
  ];
  public_insert_tables text[] := array[
    'Customer',
    'FutureReservation',
    'Notification',
    'QueueTicket',
    'ReservationEvent',
    'RunnerApplication',
    'RunnerJob',
    'RunnerRequest',
    'TicketEvent'
  ];
begin
  foreach app_table in array all_app_tables loop
    execute format('drop policy if exists "deny direct client access" on public.%I', app_table);
    execute format('drop policy if exists "authenticated app access" on public.%I', app_table);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', app_table);
    execute format(
      'create policy "authenticated app access" on public.%I for all to authenticated using (true) with check (true)',
      app_table
    );
  end loop;

  foreach app_table in array public_read_tables loop
    execute format('drop policy if exists "public read app data" on public.%I', app_table);
    execute format('grant select on table public.%I to anon', app_table);
    execute format(
      'create policy "public read app data" on public.%I for select to anon using (true)',
      app_table
    );
  end loop;

  foreach app_table in array public_insert_tables loop
    execute format('drop policy if exists "public create app data" on public.%I', app_table);
    execute format('grant insert on table public.%I to anon', app_table);
    execute format(
      'create policy "public create app data" on public.%I for insert to anon with check (true)',
      app_table
    );
  end loop;
end $$;

drop policy if exists "authenticated upload omukweyo assets" on storage.objects;
create policy "authenticated upload omukweyo assets"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'omukweyo-assets');

drop policy if exists "authenticated update omukweyo assets" on storage.objects;
create policy "authenticated update omukweyo assets"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'omukweyo-assets')
  with check (bucket_id = 'omukweyo-assets');

drop policy if exists "public read omukweyo assets" on storage.objects;
create policy "public read omukweyo assets"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'omukweyo-assets');
