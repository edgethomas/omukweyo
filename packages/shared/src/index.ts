// Shared types for the Omukweyo platform (frontend + backend)

export type Role = 'SUPER_ADMIN' | 'COMPANY_OWNER' | 'COMPANY_MANAGER' | 'STAFF' | 'CUSTOMER' | 'RUNNER';

export type TicketStatus =
  | 'WAITING'
  | 'CALLED'
  | 'SERVING'
  | 'SERVED'
  | 'MISSED'
  | 'CANCELLED'
  | 'TRANSFERRED'
  | 'ON_HOLD';

export type TicketSource = 'QR' | 'PUBLIC_PAGE' | 'EMBED' | 'STAFF_WALK_IN' | 'APPOINTMENT' | 'RUNNER';

export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' | 'MANUAL_ACTIVE';

export type ReservationStatus = 'SCHEDULED' | 'BOOKED' | 'CANCELLED' | 'EXPIRED';
export type ReservationPaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
export type RunnerApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RunnerJobStatus = 'OPEN' | 'ACCEPTED' | 'IN_LINE' | 'HANDOFF_READY' | 'COMPLETE' | 'CANCELLED';
export type BusinessOnboardingStatus = 'READY' | 'NEEDS_REVIEW';
export type BillingPaymentMethod = 'MOCK_CARD' | 'MOCK_EFT' | 'MOCK_INVOICE';
export type BillingInvoiceStatus = 'PAID' | 'PENDING' | 'FAILED';

export interface DemoUser {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone?: string;
  destination: string;
  emailVerified: boolean;
  customerId?: string;
  companyId?: string;
  companySlug?: string;
  staffId?: string;
  avatarUrl?: string;
}

export interface DemoSession {
  token: string;
  user: DemoUser;
  issuedAt: string;
  expiresAt: string;
  verificationNote: string;
}

export interface CustomerAccount {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Company {
  id: string;
  slug: string;
  name: string;
  industry: string;
  primaryColor: string;
  secondaryColor: string;
  logoText: string;
  logoUrl?: string;
  heroImageUrl?: string;
  tagline?: string;
  websiteUrl?: string;
  publicDescription?: string;
  plan: 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
  smsBalance: number;
  healthScore: number;
  createdAt: string;
}

export interface Branch {
  id: string;
  companyId: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  openingHours: string;
  isOpen: boolean;
  liveWaiting: number;
  avgWaitMin: number;
  servedToday: number;
}

export interface Service {
  id: string;
  companyId: string;
  branchId?: string;
  name: string;
  slug: string;
  description: string;
  averageServiceMinutes: number;
  icon: string;
}

export interface QueueTicket {
  id: string;
  ticketNumber: string;
  companyId: string;
  companySlug: string;
  branchId: string;
  branchSlug: string;
  serviceId: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  status: TicketStatus;
  source: TicketSource;
  reservationId?: string;
  targetArrivalAt?: string;
  position: number;
  peopleAhead: number;
  estimatedWaitMinutes: number;
  counter?: string;
  joinedAt: string;
  calledAt?: string;
  servingAt?: string;
  servedAt?: string;
  events: TicketEvent[];
}

export interface FutureReservation {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  companyId: string;
  companySlug: string;
  branchId: string;
  branchSlug: string;
  branchName: string;
  serviceId: string;
  serviceName: string;
  targetArrivalAt: string;
  smartJoinAt: string;
  arrivalWindowMinutes: number;
  status: ReservationStatus;
  paymentStatus: ReservationPaymentStatus;
  feeCents: number;
  currency: 'NAD';
  ticketId?: string;
  createdAt: string;
  paidAt?: string;
  bookedAt?: string;
  events: ReservationEvent[];
}

export interface RunnerApplication {
  id: string;
  name: string;
  phone: string;
  city: string;
  transportMode: string;
  payoutMethod: string;
  canStartAt: string;
  notes?: string;
  status: RunnerApplicationStatus;
  createdAt: string;
}

export interface RunnerJob {
  id: string;
  customerName: string;
  customerPhone: string;
  placeName: string;
  city: string;
  serviceName: string;
  targetArrivalAt: string;
  expectedWaitMinutes: number;
  payoutCents: number;
  currency: 'NAD';
  status: RunnerJobStatus;
  instructions: string;
}

export interface BusinessOnboarding {
  id: string;
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
  plan: Company['plan'];
  status: BusinessOnboardingStatus;
  createdAt: string;
  launchLinks: {
    dashboard: string;
    publicPage: string;
    staffConsole: string;
    embed: string;
    billing: string;
  };
  checklist: { label: string; done: boolean }[];
}

export interface BusinessDirectoryItem {
  id: string;
  slug: string;
  name: string;
  industry: string;
  logoText: string;
  logoUrl?: string;
  heroImageUrl?: string;
  primaryColor: string;
  publicPageUrl: string;
  serviceCount: number;
  liveWaiting: number;
  avgWaitMin: number;
  branches: {
    id: string;
    slug: string;
    name: string;
    city: string;
    address: string;
    isOpen: boolean;
    liveWaiting: number;
    avgWaitMin: number;
  }[];
  qr: {
    joinUrl: string;
    reserveUrl: string;
    embedUrl: string;
  };
}

export interface SubscriptionRecord {
  id: string;
  companyId: string;
  plan: Company['plan'];
  status: SubscriptionStatus;
  paymentMethod: BillingPaymentMethod;
  amountCents: number;
  currency: 'NAD';
  renewsAt: string;
  updatedAt: string;
}

export interface SmsCreditPackage {
  id: 'STARTER' | 'GROWTH' | 'SCALE';
  name: string;
  priceCents: number;
  credits: number;
  bonusCredits: number;
}

export interface BillingInvoice {
  id: string;
  companyId: string;
  type: 'SUBSCRIPTION' | 'SMS_CREDITS';
  description: string;
  amountCents: number;
  currency: 'NAD';
  status: BillingInvoiceStatus;
  paymentMethod: BillingPaymentMethod;
  createdAt: string;
}

export interface SmsCreditPurchase {
  id: string;
  companyId: string;
  packageId: SmsCreditPackage['id'];
  credits: number;
  amountCents: number;
  paymentMethod: BillingPaymentMethod;
  invoiceId: string;
  createdAt: string;
}

export interface BillingOverview {
  company: Company;
  subscription: SubscriptionRecord;
  smsPackages: SmsCreditPackage[];
  recentInvoices: BillingInvoice[];
  recentPurchases: SmsCreditPurchase[];
}

export interface PlatformOverview {
  totals: {
    companies: number;
    branches: number;
    customers: number;
    liveTickets: number;
    futureReservations: number;
    runnerApplications: number;
    businessOnboardings: number;
    notifications: number;
  };
  roleCoverage: { role: Role; status: 'LIVE' | 'DEMO' | 'NEEDS_BACKEND'; entry: string }[];
  recentReservations: FutureReservation[];
  recentRunnerApplications: RunnerApplication[];
  recentBusinessOnboardings: BusinessOnboarding[];
  liveBranches: {
    id: string;
    name: string;
    city: string;
    isOpen: boolean;
    liveWaiting: number;
    avgWaitMin: number;
  }[];
}

export interface CustomerVisitSummary {
  customer: CustomerAccount;
  reservations: FutureReservation[];
  currentTicket?: QueueTicket;
  notifications: Notification[];
}

export interface ReservationEvent {
  id: string;
  at: string;
  type: 'CREATED' | 'PAID' | 'SCHEDULED' | 'BOOKED' | 'CANCELLED' | 'EXPIRED';
  message: string;
}

export interface TicketEvent {
  id: string;
  at: string;
  type: 'JOINED' | 'ALMOST' | 'CALLED' | 'SERVING' | 'SERVED' | 'MISSED' | 'CANCELLED' | 'HOLD' | 'TRANSFER' | 'ON_MY_WAY' | 'SMS';
  message: string;
}

export interface Notification {
  id: string;
  at: string;
  to: string;
  template: 'TICKET_CREATED' | 'ALMOST_TURN' | 'CALLED' | 'MISSED' | 'RUNNER_UPDATE' | 'LOW_SMS_BALANCE' | 'RESERVATION_CREATED' | 'RESERVATION_BOOKED' | 'MANUAL_UPDATE';
  message: string;
  status: 'QUEUED' | 'SENT' | 'FAILED';
  ticketId?: string;
  reservationId?: string;
}

export interface StaffMember {
  id: string;
  branchId?: string;
  name: string;
  initials: string;
  role: 'OWNER' | 'MANAGER' | 'OPERATOR';
  counter: string;
  servedToday: number;
  avgServiceMin: number;
  rating: number;
}

export interface DashboardMetrics {
  liveWaiting: number;
  avgWaitTodayMin: number;
  servedToday: number;
  noShowRatePct: number;
  peakHour: string;
  slowestHour: string;
  healthScore: number;
  waitTimeSeries: { hour: string; wait: number; service: number }[];
  heatmap: number[][]; // 4 rows x 8 cols
  smsBalance: number;
  smsSentToday: number;
  smsLowAt: number;
  autoTopUp: boolean;
  topTemplates: { name: string; sent: number; share: number }[];
  branches: {
    id: string;
    name: string;
    counters: number;
    staff: number;
    avgWaitMin: number;
    served: number;
    status: 'OK' | 'BUSY' | 'SLOW';
  }[];
}

// Real-time events
export type ServerEvent =
  | { type: 'ticket:created'; ticket: QueueTicket }
  | { type: 'ticket:updated'; ticket: QueueTicket }
  | { type: 'ticket:list'; tickets: QueueTicket[] }
  | { type: 'reservation:created'; reservation: FutureReservation }
  | { type: 'reservation:booked'; reservation: FutureReservation; ticket: QueueTicket }
  | { type: 'metrics:updated'; metrics: DashboardMetrics }
  | { type: 'notification:logged'; notification: Notification };

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}
