import type { Session as SupabaseSession } from '@supabase/supabase-js';
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
  Service,
  SmsCreditPackage,
  SmsCreditPurchase,
  StaffMember,
  SubscriptionRecord,
  TicketEvent,
} from '@inline/shared';
import { getBrowserSupabase } from './supabase';

const SESSION_KEY = 'omukweyo_session';
const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET ?? 'omukweyo-assets';
const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL ?? 'https://omukweyo.com';

const activeStatuses = ['WAITING', 'CALLED', 'SERVING', 'ON_HOLD'];
type CompanyBundle = { company: Company; branches: Branch[]; services: Service[]; staff: StaffMember[] };

const requestCache = new Map<string, { expiresAt: number; promise: Promise<unknown> }>();

function appOrigin() {
  if (typeof window !== 'undefined' && window.location.origin) return window.location.origin;
  return PUBLIC_SITE_URL;
}

function authRedirectTo(path: string) {
  return new URL(path, appOrigin()).toString();
}

function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const entry = requestCache.get(key);
  if (entry && entry.expiresAt > now) return entry.promise as Promise<T>;

  const promise = load().catch((error) => {
    requestCache.delete(key);
    throw error;
  });
  requestCache.set(key, { expiresAt: now + ttlMs, promise });
  return promise;
}

function clearApiCache(...prefixes: string[]) {
  if (prefixes.length === 0) {
    requestCache.clear();
    return;
  }
  for (const key of Array.from(requestCache.keys())) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) requestCache.delete(key);
  }
}

function clearQueueCaches() {
  clearApiCache('live-queue:', 'queue-workspace:', 'staff-workspace:', 'analytics-overview:', 'dashboard:', 'dashboard-metrics:', 'company-bundle:', 'health', 'notifications');
}

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

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || `item-${crypto.randomUUID().slice(0, 6)}`;
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

function err(error: unknown, fallback = 'Supabase request failed') {
  const message = typeof error === 'object' && error && 'message' in error ? String((error as any).message) : '';
  return new Error(message || fallback);
}

function mapCustomerInput(input: { id?: string; name: string; phone: string; email?: string | null; avatarUrl?: string | null; createdAt?: string; updatedAt?: string }) {
  const timestamp = nowIso();
  return {
    id: input.id ?? id('cust'),
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || null,
    avatarUrl: input.avatarUrl ?? null,
    createdAt: input.createdAt ?? timestamp,
    updatedAt: input.updatedAt ?? timestamp,
  };
}

async function one<T>(query: PromiseLike<{ data: T | null; error: any }>, fallback = 'Record not found'): Promise<T> {
  const { data, error } = await query;
  if (error) throw err(error);
  if (!data) throw new Error(fallback);
  return data;
}

async function many<T>(query: PromiseLike<{ data: T[] | null; error: any }>): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw err(error);
  return data ?? [];
}

function storedSession(): DemoSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as DemoSession : null;
  } catch {
    return null;
  }
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
    branchId: input.branchId ?? undefined,
    name: input.name,
    initials: initials(input.name),
    role: input.role,
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
    template: input.template,
    status: input.status,
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

async function companySlug(companyId?: string | null) {
  if (!companyId) return undefined;
  const row = await one<any>(getBrowserSupabase().from('Company').select('slug').eq('id', companyId).single());
  return row.slug as string;
}

async function demoUserFromDb(input: any, knownCompanySlug?: string): Promise<DemoUser> {
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
    companySlug: knownCompanySlug ?? await companySlug(input.companyId),
    staffId: input.staffId ?? undefined,
    avatarUrl: input.avatarUrl ?? undefined,
  };
}

async function currentAuthSession() {
  const { data, error } = await getBrowserSupabase().auth.getSession();
  if (error) throw err(error);
  return data.session;
}

async function currentUser(): Promise<DemoUser | undefined> {
  const session = await currentAuthSession();
  const storedUser = storedSession()?.user;
  if (!session?.user) return storedUser;
  return cached(`current-user:${session.user.id}`, 30_000, async () => {
    const row = await one<any>(
      getBrowserSupabase().from('User').select('*').eq('supabaseUserId', session.user.id).maybeSingle(),
      'User profile not found',
    ).catch(() => null);
    return row ? demoUserFromDb(row, storedUser?.companyId === row.companyId ? storedUser?.companySlug : undefined) : undefined;
  });
}

async function sessionPayload(session: SupabaseSession, note = 'Supabase Auth session.'): Promise<{ session: DemoSession; user: DemoUser }> {
  const row = await one<any>(
    getBrowserSupabase().from('User').select('*').eq('supabaseUserId', session.user.id).maybeSingle(),
    'User profile not found',
  );
  const user = await demoUserFromDb(row);
  return {
    user,
    session: {
      token: session.access_token,
      user,
      issuedAt: new Date((session.expires_at! - session.expires_in!) * 1000).toISOString(),
      expiresAt: new Date(session.expires_at! * 1000).toISOString(),
      verificationNote: note,
    },
  };
}

async function signUpAndProfile(input: {
  email: string;
  password: string;
  role: Role;
  name: string;
  destination: string;
  phone?: string;
  companyId?: string;
  customerId?: string;
  staffId?: string;
}) {
  const sb = getBrowserSupabase();
  const email = input.email.trim().toLowerCase();
  const signUp = await sb.auth.signUp({
    email,
    password: input.password,
    options: {
      emailRedirectTo: authRedirectTo(input.destination),
      data: {
        name: input.name,
        phone: input.phone ?? null,
        role: input.role,
        destination: input.destination,
        companyId: input.companyId ?? null,
        customerId: input.customerId ?? null,
        staffId: input.staffId ?? null,
      },
    },
  });
  if (signUp.error && !/already|registered|exists/i.test(signUp.error.message)) throw err(signUp.error);

  let session = signUp.data.session;
  let authUser = signUp.data.user;
  if (!session) {
    const login = await sb.auth.signInWithPassword({ email, password: input.password });
    if (!login.error) {
      session = login.data.session;
      authUser = login.data.user;
    }
  }

  if (!authUser) throw new Error('Could not create Supabase Auth user');

  if (!session) {
    return {
      user: {
        id: `pending_${authUser.id}`,
        role: input.role,
        name: input.name,
        email,
        phone: input.phone,
        destination: input.destination,
        emailVerified: false,
        customerId: input.customerId,
        companyId: input.companyId,
        staffId: input.staffId,
      } satisfies DemoUser,
      session: undefined,
    };
  }

  const existing = await sb.from('User').select('id').eq('email', email).maybeSingle();
  const payload = {
    role: input.role,
    name: input.name,
    email,
    supabaseUserId: authUser.id,
    phone: input.phone ?? null,
    passwordHash: 'supabase-auth',
    destination: input.destination,
    emailVerified: Boolean(authUser.email_confirmed_at || session),
    companyId: input.companyId ?? null,
    customerId: input.customerId ?? null,
    staffId: input.staffId ?? null,
  };
  const result = existing.data
    ? await sb.from('User').update(payload).eq('id', existing.data.id).select('*').single()
    : await sb.from('User').insert({ id: id('usr'), ...payload }).select('*').single();
  if (result.error) throw err(result.error);

  if (!session) return { user: await demoUserFromDb(result.data), session: undefined };
  return sessionPayload(session, 'Supabase Auth session created.');
}

async function uniqueCompanySlug(name: string) {
  const sb = getBrowserSupabase();
  const base = slugify(name);
  let candidate = base;
  let index = 2;
  while (true) {
    const { data, error } = await sb.from('Company').select('id').eq('slug', candidate).maybeSingle();
    if (error) throw err(error);
    if (!data) return candidate;
    candidate = `${base}-${index}`;
    index += 1;
  }
}

async function getCurrentCompany() {
  const user = await currentUser().catch(() => undefined);
  const cacheKey = `current-company:${user?.companyId ?? user?.companySlug ?? 'first'}`;
  return cached(cacheKey, 10_000, async () => {
    const sb = getBrowserSupabase();
    const company = user?.companyId
      ? await one<any>(sb.from('Company').select('*').eq('id', user.companyId).single(), 'Company not found')
      : user?.companySlug
        ? await one<any>(sb.from('Company').select('*').eq('slug', user.companySlug).single(), 'Company not found')
        : await one<any>(sb.from('Company').select('*').order('createdAt', { ascending: true }).limit(1).single(), 'Company not found');
    return mapCompany(company);
  });
}

async function getCompanyBundle(slug?: string): Promise<CompanyBundle> {
  const user = await currentUser().catch(() => undefined);
  const resolvedKey = slug ?? user?.companySlug ?? user?.companyId ?? 'first';
  return cached(`company-bundle:${resolvedKey}`, 10_000, async () => {
    const sb = getBrowserSupabase();
    const company = slug
      ? await one<any>(sb.from('Company').select('*').eq('slug', slug).single(), 'Company not found')
      : user?.companyId
        ? await one<any>(sb.from('Company').select('*').eq('id', user.companyId).single(), 'Company not found')
        : user?.companySlug
          ? await one<any>(sb.from('Company').select('*').eq('slug', user.companySlug).single(), 'Company not found')
          : await one<any>(sb.from('Company').select('*').order('createdAt', { ascending: true }).limit(1).single(), 'Company not found');
    const canReadStaff = user?.role === 'SUPER_ADMIN' || user?.companyId === company.id;
    const [branches, services, staff] = await Promise.all([
      many<any>(sb.from('Branch').select('*').eq('companyId', company.id).order('createdAt', { ascending: true })),
      many<any>(sb.from('Service').select('*').eq('companyId', company.id).order('createdAt', { ascending: true })),
      canReadStaff
        ? many<any>(sb.from('StaffMember').select('*').eq('companyId', company.id).order('createdAt', { ascending: true }))
        : Promise.resolve([]),
    ]);
    return {
      company: mapCompany(company),
      branches: branches.map(mapBranch),
      services: services.map(mapService),
      staff: staff.map(mapStaff),
    };
  });
}

async function getTicketWithEvents(ticket: any) {
  const events = await many<any>(
    getBrowserSupabase().from('TicketEvent').select('*').eq('ticketId', ticket.id).order('at', { ascending: true }),
  );
  return mapTicket({ ...ticket, events });
}

async function listLiveTickets(branchId?: string, includeEvents = false): Promise<QueueTicket[]> {
  let query = getBrowserSupabase()
    .from('QueueTicket')
    .select('*')
    .in('status', activeStatuses)
    .order('branchId', { ascending: true })
    .order('position', { ascending: true })
    .order('joinedAt', { ascending: true });
  if (branchId) query = query.eq('branchId', branchId);
  const rows = await many<any>(query);
  if (includeEvents) return Promise.all(rows.map(getTicketWithEvents));
  return rows.map((row) => mapTicket({ ...row, events: [] }));
}

async function listCompanyLiveTickets(companyId: string, includeEvents = false): Promise<QueueTicket[]> {
  const rows = await many<any>(
    getBrowserSupabase()
      .from('QueueTicket')
      .select('*')
      .eq('companyId', companyId)
      .in('status', activeStatuses)
      .order('branchId', { ascending: true })
      .order('position', { ascending: true })
      .order('joinedAt', { ascending: true }),
  );
  if (includeEvents) return Promise.all(rows.map(getTicketWithEvents));
  return rows.map((row) => mapTicket({ ...row, events: [] }));
}

async function recalcPositions(branchId: string) {
  const sb = getBrowserSupabase();
  const tickets = await many<any>(
    sb.from('QueueTicket').select('*').eq('branchId', branchId).in('status', activeStatuses).order('joinedAt', { ascending: true }),
  );
  await Promise.all(tickets.map(async (ticket, index) => {
    const position = index + 1;
    const peopleAhead = index;
    const { error } = await sb.from('QueueTicket').update({
      position,
      peopleAhead,
      estimatedWaitMinutes: Math.max(0, peopleAhead * 8),
    }).eq('id', ticket.id);
    if (error) throw err(error);
  }));
  const waiting = tickets.filter((ticket) => ticket.status === 'WAITING').length;
  const { error } = await sb.from('Branch').update({ liveWaiting: waiting }).eq('id', branchId);
  if (error) throw err(error);
  clearQueueCaches();
}

async function makeTicketNumber(offset = 0) {
  const { count, error } = await getBrowserSupabase().from('QueueTicket').select('id', { count: 'exact', head: true });
  if (error) throw err(error);
  return `A-${String((count ?? 0) + 24 + offset).padStart(3, '0')}`;
}

async function createTicket(input: {
  branchId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  source?: QueueTicket['source'];
  reservationId?: string;
}): Promise<QueueTicket> {
  const sb = getBrowserSupabase();
  const branch = await one<any>(sb.from('Branch').select('*').eq('id', input.branchId).single(), 'Branch not found');
  const company = await one<any>(sb.from('Company').select('*').eq('id', branch.companyId).single(), 'Company not found');
  const service = await one<any>(sb.from('Service').select('*').eq('id', input.serviceId).single(), 'Service not found');
  const { count, error: countError } = await sb
    .from('QueueTicket')
    .select('id', { count: 'exact', head: true })
    .eq('branchId', branch.id)
    .in('status', activeStatuses);
  if (countError) throw err(countError);
  const position = (count ?? 0) + 1;

  let inserted: any;
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const ticketNumber = await makeTicketNumber(attempt);
    const result = await sb.from('QueueTicket').insert({
      id: id('qt'),
      ticketNumber,
      companyId: branch.companyId,
      companySlug: company.slug,
      branchId: branch.id,
      branchSlug: branch.slug,
      serviceId: service.id,
      serviceName: service.name,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      source: input.source ?? 'PUBLIC_PAGE',
      reservationId: input.reservationId ?? null,
      position,
      peopleAhead: position - 1,
      estimatedWaitMinutes: Math.max(0, (position - 1) * service.averageServiceMinutes),
    }).select('*').single();
    if (!result.error) {
      inserted = result.data;
      break;
    }
    lastError = result.error;
    if (!/duplicate|unique/i.test(result.error.message)) throw err(result.error);
  }
  if (!inserted) throw err(lastError, 'Could not allocate ticket number');

  await sb.from('TicketEvent').insert({ id: id('evt'), ticketId: inserted.id, type: 'CREATED', label: 'Ticket created' });
  await recalcPositions(branch.id);
  clearQueueCaches();
  return getTicket(inserted.id).then((ticket) => ticket!);
}

async function updateTicketStatus(idValue: string, status: QueueTicket['status'], counter?: string): Promise<QueueTicket> {
  const sb = getBrowserSupabase();
  const timestamp: Record<string, string> = {};
  if (status === 'CALLED') timestamp.calledAt = nowIso();
  if (status === 'SERVING') timestamp.servingAt = nowIso();
  if (status === 'SERVED') timestamp.servedAt = nowIso();
  const ticket = await one<any>(sb.from('QueueTicket').update({ status, counter: counter ?? null, ...timestamp }).eq('id', idValue).select('*').single());
  await sb.from('TicketEvent').insert({ id: id('evt'), ticketId: idValue, type: status, label: `Ticket ${status.toLowerCase().replace(/_/g, ' ')}` });
  await recalcPositions(ticket.branchId);
  clearQueueCaches();
  return getTicket(idValue).then((fresh) => fresh!);
}

async function getTicket(idValue: string): Promise<QueueTicket | undefined> {
  const ticket = await one<any>(getBrowserSupabase().from('QueueTicket').select('*').eq('id', idValue).maybeSingle(), 'Ticket not found').catch(() => null);
  return ticket ? getTicketWithEvents(ticket) : undefined;
}

async function upsertCustomer(input: { name: string; phone: string; email?: string; avatarUrl?: string }): Promise<CustomerAccount> {
  const sb = getBrowserSupabase();
  const session = await currentAuthSession().catch(() => null);
  const publicPayload = mapCustomerInput(input);

  if (!session?.user) {
    const { error } = await sb.from('Customer').insert(publicPayload);
    if (error) throw err(error);
    return mapCustomer(publicPayload);
  }

  const query = sb.from('Customer').select('*').or(`phone.eq.${publicPayload.phone}${publicPayload.email ? `,email.eq.${publicPayload.email}` : ''}`).maybeSingle();
  const existing = await one<any>(query, 'Customer not found').catch(() => null);
  const payload = {
    name: publicPayload.name,
    phone: publicPayload.phone,
    email: publicPayload.email || existing?.email || null,
    avatarUrl: publicPayload.avatarUrl || existing?.avatarUrl || null,
    updatedAt: nowIso(),
  };
  const result = existing
    ? await sb.from('Customer').update(payload).eq('id', existing.id).select('*').single()
    : await sb.from('Customer').insert({ id: publicPayload.id, ...payload }).select('*').single();
  if (result.error) throw err(result.error);
  return mapCustomer(result.data);
}

async function logSms(to: string, template: Notification['template'], message: string, ticketId?: string, reservationId?: string): Promise<Notification> {
  const result = await getBrowserSupabase().from('Notification').insert({
    id: id('notif'),
    to,
    template,
    status: 'SENT',
    message,
    ticketId: ticketId ?? null,
    reservationId: reservationId ?? null,
  }).select('*').single();
  if (result.error) throw err(result.error);
  clearApiCache('notifications', 'dashboard:', 'dashboard-metrics:', 'health');
  return mapNotification(result.data);
}

async function getReservationRow(idValue: string) {
  const row = await one<any>(getBrowserSupabase().from('FutureReservation').select('*').eq('id', idValue).maybeSingle(), 'Reservation not found').catch(() => null);
  if (!row) return undefined;
  const events = await many<any>(getBrowserSupabase().from('ReservationEvent').select('*').eq('reservationId', row.id).order('at', { ascending: true }));
  return mapReservation({ ...row, events });
}

async function createReservation(input: {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  branchId: string;
  serviceId: string;
  targetArrivalAt: string;
  arrivalWindowMinutes: number;
  paymentMethod: 'MOCK_CARD' | 'MOCK_EFT' | 'MOCK_WALLET';
}): Promise<FutureReservation> {
  const target = new Date(input.targetArrivalAt);
  if (Number.isNaN(target.getTime())) throw new Error('Invalid arrival time');
  const sb = getBrowserSupabase();
  const branch = await one<any>(sb.from('Branch').select('*').eq('id', input.branchId).single(), 'Branch not found');
  const company = await one<any>(sb.from('Company').select('*').eq('id', branch.companyId).single(), 'Company not found');
  const service = await one<any>(sb.from('Service').select('*').eq('id', input.serviceId).single(), 'Service not found');
  const customer = input.customerId
    ? mapCustomer(await one<any>(sb.from('Customer').select('*').eq('id', input.customerId).single(), 'Customer not found'))
    : await upsertCustomer({ name: input.customerName, phone: input.customerPhone, email: input.customerEmail });
  const smartJoinAt = new Date(target.getTime() - Math.max(10, input.arrivalWindowMinutes - 5) * 60_000);
  const result = await sb.from('FutureReservation').insert({
    id: id('res'),
    customerId: customer.id,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail ?? null,
    companyId: branch.companyId,
    companySlug: company.slug,
    branchId: branch.id,
    branchSlug: branch.slug,
    branchName: branch.name,
    serviceId: service.id,
    serviceName: service.name,
    targetArrivalAt: target.toISOString(),
    smartJoinAt: smartJoinAt.toISOString(),
    arrivalWindowMinutes: input.arrivalWindowMinutes,
    paymentStatus: 'PAID',
    paymentMethod: input.paymentMethod,
    paidAt: nowIso(),
  }).select('*').single();
  if (result.error) throw err(result.error);
  await sb.from('ReservationEvent').insert({ id: id('rev'), reservationId: result.data.id, type: 'CREATED', label: 'Reservation created and paid' });
  return getReservationRow(result.data.id).then((reservation) => reservation!);
}

function numericValue(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function averageValue(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentValue(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

const notificationTemplateLabels: Record<Notification['template'], string> = {
  TICKET_CREATED: 'Ticket created',
  ALMOST_TURN: 'Almost turn',
  CALLED: 'Called',
  MISSED: 'Missed',
  RUNNER_UPDATE: 'Runner update',
  LOW_SMS_BALANCE: 'Low SMS balance',
  RESERVATION_CREATED: 'Reservation created',
  RESERVATION_BOOKED: 'Reservation booked',
  MANUAL_UPDATE: 'Manual update',
};

function buildWaitTimeSeries(ticketRows: any[], branches: Branch[]) {
  const branchWait = new Map(branches.map((branch) => [branch.id, numericValue(branch.avgWaitMin)]));
  const buckets = new Map<string, { waitTotal: number; waitCount: number; serviceTotal: number; serviceCount: number }>();

  for (let hour = 8; hour <= 17; hour += 1) {
    buckets.set(String(hour).padStart(2, '0'), { waitTotal: 0, waitCount: 0, serviceTotal: 0, serviceCount: 0 });
  }

  for (const ticket of ticketRows) {
    const joined = new Date(ticket.joinedAt);
    if (Number.isNaN(joined.getTime())) continue;
    const hour = String(joined.getHours()).padStart(2, '0');
    const bucket = buckets.get(hour);
    if (!bucket) continue;

    bucket.waitTotal += numericValue(ticket.estimatedWaitMinutes);
    bucket.waitCount += 1;

    const configuredServiceWait = branchWait.get(ticket.branchId);
    if (configuredServiceWait !== undefined) {
      bucket.serviceTotal += configuredServiceWait;
      bucket.serviceCount += 1;
    }
  }

  return Array.from(buckets.entries()).map(([hour, bucket]) => ({
    hour,
    wait: bucket.waitCount ? Math.round(bucket.waitTotal / bucket.waitCount) : 0,
    service: bucket.serviceCount ? Math.round(bucket.serviceTotal / bucket.serviceCount) : 0,
  }));
}

async function computeMetricsFromBundle(bundle: CompanyBundle): Promise<DashboardMetrics> {
  const sb = getBrowserSupabase();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const [ticketRows, waiting, served, missed, servedTodayResult, reservationRows, notificationRows] = await Promise.all([
    many<any>(sb.from('QueueTicket').select('id,status,estimatedWaitMinutes,joinedAt,branchId').eq('companyId', bundle.company.id).order('joinedAt', { ascending: true }).limit(1000)),
    sb.from('QueueTicket').select('id', { count: 'exact', head: true }).eq('companyId', bundle.company.id).eq('status', 'WAITING'),
    sb.from('QueueTicket').select('id', { count: 'exact', head: true }).eq('companyId', bundle.company.id).eq('status', 'SERVED'),
    sb.from('QueueTicket').select('id', { count: 'exact', head: true }).eq('companyId', bundle.company.id).eq('status', 'MISSED'),
    sb.from('QueueTicket').select('id', { count: 'exact', head: true }).eq('companyId', bundle.company.id).eq('status', 'SERVED').gte('servedAt', startOfToday.toISOString()),
    many<any>(sb.from('FutureReservation').select('id').eq('companyId', bundle.company.id).limit(1000)),
    many<any>(sb.from('Notification').select('*').eq('status', 'SENT').order('at', { ascending: false }).limit(500)),
  ]);
  const waitingTickets = ticketRows.filter((ticket) => ticket.status === 'WAITING');
  const activeTickets = ticketRows.filter((ticket) => activeStatuses.includes(ticket.status));
  const queueWaits = activeTickets.map((ticket) => numericValue(ticket.estimatedWaitMinutes)).filter((wait) => wait > 0);
  const branchWaits = bundle.branches.map((branch) => numericValue(branch.avgWaitMin)).filter((wait) => wait > 0);
  const avgWaitTodayMin = Math.round(queueWaits.length ? averageValue(queueWaits) : averageValue(branchWaits));
  const branchServedToday = bundle.branches.reduce((sum, branch) => sum + numericValue(branch.servedToday), 0);
  const servedToday = Math.max(servedTodayResult.count ?? 0, branchServedToday);
  const missedTickets = missed.count ?? ticketRows.filter((ticket) => ticket.status === 'MISSED').length;
  const totalClosedTickets = (served.count ?? 0) + missedTickets;
  const noShowRatePct = percentValue(missedTickets, totalClosedTickets);
  const ticketIds = new Set(ticketRows.map((ticket) => ticket.id));
  const reservationIds = new Set(reservationRows.map((reservation) => reservation.id));
  const companyNotifications = notificationRows.filter((notification) => (
    (notification.ticketId && ticketIds.has(notification.ticketId)) ||
    (notification.reservationId && reservationIds.has(notification.reservationId))
  ));
  const templateCounts = new Map<Notification['template'], number>();
  for (const notification of companyNotifications) {
    const template = notification.template as Notification['template'];
    templateCounts.set(template, (templateCounts.get(template) ?? 0) + 1);
  }
  const waitTimeSeries = buildWaitTimeSeries(ticketRows, bundle.branches);
  const waitSeriesWithData = waitTimeSeries.filter((point) => point.wait > 0 || point.service > 0);
  const peakPoint = waitSeriesWithData.reduce<typeof waitSeriesWithData[number] | undefined>((best, point) => (!best || point.wait > best.wait ? point : best), undefined);
  const slowestPoint = waitSeriesWithData.reduce<typeof waitSeriesWithData[number] | undefined>((best, point) => (!best || point.service > best.service ? point : best), undefined);

  return {
    liveWaiting: waiting.count ?? waitingTickets.length,
    avgWaitTodayMin,
    servedToday,
    noShowRatePct,
    healthScore: bundle.company.healthScore,
    smsBalance: bundle.company.smsBalance,
    smsSentToday: companyNotifications.length,
    smsLowAt: 200,
    autoTopUp: true,
    peakHour: peakPoint ? `${peakPoint.hour}:00` : '-',
    slowestHour: slowestPoint ? `${slowestPoint.hour}:00` : '-',
    waitTimeSeries,
    heatmap: [],
    topTemplates: Array.from(templateCounts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([template, sent]) => ({
        name: notificationTemplateLabels[template] ?? template,
        sent,
        share: companyNotifications.length ? sent / companyNotifications.length : 0,
      })),
    branches: bundle.branches.map((branch) => {
      const staffForBranch = bundle.staff.filter((member) => member.branchId === branch.id);
      const counters = new Set(staffForBranch.map((member) => member.counter).filter(Boolean)).size;
      return {
        id: branch.id,
        name: branch.name,
        counters,
        staff: staffForBranch.length,
        avgWaitMin: branch.avgWaitMin,
        served: branch.servedToday,
        status: branch.avgWaitMin > 14 ? 'SLOW' : branch.avgWaitMin > 9 ? 'BUSY' : 'OK',
      };
    }),
  };
}

async function computeMetrics(companySlugValue?: string): Promise<DashboardMetrics> {
  const bundle = await getCompanyBundle(companySlugValue);
  return computeMetricsFromBundle(bundle);
}

type PreparedUpload = {
  file: File;
  optimized: boolean;
  originalSize: number;
  width?: number;
  height?: number;
};

type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};

function uploadProfileForFolder(folder: string) {
  if (folder.includes('/hero')) return { maxWidth: 1800, maxHeight: 1100, quality: 0.82 };
  if (folder.includes('/logo')) return { maxWidth: 720, maxHeight: 720, quality: 0.86 };
  return { maxWidth: 720, maxHeight: 720, quality: 0.84 };
}

async function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

async function decodeImage(file: File): Promise<DecodedImage | null> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (bitmap) {
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    }
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        close: () => URL.revokeObjectURL(objectUrl),
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    image.src = objectUrl;
  });
}

async function prepareImageUpload(file: File, folder: string): Promise<PreparedUpload> {
  if (!file.type.startsWith('image/')) throw new Error('Upload an image file.');
  if (file.type === 'image/gif') throw new Error('Animated GIFs are not supported. Upload JPG, PNG, WebP, or SVG.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Image is too large. Upload an image smaller than 20 MB.');
  if (file.type === 'image/svg+xml' || typeof document === 'undefined') {
    return { file, optimized: false, originalSize: file.size };
  }

  const decoded = await decodeImage(file);
  if (!decoded) return { file, optimized: false, originalSize: file.size };

  const profile = uploadProfileForFolder(folder);
  const scale = Math.min(1, profile.maxWidth / decoded.width, profile.maxHeight / decoded.height);
  const width = Math.max(1, Math.round(decoded.width * scale));
  const height = Math.max(1, Math.round(decoded.height * scale));
  const shouldReencode = scale < 1 || file.type !== 'image/webp' || file.size > 350 * 1024;
  if (!shouldReencode) {
    decoded.close();
    return { file, optimized: false, originalSize: file.size, width: decoded.width, height: decoded.height };
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { alpha: file.type === 'image/png' });
  if (!context) {
    decoded.close();
    return { file, optimized: false, originalSize: file.size, width: decoded.width, height: decoded.height };
  }
  context.drawImage(decoded.source, 0, 0, width, height);
  decoded.close();

  const blob = await canvasBlob(canvas, 'image/webp', profile.quality);
  if (!blob || (scale === 1 && blob.size >= file.size)) {
    return { file, optimized: false, originalSize: file.size, width, height };
  }

  const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'image';
  return {
    file: new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() }),
    optimized: true,
    originalSize: file.size,
    width,
    height,
  };
}

async function uploadPublicAsset(file: File, folder: string) {
  const sb = getBrowserSupabase();
  const prepared = await prepareImageUpload(file, folder);
  const uploadFile = prepared.file;
  const ext = uploadFile.name.includes('.') ? uploadFile.name.slice(uploadFile.name.lastIndexOf('.')).toLowerCase() : '';
  const clean = uploadFile.name.replace(ext, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'asset';
  const objectPath = `${folder}/${Date.now()}-${crypto.randomUUID()}-${clean}${ext}`;
  const { error } = await sb.storage.from(STORAGE_BUCKET).upload(objectPath, uploadFile, {
    cacheControl: '31536000',
    contentType: uploadFile.type,
    upsert: false,
  });
  if (error) throw err(error);
  return {
    path: objectPath,
    url: sb.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath).data.publicUrl,
    file: uploadFile,
    optimized: prepared.optimized,
    originalSize: prepared.originalSize,
    width: prepared.width,
    height: prepared.height,
  };
}

export const api = {
  health: async () => {
    return cached('health', 5_000, async () => {
      const sb = getBrowserSupabase();
      const [tickets, notifications, companies] = await Promise.all([
        sb.from('QueueTicket').select('id', { count: 'exact', head: true }),
        sb.from('Notification').select('id', { count: 'exact', head: true }),
        sb.from('Company').select('id', { count: 'exact', head: true }),
      ]);
      return { ok: true, tickets: tickets.count ?? 0, notifications: notifications.count ?? 0, companies: companies.count ?? 0 };
    });
  },

  login: async (body: { email: string; password: string }) => {
    const { data, error } = await getBrowserSupabase().auth.signInWithPassword({ email: body.email.trim().toLowerCase(), password: body.password });
    if (error || !data.session) throw err(error, 'Invalid email or password');
    return sessionPayload(data.session);
  },

  me: async (_token: string) => ({ user: await currentUser() }),

  logout: async (_token: string) => {
    await getBrowserSupabase().auth.signOut();
    return { ok: true };
  },

  businesses: async (query = '') => {
    const sb = getBrowserSupabase();
    const [companies, branches, services, tickets] = await Promise.all([
      many<any>(sb.from('Company').select('*').order('name', { ascending: true })),
      many<any>(sb.from('Branch').select('*').order('createdAt', { ascending: true })),
      many<any>(sb.from('Service').select('*').order('createdAt', { ascending: true })),
      many<any>(sb.from('QueueTicket').select('companyId,status')),
    ]);
    const normalized = query.trim().toLowerCase();
    const businesses = companies.filter((company) => {
      if (!normalized) return true;
      const ownBranches = branches.filter((branch) => branch.companyId === company.id);
      const ownServices = services.filter((service) => service.companyId === company.id);
      return [company.name, company.industry, company.slug, company.tagline ?? '', ...ownBranches.flatMap((branch) => [branch.name, branch.city, branch.address]), ...ownServices.flatMap((service) => [service.name, service.description])]
        .join(' ')
        .toLowerCase()
        .includes(normalized);
    }).map((company): BusinessDirectoryItem => {
      const ownBranches = branches.filter((branch) => branch.companyId === company.id);
      const ownServices = services.filter((service) => service.companyId === company.id);
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
        serviceCount: ownServices.length,
        liveWaiting: tickets.filter((ticket) => ticket.companyId === company.id && ticket.status === 'WAITING').length,
        avgWaitMin: Math.round(ownBranches.reduce((sum, branch) => sum + branch.avgWaitMin, 0) / Math.max(1, ownBranches.length)),
        branches: ownBranches.map((branch) => ({
          id: branch.id,
          slug: branch.slug,
          name: branch.name,
          city: branch.city,
          address: branch.address,
          isOpen: branch.isOpen,
          liveWaiting: branch.liveWaiting,
          avgWaitMin: branch.avgWaitMin,
        })),
        qr: { joinUrl: `/c/${company.slug}`, reserveUrl: `/reserve?company=${company.slug}`, embedUrl: `/widget/${company.slug}` },
      };
    });
    return { businesses };
  },

  company: async (slug: string) => {
    const bundle = await getCompanyBundle(slug);
    return { ...bundle, liveTickets: await listLiveTickets(bundle.branches[0]?.id) };
  },

  businessOnboard: async (body: {
    ownerName: string;
    ownerEmail: string;
    ownerPassword: string;
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
    plan: 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
  }) => {
    const sb = getBrowserSupabase();
    const companyId = id('co');
    const branchId = id('br');
    const serviceId = id('svc');
    const staffId = id('st');
    const slug = await uniqueCompanySlug(body.companyName);
    const branchSlug = slugify(body.branchName);
    const serviceSlug = slugify(body.serviceName);
    const company = await one<any>(sb.from('Company').insert({
      id: companyId,
      slug,
      name: body.companyName,
      industry: body.industry,
      logoText: initials(body.companyName),
      primaryColor: '#2563EB',
      secondaryColor: '#10B981',
      tagline: `${body.companyName} queues, reservations, and SMS updates.`,
      publicDescription: `Join ${body.companyName} online, reserve an arrival window, or scan a QR code at the branch.`,
      plan: body.plan,
      smsBalance: 250,
      healthScore: 90,
    }).select('*').single());
    const branch = await one<any>(sb.from('Branch').insert({
      id: branchId,
      companyId,
      slug: branchSlug,
      name: body.branchName,
      address: body.address || '',
      city: body.city,
      phone: body.branchPhone || body.ownerPhone,
      openingHours: body.openingHours,
      avgWaitMin: body.averageServiceMinutes,
    }).select('*').single());
    await sb.from('Service').insert({
      id: serviceId,
      companyId,
      branchId,
      slug: serviceSlug,
      name: body.serviceName,
      description: `${body.serviceName} queue at ${body.branchName}.`,
      averageServiceMinutes: body.averageServiceMinutes,
      icon: 'ticket',
    });
    await sb.from('StaffMember').insert({ id: staffId, companyId, branchId, name: body.ownerName, role: 'OWNER', counter: 'Counter 1', rating: 5 });
    const auth = await signUpAndProfile({
      email: body.ownerEmail,
      password: body.ownerPassword,
      role: 'COMPANY_OWNER',
      name: body.ownerName,
      phone: body.ownerPhone,
      destination: '/dashboard',
      companyId,
      staffId,
    });
    await sb.from('Subscription').insert({ id: id('sub'), companyId, plan: body.plan, status: body.plan === 'FREE' ? 'TRIALING' : 'ACTIVE', paymentMethod: 'MOCK_INVOICE' });
    await sb.from('BillingInvoice').insert({ id: id('inv'), companyId, type: 'SUBSCRIPTION', description: `${body.plan} plan activation`, amountCents: planPricesCents[body.plan], status: 'PAID', paymentMethod: 'MOCK_INVOICE' });
    const onboarding: BusinessOnboarding = {
      id: company.id,
      ownerName: body.ownerName,
      ownerEmail: body.ownerEmail,
      ownerPhone: body.ownerPhone,
      companyName: company.name,
      industry: company.industry,
      branchName: branch.name,
      address: branch.address,
      city: branch.city,
      branchPhone: branch.phone,
      openingHours: branch.openingHours,
      serviceName: body.serviceName,
      averageServiceMinutes: body.averageServiceMinutes,
      plan: body.plan,
      status: 'READY',
      createdAt: toIso(company.createdAt)!,
      launchLinks: { dashboard: '/dashboard', publicPage: `/c/${company.slug}`, staffConsole: '/staff', embed: '/dashboard/embed', billing: '/dashboard/billing' },
      checklist: [
        { label: 'Company profile created', done: true },
        { label: 'First branch configured', done: true },
        { label: 'First service configured', done: true },
        { label: 'Public queue page ready', done: true },
        { label: 'Staff console ready', done: true },
        { label: 'Billing plan selected', done: true },
      ],
    };
    return { onboarding, session: auth.session, user: auth.user };
  },

  businessWidget: async () => {
    const bundle = { company: await getCurrentCompany() };
    const origin = window.location.origin;
    return {
      company: bundle.company,
      widgetUrl: `${origin}/widget/${bundle.company.slug}`,
      iframe: `<iframe src="${origin}/widget/${bundle.company.slug}" width="100%" height="520" style="border:0;border-radius:12px;overflow:hidden" loading="lazy"></iframe>`,
      loader: `<div data-omukweyo-queue="${bundle.company.slug}"></div>\n<script src="${origin}/omukweyo-widget.js" async></script>`,
      publicUrl: `${origin}/c/${bundle.company.slug}`,
    };
  },

  companyProfile: async () => ({ company: await getCurrentCompany() }),

  businessWorkspace: async () => cached('business-workspace:current', 5_000, () => getCompanyBundle()),

  queueWorkspace: async () => cached('queue-workspace:current', 2_000, async () => {
    const bundle = await getCompanyBundle();
    const liveTickets = await listCompanyLiveTickets(bundle.company.id);
    return { ...bundle, liveTickets };
  }),

  staffWorkspace: async () => cached('staff-workspace:current', 2_000, async () => {
    const bundle = await getCompanyBundle();
    const liveTickets = await listCompanyLiveTickets(bundle.company.id);
    const metrics = {
      smsBalance: bundle.company.smsBalance,
      servedToday: bundle.staff.reduce((sum, member) => sum + member.servedToday, 0),
      liveWaiting: liveTickets.filter((ticket) => ticket.status === 'WAITING').length,
    };
    return { ...bundle, metrics, liveTickets, notifications: [] };
  }),

  analyticsOverview: async () => cached('analytics-overview:current', 5_000, async () => {
    const bundle = await getCompanyBundle();
    return { ...bundle, metrics: await computeMetricsFromBundle(bundle) };
  }),

  businessProfile: async (body: Partial<Pick<Company, 'name' | 'industry' | 'primaryColor' | 'secondaryColor' | 'logoText' | 'logoUrl' | 'heroImageUrl' | 'tagline' | 'websiteUrl' | 'publicDescription'>>) => {
    const user = await currentUser();
    if (!user?.companyId) throw new Error('Company profile not found');
    const patch = { ...body, logoText: body.logoText || (body.name ? initials(body.name) : undefined) };
    const company = await one<any>(getBrowserSupabase().from('Company').update(patch).eq('id', user.companyId).select('*').single());
    clearApiCache('current-company:', 'company-bundle:', 'business-workspace:', 'queue-workspace:', 'staff-workspace:', 'analytics-overview:', 'dashboard:', 'billing-overview');
    return { company: mapCompany(company) };
  },

  businessUploadAsset: async (file: File, type: 'logo' | 'hero') => {
    const user = await currentUser();
    if (!user?.companyId) throw new Error('Company profile not found');
    const uploaded = await uploadPublicAsset(file, `companies/${user.companyId}/${type}`);
    const asset = await one<any>(getBrowserSupabase().from('CompanyAsset').insert({
      id: id('asset'),
      companyId: user.companyId,
      type,
      url: uploaded.url,
      filename: uploaded.path,
      mimeType: uploaded.file.type,
      sizeBytes: uploaded.file.size,
    }).select('*').single());
    const { company } = await api.businessProfile(type === 'hero' ? { heroImageUrl: uploaded.url } : { logoUrl: uploaded.url });
    return { asset, company };
  },

  createBranch: async (body: { name: string; address?: string; city?: string; phone?: string; openingHours?: string; avgWaitMin?: number }) => {
    const user = await currentUser();
    if (!user?.companyId) throw new Error('Company profile not found');
    const branch = await one<any>(getBrowserSupabase().from('Branch').insert({
      id: id('br'),
      companyId: user.companyId,
      slug: slugify(body.name),
      name: body.name,
      address: body.address ?? '',
      city: body.city ?? 'Windhoek',
      phone: body.phone ?? '',
      openingHours: body.openingHours ?? '08:00 - 16:30',
      avgWaitMin: body.avgWaitMin ?? 8,
    }).select('*').single());
    clearApiCache('company-bundle:', 'business-workspace:', 'queue-workspace:', 'staff-workspace:', 'analytics-overview:', 'dashboard:');
    return { branch: mapBranch(branch) };
  },

  createService: async (body: { name: string; description?: string; branchId?: string; averageServiceMinutes?: number; icon?: string }) => {
    const user = await currentUser();
    if (!user?.companyId) throw new Error('Company profile not found');
    const service = await one<any>(getBrowserSupabase().from('Service').insert({
      id: id('svc'),
      companyId: user.companyId,
      branchId: body.branchId ?? null,
      slug: slugify(body.name),
      name: body.name,
      description: body.description ?? `${body.name} queue.`,
      averageServiceMinutes: body.averageServiceMinutes ?? 8,
      icon: body.icon ?? 'ticket',
    }).select('*').single());
    clearApiCache('company-bundle:', 'business-workspace:', 'queue-workspace:', 'staff-workspace:', 'analytics-overview:', 'dashboard:');
    return { service: mapService(service) };
  },

  inviteStaff: async (body: { name: string; email: string; branchId?: string; role?: string; counter?: string }) => {
    const user = await currentUser();
    if (!user?.companyId) throw new Error('Company profile not found');
    const staff = await one<any>(getBrowserSupabase().from('StaffMember').insert({
      id: id('st'),
      companyId: user.companyId,
      branchId: body.branchId ?? null,
      name: body.name,
      role: body.role ?? 'OPERATOR',
      counter: body.counter ?? 'Counter',
    }).select('*').single());
    clearApiCache('company-bundle:', 'business-workspace:', 'queue-workspace:', 'staff-workspace:', 'analytics-overview:', 'dashboard:');
    return { staff: mapStaff(staff), invite: { email: body.email, status: 'SENT' } };
  },

  billingOverview: async () => {
    const company = await getCurrentCompany();
    return cached(`billing-overview:${company.id}`, 5_000, async () => {
      const sb = getBrowserSupabase();
      const [subscription, invoices, purchases] = await Promise.all([
        one<any>(sb.from('Subscription').select('*').eq('companyId', company.id).maybeSingle(), 'No subscription').catch(() => null),
        many<any>(sb.from('BillingInvoice').select('*').eq('companyId', company.id).order('createdAt', { ascending: false }).limit(10)),
        many<any>(sb.from('SmsCreditPurchase').select('*').eq('companyId', company.id).order('createdAt', { ascending: false }).limit(10)),
      ]);
      const overview: BillingOverview = {
        company,
        subscription: subscription ? mapSubscription(subscription) : {
          id: `sub_${company.id}`,
          companyId: company.id,
          plan: company.plan,
          status: 'TRIALING',
          paymentMethod: 'MOCK_INVOICE',
          amountCents: planPricesCents[company.plan],
          currency: 'NAD',
          renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString(),
          updatedAt: nowIso(),
        },
        smsPackages,
        recentInvoices: invoices.map(mapInvoice),
        recentPurchases: purchases.map(mapSmsPurchase),
      };
      return overview;
    });
  },

  updateSubscription: async (body: { plan: Company['plan']; paymentMethod: BillingPaymentMethod }) => {
    const company = await getCurrentCompany();
    const sb = getBrowserSupabase();
    await sb.from('Company').update({ plan: body.plan }).eq('id', company.id);
    const existing = await sb.from('Subscription').select('id').eq('companyId', company.id).maybeSingle();
    const payload = { companyId: company.id, plan: body.plan, paymentMethod: body.paymentMethod, status: 'ACTIVE' };
    const subscription = existing.data
      ? await one<any>(sb.from('Subscription').update(payload).eq('id', existing.data.id).select('*').single())
      : await one<any>(sb.from('Subscription').insert({ id: id('sub'), ...payload }).select('*').single());
    await sb.from('BillingInvoice').insert({ id: id('inv'), companyId: company.id, type: 'SUBSCRIPTION', description: `${body.plan} plan subscription`, amountCents: planPricesCents[body.plan], paymentMethod: body.paymentMethod, status: 'PAID' });
    clearApiCache('billing-overview', 'current-company:', 'company-bundle:', 'business-workspace:', 'staff-workspace:', 'dashboard:');
    return { subscription: mapSubscription(subscription), billing: await api.billingOverview() };
  },

  purchaseSmsCredits: async (body: { packageId: SmsCreditPackage['id']; paymentMethod: BillingPaymentMethod }) => {
    const pack = smsPackages.find((item) => item.id === body.packageId);
    if (!pack) throw new Error('SMS package not found');
    const company = await getCurrentCompany();
    const sb = getBrowserSupabase();
    const invoice = await one<any>(sb.from('BillingInvoice').insert({ id: id('inv'), companyId: company.id, type: 'SMS_CREDITS', description: pack.name, amountCents: pack.priceCents, paymentMethod: body.paymentMethod, status: 'PAID' }).select('*').single());
    await sb.from('Company').update({ smsBalance: company.smsBalance + pack.credits }).eq('id', company.id);
    const purchase = await one<any>(sb.from('SmsCreditPurchase').insert({ id: id('sms'), companyId: company.id, packageId: pack.id, credits: pack.credits, amountCents: pack.priceCents, paymentMethod: body.paymentMethod, invoiceId: invoice.id }).select('*').single());
    clearApiCache('billing-overview', 'current-company:', 'company-bundle:', 'business-workspace:', 'staff-workspace:', 'dashboard:');
    return { purchase: mapSmsPurchase(purchase), billing: await api.billingOverview() };
  },

  branch: async (slug: string, companySlugValue?: string) => {
    const sb = getBrowserSupabase();
    const company = companySlugValue ? await one<any>(sb.from('Company').select('*').eq('slug', companySlugValue).single()) : undefined;
    let query = sb.from('Branch').select('*').eq('slug', slug);
    if (company) query = query.eq('companyId', company.id);
    const branch = await one<any>(query.single(), 'Branch not found');
    const services = await many<any>(sb.from('Service').select('*').eq('companyId', branch.companyId).or(`branchId.eq.${branch.id},branchId.is.null`).order('createdAt', { ascending: true }));
    return { branch: mapBranch(branch), services: services.map(mapService), liveTickets: await listLiveTickets(branch.id) };
  },

  liveQueue: async (branchId?: string) => cached(`live-queue:${branchId ?? 'company'}`, 1_000, async () => {
    if (branchId) return { tickets: await listLiveTickets(branchId) };
    const company = await getCurrentCompany();
    return { tickets: await listCompanyLiveTickets(company.id) };
  }),
  joinQueue: async (body: { branchId: string; serviceId: string; customerName: string; customerPhone: string; source?: QueueTicket['source'] }) => ({ ticket: await createTicket(body) }),

  customerSignup: async (body: { name: string; phone: string; email?: string; password?: string }) => {
    const customer = await upsertCustomer({ name: body.name, phone: body.phone, email: body.email });
    if (!body.email || !body.password) return { customer };
    const auth = await signUpAndProfile({ email: body.email, password: body.password, role: 'CUSTOMER', name: body.name, phone: body.phone, destination: '/customer', customerId: customer.id });
    return { customer, session: auth.session, user: auth.user };
  },

  customerUploadAvatar: async (customerId: string, file: File) => {
    const uploaded = await uploadPublicAsset(file, `customers/${customerId}`);
    const customer = await one<any>(getBrowserSupabase().from('Customer').update({ avatarUrl: uploaded.url }).eq('id', customerId).select('*').single());
    return { customer: mapCustomer(customer) };
  },

  deleteCustomer: async (customerId: string) => {
    const customer = await one<any>(getBrowserSupabase().from('Customer').delete().eq('id', customerId).select('*').single());
    return { deleted: true, customer: mapCustomer(customer) };
  },

  forgotPassword: async (email: string) => {
    const { error } = await getBrowserSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectTo('/reset-password'),
    });
    if (error) throw err(error);
    return { ok: true, mode: 'SUPABASE_AUTH', message: 'Password reset email requested.' };
  },

  changePassword: async (_currentPassword: string, newPassword: string) => {
    const { error } = await getBrowserSupabase().auth.updateUser({ password: newPassword });
    if (error) throw err(error);
    return { ok: true, mode: 'SUPABASE_AUTH', message: 'Password updated.' };
  },

  updateMyProfile: async (patch: { name?: string; phone?: string | null; email?: string; avatarUrl?: string | null }) => {
    const user = await currentUser();
    if (!user) throw new Error('Not signed in');
    const nextEmail = patch.email === undefined ? undefined : patch.email.trim().toLowerCase();
    if (nextEmail && nextEmail !== user.email.toLowerCase()) {
      const { error } = await getBrowserSupabase().auth.updateUser(
        { email: nextEmail },
        { emailRedirectTo: authRedirectTo('/profile') },
      );
      if (error) throw err(error, 'Could not request email change');
    }
    const result = await one<any>(getBrowserSupabase().from('User').update({
      name: patch.name ?? user.name,
      phone: patch.phone === undefined ? user.phone ?? null : patch.phone,
      email: nextEmail ?? user.email,
      avatarUrl: patch.avatarUrl === undefined ? user.avatarUrl ?? null : patch.avatarUrl,
    }).eq('id', user.id).select('*').single());
    return { user: await demoUserFromDb(result) };
  },

  uploadMyAvatar: async (file: File) => {
    const user = await currentUser();
    if (!user) throw new Error('Not signed in');
    const uploaded = await uploadPublicAsset(file, `users/${user.id}`);
    const result = await one<any>(getBrowserSupabase().from('User').update({ avatarUrl: uploaded.url }).eq('id', user.id).select('*').single());
    return { user: await demoUserFromDb(result), asset: { url: uploaded.url } };
  },

  deleteMyAccount: async () => {
    const user = await currentUser();
    if (!user) throw new Error('Not signed in');
    if (user.role === 'SUPER_ADMIN') throw new Error('Super admin accounts cannot self-delete');
    await getBrowserSupabase().from('User').delete().eq('id', user.id);
    await getBrowserSupabase().auth.signOut();
    return { ok: true, deleted: { id: user.id, email: user.email } };
  },

  customerReservations: async (customerId: string) => ({ customer: mapCustomer(await one<any>(getBrowserSupabase().from('Customer').select('*').eq('id', customerId).single())), reservations: await api.customerHistory(customerId).then((d) => d.reservations) }),

  customerVisit: async (customerId: string): Promise<CustomerVisitSummary> => {
    const customer = mapCustomer(await one<any>(getBrowserSupabase().from('Customer').select('*').eq('id', customerId).single()));
    const history = await api.customerHistory(customerId);
    const currentTicket = history.tickets.find((ticket: QueueTicket) => activeStatuses.includes(ticket.status));
    const notifications = await many<any>(getBrowserSupabase().from('Notification').select('*').or(`to.eq.${customer.phone}${currentTicket ? `,ticketId.eq.${currentTicket.id}` : ''}`).order('at', { ascending: false }).limit(10));
    return { customer, reservations: history.reservations, currentTicket, notifications: notifications.map(mapNotification) };
  },

  customerHistory: async (customerId: string) => {
    const customer = mapCustomer(await one<any>(getBrowserSupabase().from('Customer').select('*').eq('id', customerId).single()));
    const [ticketRows, reservationRows] = await Promise.all([
      many<any>(getBrowserSupabase().from('QueueTicket').select('*').eq('customerPhone', customer.phone).order('joinedAt', { ascending: false }).limit(100)),
      many<any>(getBrowserSupabase().from('FutureReservation').select('*').eq('customerId', customer.id).order('createdAt', { ascending: false })),
    ]);
    return {
      customer,
      tickets: await Promise.all(ticketRows.map(getTicketWithEvents)),
      reservations: await Promise.all(reservationRows.map(async (row) => getReservationRow(row.id).then((item) => item!))),
    };
  },

  createReservation: async (body: Parameters<typeof createReservation>[0]) => ({ reservation: await createReservation(body) }),
  getReservation: async (idValue: string) => ({ reservation: await getReservationRow(idValue), ticket: undefined }),
  bookReservationNow: async (idValue: string) => {
    const reservation = await getReservationRow(idValue);
    if (!reservation) throw new Error('Reservation not found');
    if (reservation.status === 'BOOKED' && reservation.ticketId) return { reservation, ticket: await getTicket(reservation.ticketId) };
    const ticket = await createTicket({ branchId: reservation.branchId, serviceId: reservation.serviceId, customerName: reservation.customerName, customerPhone: reservation.customerPhone, source: 'APPOINTMENT', reservationId: reservation.id });
    await getBrowserSupabase().from('FutureReservation').update({ status: 'BOOKED', bookedAt: nowIso(), ticketId: ticket.id }).eq('id', reservation.id);
    await getBrowserSupabase().from('ReservationEvent').insert({ id: id('rev'), reservationId: reservation.id, type: 'BOOKED', label: `Live ticket ${ticket.ticketNumber} created` });
    return { reservation: (await getReservationRow(reservation.id))!, ticket };
  },

  runnerApply: async (body: { name: string; email: string; password: string; phone: string; city: string; transportMode: string; payoutMethod: string; canStartAt: string; notes?: string }) => {
    const application = await one<any>(getBrowserSupabase().from('RunnerApplication').insert({ id: id('ra'), name: body.name, phone: body.phone, city: body.city, transportMode: body.transportMode, payoutMethod: body.payoutMethod, canStartAt: body.canStartAt, notes: body.notes ?? null }).select('*').single());
    const auth = await signUpAndProfile({ email: body.email, password: body.password, role: 'RUNNER', name: body.name, phone: body.phone, destination: '/runner/work' });
    return { application: mapRunnerApplication(application), session: auth.session, user: auth.user };
  },

  setRunnerApplicationStatus: async (idValue: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    const application = await one<any>(getBrowserSupabase().from('RunnerApplication').update({ status }).eq('id', idValue).select('*').single());
    return { application: mapRunnerApplication(application) };
  },

  runnerJobs: async () => ({ jobs: (await many<any>(getBrowserSupabase().from('RunnerJob').select('*').order('updatedAt', { ascending: false }))).map(mapRunnerJob) }),
  runnerAcceptJob: async (idValue: string, runnerName?: string) => {
    const job = await one<any>(getBrowserSupabase().from('RunnerJob').update({ status: 'ACCEPTED', runnerName: runnerName ?? 'Runner' }).eq('id', idValue).select('*').single());
    return { job: mapRunnerJob(job), jobs: await api.runnerJobs().then((d) => d.jobs) };
  },
  runnerCheckIn: async (idValue: string) => {
    const job = await one<any>(getBrowserSupabase().from('RunnerJob').update({ status: 'IN_LINE' }).eq('id', idValue).select('*').single());
    const notification = await logSms(job.customerPhone, 'RUNNER_UPDATE', `${job.runnerName ?? 'Runner'} checked in at ${job.placeName}.`);
    return { job: mapRunnerJob(job), notification, jobs: await api.runnerJobs().then((d) => d.jobs) };
  },
  runnerProof: async (idValue: string, message: string) => {
    const job = await one<any>(getBrowserSupabase().from('RunnerJob').update({ status: 'HANDOFF_READY' }).eq('id', idValue).select('*').single());
    const notification = await logSms(job.customerPhone, 'RUNNER_UPDATE', message);
    return { job: mapRunnerJob(job), notification, jobs: await api.runnerJobs().then((d) => d.jobs) };
  },
  runnerComplete: async (idValue: string) => {
    const job = await one<any>(getBrowserSupabase().from('RunnerJob').update({ status: 'COMPLETE' }).eq('id', idValue).select('*').single());
    const notification = await logSms(job.customerPhone, 'RUNNER_UPDATE', `${job.runnerName ?? 'Runner'} completed the handoff.`);
    return { job: mapRunnerJob(job), notification, jobs: await api.runnerJobs().then((d) => d.jobs) };
  },

  runnerRequest: async (body: { customerName: string; customerPhone: string; destinationName: string; destinationCity: string; destinationSource?: string; serviceName: string; targetArrivalAt: string; maxBudgetCents: number; instructions: string }) => {
    const customer = await upsertCustomer({ name: body.customerName, phone: body.customerPhone });
    const request = await one<any>(getBrowserSupabase().from('RunnerRequest').insert({ id: id('rr'), customerId: customer.id, ...body, destinationSource: body.destinationSource ?? 'MANUAL' }).select('*').single());
    await getBrowserSupabase().from('RunnerJob').insert({ id: id('rj'), customerName: body.customerName, customerPhone: body.customerPhone, placeName: body.destinationName, city: body.destinationCity, serviceName: body.serviceName, targetArrivalAt: body.targetArrivalAt, expectedWaitMinutes: 45, payoutCents: body.maxBudgetCents, status: 'OPEN', instructions: body.instructions });
    return { request };
  },
  runnerRequestById: async (idValue: string) => ({ request: await one<any>(getBrowserSupabase().from('RunnerRequest').select('*').eq('id', idValue).single()) }),
  customerRunnerRequests: async (customerId: string) => ({ requests: await many<any>(getBrowserSupabase().from('RunnerRequest').select('*').eq('customerId', customerId).order('createdAt', { ascending: false })) }),
  searchDestinations: async (q: string, city?: string) => {
    let query = getBrowserSupabase().from('RunnerDestination').select('*').ilike('name', `%${q}%`).limit(8);
    if (city) query = query.ilike('city', `%${city}%`);
    return { results: await many<any>(query), source: 'SUPABASE' };
  },

  adminOverview: async (): Promise<PlatformOverview> => {
    const sb = getBrowserSupabase();
    const [companies, branches, customers, liveTickets, reservations, applications, notifications, recentApplications, recentCompanies, recentReservations, liveBranches] = await Promise.all([
      sb.from('Company').select('id', { count: 'exact', head: true }),
      sb.from('Branch').select('id', { count: 'exact', head: true }),
      sb.from('Customer').select('id', { count: 'exact', head: true }),
      sb.from('QueueTicket').select('id', { count: 'exact', head: true }).in('status', activeStatuses),
      sb.from('FutureReservation').select('id', { count: 'exact', head: true }),
      sb.from('RunnerApplication').select('id', { count: 'exact', head: true }),
      sb.from('Notification').select('id', { count: 'exact', head: true }),
      many<any>(sb.from('RunnerApplication').select('*').order('createdAt', { ascending: false }).limit(5)),
      many<any>(sb.from('Company').select('*').order('createdAt', { ascending: false }).limit(5)),
      many<any>(sb.from('FutureReservation').select('*').order('createdAt', { ascending: false }).limit(5)),
      many<any>(sb.from('Branch').select('*').order('liveWaiting', { ascending: false }).limit(8)),
    ]);
    return {
      totals: {
        companies: companies.count ?? 0,
        branches: branches.count ?? 0,
        customers: customers.count ?? 0,
        liveTickets: liveTickets.count ?? 0,
        futureReservations: reservations.count ?? 0,
        runnerApplications: applications.count ?? 0,
        businessOnboardings: recentCompanies.length,
        notifications: notifications.count ?? 0,
      },
      roleCoverage: [
        { role: 'CUSTOMER', status: 'LIVE', entry: '/customer' },
        { role: 'COMPANY_OWNER', status: 'LIVE', entry: '/dashboard' },
        { role: 'COMPANY_MANAGER', status: 'LIVE', entry: '/dashboard' },
        { role: 'STAFF', status: 'LIVE', entry: '/staff' },
        { role: 'RUNNER', status: 'LIVE', entry: '/runner/work' },
        { role: 'SUPER_ADMIN', status: 'LIVE', entry: '/admin' },
      ],
      recentReservations: await Promise.all(recentReservations.map(async (row) => getReservationRow(row.id).then((item) => item!))),
      recentRunnerApplications: recentApplications.map(mapRunnerApplication),
      recentBusinessOnboardings: recentCompanies.map((company) => ({ id: company.id, ownerName: 'Owner', ownerEmail: '', ownerPhone: '', companyName: company.name, industry: company.industry, branchName: '', city: '', openingHours: '', serviceName: '', averageServiceMinutes: 0, plan: company.plan, status: 'READY', createdAt: toIso(company.createdAt)!, launchLinks: { dashboard: '/dashboard', publicPage: `/c/${company.slug}`, staffConsole: '/staff', embed: '/dashboard/embed', billing: '/dashboard/billing' }, checklist: [] })),
      liveBranches: liveBranches.map((branch) => ({ id: branch.id, name: branch.name, city: branch.city, isOpen: branch.isOpen, liveWaiting: branch.liveWaiting, avgWaitMin: branch.avgWaitMin })),
    };
  },

  getTicket: async (idValue: string) => ({ ticket: await getTicket(idValue) }),
  cancelTicket: async (idValue: string) => ({ ticket: await updateTicketStatus(idValue, 'CANCELLED') }),
  onMyWay: async (idValue: string) => {
    await getBrowserSupabase().from('TicketEvent').insert({ id: id('evt'), ticketId: idValue, type: 'ON_MY_WAY', label: 'Customer is on the way' });
    return { ticket: (await getTicket(idValue))! };
  },
  staffCallNext: async (branchId: string, counter?: string) => {
    const next = await one<any>(getBrowserSupabase().from('QueueTicket').select('*').eq('branchId', branchId).eq('status', 'WAITING').order('position', { ascending: true }).limit(1).maybeSingle(), 'No waiting tickets').catch(() => null);
    if (!next) throw new Error('No waiting tickets');
    return { ticket: await updateTicketStatus(next.id, 'CALLED', counter?.trim() || 'Counter 1') };
  },
  staffServe: async (ticketId: string) => ({ ticket: await updateTicketStatus(ticketId, 'SERVING') }),
  staffServed: async (ticketId: string) => ({ ticket: await updateTicketStatus(ticketId, 'SERVED') }),
  staffMissed: async (ticketId: string) => ({ ticket: await updateTicketStatus(ticketId, 'MISSED') }),
  staffHold: async (ticketId: string) => ({ ticket: await updateTicketStatus(ticketId, 'ON_HOLD') }),
  staffTransfer: async (ticketId: string, toServiceId: string, actor = 'Staff') => {
    const service = await one<any>(getBrowserSupabase().from('Service').select('*').eq('id', toServiceId).single(), 'Target service not found');
    const ticket = await one<any>(getBrowserSupabase().from('QueueTicket').update({ serviceId: service.id, serviceName: service.name, status: 'WAITING' }).eq('id', ticketId).select('*').single());
    await getBrowserSupabase().from('TicketEvent').insert({ id: id('evt'), ticketId, type: 'TRANSFER', label: `${actor} transferred ticket to ${service.name}` });
    await recalcPositions(ticket.branchId);
    clearQueueCaches();
    return { ticket: (await getTicket(ticketId))! };
  },
  staffSendSms: async (ticketId: string, message: string) => {
    const ticket = await getTicket(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    await getBrowserSupabase().from('TicketEvent').insert({ id: id('evt'), ticketId, type: 'MANUAL_SMS', label: 'Manual SMS update sent by staff' });
    const notification = await logSms(ticket.customerPhone, 'MANUAL_UPDATE', message, ticketId);
    return { notification, ticket: (await getTicket(ticketId))! };
  },

  dashboard: async (companySlugValue?: string) => {
    return cached(`dashboard:${companySlugValue ?? 'current'}`, 3_000, async () => {
      const bundle = await getCompanyBundle(companySlugValue);
      const [metrics, liveTickets, notificationRows] = await Promise.all([
        computeMetricsFromBundle(bundle),
        listCompanyLiveTickets(bundle.company.id),
        many<any>(getBrowserSupabase().from('Notification').select('*').order('at', { ascending: false }).limit(50)),
      ]);
      const ticketIds = new Set(liveTickets.map((ticket) => ticket.id));
      return {
        ...bundle,
        metrics,
        liveTickets,
        notifications: notificationRows
          .filter((notification) => notification.ticketId && ticketIds.has(notification.ticketId))
          .map(mapNotification),
      };
    });
  },

  dashboardMetrics: async (companySlugValue?: string) => {
    return cached(`dashboard-metrics:${companySlugValue ?? 'current'}`, 5_000, async () => computeMetrics(companySlugValue));
  },

  notifications: async () => cached('notifications', 3_000, async () => ({ notifications: (await many<any>(getBrowserSupabase().from('Notification').select('*').order('at', { ascending: false }).limit(50))).map(mapNotification) })),
};
