import {
  createReservation,
  createTicket,
  getCompanyBundle,
  getDashboard,
  getWidgetConfig,
  listBusinessDirectory,
  loginDemoUser,
  logoutDemoUser,
  prisma,
  upsertCustomer,
} from '../src/store.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  assert(process.env.DATABASE_URL, 'DATABASE_URL is missing. Copy .env.example to .env or apps/api/.env and set MySQL credentials.');

  const session = await loginDemoUser('owner@omukweyo.demo', 'demo123');
  assert(session.user.companySlug, 'Seeded owner demo must be attached to a company');

  const businesses = await listBusinessDirectory('queue');
  assert(businesses.length > 0, 'Business directory should return seeded or created companies');

  const bundle = await getCompanyBundle(session.user.companySlug);
  assert(bundle, 'Owner company bundle should load by slug');
  assert(bundle.branches.length > 0, 'Company must have at least one branch');
  assert(bundle.services.length > 0, 'Company must have at least one service');

  const branch = bundle.branches[0];
  const service = bundle.services[0];
  const stamp = Date.now();
  const customer = await upsertCustomer({
    name: `Smoke Customer ${stamp}`,
    phone: `+264 81 ${String(stamp).slice(-6)}`,
    email: `smoke-${stamp}@inline.test`,
  });

  const ticket = await createTicket({
    branchId: branch.id,
    serviceId: service.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    source: 'PUBLIC_PAGE',
  });
  assert(ticket.companySlug === bundle.company.slug, 'Created ticket should belong to the selected company');

  const reservation = await createReservation({
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerEmail: customer.email,
    branchId: branch.id,
    serviceId: service.id,
    targetArrivalAt: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
    arrivalWindowMinutes: 30,
    paymentMethod: 'MOCK_CARD',
  });
  assert(reservation.status === 'SCHEDULED', 'Reservation should persist in scheduled state');

  const dashboard = await getDashboard(bundle.company.slug);
  assert(dashboard.metrics.liveWaiting >= 1, 'Dashboard should reflect live queue state');

  const widget = await getWidgetConfig(bundle.company.slug, 'http://localhost:5173');
  assert(widget.loader.includes(`data-omukweyo-queue="${bundle.company.slug}"`), 'Widget loader should use the company slug');

  await logoutDemoUser(session.token);
  await prisma.$disconnect();

  console.log(JSON.stringify({
    ok: true,
    company: bundle.company.slug,
    ticket: ticket.ticketNumber,
    reservation: reservation.id,
    widget: widget.publicUrl,
  }, null, 2));
}

main().catch(async (error) => {
  await prisma.$disconnect().catch(() => {});
  console.error(error?.message ?? error);
  process.exit(1);
});
