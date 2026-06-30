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
begin
  foreach app_table in array all_app_tables loop
    execute format('grant select, insert, update, delete on table public.%I to service_role', app_table);
  end loop;
end $$;
