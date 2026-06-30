import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Role } from '@inline/shared';
import Layout from './components/Layout';
import AppShell from './components/AppShell';
import CustomerShell from './components/CustomerShell';
import ErrorBoundary from './components/ErrorBoundary';

const Home = lazy(() => import('./pages/Home'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const ForCompanies = lazy(() => import('./pages/ForCompanies'));
const ForCustomers = lazy(() => import('./pages/ForCustomers'));
const ForRunners = lazy(() => import('./pages/ForRunners'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Contact = lazy(() => import('./pages/Contact'));
const Legal = lazy(() => import('./pages/Legal'));
const BusinessDirectory = lazy(() => import('./pages/BusinessDirectory'));
const Login = lazy(() => import('./pages/Login'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Signup = lazy(() => import('./pages/Signup'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const CustomerSignup = lazy(() => import('./pages/CustomerSignup'));
const CustomerSettings = lazy(() => import('./pages/CustomerSettings'));
const ReserveTicket = lazy(() => import('./pages/ReserveTicket'));
const ReservationStatus = lazy(() => import('./pages/ReservationStatus'));
const CustomerHome = lazy(() => import('./pages/CustomerHome'));
const CustomerProfile = lazy(() => import('./pages/CustomerProfile'));
const RunnerSignup = lazy(() => import('./pages/RunnerSignup'));
const RunnerWorkspace = lazy(() => import('./pages/RunnerWorkspace'));
const PlatformAdmin = lazy(() => import('./pages/PlatformAdmin'));
const Widget = lazy(() => import('./pages/Widget'));
const EmbedPage = lazy(() => import('./pages/EmbedPage'));
const EmbedTicketPage = lazy(() => import('./pages/EmbedTicketPage'));
const StaffProfile = lazy(() => import('./pages/StaffProfile'));
const StaffSettings = lazy(() => import('./pages/StaffSettings'));
const BusinessProfile = lazy(() => import('./pages/BusinessProfile'));
const AdminProfile = lazy(() => import('./pages/AdminProfile'));
const RunnerSettings = lazy(() => import('./pages/RunnerSettings'));
const CompanyPublic = lazy(() => import('./pages/CompanyPublic'));
const Ticket = lazy(() => import('./pages/Ticket'));
const Staff = lazy(() => import('./pages/Staff'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CustomerHistory = lazy(() => import('./features/customer/CustomerHistory'));
const RunnerRequestPage = lazy(() => import('./features/runner/RunnerRequestPage'));
const RunnerRequestStatusPage = lazy(() => import('./features/runner/RunnerRequestStatusPage'));
const RunnerJobsPage = lazy(() => import('./features/runner/RunnerJobsPage'));
const RunnerProfilePage = lazy(() => import('./features/runner/RunnerProfilePage'));
const BranchesPage = lazy(() => import('./features/business-admin/BranchesPage'));
const ServicesPage = lazy(() => import('./features/business-admin/ServicesPage'));
const BusinessStaffPage = lazy(() => import('./features/business-admin/StaffPage'));
const CountersPage = lazy(() => import('./features/business-admin/CountersPage'));
const QueuesPage = lazy(() => import('./features/business-admin/QueuesPage'));
const CustomersPage = lazy(() => import('./features/business-admin/CustomersPage'));
const SmsPage = lazy(() => import('./features/business-admin/SmsPage'));
const QrCodesPage = lazy(() => import('./features/business-admin/QrCodesPage'));
const AnalyticsPage = lazy(() => import('./features/business-admin/AnalyticsPage'));
const ReportsPage = lazy(() => import('./features/business-admin/ReportsPage'));
const DashboardBillingPage = lazy(() => import('./features/business-admin/DashboardBillingPage'));
const BrandingPage = lazy(() => import('./features/business-admin/BrandingPage'));
const BusinessSettingsPage = lazy(() => import('./features/business-admin/SettingsPage'));
const DashboardEmbedPage = lazy(() => import('./features/business-admin/DashboardEmbedPage'));
const StaffQueuePage = lazy(() => import('./features/staff/StaffQueuePage'));
const StaffTicketDetailPage = lazy(() => import('./features/staff/StaffTicketDetailPage'));
const KioskPage = lazy(() => import('./features/staff/KioskPage'));
const WaitingRoomTvPage = lazy(() => import('./features/staff/WaitingRoomTvPage'));
const AdminCompaniesPage = lazy(() => import('./features/platform-admin/AdminCompaniesPage'));
const AdminRunnersPage = lazy(() => import('./features/platform-admin/AdminRunnersPage'));
const AdminBillingPage = lazy(() => import('./features/platform-admin/AdminBillingPage'));
const AdminSupportPage = lazy(() => import('./features/platform-admin/AdminSupportPage'));
const AdminAuditLogsPage = lazy(() => import('./features/platform-admin/AdminAuditLogsPage'));
const AdminSettingsPage = lazy(() => import('./features/platform-admin/AdminSettingsPage'));
const CompanyJoinPage = lazy(() => import('./features/public-company/CompanyJoinPage'));

const productRoutes = [
  '/dashboard',
  '/staff',
  '/embed',
  '/customer',
  '/customer/history',
  '/customer/profile',
  '/customer/settings',
  '/runner/work',
  '/admin',
  '/billing',
  '/settings',
  '/runner/request',
  '/runner/jobs',
  '/runner/profile',
  '/dashboard/branches',
  '/dashboard/services',
  '/dashboard/staff',
  '/dashboard/counters',
  '/dashboard/queues',
  '/dashboard/customers',
  '/dashboard/sms',
  '/dashboard/qr-codes',
  '/dashboard/embed',
  '/dashboard/analytics',
  '/dashboard/reports',
  '/dashboard/billing',
  '/dashboard/branding',
  '/dashboard/settings',
  '/staff/queue',
  '/staff/kiosk',
  '/staff/tv',
  '/staff/profile',
  '/staff/settings',
  '/admin/companies',
  '/admin/runners',
  '/admin/billing',
  '/admin/support',
  '/admin/audit-logs',
  '/admin/settings',
  '/admin/profile',
  '/dashboard/profile',
  '/runner/settings',
];
const productPrefixes = ['/ticket', '/reservation', '/staff/ticket', '/runner/request', '/runner/jobs'];
const sessionAwarePublicRoutes = ['/businesses', '/reserve', '/contact', '/onboarding', '/runner/signup', '/customer/signup', '/join'];
const sessionAwarePublicPrefixes = ['/reservation/'];
const allRoles: Role[] = ['CUSTOMER', 'COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF', 'RUNNER', 'SUPER_ADMIN'];
const SESSION_KEY = 'omukweyo_session';

type Session = {
  user?: {
    role?: Role;
    destination?: string;
  };
};

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function fallbackDestination(role?: Role) {
  if (role === 'CUSTOMER') return '/customer';
  if (role === 'RUNNER') return '/runner/work';
  if (role === 'STAFF') return '/staff';
  if (role === 'SUPER_ADMIN') return '/admin';
  return '/dashboard';
}

function RequireAuth({ children, allowedRoles }: { children: ReactNode; allowedRoles: Role[] }) {
  const loc = useLocation();
  const session = loadSession();
  const role = session?.user?.role;

  if (!role) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={session?.user?.destination ?? fallbackDestination(role)} replace />;
  }

  return <>{children}</>;
}

function ProductPage({ children, title, subtitle, actions }: { children: ReactNode; title: string; subtitle?: string; actions?: ReactNode }) {
  const session = loadSession();
  const role = session?.user?.role;
  const content = <Suspense fallback={<ProductRouteFallback />}>{children}</Suspense>;

  if (role === 'CUSTOMER') {
    return <CustomerShell>{content}</CustomerShell>;
  }

  return <AppShell title={title} subtitle={subtitle} actions={actions}>{content}</AppShell>;
}

function ProductRouteFallback() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <div className="h-5 w-36 rounded bg-surface-2 animate-pulse" />
        <div className="h-3 w-64 max-w-[70vw] rounded bg-surface-2 animate-pulse" />
      </div>
      <div className="card p-5 space-y-3">
        <div className="h-4 w-28 rounded bg-surface-2 animate-pulse" />
        <div className="h-24 rounded-lg bg-surface-2 animate-pulse" />
      </div>
    </div>
  );
}

function PublicRouteFallback() {
  return (
    <div className="min-h-screen bg-surface p-6" aria-busy="true" aria-label="Loading page">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-8 w-36 rounded bg-surface-2 animate-pulse" />
        <div className="h-64 rounded-xl border border-line bg-surface-2 animate-pulse" />
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      document.querySelectorAll<HTMLElement>('.app-main, .customer-main, main').forEach((node) => {
        node.scrollTop = 0;
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname, search]);
  return null;
}

function Router() {
  const loc = useLocation();
  const session = loadSession();
  const isSessionAwarePublicRoute = Boolean(session?.user?.role) && (sessionAwarePublicRoutes.includes(loc.pathname) || sessionAwarePublicPrefixes.some(p => loc.pathname.startsWith(p)));
  const isProduct = productRoutes.includes(loc.pathname) || productPrefixes.some(p => loc.pathname.startsWith(p)) || isSessionAwarePublicRoute;

  if (loc.pathname.startsWith('/widget/')) {
    return (
      <Routes>
        <Route path="/widget/:companySlug" element={<Widget />} />
        <Route path="/widget/:companySlug/:branchSlug" element={<Widget />} />
      </Routes>
    );
  }

  if (loc.pathname.startsWith('/embed/')) {
    return (
      <Routes>
        <Route path="/embed/:companySlug" element={<EmbedPage />} />
        <Route path="/embed/:companySlug/:branchSlug" element={<EmbedPage />} />
        <Route path="/embed/ticket/:id" element={<EmbedTicketPage />} />
      </Routes>
    );
  }

  if (loc.pathname.startsWith('/c/')) {
    return (
      <Routes>
        <Route path="/c/:companySlug" element={<CompanyPublic />} />
        <Route path="/c/:companySlug/:branchSlug" element={<CompanyPublic />} />
        <Route path="/c/:companySlug/:branchSlug/:serviceSlug" element={<CompanyPublic />} />
      </Routes>
    );
  }

  if (loc.pathname.startsWith('/join/')) {
    return (
      <Routes>
        <Route path="/join/:companySlug" element={<CompanyJoinPage />} />
        <Route path="/join/:companySlug/:branchSlug" element={<CompanyJoinPage />} />
        <Route path="/join/:companySlug/:branchSlug/:serviceSlug" element={<CompanyJoinPage />} />
      </Routes>
    );
  }

  if (isProduct) {
    return (
      <Routes>
        <Route path="/customer" element={<RequireAuth allowedRoles={['CUSTOMER', 'SUPER_ADMIN']}><ProductPageWrapper title="Your visit" subtitle="Ticket status, arrival timing, and SMS updates"><CustomerHome /></ProductPageWrapper></RequireAuth>} />
        <Route path="/customer/history" element={<RequireAuth allowedRoles={['CUSTOMER', 'SUPER_ADMIN']}><ProductPageWrapper title="History" subtitle="Past tickets, reservations, and receipts"><CustomerHistory /></ProductPageWrapper></RequireAuth>} />
        <Route path="/customer/profile" element={<RequireAuth allowedRoles={['CUSTOMER', 'SUPER_ADMIN']}><ProductPageWrapper title="Profile" subtitle="Your contact details, SMS number, and reservation defaults"><CustomerProfile /></ProductPageWrapper></RequireAuth>} />
        <Route path="/customer/settings" element={<RequireAuth allowedRoles={['CUSTOMER', 'SUPER_ADMIN']}><ProductPageWrapper title="Settings" subtitle="Account access, billing, notifications, and danger zone"><CustomerSettings /></ProductPageWrapper></RequireAuth>} />
        <Route path="/runner/work" element={<RequireAuth allowedRoles={['RUNNER', 'SUPER_ADMIN']}><ProductPageWrapper title="Runner workbench" subtitle="Available public-line jobs and proof updates"><RunnerWorkspace /></ProductPageWrapper></RequireAuth>} />
        <Route path="/runner/request" element={<RequireAuth allowedRoles={['CUSTOMER', 'RUNNER', 'SUPER_ADMIN']}><ProductPageWrapper title="Request a runner" subtitle="Get a runner to hold a public-line spot at a place without Omukweyo"><RunnerRequestPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/runner/request/:id" element={<RequireAuth allowedRoles={['CUSTOMER', 'RUNNER', 'SUPER_ADMIN']}><ProductPageWrapper title="Runner request status" subtitle="Live updates and proof messages"><RunnerRequestStatusPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/runner/jobs/:id" element={<RequireAuth allowedRoles={['RUNNER', 'SUPER_ADMIN']}><ProductPageWrapper title="Runner job" subtitle="One job to claim, check in, send proof, and hand off"><RunnerJobsPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/runner/profile" element={<RequireAuth allowedRoles={['RUNNER', 'SUPER_ADMIN']}><ProductPageWrapper title="Runner profile" subtitle="Your runner details and active coverage"><RunnerProfilePage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth allowedRoles={['SUPER_ADMIN']}><ProductPageWrapper title="Platform admin" subtitle="Role coverage, oversight, and network health"><PlatformAdmin /></ProductPageWrapper></RequireAuth>} />
        <Route path="/admin/companies" element={<RequireAuth allowedRoles={['SUPER_ADMIN']}><ProductPageWrapper title="Companies" subtitle="Every business on Omukweyo"><AdminCompaniesPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/admin/runners" element={<RequireAuth allowedRoles={['SUPER_ADMIN']}><ProductPageWrapper title="Runners" subtitle="Approve, suspend, or audit runner accounts"><AdminRunnersPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/admin/billing" element={<RequireAuth allowedRoles={['SUPER_ADMIN']}><ProductPageWrapper title="Platform billing" subtitle="Subscriptions, invoices, and SMS revenue"><AdminBillingPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/admin/support" element={<RequireAuth allowedRoles={['SUPER_ADMIN']}><ProductPageWrapper title="Support" subtitle="Impersonate, look up tickets, and answer questions"><AdminSupportPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/admin/audit-logs" element={<RequireAuth allowedRoles={['SUPER_ADMIN']}><ProductPageWrapper title="Audit logs" subtitle="Every sensitive action across the platform"><AdminAuditLogsPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/admin/settings" element={<RequireAuth allowedRoles={['SUPER_ADMIN']}><ProductPageWrapper title="Platform settings" subtitle="Plans, integrations, and platform-wide toggles"><AdminSettingsPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/billing" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER']}><Navigate to="/dashboard/billing" replace /></RequireAuth>} />
        <Route path="/ticket" element={<ProductPageWrapper title="Live ticket" subtitle="Real-time position, ETA, and counter"><Ticket /></ProductPageWrapper>} />
        <Route path="/ticket/:id" element={<ProductPageWrapper title="Live ticket" subtitle="Real-time position, ETA, and counter"><Ticket /></ProductPageWrapper>} />
        <Route path="/staff" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF']}><ProductPageWrapper title="Staff console" subtitle="Counter workflow"><Staff /></ProductPageWrapper></RequireAuth>} />
        <Route path="/staff/queue" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF']}><ProductPageWrapper title="Staff queue" subtitle="Counter workflow focused on the waiting list"><StaffQueuePage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/staff/ticket/:id" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF']}><ProductPageWrapper title="Ticket detail" subtitle="Every action and event for this ticket"><StaffTicketDetailPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/staff/kiosk" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF']}><ProductPageWrapper title="Kiosk" subtitle="Join-the-queue screen for in-branch tablets"><KioskPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/staff/tv" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF']}><ProductPageWrapper title="Waiting room TV" subtitle="Now serving on a big screen"><WaitingRoomTvPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/staff/profile" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF']}><ProductPageWrapper title="Staff profile" subtitle="Your counter profile, photo, and contact details"><StaffProfile /></ProductPageWrapper></RequireAuth>} />
        <Route path="/staff/settings" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF']}><ProductPageWrapper title="Staff settings" subtitle="Account access, notifications, and danger zone"><StaffSettings /></ProductPageWrapper></RequireAuth>} />
        <Route path="/dashboard/profile" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER']}><ProductPageWrapper title="My profile" subtitle="Your personal profile, photo, and sign-in details"><BusinessProfile /></ProductPageWrapper></RequireAuth>} />
        <Route path="/admin/profile" element={<RequireAuth allowedRoles={['SUPER_ADMIN']}><ProductPageWrapper title="My profile" subtitle="Your platform-admin profile, photo, and sign-in details"><AdminProfile /></ProductPageWrapper></RequireAuth>} />
        <Route path="/runner/settings" element={<RequireAuth allowedRoles={['RUNNER', 'SUPER_ADMIN']}><ProductPageWrapper title="Runner settings" subtitle="Account access, notifications, and danger zone"><RunnerSettings /></ProductPageWrapper></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF']}><ProductPageWrapper title="Company admin console" subtitle="Branches, queues, staff, billing, and access"><Dashboard /></ProductPageWrapper></RequireAuth>} />
        <Route path="/dashboard/branches" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER']}><ProductPageWrapper title="Branches" subtitle="Create, edit, and disable branches"><BranchesPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/dashboard/services" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER']}><ProductPageWrapper title="Services" subtitle="Define the queue services a customer picks from"><ServicesPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/dashboard/staff" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER']}><ProductPageWrapper title="Staff" subtitle="Invite staff, set roles, and scope to a branch"><BusinessStaffPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/dashboard/counters" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER']}><ProductPageWrapper title="Counters" subtitle="Configure counters and assign staff"><CountersPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/dashboard/queues" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF']}><ProductPageWrapper title="Live queues" subtitle="Watch and steer every active branch queue"><QueuesPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/dashboard/customers" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER']}><ProductPageWrapper title="Customers" subtitle="Customer history and ratings across branches"><CustomersPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/dashboard/sms" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER']}><ProductPageWrapper title="SMS" subtitle="Templates, logs, balance, and top-ups"><SmsPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/dashboard/qr-codes" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER']}><ProductPageWrapper title="QR codes & posters" subtitle="Generate printable QR posters"><QrCodesPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/dashboard/embed" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER']}><ProductPageWrapper title="Embed widget" subtitle="Drop Omukweyo on your own website"><DashboardEmbedPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/dashboard/analytics" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER']}><ProductPageWrapper title="Analytics" subtitle="Wait times, served counts, and peak hours"><AnalyticsPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/dashboard/reports" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER']}><ProductPageWrapper title="Reports" subtitle="Custom reports and exports"><ReportsPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/dashboard/billing" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER']}><ProductPageWrapper title="Billing" subtitle="Subscription, invoices, and SMS credits"><DashboardBillingPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/dashboard/branding" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER']}><ProductPageWrapper title="Store page" subtitle="Logo, hero, colors, tagline, and public description"><BrandingPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/dashboard/settings" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER']}><ProductPageWrapper title="Business settings" subtitle="Company name, industry, and website"><BusinessSettingsPage /></ProductPageWrapper></RequireAuth>} />
        <Route path="/embed" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER']}><Navigate to="/dashboard/embed" replace /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER']}><Navigate to="/dashboard/settings" replace /></RequireAuth>} />
        <Route path="/businesses" element={<RequireAuth allowedRoles={allRoles}><ProductPageWrapper title="Find businesses" subtitle="Search public queue pages, branches, and services"><BusinessDirectory /></ProductPageWrapper></RequireAuth>} />
        <Route path="/reserve" element={<RequireAuth allowedRoles={allRoles}><ProductPageWrapper title="Reserve arrival window" subtitle="Protect an arrival window from your account"><ReserveTicket /></ProductPageWrapper></RequireAuth>} />
        <Route path="/reservation/:id" element={<RequireAuth allowedRoles={allRoles}><ProductPageWrapper title="Reservation status" subtitle="Payment state, smart booking time, and live ticket handoff"><ReservationStatus /></ProductPageWrapper></RequireAuth>} />
        <Route path="/contact" element={<RequireAuth allowedRoles={allRoles}><ProductPageWrapper title="Help" subtitle="Contact support without leaving the app"><Contact /></ProductPageWrapper></RequireAuth>} />
        <Route path="/onboarding" element={<RequireAuth allowedRoles={allRoles}><ProductPageWrapper title="Business onboarding" subtitle="Set up a company, branch, services, and operating defaults"><Onboarding /></ProductPageWrapper></RequireAuth>} />
        <Route path="/runner/signup" element={<RequireAuth allowedRoles={allRoles}><ProductPageWrapper title="Runner profile" subtitle="Apply or update public-line runner details"><RunnerSignup /></ProductPageWrapper></RequireAuth>} />
        <Route path="/customer/signup" element={<RequireAuth allowedRoles={allRoles}><ProductPageWrapper title="Customer account" subtitle="Create or update customer queue details"><CustomerSignup /></ProductPageWrapper></RequireAuth>} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/for-companies" element={<ForCompanies />} />
        <Route path="/for-customers" element={<ForCustomers />} />
        <Route path="/for-runners" element={<ForRunners />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/businesses" element={<BusinessDirectory />} />
        <Route path="/c/:companySlug" element={<CompanyPublic />} />
        <Route path="/c/:companySlug/:branchSlug" element={<CompanyPublic />} />
        <Route path="/c/:companySlug/:branchSlug/:serviceSlug" element={<CompanyPublic />} />
        <Route path="/join/:companySlug" element={<CompanyJoinPage />} />
        <Route path="/join/:companySlug/:branchSlug" element={<CompanyJoinPage />} />
        <Route path="/join/:companySlug/:branchSlug/:serviceSlug" element={<CompanyJoinPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/privacy" element={<Legal type="privacy" />} />
        <Route path="/terms" element={<Legal type="terms" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/customer/signup" element={<CustomerSignup />} />
        <Route path="/reserve" element={<ReserveTicket />} />
        <Route path="/reservation/:id" element={<ReservationStatus />} />
        <Route path="/runner/signup" element={<RunnerSignup />} />
      </Routes>
    </Layout>
  );
}

function ProductPageWrapper({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  return <ProductPage title={title} subtitle={subtitle}>{children}</ProductPage>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Suspense fallback={<PublicRouteFallback />}>
        <Router />
      </Suspense>
    </ErrorBoundary>
  );
}
