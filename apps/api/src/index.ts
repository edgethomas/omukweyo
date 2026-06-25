import express from 'express';
import cors from 'cors';
import http from 'http';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { Server as IOServer } from 'socket.io';
import {
  acceptRunnerJob,
  bookReservationNow,
  callNext,
  completeRunnerJob,
  computeMetrics,
  createBusinessOnboarding,
  createReservation,
  createRunnerApplication,
  createRunnerRequest,
  setRunnerApplicationStatus,
  createTicket,
  ensureDestinationSeeded,
  getBranchBySlug,
  getCompanyBundle,
  getCustomerHistory,
  getDashboard,
  getDemoUserByToken,
  getPlatformOverview,
  getReservation,
  getRunnerRequest,
  getSocketInitialEvents,
  getTicket,
  getWidgetConfig,
  listBusinessDirectory,
  listCustomerReservations,
  listCustomerRunnerRequests,
  listLiveTickets,
  listRunnerJobs,
  logSms,
  loginDemoUser,
  logoutDemoUser,
  prisma,
  purchaseSmsCredits,
  recordCompanyAsset,
  runnerCheckIn,
  runnerProofUpdate,
  searchDestinations,
  sendTicketSms,
  transferTicket,
  updateBusinessProfile,
  updateSubscriptionPlan,
  updateTicketStatus,
  upsertCustomer,
  getCustomerVisit,
  getBillingOverview,
  updateCustomerAvatar,
  deleteCustomerAccount,
} from './store.js';
import {
  BusinessOnboardingBody,
  CallNextBody,
  CompanySlug,
  CreateReservationBody,
  CreateRunnerRequestBody,
  CustomerSignupBody,
  JoinQueueBody,
  LoginBody,
  PurchaseSmsCreditsBody,
  ReservationParams,
  RunnerAcceptBody,
  RunnerApplicationBody,
  RunnerJobParams,
  RunnerProofBody,
  StaffSmsBody,
  TicketActionBody,
  TransferBody,
  UpdateSubscriptionBody,
} from './schemas.js';
import type { Company, DemoUser, Role, ServerEvent } from '@inline/shared';

const PORT = Number(process.env.PORT ?? 4000);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
const UPLOAD_BASE_URL = process.env.UPLOAD_BASE_URL ?? `http://localhost:${PORT}/uploads`;

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const uploadRoot = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(apiRoot, 'uploads');
const webDistRoot = process.env.WEB_DIST_DIR ? path.resolve(process.env.WEB_DIST_DIR) : path.resolve(apiRoot, '../web/dist');
mkdirSync(uploadRoot, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadRoot),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeBase = path.basename(file.originalname, ext).replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
      cb(null, `${Date.now()}-${safeBase || 'asset'}${ext}`);
    },
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(png|jpe?g|webp|gif|svg\+xml)$/i.test(file.mimetype)) return cb(new Error('Only image uploads are allowed'));
    cb(null, true);
  },
});

const app = express();
app.use(cors({ origin: WEB_ORIGIN, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(uploadRoot));

const server = http.createServer(app);
const io = new IOServer(server, { cors: { origin: WEB_ORIGIN } });

function broadcast(event: ServerEvent) {
  io.emit('omukweyo:event', event);
}

function bearerToken(req: express.Request): string | null {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

function httpError(status: number, code: string, message: string) {
  return new ApiError(status, code, message);
}

function safeErrorMessage(error: any, fallback: string) {
  const message = typeof error?.message === 'string' ? error.message : '';
  if (!message) return fallback;
  if (/prisma|database|invocation|C:\\|\/app\/|unknown authentication plugin/i.test(message)) return fallback;
  return message;
}

function asyncRoute(handler: (req: express.Request, res: express.Response) => Promise<void>) {
  return (req: express.Request, res: express.Response) => {
    handler(req, res).catch((error) => {
      console.error(error);
      const isApiError = error instanceof ApiError;
      const status = isApiError ? error.status : 500;
      const code = isApiError ? error.code : 'server_error';
      res.status(status).json({ error: code, message: isApiError ? error.message : 'Unexpected server error' });
    });
  };
}

async function currentUser(req: express.Request): Promise<DemoUser | undefined> {
  const token = bearerToken(req);
  return token ? getDemoUserByToken(token) : undefined;
}

async function requireUser(req: express.Request): Promise<DemoUser> {
  const user = await currentUser(req);
  if (!user) throw httpError(401, 'unauthorized', 'Session missing or expired');
  return user;
}

async function requireRole(req: express.Request, allowedRoles: Role[]): Promise<DemoUser> {
  const user = await requireUser(req);
  if (!allowedRoles.includes(user.role)) throw httpError(403, 'forbidden', 'Your account cannot access this workspace');
  return user;
}

async function requireCompanyUser(
  req: express.Request,
  allowedRoles: Role[] = ['COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF'],
): Promise<{ user: DemoUser; companyId: string; companySlug: string }> {
  const user = await requireRole(req, allowedRoles);
  if (!user.companyId) throw httpError(403, 'company_required', 'Your account is not attached to a company');
  const company = await prisma.company.findUnique({ where: { id: user.companyId }, select: { id: true, slug: true } });
  if (!company) throw httpError(404, 'company_not_found', 'Company not found');
  return { user, companyId: company.id, companySlug: company.slug };
}

async function requireBranchInCompany(branchId: string, companyId: string) {
  const branch = await prisma.branch.findFirst({ where: { id: branchId, companyId }, select: { id: true } });
  if (!branch) throw httpError(403, 'branch_forbidden', 'Branch does not belong to your company');
}

async function requireServiceInCompany(serviceId: string, companyId: string) {
  const service = await prisma.service.findFirst({ where: { id: serviceId, companyId }, select: { id: true } });
  if (!service) throw httpError(403, 'service_forbidden', 'Service does not belong to your company');
}

async function requireTicketAccess(req: express.Request, ticketId: string) {
  const user = await currentUser(req);
  const ticket = await prisma.queueTicket.findUnique({ where: { id: ticketId }, select: { id: true, companyId: true, customerPhone: true } });
  if (!ticket) throw httpError(404, 'not_found', 'Ticket not found');
  if (!user) return { user, ticket };
  if (user.role === 'SUPER_ADMIN') return { user, ticket };
  if (user.companyId && user.companyId === ticket.companyId) return { user, ticket };
  if (user.role === 'CUSTOMER' && user.phone && user.phone === ticket.customerPhone) return { user, ticket };
  throw httpError(403, 'forbidden', 'You cannot access this ticket');
}

async function requireCompanyTicket(req: express.Request, ticketId: string) {
  const scope = await requireCompanyUser(req, ['COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF']);
  const ticket = await prisma.queueTicket.findFirst({ where: { id: ticketId, companyId: scope.companyId }, select: { id: true } });
  if (!ticket) throw httpError(403, 'ticket_forbidden', 'Ticket does not belong to your company');
  return scope;
}

async function requireRunnerUser(req: express.Request) {
  return requireRole(req, ['RUNNER', 'SUPER_ADMIN']);
}

async function requireCustomerAccess(req: express.Request, customerId: string) {
  const user = await requireUser(req);
  if (user.role === 'SUPER_ADMIN') return user;
  if (user.role !== 'CUSTOMER') throw httpError(403, 'forbidden', 'Only customer accounts can change this profile');
  if (user.customerId && user.customerId === customerId) return user;
  const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { phone: true, email: true } });
  if (customer && ((user.phone && user.phone === customer.phone) || user.email === customer.email)) return user;
  throw httpError(403, 'forbidden', 'You cannot change this customer profile');
}

function originFor(req: express.Request) {
  return req.get('origin') ?? WEB_ORIGIN;
}

function assetUrl(file: Express.Multer.File) {
  return `${UPLOAD_BASE_URL}/${encodeURIComponent(file.filename)}`;
}

function activeCompanyQuery(req: express.Request, companySlug: string) {
  if (typeof req.query.company === 'string' && req.query.company !== companySlug) {
    throw httpError(403, 'company_forbidden', 'You cannot access another company workspace');
  }
  return companySlug;
}

// ---------- auth ----------

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'bad_request', message: 'Invalid login payload', details: parsed.error.flatten() });
  try {
    const session = await loginDemoUser(parsed.data.email, parsed.data.password);
    res.json({ session, user: session.user });
  } catch (error: any) {
    console.error('Login failed', error);
    res.status(401).json({ error: 'invalid_credentials', message: 'Invalid email or password' });
  }
}));

app.get('/api/auth/me', asyncRoute(async (req, res) => {
  const user = await requireUser(req);
  res.json({ user });
}));

app.post('/api/auth/logout', asyncRoute(async (req, res) => {
  const token = bearerToken(req);
  if (token) await logoutDemoUser(token);
  res.json({ ok: true });
}));

app.post('/api/auth/forgot-password', asyncRoute(async (_req, res) => {
  res.json({ ok: true, mode: 'LOCAL_PRESENTATION', message: 'Password reset email is simulated in this local build.' });
}));

app.post('/api/auth/change-password', asyncRoute(async (req, res) => {
  const body = (req.body ?? {}) as { currentPassword?: string; newPassword?: string };
  if (!body.currentPassword || !body.newPassword) {
    res.status(400).json({ error: 'invalid_input', message: 'Current and new password are both required.' });
    return;
  }
  if (String(body.newPassword).length < 6) {
    res.status(400).json({ error: 'weak_password', message: 'New password must be at least 6 characters.' });
    return;
  }
  res.json({ ok: true, mode: 'LOCAL_PRESENTATION', message: 'Password updated (local simulation).' });
}));

app.post('/api/auth/verify-phone', asyncRoute(async (_req, res) => {
  res.json({ ok: true, mode: 'LOCAL_PRESENTATION', message: 'Phone verification is simulated in this local build.' });
}));

// ---------- public ----------

app.get('/api/health', asyncRoute(async (_req, res) => {
  const [tickets, notifications, companies] = await Promise.all([
    prisma.queueTicket.count(),
    prisma.notification.count(),
    prisma.company.count(),
  ]);
  res.json({ ok: true, uptime: process.uptime(), tickets, notifications, companies });
}));

app.get('/api/company/:slug', asyncRoute(async (req, res) => {
  const parsed = CompanySlug.safeParse(req.params);
  if (!parsed.success) return void res.status(400).json({ error: 'bad_request', message: 'Invalid slug' });
  const bundle = await getCompanyBundle(parsed.data.slug);
  if (!bundle) return void res.status(404).json({ error: 'not_found', message: 'Company not found' });
  res.json(bundle);
}));

app.get('/api/businesses', asyncRoute(async (req, res) => {
  const query = typeof req.query.q === 'string'
    ? req.query.q
    : typeof req.query.search === 'string'
      ? req.query.search
      : '';
  res.json({ businesses: await listBusinessDirectory(query) });
}));

app.get('/api/branch/:branchSlug', asyncRoute(async (req, res) => {
  const companySlug = typeof req.query.company === 'string' ? req.query.company : undefined;
  const payload = await getBranchBySlug(req.params.branchSlug, companySlug);
  if (!payload) return void res.status(404).json({ error: 'not_found', message: 'Branch not found' });
  res.json(payload);
}));

// ---------- business onboarding + management ----------

app.post('/api/business/onboard', asyncRoute(async (req, res) => {
  const parsed = BusinessOnboardingBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'bad_request', message: 'Invalid business onboarding payload', details: parsed.error.flatten() });
  try {
    const onboarding = await createBusinessOnboarding({
      ownerName: parsed.data.ownerName,
      ownerEmail: parsed.data.ownerEmail,
      ownerPhone: parsed.data.ownerPhone,
      companyName: parsed.data.companyName,
      industry: parsed.data.industry,
      branchName: parsed.data.branchName,
      address: parsed.data.address || undefined,
      city: parsed.data.city,
      branchPhone: parsed.data.branchPhone || undefined,
      openingHours: parsed.data.openingHours,
      serviceName: parsed.data.serviceName,
      averageServiceMinutes: parsed.data.averageServiceMinutes,
      plan: parsed.data.plan,
    });
    res.status(201).json({ onboarding });
  } catch (error: any) {
    res.status(400).json({ error: 'onboarding_failed', message: safeErrorMessage(error, 'Failed to create business') });
  }
}));

app.get('/api/business/widget', asyncRoute(async (req, res) => {
  const { companySlug } = await requireCompanyUser(req, ['COMPANY_OWNER', 'COMPANY_MANAGER']);
  res.json(await getWidgetConfig(companySlug, originFor(req)));
}));

app.patch('/api/business/profile', asyncRoute(async (req, res) => {
  const { companyId } = await requireCompanyUser(req, ['COMPANY_OWNER', 'COMPANY_MANAGER']);
  const allowed = ['name', 'industry', 'primaryColor', 'secondaryColor', 'logoText', 'logoUrl', 'heroImageUrl', 'tagline', 'websiteUrl', 'publicDescription'] as const;
  const patch: Partial<Pick<Company, typeof allowed[number]>> = {};
  for (const key of allowed) {
    if (typeof req.body?.[key] === 'string') (patch as any)[key] = req.body[key].trim();
  }
  const company = await updateBusinessProfile(companyId, patch);
  res.json({ company });
}));

app.post('/api/business/assets', upload.single('asset'), asyncRoute(async (req, res) => {
  const { companyId } = await requireCompanyUser(req, ['COMPANY_OWNER', 'COMPANY_MANAGER']);
  if (!req.file) return void res.status(400).json({ error: 'bad_request', message: 'Upload an image file named asset' });
  const type = typeof req.body?.type === 'string' && req.body.type === 'hero' ? 'hero' : 'logo';
  const asset = await recordCompanyAsset(companyId, {
    type,
    url: assetUrl(req.file),
    filename: req.file.filename,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
  });
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  res.status(201).json({ asset, company });
}));

app.post('/api/business/branches', asyncRoute(async (req, res) => {
  const { companyId } = await requireCompanyUser(req, ['COMPANY_OWNER', 'COMPANY_MANAGER']);
  const name = String(req.body?.name ?? '').trim();
  if (!name) return void res.status(400).json({ error: 'bad_request', message: 'Branch name is required' });
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const branch = await prisma.branch.create({
    data: {
      companyId,
      slug,
      name,
      address: String(req.body?.address ?? ''),
      city: String(req.body?.city ?? 'Windhoek'),
      phone: String(req.body?.phone ?? ''),
      openingHours: String(req.body?.openingHours ?? '08:00 - 16:30'),
      avgWaitMin: Number(req.body?.avgWaitMin ?? 8),
    },
  });
  res.status(201).json({ branch });
}));

app.post('/api/business/services', asyncRoute(async (req, res) => {
  const { companyId } = await requireCompanyUser(req, ['COMPANY_OWNER', 'COMPANY_MANAGER']);
  const name = String(req.body?.name ?? '').trim();
  if (!name) return void res.status(400).json({ error: 'bad_request', message: 'Service name is required' });
  if (req.body?.branchId) await requireBranchInCompany(String(req.body.branchId), companyId);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const service = await prisma.service.create({
    data: {
      companyId,
      branchId: req.body?.branchId || undefined,
      slug,
      name,
      description: String(req.body?.description ?? `${name} queue`),
      averageServiceMinutes: Number(req.body?.averageServiceMinutes ?? 8),
      icon: String(req.body?.icon ?? 'ticket'),
    },
  });
  res.status(201).json({ service });
}));

app.post('/api/business/staff', asyncRoute(async (req, res) => {
  const { companyId } = await requireCompanyUser(req, ['COMPANY_OWNER', 'COMPANY_MANAGER']);
  const name = String(req.body?.name ?? '').trim();
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  if (!name || !email) return void res.status(400).json({ error: 'bad_request', message: 'Staff name and email are required' });
  if (req.body?.branchId) await requireBranchInCompany(String(req.body.branchId), companyId);
  const staff = await prisma.staffMember.create({
    data: {
      companyId,
      branchId: req.body?.branchId || undefined,
      name,
      role: String(req.body?.role ?? 'OPERATOR'),
      counter: String(req.body?.counter ?? 'Counter'),
    },
  });
  res.status(201).json({ staff, invite: { email, status: 'READY_TO_SEND' } });
}));

// ---------- billing ----------

app.get('/api/billing/overview', asyncRoute(async (req, res) => {
  const { companySlug } = await requireCompanyUser(req, ['COMPANY_OWNER', 'COMPANY_MANAGER']);
  res.json(await getBillingOverview(companySlug));
}));

app.post('/api/billing/subscription', asyncRoute(async (req, res) => {
  const { companySlug } = await requireCompanyUser(req, ['COMPANY_OWNER']);
  const parsed = UpdateSubscriptionBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'bad_request', message: 'Invalid subscription payload', details: parsed.error.flatten() });
  const subscription = await updateSubscriptionPlan(parsed.data.plan, parsed.data.paymentMethod, companySlug);
  res.json({ subscription, billing: await getBillingOverview(companySlug) });
}));

app.post('/api/billing/sms-credits', asyncRoute(async (req, res) => {
  const { companySlug } = await requireCompanyUser(req, ['COMPANY_OWNER', 'COMPANY_MANAGER']);
  const parsed = PurchaseSmsCreditsBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'bad_request', message: 'Invalid SMS credit purchase', details: parsed.error.flatten() });
  try {
    const purchase = await purchaseSmsCredits(parsed.data.packageId, parsed.data.paymentMethod, companySlug);
    res.status(201).json({ purchase, billing: await getBillingOverview(companySlug) });
  } catch (error: any) {
    res.status(400).json({ error: 'purchase_failed', message: safeErrorMessage(error, 'Failed to buy credits') });
  }
}));

// ---------- queue + customers ----------

app.get('/api/queue/live', asyncRoute(async (req, res) => {
  const branchId = typeof req.query.branchId === 'string' ? req.query.branchId : undefined;
  res.json({ tickets: await listLiveTickets(branchId) });
}));

app.post('/api/queue/join', asyncRoute(async (req, res) => {
  const parsed = JoinQueueBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'bad_request', message: 'Invalid join payload', details: parsed.error.flatten() });
  try {
    const ticket = await createTicket(parsed.data);
    const bundle = await getCompanyBundle(ticket.companySlug);
    const branch = bundle?.branches.find((item) => item.id === ticket.branchId);
    const notification = await logSms(
      ticket.customerPhone,
      'TICKET_CREATED',
      `Hi ${ticket.customerName.split(' ')[0]}, you joined ${bundle?.company.name ?? 'the company'} ${branch?.name ?? ''} for ${ticket.serviceName}. Ticket ${ticket.ticketNumber}. Track: /ticket/${ticket.id}`,
      ticket.id,
    );
    broadcast({ type: 'ticket:created', ticket });
    broadcast({ type: 'notification:logged', notification });
    broadcast({ type: 'metrics:updated', metrics: await computeMetrics(ticket.companySlug) });
    res.status(201).json({ ticket });
  } catch (error: any) {
    res.status(400).json({ error: 'join_failed', message: safeErrorMessage(error, 'Failed to join') });
  }
}));

app.post('/api/customers/signup', asyncRoute(async (req, res) => {
  const parsed = CustomerSignupBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'bad_request', message: 'Invalid signup payload', details: parsed.error.flatten() });
  const customer = await upsertCustomer({
    name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email || undefined,
    avatarUrl: parsed.data.avatarUrl || undefined,
  });
  const user = await currentUser(req);
  if (user?.role === 'CUSTOMER') {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: customer.name,
        phone: customer.phone,
        customerId: customer.id,
        destination: '/customer',
      },
    });
  }
  res.status(201).json({ customer });
}));

app.post('/api/customers/:id/avatar', upload.single('avatar'), asyncRoute(async (req, res) => {
  await requireCustomerAccess(req, req.params.id);
  if (!req.file) return void res.status(400).json({ error: 'bad_request', message: 'Upload an image file named avatar' });
  const customer = await updateCustomerAvatar(req.params.id, assetUrl(req.file));
  res.status(201).json({ customer });
}));

app.delete('/api/customers/:id', asyncRoute(async (req, res) => {
  await requireCustomerAccess(req, req.params.id);
  const customer = await deleteCustomerAccount(req.params.id);
  res.json({ deleted: true, customer });
}));

app.get('/api/customers/:id/reservations', asyncRoute(async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!customer) return void res.status(404).json({ error: 'not_found', message: 'Customer not found' });
  res.json({ customer, reservations: await listCustomerReservations(customer.id) });
}));

app.get('/api/customers/:id/visit', asyncRoute(async (req, res) => {
  try {
    res.json(await getCustomerVisit(req.params.id));
  } catch (error: any) {
    res.status(404).json({ error: 'not_found', message: safeErrorMessage(error, 'Customer not found') });
  }
}));

app.get('/api/customers/:id/history', asyncRoute(async (req, res) => {
  await requireCustomerAccess(req, req.params.id);
  try {
    res.json(await getCustomerHistory(req.params.id));
  } catch (error: any) {
    res.status(404).json({ error: 'not_found', message: safeErrorMessage(error, 'Customer not found') });
  }
}));

app.post('/api/reservations', asyncRoute(async (req, res) => {
  const parsed = CreateReservationBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'bad_request', message: 'Invalid reservation payload', details: parsed.error.flatten() });
  try {
    const reservation = await createReservation({
      customerId: parsed.data.customerId,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      customerEmail: parsed.data.customerEmail || undefined,
      branchId: parsed.data.branchId,
      serviceId: parsed.data.serviceId,
      targetArrivalAt: parsed.data.targetArrivalAt,
      arrivalWindowMinutes: parsed.data.arrivalWindowMinutes,
      paymentMethod: parsed.data.paymentMethod,
    });
    const bundle = await getCompanyBundle(reservation.companySlug);
    const notification = await logSms(
      reservation.customerPhone,
      'RESERVATION_CREATED',
      `Hi ${reservation.customerName.split(' ')[0]}, your ${reservation.serviceName} reservation at ${bundle?.company.name ?? 'the company'} ${reservation.branchName} is paid. We'll book your live spot around ${new Date(reservation.smartJoinAt).toLocaleTimeString('en-NA', { hour: '2-digit', minute: '2-digit' })}.`,
      undefined,
      reservation.id,
    );
    broadcast({ type: 'reservation:created', reservation });
    broadcast({ type: 'notification:logged', notification });
    res.status(201).json({ reservation });
  } catch (error: any) {
    res.status(400).json({ error: 'reservation_failed', message: safeErrorMessage(error, 'Failed to reserve ticket') });
  }
}));

app.get('/api/reservations/:id', asyncRoute(async (req, res) => {
  const parsed = ReservationParams.safeParse(req.params);
  if (!parsed.success) return void res.status(400).json({ error: 'bad_request', message: 'Invalid reservation id' });
  const reservation = await getReservation(parsed.data.id);
  if (!reservation) return void res.status(404).json({ error: 'not_found', message: 'Reservation not found' });
  const ticket = reservation.ticketId ? await getTicket(reservation.ticketId) : undefined;
  res.json({ reservation, ticket });
}));

app.post('/api/reservations/:id/book-now', asyncRoute(async (req, res) => {
  const parsed = ReservationParams.safeParse(req.params);
  if (!parsed.success) return void res.status(400).json({ error: 'bad_request', message: 'Invalid reservation id' });
  try {
    const { reservation, ticket } = await bookReservationNow(parsed.data.id);
    const notification = await logSms(
      reservation.customerPhone,
      'RESERVATION_BOOKED',
      `Hi ${reservation.customerName.split(' ')[0]}, Omukweyo booked your live spot. Ticket ${ticket.ticketNumber}. Track: /ticket/${ticket.id}`,
      ticket.id,
      reservation.id,
    );
    broadcast({ type: 'ticket:created', ticket });
    broadcast({ type: 'reservation:booked', reservation, ticket });
    broadcast({ type: 'notification:logged', notification });
    res.json({ reservation, ticket });
  } catch (error: any) {
    res.status(400).json({ error: 'book_failed', message: safeErrorMessage(error, 'Failed to book reservation') });
  }
}));

// ---------- runners ----------

app.post('/api/runners/apply', asyncRoute(async (req, res) => {
  const parsed = RunnerApplicationBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'bad_request', message: 'Invalid runner application', details: parsed.error.flatten() });
  const application = await createRunnerApplication({
    name: parsed.data.name,
    phone: parsed.data.phone,
    city: parsed.data.city,
    transportMode: parsed.data.transportMode,
    payoutMethod: parsed.data.payoutMethod,
    canStartAt: parsed.data.canStartAt,
    notes: parsed.data.notes || undefined,
  });
  res.status(201).json({ application });
}));

app.post('/api/runners/applications/:id/status', asyncRoute(async (req, res) => {
  const status = String(req.body?.status ?? '').toUpperCase();
  if (status !== 'PENDING' && status !== 'APPROVED' && status !== 'REJECTED') {
    return void res.status(400).json({ error: 'invalid_status', message: 'Status must be PENDING, APPROVED, or REJECTED.' });
  }
  try {
    const application = await setRunnerApplicationStatus(req.params.id, status);
    res.json({ application });
  } catch (err: any) {
    res.status(404).json({ error: 'not_found', message: safeErrorMessage(err, 'Runner application not found.') });
  }
}));

app.post('/api/runner-requests', asyncRoute(async (req, res) => {
  const user = await currentUser(req);
  const parsed = CreateRunnerRequestBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'bad_request', message: 'Invalid runner request', details: parsed.error.flatten() });
  try {
    const request = await createRunnerRequest({
      customerId: parsed.data.customerId ?? user?.customerId,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      destinationName: parsed.data.destinationName,
      destinationCity: parsed.data.destinationCity,
      destinationSource: parsed.data.destinationSource ?? 'MANUAL',
      serviceName: parsed.data.serviceName,
      targetArrivalAt: parsed.data.targetArrivalAt,
      maxBudgetCents: parsed.data.maxBudgetCents,
      instructions: parsed.data.instructions,
    });
    res.status(201).json({ request });
  } catch (error: any) {
    res.status(400).json({ error: 'request_failed', message: safeErrorMessage(error, 'Failed to create runner request') });
  }
}));

app.get('/api/runner-requests/:id', asyncRoute(async (req, res) => {
  const request = await getRunnerRequest(req.params.id);
  if (!request) return void res.status(404).json({ error: 'not_found' });
  res.json({ request });
}));

app.get('/api/customers/:id/runner-requests', asyncRoute(async (req, res) => {
  await requireCustomerAccess(req, req.params.id);
  res.json({ requests: await listCustomerRunnerRequests(req.params.id) });
}));

app.get('/api/destinations/search', asyncRoute(async (req, res) => {
  await ensureDestinationSeeded();
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  const city = typeof req.query.city === 'string' ? req.query.city : undefined;
  const results = await searchDestinations(q, city);
  res.json({
    results,
    source: process.env.GOOGLE_PLACES_API_KEY ? 'GOOGLE_PLACES' : 'LOCAL_SEED',
  });
}));

app.get('/api/runners/jobs', asyncRoute(async (req, res) => {
  await requireRunnerUser(req);
  res.json({ jobs: await listRunnerJobs() });
}));

app.post('/api/runners/jobs/:id/accept', asyncRoute(async (req, res) => {
  await requireRunnerUser(req);
  const params = RunnerJobParams.safeParse(req.params);
  const body = RunnerAcceptBody.safeParse(req.body ?? {});
  if (!params.success || !body.success) return void res.status(400).json({ error: 'bad_request', message: 'Invalid runner job accept payload' });
  try {
    const job = await acceptRunnerJob(params.data.id, body.data.runnerName);
    res.json({ job, jobs: await listRunnerJobs() });
  } catch (error: any) {
    res.status(400).json({ error: 'runner_job_failed', message: safeErrorMessage(error, 'Failed to accept runner job') });
  }
}));

app.post('/api/runners/jobs/:id/check-in', asyncRoute(async (req, res) => {
  await requireRunnerUser(req);
  const params = RunnerJobParams.safeParse(req.params);
  if (!params.success) return void res.status(400).json({ error: 'bad_request', message: 'Invalid runner job id' });
  try {
    const { job, notification } = await runnerCheckIn(params.data.id);
    broadcast({ type: 'notification:logged', notification });
    res.json({ job, notification, jobs: await listRunnerJobs() });
  } catch (error: any) {
    res.status(400).json({ error: 'runner_job_failed', message: safeErrorMessage(error, 'Failed to check in') });
  }
}));

app.post('/api/runners/jobs/:id/proof', asyncRoute(async (req, res) => {
  await requireRunnerUser(req);
  const params = RunnerJobParams.safeParse(req.params);
  const body = RunnerProofBody.safeParse(req.body);
  if (!params.success || !body.success) return void res.status(400).json({ error: 'bad_request', message: 'Invalid runner proof payload' });
  try {
    const { job, notification } = await runnerProofUpdate(params.data.id, body.data.message);
    broadcast({ type: 'notification:logged', notification });
    res.json({ job, notification, jobs: await listRunnerJobs() });
  } catch (error: any) {
    res.status(400).json({ error: 'runner_job_failed', message: safeErrorMessage(error, 'Failed to send runner proof') });
  }
}));

app.post('/api/runners/jobs/:id/complete', asyncRoute(async (req, res) => {
  await requireRunnerUser(req);
  const params = RunnerJobParams.safeParse(req.params);
  if (!params.success) return void res.status(400).json({ error: 'bad_request', message: 'Invalid runner job id' });
  try {
    const { job, notification } = await completeRunnerJob(params.data.id);
    broadcast({ type: 'notification:logged', notification });
    res.json({ job, notification, jobs: await listRunnerJobs() });
  } catch (error: any) {
    res.status(400).json({ error: 'runner_job_failed', message: safeErrorMessage(error, 'Failed to complete runner job') });
  }
}));

// ---------- tickets + staff ----------

app.get('/api/ticket/:id', asyncRoute(async (req, res) => {
  const ticket = await getTicket(req.params.id);
  if (!ticket) return void res.status(404).json({ error: 'not_found' });
  res.json({ ticket });
}));

app.post('/api/ticket/:id/cancel', asyncRoute(async (req, res) => {
  try {
    await requireTicketAccess(req, req.params.id);
    const ticket = await updateTicketStatus(req.params.id, 'CANCELLED');
    broadcast({ type: 'ticket:updated', ticket });
    res.json({ ticket });
  } catch (error: any) {
    res.status(400).json({ error: 'cancel_failed', message: safeErrorMessage(error, 'Failed to cancel ticket') });
  }
}));

app.post('/api/ticket/:id/on-my-way', asyncRoute(async (req, res) => {
  await requireTicketAccess(req, req.params.id);
  const ticket = await getTicket(req.params.id);
  if (!ticket) return void res.status(404).json({ error: 'not_found' });
  await prisma.ticketEvent.create({ data: { ticketId: ticket.id, type: 'ON_MY_WAY', label: 'Customer on the way' } });
  const updated = await getTicket(ticket.id);
  const notification = await logSms(ticket.customerPhone, 'CALLED', `Hi ${ticket.customerName.split(' ')[0]}, thanks! We see you're on your way. We'll be ready at ${ticket.counter ?? 'your counter'}.`, ticket.id);
  broadcast({ type: 'ticket:updated', ticket: updated! });
  broadcast({ type: 'notification:logged', notification });
  res.json({ ticket: updated });
}));

app.post('/api/staff/call-next', asyncRoute(async (req, res) => {
  const { companyId } = await requireCompanyUser(req, ['COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF']);
  const parsed = CallNextBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'bad_request' });
  await requireBranchInCompany(parsed.data.branchId, companyId);
  const ticket = await callNext(parsed.data.branchId, parsed.data.counter);
  if (!ticket) return void res.status(404).json({ error: 'no_waiting' });
  const bundle = await getCompanyBundle(ticket.companySlug);
  const notification = await logSms(ticket.customerPhone, 'CALLED', `Hi ${ticket.customerName.split(' ')[0]}, ticket ${ticket.ticketNumber} has been called at ${bundle?.company.name ?? 'the company'}. Go to ${ticket.counter ?? 'your counter'}.`, ticket.id);
  broadcast({ type: 'ticket:updated', ticket });
  broadcast({ type: 'notification:logged', notification });
  res.json({ ticket });
}));

app.post('/api/staff/serve', asyncRoute(async (req, res) => {
  const parsed = TicketActionBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'bad_request' });
  await requireCompanyTicket(req, parsed.data.ticketId);
  const ticket = await updateTicketStatus(parsed.data.ticketId, 'SERVING');
  broadcast({ type: 'ticket:updated', ticket });
  res.json({ ticket });
}));

app.post('/api/staff/served', asyncRoute(async (req, res) => {
  const parsed = TicketActionBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'bad_request' });
  await requireCompanyTicket(req, parsed.data.ticketId);
  const ticket = await updateTicketStatus(parsed.data.ticketId, 'SERVED');
  broadcast({ type: 'ticket:updated', ticket });
  res.json({ ticket });
}));

app.post('/api/staff/missed', asyncRoute(async (req, res) => {
  const parsed = TicketActionBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'bad_request' });
  await requireCompanyTicket(req, parsed.data.ticketId);
  const ticket = await updateTicketStatus(parsed.data.ticketId, 'MISSED');
  const notification = await logSms(ticket.customerPhone, 'MISSED', `Hi ${ticket.customerName.split(' ')[0]}, ticket ${ticket.ticketNumber} was missed. You can rejoin if your company allows.`, ticket.id);
  broadcast({ type: 'ticket:updated', ticket });
  broadcast({ type: 'notification:logged', notification });
  res.json({ ticket });
}));

app.post('/api/staff/hold', asyncRoute(async (req, res) => {
  const parsed = TicketActionBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'bad_request' });
  await requireCompanyTicket(req, parsed.data.ticketId);
  const ticket = await updateTicketStatus(parsed.data.ticketId, 'ON_HOLD');
  broadcast({ type: 'ticket:updated', ticket });
  res.json({ ticket });
}));

app.post('/api/staff/transfer', asyncRoute(async (req, res) => {
  const parsed = TransferBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'bad_request', message: 'Invalid transfer payload', details: parsed.error.flatten() });
  try {
    const { companyId } = await requireCompanyTicket(req, parsed.data.ticketId);
    await requireServiceInCompany(parsed.data.toServiceId, companyId);
    const ticket = await transferTicket(parsed.data.ticketId, parsed.data.toServiceId, parsed.data.actor ?? 'Staff');
    broadcast({ type: 'ticket:updated', ticket });
    res.json({ ticket });
  } catch (error: any) {
    res.status(400).json({ error: 'transfer_failed', message: safeErrorMessage(error, 'Failed to transfer ticket') });
  }
}));

app.post('/api/staff/send-sms', asyncRoute(async (req, res) => {
  const parsed = StaffSmsBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'bad_request', message: 'Invalid SMS payload', details: parsed.error.flatten() });
  try {
    await requireCompanyTicket(req, parsed.data.ticketId);
    const notification = await sendTicketSms(parsed.data.ticketId, parsed.data.message);
    const ticket = await getTicket(parsed.data.ticketId);
    if (ticket) broadcast({ type: 'ticket:updated', ticket });
    broadcast({ type: 'notification:logged', notification });
    res.json({ notification, ticket });
  } catch (error: any) {
    res.status(400).json({ error: 'sms_failed', message: safeErrorMessage(error, 'Failed to send SMS') });
  }
}));

// ---------- dashboards ----------

app.get('/api/dashboard', asyncRoute(async (req, res) => {
  const { companySlug } = await requireCompanyUser(req, ['COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF']);
  res.json(await getDashboard(activeCompanyQuery(req, companySlug)));
}));

app.get('/api/notifications', asyncRoute(async (req, res) => {
  await requireUser(req);
  const rows = await prisma.notification.findMany({ orderBy: { at: 'desc' }, take: 50 });
  res.json({ notifications: rows });
}));

app.get('/api/admin/overview', asyncRoute(async (req, res) => {
  await requireRole(req, ['SUPER_ADMIN']);
  res.json(await getPlatformOverview());
}));

// ---------- root + socket ----------

const apiInfo = {
  name: 'Omukweyo API',
  version: '1.0.0',
  storage: 'Prisma + MySQL',
  endpoints: [
    'GET  /api/health',
    'POST /api/auth/login',
    'GET  /api/company/:slug',
    'GET  /api/businesses?q=...',
    'POST /api/business/onboard',
    'PATCH /api/business/profile',
    'POST /api/business/assets',
    'GET  /api/business/widget',
    'POST /api/queue/join',
    'POST /api/reservations',
    'GET  /api/dashboard',
  ],
};

app.get('/api', (_req, res) => {
  res.json(apiInfo);
});

if (existsSync(path.join(webDistRoot, 'index.html'))) {
  app.use(express.static(webDistRoot));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) return next();
    res.sendFile(path.join(webDistRoot, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.json(apiInfo);
  });
}

io.on('connection', async (socket) => {
  try {
    for (const event of await getSocketInitialEvents()) {
      socket.emit('omukweyo:event', event);
    }
  } catch (error) {
    socket.emit('omukweyo:event', { type: 'error', message: 'Initial sync failed' });
  }
});

server.listen(PORT, () => {
  console.log(`Omukweyo API listening on http://localhost:${PORT}`);
  console.log(`Prisma/MySQL runtime active for ${WEB_ORIGIN}`);
});
