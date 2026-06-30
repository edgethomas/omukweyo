do $$
declare
  app_table text;
  app_tables text[] := array[
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
begin
  foreach app_table in array app_tables loop
    execute format('revoke all on table public.%I from anon, authenticated', app_table);
    execute format('drop policy if exists "deny direct client access" on public.%I', app_table);
    execute format(
      'create policy "deny direct client access" on public.%I for all to anon, authenticated using (false) with check (false)',
      app_table
    );
  end loop;
end $$;
