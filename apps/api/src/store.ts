import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type {
  BillingInvoice,
  BillingOverview,
  BillingPaymentMethod,
  Branch,
  BusinessDirectoryItem,
  BusinessOnboarding,
  Company,
  CustomerAccount,
  CustomerVisitSummary,
  DashboardMetrics,
  DemoSession,
  DemoUser,
  FutureReservation,
  Notification,
  PlatformOverview,
  QueueTicket,
  ReservationEvent,
  Role,
  RunnerApplication,
  RunnerJob,
  ServerEvent,
  Service,
  SmsCreditPackage,
  SmsCreditPurchase,
  StaffMember,
  SubscriptionRecord,
  TicketEvent,
} from '@inline/shared';
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  for (const rawLine of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^"|"$/g, '');
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env'));
loadEnvFile(path.resolve(process.cwd(), 'apps/api/.env'));

export const prisma = new PrismaClient();

export const smsPackages: SmsCreditPackage[] = [
  { id: 'STARTER', name: 'Starter SMS pack', credits: 500, bonusCredits: 0, priceCents: 14900 },
  { id: 'GROWTH', name: 'Growth SMS pack', credits: 1800, bonusCredits: 250, priceCents: 39900 },
  { id: 'SCALE', name: 'Scale SMS pack', credits: 5500, bonusCredits: 1000, priceCents: 99900 },
];

const planPricesCents: Record<Company['plan'], number> = {
  FREE: 0,
  STARTER: 39900,
  BUSINESS: 99900,
  ENTERPRISE: 249900,
};

function nowIso() {
  return new Date().toISOString();
}

function toIso(value: Date | string | null | undefined) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || `company-${nanoid(6).toLowerCase()}`;
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

async function uniqueCompanySlug(name: string) {
  const base = slugify(name);
  let candidate = base;
  let index = 2;
  while (await prisma.company.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  return candidate;
}

function mapCompany(input: any): Company {
  return {
    id: input.id,
    slug: input.slug,
    name: input.name,
    industry: input.industry,
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    logoText: input.logoText,
    logoUrl: input.logoUrl ?? undefined,
    heroImageUrl: input.heroImageUrl ?? undefined,
    tagline: input.tagline ?? undefined,
    websiteUrl: input.websiteUrl ?? undefined,
    publicDescription: input.publicDescription ?? undefined,
    plan: input.plan,
    smsBalance: input.smsBalance,
    healthScore: input.healthScore,
    createdAt: toIso(input.createdAt)!,
  };
}

function mapBranch(input: any): Branch {
  return {
    id: input.id,
    companyId: input.companyId,
    slug: input.slug,
    name: input.name,
    address: input.address,
    city: input.city,
    phone: input.phone,
    openingHours: input.openingHours,
    isOpen: input.isOpen,
    liveWaiting: input.liveWaiting,
    avgWaitMin: input.avgWaitMin,
    servedToday: input.servedToday,
  };
}

function mapService(input: any): Service {
  return {
    id: input.id,
    companyId: input.companyId,
    branchId: input.branchId ?? undefined,
    name: input.name,
    slug: input.slug,
    description: input.description,
    averageServiceMinutes: input.averageServiceMinutes,
    icon: input.icon,
  };
}

function mapStaff(input: any): StaffMember {
  return {
    id: input.id,
    name: input.name,
    initials: initials(input.name),
    role: input.role as StaffMember['role'],
    counter: input.counter ?? 'Counter',
    servedToday: input.servedToday,
    avgServiceMin: 8,
    rating: input.rating,
  };
}

function mapTicketEvent(input: any): TicketEvent {
  const typeMap: Record<string, TicketEvent['type']> = {
    CREATED: 'JOINED',
    WAITING: 'JOINED',
    ON_HOLD: 'HOLD',
    MANUAL_SMS: 'SMS',
  };
  return {
    id: input.id,
    at: toIso(input.at)!,
    type: typeMap[input.type] ?? input.type,
    message: input.label,
  };
}

function mapTicket(input: any): QueueTicket {
  return {
    id: input.id,
    ticketNumber: input.ticketNumber,
    companyId: input.companyId,
    companySlug: input.companySlug,
    branchId: input.branchId,
    branchSlug: input.branchSlug,
    serviceId: input.serviceId,
    serviceName: input.serviceName,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    status: input.status,
    source: input.source,
    reservationId: input.reservationId ?? undefined,
    targetArrivalAt: toIso(input.targetArrivalAt),
    position: input.position,
    peopleAhead: input.peopleAhead,
    estimatedWaitMinutes: input.estimatedWaitMinutes,
    counter: input.counter ?? undefined,
    joinedAt: toIso(input.joinedAt)!,
    calledAt: toIso(input.calledAt),
    servingAt: toIso(input.servingAt),
    servedAt: toIso(input.servedAt),
    events: (input.events ?? []).map(mapTicketEvent),
  };
}

function mapCustomer(input: any): CustomerAccount {
  return {
    id: input.id,
    name: input.name,
    phone: input.phone,
    email: input.email ?? undefined,
    avatarUrl: input.avatarUrl ?? undefined,
    createdAt: toIso(input.createdAt)!,
  };
}

function mapReservationEvent(input: any): ReservationEvent {
  return {
    id: input.id,
    at: toIso(input.at)!,
    type: input.type,
    message: input.label,
  };
}

function mapReservation(input: any): FutureReservation {
  return {
    id: input.id,
    customerId: input.customerId ?? '',
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail ?? undefined,
    companyId: input.companyId,
    companySlug: input.companySlug,
    branchId: input.branchId,
    branchSlug: input.branchSlug,
    branchName: input.branchName,
    serviceId: input.serviceId,
    serviceName: input.serviceName,
    targetArrivalAt: toIso(input.targetArrivalAt)!,
    smartJoinAt: toIso(input.smartJoinAt)!,
    arrivalWindowMinutes: input.arrivalWindowMinutes,
    status: input.status,
    paymentStatus: input.paymentStatus,
    feeCents: input.feeCents,
    currency: 'NAD',
    ticketId: input.ticketId ?? undefined,
    createdAt: toIso(input.createdAt)!,
    paidAt: toIso(input.paidAt),
    bookedAt: toIso(input.bookedAt),
    events: (input.events ?? []).map(mapReservationEvent),
  };
}

function mapNotification(input: any): Notification {
  return {
    id: input.id,
    to: input.to,
    template: input.template as Notification['template'],
    status: input.status as Notification['status'],
    message: input.message,
    ticketId: input.ticketId ?? undefined,
    reservationId: input.reservationId ?? undefined,
    at: toIso(input.at)!,
  };
}

function mapRunnerApplication(input: any): RunnerApplication {
  return {
    id: input.id,
    name: input.name,
    phone: input.phone,
    city: input.city,
    transportMode: input.transportMode,
    payoutMethod: input.payoutMethod,
    canStartAt: input.canStartAt,
    notes: input.notes ?? undefined,
    status: input.status,
    createdAt: toIso(input.createdAt)!,
  };
}

function mapRunnerJob(input: any): RunnerJob {
  return {
    id: input.id,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    placeName: input.placeName,
    city: input.city,
    serviceName: input.serviceName,
    targetArrivalAt: toIso(input.targetArrivalAt)!,
    expectedWaitMinutes: input.expectedWaitMinutes,
    payoutCents: input.payoutCents,
    currency: 'NAD',
    status: input.status,
    instructions: input.instructions,
  };
}

function mapInvoice(input: any): BillingInvoice {
  return {
    id: input.id,
    companyId: input.companyId,
    type: input.type,
    description: input.description,
    amountCents: input.amountCents,
    currency: 'NAD',
    status: input.status,
    paymentMethod: input.paymentMethod,
    createdAt: toIso(input.createdAt)!,
  };
}

function mapSmsPurchase(input: any): SmsCreditPurchase {
  return {
    id: input.id,
    companyId: input.companyId,
    packageId: input.packageId,
    credits: input.credits,
    amountCents: input.amountCents,
    paymentMethod: input.paymentMethod,
    invoiceId: input.invoiceId ?? '',
    createdAt: toIso(input.createdAt)!,
  };
}

function mapSubscription(input: any): SubscriptionRecord {
  const plan = input.plan as Company['plan'];
  const renewsAt = input.currentPeriodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60_000);
  return {
    id: input.id,
    companyId: input.companyId,
    plan,
    status: input.status,
    paymentMethod: input.paymentMethod,
    amountCents: planPricesCents[plan],
    currency: 'NAD',
    renewsAt: toIso(renewsAt)!,
    updatedAt: toIso(input.updatedAt)!,
  };
}

function demoUserFromDb(input: any): DemoUser {
  return {
    id: input.id,
    role: input.role,
    name: input.name,
    email: input.email,
    phone: input.phone ?? undefined,
    destination: input.destination,
    emailVerified: input.emailVerified,
    customerId: input.customerId ?? undefined,
    companyId: input.companyId ?? undefined,
    companySlug: input.company?.slug ?? undefined,
    staffId: input.staffId ?? undefined,
  };
}

export async function loginDemoUser(email: string, password: string): Promise<DemoSession> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, include: { company: { select: { slug: true } } } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new Error('Invalid email or password');
  }

  const issuedAt = new Date();
  const expiresAt = new Date(Date.now() + 12 * 60 * 60_000);
  const token = `sess_${nanoid(32)}`;
  await prisma.session.create({
    data: { token, userId: user.id, issuedAt, expiresAt },
  });

  return {
    token,
    user: demoUserFromDb(user),
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    verificationNote: 'Database-backed local session. Email and SMS verification are still simulated for presentation mode.',
  };
}

export async function getDemoUserByToken(token: string): Promise<DemoUser | undefined> {
  const session = await prisma.session.findUnique({ where: { token }, include: { user: { include: { company: { select: { slug: true } } } } } });
  if (!session || session.expiresAt.getTime() <= Date.now()) {
    if (session) await prisma.session.delete({ where: { token } });
    return undefined;
  }
  return demoUserFromDb(session.user);
}

export async function logoutDemoUser(token: string): Promise<boolean> {
  const deleted = await prisma.session.deleteMany({ where: { token } });
  return deleted.count > 0;
}

export async function getCompanyBundle(slug: string) {
  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      branches: { orderBy: { createdAt: 'asc' } },
      services: { orderBy: { createdAt: 'asc' } },
      staff: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!company) return null;
  return {
    company: mapCompany(company),
    branches: company.branches.map(mapBranch),
    services: company.services.map(mapService),
    staff: company.staff.map(mapStaff),
  };
}

async function defaultCompanySlug() {
  const company = await prisma.company.findFirst({ orderBy: { createdAt: 'asc' }, select: { slug: true } });
  if (!company) throw new Error('No company exists. Run npm --workspace apps/api run db:seed after configuring DATABASE_URL.');
  return company.slug;
}

async function defaultCompanyBundle() {
  const bundle = await getCompanyBundle(await defaultCompanySlug());
  if (!bundle) throw new Error('Company not found');
  return bundle;
}

export async function listLiveTickets(branchId?: string): Promise<QueueTicket[]> {
  const rows = await prisma.queueTicket.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      status: { in: ['WAITING', 'CALLED', 'SERVING', 'ON_HOLD'] },
    },
    include: { events: { orderBy: { at: 'asc' } } },
    orderBy: [{ branchId: 'asc' }, { position: 'asc' }, { joinedAt: 'asc' }],
  });
  return rows.map(mapTicket);
}

async function recalcPositions(branchId: string) {
  const tickets = await prisma.queueTicket.findMany({
    where: { branchId, status: { in: ['WAITING', 'CALLED', 'SERVING', 'ON_HOLD'] } },
    orderBy: { joinedAt: 'asc' },
  });
  for (let index = 0; index < tickets.length; index += 1) {
    const position = index + 1;
    const peopleAhead = index;
    await prisma.queueTicket.update({
      where: { id: tickets[index].id },
      data: { position, peopleAhead, estimatedWaitMinutes: Math.max(0, peopleAhead * 8) },
    });
  }
  await prisma.branch.update({
    where: { id: branchId },
    data: { liveWaiting: tickets.filter((ticket) => ticket.status === 'WAITING').length },
  });
}

async function makeTicketNumber(branchId: string) {
  const count = await prisma.queueTicket.count({ where: { branchId } });
  return `A-${String(count + 24).padStart(3, '0')}`;
}

export async function createTicket(input: {
  branchId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  source?: QueueTicket['source'];
  reservationId?: string;
}): Promise<QueueTicket> {
  const branch = await prisma.branch.findUnique({ where: { id: input.branchId }, include: { company: true } });
  const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
  if (!branch || !service) throw new Error('Branch or service not found');

  const position = await prisma.queueTicket.count({
    where: { branchId: branch.id, status: { in: ['WAITING', 'CALLED', 'SERVING', 'ON_HOLD'] } },
  }) + 1;

  const ticket = await prisma.queueTicket.create({
    data: {
      ticketNumber: await makeTicketNumber(branch.id),
      companyId: branch.companyId,
      companySlug: branch.company.slug,
      branchId: branch.id,
      branchSlug: branch.slug,
      serviceId: service.id,
      serviceName: service.name,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      source: input.source ?? 'PUBLIC_PAGE',
      reservationId: input.reservationId,
      position,
      peopleAhead: position - 1,
      estimatedWaitMinutes: Math.max(0, (position - 1) * service.averageServiceMinutes),
      events: { create: { type: 'CREATED', label: 'Ticket created' } },
    },
    include: { events: { orderBy: { at: 'asc' } } },
  });

  await recalcPositions(branch.id);
  const fresh = await getTicket(ticket.id);
  return fresh!;
}

export async function updateTicketStatus(id: string, status: QueueTicket['status'], counter?: string): Promise<QueueTicket> {
  const timestamp: Record<string, Date> = {};
  if (status === 'CALLED') timestamp.calledAt = new Date();
  if (status === 'SERVING') timestamp.servingAt = new Date();
  if (status === 'SERVED') timestamp.servedAt = new Date();

  const ticket = await prisma.queueTicket.update({
    where: { id },
    data: {
      status,
      counter,
      ...timestamp,
      events: { create: { type: status, label: `Ticket ${status.toLowerCase().replace(/_/g, ' ')}` } },
    },
    include: { events: { orderBy: { at: 'asc' } } },
  });
  await recalcPositions(ticket.branchId);
  const fresh = await getTicket(id);
  return fresh!;
}

export async function getTicket(id: string): Promise<QueueTicket | undefined> {
  const ticket = await prisma.queueTicket.findUnique({ where: { id }, include: { events: { orderBy: { at: 'asc' } } } });
  return ticket ? mapTicket(ticket) : undefined;
}

export async function callNext(branchId: string, counter?: string): Promise<QueueTicket | undefined> {
  const next = await prisma.queueTicket.findFirst({
    where: { branchId, status: 'WAITING' },
    orderBy: [{ position: 'asc' }, { joinedAt: 'asc' }],
  });
  return next ? updateTicketStatus(next.id, 'CALLED', counter ?? 'Counter 3') : undefined;
}

export async function transferTicket(id: string, toServiceId: string, actor = 'Staff'): Promise<QueueTicket> {
  const service = await prisma.service.findUnique({ where: { id: toServiceId } });
  if (!service) throw new Error('Target service not found');
  const ticket = await prisma.queueTicket.update({
    where: { id },
    data: {
      serviceId: service.id,
      serviceName: service.name,
      status: 'WAITING',
      events: { create: { type: 'TRANSFER', label: `${actor} transferred ticket to ${service.name}` } },
    },
    include: { events: { orderBy: { at: 'asc' } } },
  });
  await recalcPositions(ticket.branchId);
  return mapTicket(ticket);
}

export async function logSms(to: string, template: Notification['template'], message: string, ticketId?: string, reservationId?: string): Promise<Notification> {
  const ticket = ticketId ? await prisma.queueTicket.findUnique({ where: { id: ticketId }, select: { companyId: true } }) : null;
  const reservation = reservationId ? await prisma.futureReservation.findUnique({ where: { id: reservationId }, select: { companyId: true } }) : null;
  const companyId = ticket?.companyId ?? reservation?.companyId;

  let status = 'SENT';
  let finalMessage = message;
  if (companyId) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (company && company.smsBalance > 0) {
      await prisma.company.update({ where: { id: company.id }, data: { smsBalance: { decrement: 1 } } });
    } else {
      status = 'FAILED';
      finalMessage = `SMS wallet is empty. Original: ${message}`;
    }
  }

  return mapNotification(await prisma.notification.create({
    data: { to, template, status, message: finalMessage, ticketId, reservationId },
  }));
}

export async function sendTicketSms(ticketId: string, message: string): Promise<Notification> {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  await prisma.ticketEvent.create({
    data: { ticketId, type: 'MANUAL_SMS', label: 'Manual SMS update sent by staff' },
  });
  return logSms(ticket.customerPhone, 'MANUAL_UPDATE', message, ticketId);
}

export async function upsertCustomer(input: { name: string; phone: string; email?: string; avatarUrl?: string }): Promise<CustomerAccount> {
  const existing = await prisma.customer.findFirst({
    where: { OR: [{ phone: input.phone }, ...(input.email ? [{ email: input.email }] : [])] },
  });
  const customer = existing
    ? await prisma.customer.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email || existing.email,
        avatarUrl: input.avatarUrl || existing.avatarUrl,
      },
    })
    : await prisma.customer.create({ data: { name: input.name, phone: input.phone, email: input.email || undefined, avatarUrl: input.avatarUrl || undefined } });
  return mapCustomer(customer);
}

export async function updateCustomerAvatar(customerId: string, avatarUrl: string): Promise<CustomerAccount> {
  const customer = await prisma.customer.update({ where: { id: customerId }, data: { avatarUrl } });
  await prisma.user.updateMany({
    where: { customerId },
    data: {
      name: customer.name,
      phone: customer.phone,
      ...(customer.email ? { email: customer.email } : {}),
    },
  });
  return mapCustomer(customer);
}

export async function deleteCustomerAccount(customerId: string): Promise<CustomerAccount> {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error('Customer not found');
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { user: { customerId } } }),
    prisma.user.deleteMany({ where: { customerId } }),
    prisma.customer.delete({ where: { id: customerId } }),
  ]);
  return mapCustomer(customer);
}

export async function createReservation(input: {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  branchId: string;
  serviceId: string;
  targetArrivalAt: string;
  arrivalWindowMinutes: number;
  paymentMethod?: BillingPaymentMethod | 'MOCK_WALLET';
}): Promise<FutureReservation> {
  const target = new Date(input.targetArrivalAt);
  if (Number.isNaN(target.getTime())) throw new Error('Invalid arrival time');
  if (target.getTime() <= Date.now() + 30 * 60_000) throw new Error('Choose a time at least 30 minutes from now');

  const branch = await prisma.branch.findUnique({ where: { id: input.branchId }, include: { company: true } });
  const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
  if (!branch || !service) throw new Error('Branch or service not found');

  const customer = input.customerId
    ? await prisma.customer.findUnique({ where: { id: input.customerId } })
    : null;
  const account = customer
    ? mapCustomer(customer)
    : await upsertCustomer({ name: input.customerName, phone: input.customerPhone, email: input.customerEmail });
  const smartJoinAt = new Date(target.getTime() - Math.max(10, input.arrivalWindowMinutes - 5) * 60_000);

  const reservation = await prisma.futureReservation.create({
    data: {
      customerId: account.id,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail || undefined,
      companyId: branch.companyId,
      companySlug: branch.company.slug,
      branchId: branch.id,
      branchSlug: branch.slug,
      branchName: branch.name,
      serviceId: service.id,
      serviceName: service.name,
      targetArrivalAt: target,
      smartJoinAt,
      arrivalWindowMinutes: input.arrivalWindowMinutes,
      paymentStatus: 'PAID',
      paymentMethod: (input.paymentMethod ?? 'MOCK_CARD') as any,
      paidAt: new Date(),
      events: { create: { type: 'CREATED', label: 'Reservation created and paid' } },
    },
    include: { events: { orderBy: { at: 'asc' } } },
  });
  return mapReservation(reservation);
}

export async function getReservation(id: string): Promise<FutureReservation | undefined> {
  const reservation = await prisma.futureReservation.findUnique({ where: { id }, include: { events: { orderBy: { at: 'asc' } } } });
  return reservation ? mapReservation(reservation) : undefined;
}

export async function listCustomerReservations(customerId: string): Promise<FutureReservation[]> {
  const reservations = await prisma.futureReservation.findMany({
    where: { customerId },
    include: { events: { orderBy: { at: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  return reservations.map(mapReservation);
}

export async function getCustomerVisit(customerId: string): Promise<CustomerVisitSummary> {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error('Customer not found');
  const reservations = await listCustomerReservations(customer.id);
  const currentTicket = await prisma.queueTicket.findFirst({
    where: { customerPhone: customer.phone, status: { in: ['WAITING', 'CALLED', 'SERVING', 'ON_HOLD'] } },
    include: { events: { orderBy: { at: 'asc' } } },
    orderBy: { joinedAt: 'desc' },
  });
  const notificationRows = await prisma.notification.findMany({
    where: {
      OR: [
        { to: customer.phone },
        ...(currentTicket ? [{ ticketId: currentTicket.id }] : []),
        ...reservations.map((reservation) => ({ reservationId: reservation.id })),
      ],
    },
    orderBy: { at: 'desc' },
    take: 10,
  });
  return {
    customer: mapCustomer(customer),
    reservations,
    currentTicket: currentTicket ? mapTicket(currentTicket) : undefined,
    notifications: notificationRows.map(mapNotification),
  };
}

export async function bookReservationNow(id: string): Promise<{ reservation: FutureReservation; ticket: QueueTicket }> {
  const reservation = await prisma.futureReservation.findUnique({ where: { id } });
  if (!reservation) throw new Error('Reservation not found');
  if (reservation.status === 'BOOKED' && reservation.ticketId) {
    const ticket = await getTicket(reservation.ticketId);
    if (ticket) return { reservation: mapReservation(reservation), ticket };
  }
  const ticket = await createTicket({
    branchId: reservation.branchId,
    serviceId: reservation.serviceId,
    customerName: reservation.customerName,
    customerPhone: reservation.customerPhone,
    source: 'APPOINTMENT',
    reservationId: reservation.id,
  });
  const updated = await prisma.futureReservation.update({
    where: { id },
    data: {
      status: 'BOOKED',
      bookedAt: new Date(),
      ticketId: ticket.id,
      events: { create: { type: 'BOOKED', label: `Live ticket ${ticket.ticketNumber} created` } },
    },
    include: { events: { orderBy: { at: 'asc' } } },
  });
  return { reservation: mapReservation(updated), ticket };
}

export async function createRunnerApplication(input: {
  name: string;
  phone: string;
  city: string;
  transportMode: string;
  payoutMethod: string;
  canStartAt: string;
  notes?: string;
}): Promise<RunnerApplication> {
  return mapRunnerApplication(await prisma.runnerApplication.create({ data: input }));
}

export async function listRunnerJobs(): Promise<RunnerJob[]> {
  const rows = await prisma.runnerJob.findMany({ orderBy: { targetArrivalAt: 'asc' } });
  return rows.map(mapRunnerJob);
}

export async function acceptRunnerJob(id: string, runnerName = 'Demo runner'): Promise<RunnerJob> {
  return mapRunnerJob(await prisma.runnerJob.update({ where: { id }, data: { status: 'ACCEPTED', runnerName } }));
}

export async function runnerCheckIn(id: string): Promise<{ job: RunnerJob; notification: Notification }> {
  const row = await prisma.runnerJob.update({ where: { id }, data: { status: 'IN_LINE' } });
  const notification = await logSms(row.customerPhone, 'RUNNER_UPDATE', `Your Omukweyo runner checked in at ${row.placeName}. They are now holding your normal public-line spot.`);
  return { job: mapRunnerJob(row), notification };
}

export async function runnerProofUpdate(id: string, message: string): Promise<{ job: RunnerJob; notification: Notification }> {
  const row = await prisma.runnerJob.update({ where: { id }, data: { status: 'IN_LINE' } });
  const notification = await logSms(row.customerPhone, 'RUNNER_UPDATE', `Your Omukweyo runner update: ${message}`);
  return { job: mapRunnerJob(row), notification };
}

export async function completeRunnerJob(id: string): Promise<{ job: RunnerJob; notification: Notification }> {
  const row = await prisma.runnerJob.update({ where: { id }, data: { status: 'COMPLETE' } });
  const notification = await logSms(row.customerPhone, 'RUNNER_UPDATE', `Your Omukweyo runner completed the handoff at ${row.placeName}.`);
  return { job: mapRunnerJob(row), notification };
}

export async function listBusinessDirectory(query = ''): Promise<BusinessDirectoryItem[]> {
  const normalized = query.trim().toLowerCase();
  const companies = await prisma.company.findMany({
    include: {
      branches: { orderBy: { createdAt: 'asc' } },
      services: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { name: 'asc' },
  });

  const filtered = companies.filter((company) => {
    if (!normalized) return true;
    const haystack = [
      company.name,
      company.industry,
      company.slug,
      company.tagline ?? '',
      ...company.branches.flatMap((branch) => [branch.name, branch.city, branch.address]),
      ...company.services.flatMap((service) => [service.name, service.description]),
    ].join(' ').toLowerCase();
    return haystack.includes(normalized);
  });

  return Promise.all(filtered.map(async (company): Promise<BusinessDirectoryItem> => {
    const liveWaiting = await prisma.queueTicket.count({ where: { companyId: company.id, status: 'WAITING' } });
    const avgWaitMin = Math.round(company.branches.reduce((sum, branch) => sum + branch.avgWaitMin, 0) / Math.max(1, company.branches.length));
    return {
      id: company.id,
      slug: company.slug,
      name: company.name,
      industry: company.industry,
      logoText: company.logoText,
      logoUrl: company.logoUrl ?? undefined,
      heroImageUrl: company.heroImageUrl ?? undefined,
      primaryColor: company.primaryColor,
      publicPageUrl: `/c/${company.slug}`,
      serviceCount: company.services.length,
      liveWaiting,
      avgWaitMin,
      branches: company.branches.map((branch) => ({
        id: branch.id,
        slug: branch.slug,
        name: branch.name,
        city: branch.city,
        address: branch.address,
        isOpen: branch.isOpen,
        liveWaiting: branch.liveWaiting,
        avgWaitMin: branch.avgWaitMin,
      })),
      qr: {
        joinUrl: `/c/${company.slug}`,
        reserveUrl: `/reserve?company=${company.slug}`,
        embedUrl: `/widget/${company.slug}`,
      },
    };
  }));
}

export async function createBusinessOnboarding(input: {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  companyName: string;
  industry: string;
  branchName: string;
  address?: string;
  city: string;
  branchPhone?: string;
  openingHours: string;
  serviceName: string;
  averageServiceMinutes: number;
  plan: BusinessOnboarding['plan'];
}): Promise<BusinessOnboarding> {
  const passwordHash = await bcrypt.hash('demo123', 10);
  const companySlug = await uniqueCompanySlug(input.companyName);
  const branchSlug = slugify(input.branchName);
  const serviceSlug = slugify(input.serviceName);

  const company = await prisma.company.create({
    data: {
      slug: companySlug,
      name: input.companyName,
      industry: input.industry,
      logoText: initials(input.companyName),
      primaryColor: '#2563EB',
      secondaryColor: '#10B981',
      tagline: `${input.companyName} queues, reservations, and SMS updates.`,
      publicDescription: `Join ${input.companyName} online, reserve a future spot, or scan a QR code at the branch.`,
      plan: input.plan,
      smsBalance: 250,
      branches: {
        create: {
          slug: branchSlug,
          name: input.branchName,
          address: input.address || '',
          city: input.city,
          phone: input.branchPhone || input.ownerPhone,
          openingHours: input.openingHours,
          avgWaitMin: input.averageServiceMinutes,
        },
      },
      subscription: {
        create: {
          plan: input.plan,
          status: input.plan === 'FREE' ? 'TRIALING' : 'ACTIVE',
          paymentMethod: 'MOCK_INVOICE',
        },
      },
    },
    include: { branches: true },
  });

  const branch = company.branches[0];
  await prisma.service.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      slug: serviceSlug,
      name: input.serviceName,
      description: `${input.serviceName} queue at ${input.branchName}.`,
      averageServiceMinutes: input.averageServiceMinutes,
      icon: 'ticket',
    },
  });
  const staff = await prisma.staffMember.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      name: input.ownerName,
      role: 'OWNER',
      counter: 'Admin',
      rating: 5,
    },
  });
  await prisma.user.create({
    data: {
      role: 'COMPANY_OWNER',
      name: input.ownerName,
      email: input.ownerEmail.trim().toLowerCase(),
      phone: input.ownerPhone,
      passwordHash,
      destination: '/dashboard',
      companyId: company.id,
      staffId: staff.id,
      emailVerified: false,
    },
  });
  await prisma.billingInvoice.create({
    data: {
      companyId: company.id,
      type: 'SUBSCRIPTION',
      description: `${input.plan} plan activation`,
      amountCents: planPricesCents[input.plan],
      status: 'PAID',
      paymentMethod: 'MOCK_INVOICE',
    },
  });

  return {
    id: company.id,
    ownerName: input.ownerName,
    ownerEmail: input.ownerEmail,
    ownerPhone: input.ownerPhone,
    companyName: company.name,
    industry: company.industry,
    branchName: branch.name,
    address: branch.address,
    city: branch.city,
    branchPhone: branch.phone,
    openingHours: branch.openingHours,
    serviceName: input.serviceName,
    averageServiceMinutes: input.averageServiceMinutes,
    plan: input.plan,
    status: 'READY',
    createdAt: toIso(company.createdAt)!,
    launchLinks: {
      dashboard: '/dashboard',
      publicPage: `/c/${company.slug}`,
      staffConsole: '/staff',
      embed: '/embed',
      billing: '/billing',
    },
    checklist: [
      { label: 'Company profile created', done: true },
      { label: 'First branch configured', done: true },
      { label: 'First service configured', done: true },
      { label: 'Public queue page ready', done: true },
      { label: 'Staff console ready', done: true },
      { label: 'Billing plan selected', done: true },
    ],
  };
}

export async function getBillingOverview(companySlug?: string): Promise<BillingOverview> {
  const bundle = companySlug ? await getCompanyBundle(companySlug) : await defaultCompanyBundle();
  if (!bundle) throw new Error('Company not found');
  const subscription = await prisma.subscription.findUnique({ where: { companyId: bundle.company.id } });
  const recentInvoices = await prisma.billingInvoice.findMany({ where: { companyId: bundle.company.id }, orderBy: { createdAt: 'desc' }, take: 10 });
  const smsPurchases = await prisma.smsCreditPurchase.findMany({ where: { companyId: bundle.company.id }, orderBy: { createdAt: 'desc' }, take: 10 });
  return {
    company: bundle.company,
    subscription: subscription ? mapSubscription(subscription) : {
      id: `sub_${bundle.company.id}`,
      companyId: bundle.company.id,
      plan: bundle.company.plan,
      status: 'TRIALING',
      paymentMethod: 'MOCK_INVOICE',
      amountCents: planPricesCents[bundle.company.plan],
      currency: 'NAD',
      renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString(),
      updatedAt: nowIso(),
    },
    smsPackages,
    recentInvoices: recentInvoices.map(mapInvoice),
    recentPurchases: smsPurchases.map(mapSmsPurchase),
  };
}

export async function updateSubscriptionPlan(plan: Company['plan'], paymentMethod: BillingPaymentMethod, companySlug?: string): Promise<SubscriptionRecord> {
  const bundle = companySlug ? await getCompanyBundle(companySlug) : await defaultCompanyBundle();
  if (!bundle) throw new Error('Company not found');
  await prisma.company.update({ where: { id: bundle.company.id }, data: { plan } });
  const subscription = await prisma.subscription.upsert({
    where: { companyId: bundle.company.id },
    update: { plan, paymentMethod: paymentMethod as any, status: 'ACTIVE' },
    create: { companyId: bundle.company.id, plan, paymentMethod: paymentMethod as any, status: 'ACTIVE' },
  });
  await prisma.billingInvoice.create({
    data: {
      companyId: bundle.company.id,
      type: 'SUBSCRIPTION',
      description: `${plan} plan subscription`,
      amountCents: planPricesCents[plan],
      paymentMethod: paymentMethod as any,
      status: 'PAID',
    },
  });
  return mapSubscription(subscription);
}

export async function purchaseSmsCredits(packageId: SmsCreditPackage['id'], paymentMethod: BillingPaymentMethod, companySlug?: string): Promise<SmsCreditPurchase> {
  const pack = smsPackages.find((item) => item.id === packageId);
  if (!pack) throw new Error('SMS package not found');
  const bundle = companySlug ? await getCompanyBundle(companySlug) : await defaultCompanyBundle();
  if (!bundle) throw new Error('Company not found');
  const invoice = await prisma.billingInvoice.create({
    data: {
      companyId: bundle.company.id,
      type: 'SMS_CREDITS',
      description: pack.name,
      amountCents: pack.priceCents,
      paymentMethod: paymentMethod as any,
      status: 'PAID',
    },
  });
  await prisma.company.update({ where: { id: bundle.company.id }, data: { smsBalance: { increment: pack.credits } } });
  return mapSmsPurchase(await prisma.smsCreditPurchase.create({
    data: {
      companyId: bundle.company.id,
      packageId: pack.id,
      credits: pack.credits,
      amountCents: pack.priceCents,
      paymentMethod: paymentMethod as any,
      invoiceId: invoice.id,
    },
  }));
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const [companies, branchCount, customers, liveTickets, futureReservations, runnerApplications, notifications, recentRunnerApplications, recentBusinesses, recentReservations, liveBranches] = await Promise.all([
    prisma.company.count(),
    prisma.branch.count(),
    prisma.customer.count(),
    prisma.queueTicket.count({ where: { status: { in: ['WAITING', 'CALLED', 'SERVING', 'ON_HOLD'] } } }),
    prisma.futureReservation.count(),
    prisma.runnerApplication.count(),
    prisma.notification.count(),
    prisma.runnerApplication.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.company.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.futureReservation.findMany({ include: { events: { orderBy: { at: 'asc' } } }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.branch.findMany({ orderBy: { liveWaiting: 'desc' }, take: 8 }),
  ]);
  return {
    totals: {
      companies,
      branches: branchCount,
      customers,
      liveTickets,
      futureReservations,
      runnerApplications,
      businessOnboardings: recentBusinesses.length,
      notifications,
    },
    roleCoverage: [
      { role: 'CUSTOMER', status: 'LIVE', entry: '/customer' },
      { role: 'COMPANY_OWNER', status: 'LIVE', entry: '/dashboard' },
      { role: 'COMPANY_MANAGER', status: 'LIVE', entry: '/dashboard' },
      { role: 'STAFF', status: 'LIVE', entry: '/staff' },
      { role: 'RUNNER', status: 'LIVE', entry: '/runner/work' },
      { role: 'SUPER_ADMIN', status: 'LIVE', entry: '/admin' },
    ],
    recentReservations: recentReservations.map(mapReservation),
    recentRunnerApplications: recentRunnerApplications.map(mapRunnerApplication),
    recentBusinessOnboardings: recentBusinesses.map((company) => ({
      id: company.id,
      ownerName: 'Owner',
      ownerEmail: '',
      ownerPhone: '',
      companyName: company.name,
      industry: company.industry,
      branchName: '',
      city: '',
      openingHours: '',
      serviceName: '',
      averageServiceMinutes: 0,
      plan: company.plan,
      status: 'READY',
      createdAt: toIso(company.createdAt)!,
      launchLinks: { dashboard: '/dashboard', publicPage: `/c/${company.slug}`, staffConsole: '/staff', embed: '/embed', billing: '/billing' },
      checklist: [],
    })),
    liveBranches: liveBranches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      city: branch.city,
      isOpen: branch.isOpen,
      liveWaiting: branch.liveWaiting,
      avgWaitMin: branch.avgWaitMin,
    })),
  };
}

export async function computeMetrics(companySlug?: string): Promise<DashboardMetrics> {
  const bundle = companySlug ? await getCompanyBundle(companySlug) : await defaultCompanyBundle();
  if (!bundle) throw new Error('Company not found');
  const [liveWaiting, servedToday, notificationsSent] = await Promise.all([
    prisma.queueTicket.count({ where: { companyId: bundle.company.id, status: 'WAITING' } }),
    prisma.queueTicket.count({ where: { companyId: bundle.company.id, status: 'SERVED' } }),
    prisma.notification.count({ where: { status: 'SENT' } }),
  ]);
  const avgWaitTodayMin = Math.round(bundle.branches.reduce((sum, branch) => sum + branch.avgWaitMin, 0) / Math.max(1, bundle.branches.length));
  return {
    liveWaiting,
    avgWaitTodayMin,
    servedToday: Math.max(servedToday, bundle.branches.reduce((sum, branch) => sum + branch.servedToday, 0)),
    noShowRatePct: 3.4,
    healthScore: bundle.company.healthScore,
    smsBalance: bundle.company.smsBalance,
    smsSentToday: notificationsSent,
    smsLowAt: 200,
    autoTopUp: true,
    peakHour: '12:00',
    slowestHour: '15:00',
    waitTimeSeries: [
      { hour: '08', wait: 4, service: 7 },
      { hour: '09', wait: 6, service: 8 },
      { hour: '10', wait: 11, service: 8 },
      { hour: '11', wait: 9, service: 7 },
      { hour: '12', wait: 14, service: 9 },
      { hour: '14', wait: 8, service: 7 },
      { hour: '15', wait: 16, service: 10 },
      { hour: '16', wait: 7, service: 8 },
    ],
    heatmap: [
      [0.2, 0.3, 0.6, 0.4, 0.8, 0.5, 0.7, 0.3],
      [0.3, 0.4, 0.7, 0.5, 0.9, 0.6, 0.6, 0.4],
      [0.1, 0.2, 0.4, 0.3, 0.6, 0.4, 0.5, 0.2],
      [0.2, 0.3, 0.5, 0.6, 0.7, 0.5, 0.8, 0.4],
    ],
    topTemplates: [
      { name: 'Ticket created', sent: Math.max(1, Math.round(notificationsSent * 0.45)), share: 0.45 },
      { name: 'Almost turn', sent: Math.max(1, Math.round(notificationsSent * 0.25)), share: 0.25 },
      { name: 'Called', sent: Math.max(1, Math.round(notificationsSent * 0.2)), share: 0.2 },
    ],
    branches: bundle.branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      counters: 3,
      staff: 4,
      avgWaitMin: branch.avgWaitMin,
      served: branch.servedToday,
      status: branch.avgWaitMin > 14 ? 'SLOW' : branch.avgWaitMin > 9 ? 'BUSY' : 'OK',
    })),
  };
}

export async function getDashboard(companySlug?: string) {
  const bundle = companySlug ? await getCompanyBundle(companySlug) : await defaultCompanyBundle();
  if (!bundle) throw new Error('Company not found');
  const liveTickets = await listLiveTickets(bundle.branches[0]?.id);
  const notificationRows = await prisma.notification.findMany({ orderBy: { at: 'desc' }, take: 20 });
  return {
    ...bundle,
    metrics: await computeMetrics(bundle.company.slug),
    liveTickets,
    notifications: notificationRows.map(mapNotification),
  };
}

export async function getBranchBySlug(branchSlug: string, companySlug?: string) {
  const branch = await prisma.branch.findFirst({
    where: { slug: branchSlug, ...(companySlug ? { company: { slug: companySlug } } : {}) },
    include: { company: true },
  });
  if (!branch) return null;
  const [services, liveTickets] = await Promise.all([
    prisma.service.findMany({ where: { OR: [{ branchId: branch.id }, { branchId: null }], companyId: branch.companyId }, orderBy: { createdAt: 'asc' } }),
    listLiveTickets(branch.id),
  ]);
  return { branch: mapBranch(branch), services: services.map(mapService), liveTickets };
}

export async function updateBusinessProfile(companyId: string, input: Partial<Pick<Company, 'name' | 'industry' | 'primaryColor' | 'secondaryColor' | 'logoText' | 'logoUrl' | 'heroImageUrl' | 'tagline' | 'websiteUrl' | 'publicDescription'>>) {
  const company = await prisma.company.update({
    where: { id: companyId },
    data: {
      ...input,
      logoText: input.logoText || (input.name ? initials(input.name) : undefined),
    },
  });
  return mapCompany(company);
}

export async function recordCompanyAsset(companyId: string, input: { type: string; url: string; filename: string; mimeType: string; sizeBytes: number }) {
  const asset = await prisma.companyAsset.create({ data: { companyId, ...input } });
  const patch = input.type === 'hero' ? { heroImageUrl: input.url } : { logoUrl: input.url };
  await prisma.company.update({ where: { id: companyId }, data: patch });
  return asset;
}

export async function getWidgetConfig(companySlug: string, origin = '') {
  const bundle = await getCompanyBundle(companySlug);
  if (!bundle) throw new Error('Company not found');
  return {
    company: bundle.company,
    widgetUrl: `${origin}/widget/${bundle.company.slug}`,
    iframe: `<iframe src="${origin}/widget/${bundle.company.slug}" width="100%" height="520" style="border:0;border-radius:12px;overflow:hidden" loading="lazy"></iframe>`,
    loader: `<div data-omukweyo-queue="${bundle.company.slug}"></div>\n<script src="${origin}/omukweyo-widget.js" async></script>`,
    publicUrl: `${origin}/c/${bundle.company.slug}`,
  };
}

export async function getSocketInitialEvents(): Promise<ServerEvent[]> {
  return [
    { type: 'ticket:list', tickets: await listLiveTickets() },
    { type: 'metrics:updated', metrics: await computeMetrics() },
  ];
}
