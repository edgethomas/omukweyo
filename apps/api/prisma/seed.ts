import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

async function main() {
  const passwordHash = await bcrypt.hash('demo123', 10);

  const company = await prisma.company.upsert({
    where: { slug: 'bank-windhoek' },
    update: {
      name: 'Bank Windhoek',
      industry: 'Banking & Financial Services',
      primaryColor: '#2563EB',
      secondaryColor: '#10B981',
      logoText: 'BW',
      tagline: 'Banking queues that respect your time.',
      websiteUrl: 'https://www.bankwindhoek.com.na',
      publicDescription: 'Join the live queue, reserve a future arrival window, or scan a branch QR code before visiting.',
      plan: 'BUSINESS',
      smsBalance: 1832,
      healthScore: 92,
    },
    create: {
      slug: 'bank-windhoek',
      name: 'Bank Windhoek',
      industry: 'Banking & Financial Services',
      primaryColor: '#2563EB',
      secondaryColor: '#10B981',
      logoText: 'BW',
      tagline: 'Banking queues that respect your time.',
      websiteUrl: 'https://www.bankwindhoek.com.na',
      publicDescription: 'Join the live queue, reserve a future arrival window, or scan a branch QR code before visiting.',
      plan: 'BUSINESS',
      smsBalance: 1832,
      healthScore: 92,
    },
  });

  const branchData = [
    ['katutura', 'Katutura', 'Independence Ave, Katutura', 'Windhoek', '+264 61 299 1200', '08:00 - 16:30', 11, 86],
    ['windhoek-west', 'Windhoek West', 'Mandume Ndemufayo Ave', 'Windhoek', '+264 61 299 1400', '08:00 - 16:30', 8, 74],
    ['klein-windhoek', 'Klein Windhoek', 'Nelson Mandela Ave', 'Windhoek', '+264 61 299 1600', '08:00 - 16:30', 6, 63],
    ['swakopmund', 'Swakopmund', 'Sam Nujoma Ave', 'Swakopmund', '+264 64 410 200', '08:00 - 16:00', 9, 58],
  ] as const;

  const branches = await Promise.all(branchData.map(([slug, name, address, city, phone, openingHours, avgWaitMin, servedToday]) =>
    prisma.branch.upsert({
      where: { companyId_slug: { companyId: company.id, slug } },
      update: { name, address, city, phone, openingHours, isOpen: true, avgWaitMin, servedToday },
      create: { companyId: company.id, slug, name, address, city, phone, openingHours, isOpen: true, avgWaitMin, servedToday },
    }),
  ));

  const [katutura] = branches;
  const serviceData = [
    ['personal-banking', 'Personal banking', 'Deposits, cards, account support, and branch service help.', 8, 'wallet'],
    ['loans', 'Loans and credit', 'Applications, statements, repayment support, and document checks.', 14, 'file'],
    ['business-banking', 'Business banking', 'SME support, merchant service, and business account help.', 12, 'building'],
  ] as const;

  const services = await Promise.all(serviceData.map(([slug, name, description, averageServiceMinutes, icon]) =>
    prisma.service.upsert({
      where: { companyId_slug: { companyId: company.id, slug } },
      update: { name, description, averageServiceMinutes, icon, branchId: katutura.id },
      create: { companyId: company.id, branchId: katutura.id, slug, name, description, averageServiceMinutes, icon },
    }),
  ));

  const staff = await Promise.all([
    prisma.staffMember.upsert({
      where: { id: 'st_owner' },
      update: { companyId: company.id, branchId: katutura.id, name: 'Selma Owner', role: 'OWNER', counter: 'Admin', servedToday: 0, rating: 4.9 },
      create: { id: 'st_owner', companyId: company.id, branchId: katutura.id, name: 'Selma Owner', role: 'OWNER', counter: 'Admin', servedToday: 0, rating: 4.9 },
    }),
    prisma.staffMember.upsert({
      where: { id: 'st_tendai' },
      update: { companyId: company.id, branchId: katutura.id, name: 'Tendai Staff', role: 'OPERATOR', counter: 'Counter 3', servedToday: 31, rating: 4.8 },
      create: { id: 'st_tendai', companyId: company.id, branchId: katutura.id, name: 'Tendai Staff', role: 'OPERATOR', counter: 'Counter 3', servedToday: 31, rating: 4.8 },
    }),
  ]);

  const existingCustomer =
    (await prisma.customer.findUnique({ where: { id: 'cust_martha_demo' } })) ??
    (await prisma.customer.findUnique({ where: { phone: '+264 81 555 0101' } }));
  const customer = existingCustomer
    ? await prisma.customer.update({
      where: { id: existingCustomer.id },
      data: { name: 'Martha Customer', phone: '+264 81 555 0101', email: 'customer@omukweyo.demo' },
    })
    : await prisma.customer.create({
      data: { id: 'cust_martha_demo', name: 'Martha Customer', phone: '+264 81 555 0101', email: 'customer@omukweyo.demo' },
    });

  await Promise.all([
    seedUser('usr_customer_demo', 'CUSTOMER', 'Martha Customer', 'customer@omukweyo.demo', '/customer', { phone: customer.phone, customerId: customer.id }),
    seedUser('usr_owner_demo', 'COMPANY_OWNER', 'Selma Owner', 'owner@omukweyo.demo', '/dashboard', { companyId: company.id, staffId: staff[0].id }),
    seedUser('usr_staff_demo', 'STAFF', 'Tendai Staff', 'staff@omukweyo.demo', '/staff', { companyId: company.id, staffId: staff[1].id }),
    seedUser('usr_runner_demo', 'RUNNER', 'Jonas Runner', 'runner@omukweyo.demo', '/runner/work'),
    seedUser('usr_admin_demo', 'SUPER_ADMIN', 'Aina Admin', 'admin@omukweyo.demo', '/admin'),
  ]);

  async function seedUser(
    id: string,
    role: Role,
    name: string,
    email: string,
    destination: string,
    extra: { phone?: string; companyId?: string; customerId?: string; staffId?: string } = {},
  ) {
    return prisma.user.upsert({
      where: { id },
      update: { role, name, email, destination, passwordHash, emailVerified: false, ...extra },
      create: { id, role, name, email, destination, passwordHash, emailVerified: false, ...extra },
    });
  }

  await prisma.subscription.upsert({
    where: { companyId: company.id },
    update: { plan: 'BUSINESS', status: 'ACTIVE', paymentMethod: 'MOCK_INVOICE' },
    create: { companyId: company.id, plan: 'BUSINESS', status: 'ACTIVE', paymentMethod: 'MOCK_INVOICE' },
  });

  await prisma.billingInvoice.upsert({
    where: { id: 'inv_seed_business' },
    update: { companyId: company.id, type: 'SUBSCRIPTION', description: 'Business plan monthly subscription', amountCents: 99900, status: 'PAID', paymentMethod: 'MOCK_INVOICE' },
    create: { id: 'inv_seed_business', companyId: company.id, type: 'SUBSCRIPTION', description: 'Business plan monthly subscription', amountCents: 99900, status: 'PAID', paymentMethod: 'MOCK_INVOICE' },
  });

  const targetArrivalAt = addMinutes(new Date(), 26 * 60);
  const reservation = await prisma.futureReservation.upsert({
    where: { id: 'res_martha_demo' },
    update: {
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      companyId: company.id,
      companySlug: company.slug,
      branchId: katutura.id,
      branchSlug: katutura.slug,
      branchName: katutura.name,
      serviceId: services[0].id,
      serviceName: services[0].name,
      targetArrivalAt,
      smartJoinAt: addMinutes(targetArrivalAt, -25),
      arrivalWindowMinutes: 30,
      status: 'SCHEDULED',
      paymentStatus: 'PAID',
      paymentMethod: 'MOCK_CARD',
      feeCents: 3500,
      paidAt: new Date(),
    },
    create: {
      id: 'res_martha_demo',
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      companyId: company.id,
      companySlug: company.slug,
      branchId: katutura.id,
      branchSlug: katutura.slug,
      branchName: katutura.name,
      serviceId: services[0].id,
      serviceName: services[0].name,
      targetArrivalAt,
      smartJoinAt: addMinutes(targetArrivalAt, -25),
      arrivalWindowMinutes: 30,
      status: 'SCHEDULED',
      paymentStatus: 'PAID',
      paymentMethod: 'MOCK_CARD',
      feeCents: 3500,
      paidAt: new Date(),
    },
  });

  const ticketSeeds = [
    ['A-024', 'Maria N.', '+264 81 400 2201', 'CALLED', 1, 0, 2, 'Counter 3'],
    ['A-025', 'Martha Customer', customer.phone, 'WAITING', 2, 1, 8, null],
    ['A-026', 'Joseph T.', '+264 81 400 2203', 'WAITING', 3, 2, 16, null],
  ] as const;

  for (const [ticketNumber, customerName, customerPhone, status, position, peopleAhead, estimatedWaitMinutes, counter] of ticketSeeds) {
    const ticket = await prisma.queueTicket.upsert({
      where: { ticketNumber },
      update: {
        companyId: company.id,
        companySlug: company.slug,
        branchId: katutura.id,
        branchSlug: katutura.slug,
        serviceId: services[0].id,
        serviceName: services[0].name,
        customerName,
        customerPhone,
        status,
        position,
        peopleAhead,
        estimatedWaitMinutes,
        counter: counter ?? undefined,
        reservationId: customerPhone === customer.phone ? reservation.id : undefined,
      },
      create: {
        ticketNumber,
        companyId: company.id,
        companySlug: company.slug,
        branchId: katutura.id,
        branchSlug: katutura.slug,
        serviceId: services[0].id,
        serviceName: services[0].name,
        customerName,
        customerPhone,
        status,
        source: customerPhone === customer.phone ? 'APPOINTMENT' : 'PUBLIC_PAGE',
        position,
        peopleAhead,
        estimatedWaitMinutes,
        counter: counter ?? undefined,
        reservationId: customerPhone === customer.phone ? reservation.id : undefined,
      },
    });

    await prisma.ticketEvent.upsert({
      where: { id: `evt_${ticket.ticketNumber}_created` },
      update: { ticketId: ticket.id, type: 'CREATED', label: 'Ticket created' },
      create: { id: `evt_${ticket.ticketNumber}_created`, ticketId: ticket.id, type: 'CREATED', label: 'Ticket created' },
    });
  }

  await prisma.notification.upsert({
    where: { id: 'notif_martha_reservation' },
    update: {
      to: customer.phone,
      template: 'RESERVATION_CREATED',
      status: 'SENT',
      message: 'Hi Martha, your Personal banking reservation at Bank Windhoek Katutura is paid. We will book your live spot before your arrival window.',
      reservationId: reservation.id,
    },
    create: {
      id: 'notif_martha_reservation',
      to: customer.phone,
      template: 'RESERVATION_CREATED',
      status: 'SENT',
      message: 'Hi Martha, your Personal banking reservation at Bank Windhoek Katutura is paid. We will book your live spot before your arrival window.',
      reservationId: reservation.id,
    },
  });

  await Promise.all([
    prisma.runnerJob.upsert({
      where: { id: 'rj_home_affairs_1' },
      update: {
        customerName: 'Maria Future',
        customerPhone: '+264 81 555 8899',
        placeName: 'Home Affairs Windhoek',
        city: 'Windhoek',
        serviceName: 'Document pickup',
        targetArrivalAt: addMinutes(new Date(), 180),
        expectedWaitMinutes: 55,
        payoutCents: 12000,
        status: 'OPEN',
        instructions: 'Check in at the public entrance, send updates every 20 minutes, and hand off only to the verified customer.',
      },
      create: {
        id: 'rj_home_affairs_1',
        customerName: 'Maria Future',
        customerPhone: '+264 81 555 8899',
        placeName: 'Home Affairs Windhoek',
        city: 'Windhoek',
        serviceName: 'Document pickup',
        targetArrivalAt: addMinutes(new Date(), 180),
        expectedWaitMinutes: 55,
        payoutCents: 12000,
        status: 'OPEN',
        instructions: 'Check in at the public entrance, send updates every 20 minutes, and hand off only to the verified customer.',
      },
    }),
    prisma.widgetInstall.upsert({
      where: { id: 'wi_bank_demo' },
      update: { companyId: company.id, domain: 'bankwindhoek.com.na', theme: { mode: 'light' } },
      create: { id: 'wi_bank_demo', companyId: company.id, domain: 'bankwindhoek.com.na', theme: { mode: 'light' } },
    }),
  ]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
