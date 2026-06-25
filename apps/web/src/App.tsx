import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Role } from '@inline/shared';
import Layout from './components/Layout';
import AppShell from './components/AppShell';
import CustomerShell from './components/CustomerShell';

import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import ForCompanies from './pages/ForCompanies';
import ForCustomers from './pages/ForCustomers';
import ForRunners from './pages/ForRunners';
import Pricing from './pages/Pricing';
import Contact from './pages/Contact';
import Legal from './pages/Legal';
import BusinessDirectory from './pages/BusinessDirectory';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import CustomerSignup from './pages/CustomerSignup';
import ReserveTicket from './pages/ReserveTicket';
import ReservationStatus from './pages/ReservationStatus';
import CustomerHome from './pages/CustomerHome';
import CustomerProfile from './pages/CustomerProfile';
import RunnerSignup from './pages/RunnerSignup';
import RunnerWorkspace from './pages/RunnerWorkspace';
import PlatformAdmin from './pages/PlatformAdmin';
import Billing from './pages/Billing';
import Widget from './pages/Widget';
import BusinessSettings from './pages/BusinessSettings';

import CompanyPublic from './pages/CompanyPublic';
import Ticket from './pages/Ticket';
import Staff from './pages/Staff';
import Dashboard from './pages/Dashboard';
import Embed from './pages/Embed';

const productRoutes = ['/dashboard', '/staff', '/embed', '/customer', '/customer/history', '/customer/profile', '/runner/work', '/admin', '/billing', '/settings'];
const productPrefixes = ['/ticket'];
const sessionAwarePublicRoutes = ['/businesses', '/reserve', '/contact', '/onboarding', '/runner/signup', '/customer/signup'];
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

  if (role === 'CUSTOMER') {
    return <CustomerShell title={title} subtitle={subtitle} actions={actions}>{children}</CustomerShell>;
  }

  return <AppShell title={title} subtitle={subtitle} actions={actions}>{children}</AppShell>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
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
      </Routes>
    );
  }

  if (loc.pathname.startsWith('/c/')) {
    return (
      <Routes>
        <Route path="/c/:companySlug" element={<CompanyPublic />} />
        <Route path="/c/:companySlug/:branchSlug" element={<CompanyPublic />} />
      </Routes>
    );
  }

  if (isProduct) {
    return (
      <Routes>
        <Route path="/customer" element={<RequireAuth allowedRoles={['CUSTOMER', 'SUPER_ADMIN']}><ProductPageWrapper title="Your visit" subtitle="Ticket status, arrival timing, and SMS updates"><CustomerHome /></ProductPageWrapper></RequireAuth>} />
        <Route path="/customer/history" element={<RequireAuth allowedRoles={['CUSTOMER', 'SUPER_ADMIN']}><ProductPageWrapper title="History" subtitle="Past tickets, reservations, and receipts"><CustomerHistoryPlaceholder /></ProductPageWrapper></RequireAuth>} />
        <Route path="/customer/profile" element={<RequireAuth allowedRoles={['CUSTOMER', 'SUPER_ADMIN']}><ProductPageWrapper title="Profile" subtitle="Your contact details, SMS number, and reservation defaults"><CustomerProfile /></ProductPageWrapper></RequireAuth>} />
        <Route path="/runner/work" element={<RequireAuth allowedRoles={['RUNNER', 'SUPER_ADMIN']}><ProductPageWrapper title="Runner workbench" subtitle="Available public-line jobs and proof updates"><RunnerWorkspace /></ProductPageWrapper></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth allowedRoles={['SUPER_ADMIN']}><ProductPageWrapper title="Platform admin" subtitle="Role coverage, oversight, and network health"><PlatformAdmin /></ProductPageWrapper></RequireAuth>} />
        <Route path="/billing" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER']}><ProductPageWrapper title="Billing" subtitle="Subscription, invoices, and SMS credits"><Billing /></ProductPageWrapper></RequireAuth>} />
        <Route path="/ticket" element={<ProductPageWrapper title="Live ticket" subtitle="Real-time position, ETA, and counter"><Ticket /></ProductPageWrapper>} />
        <Route path="/ticket/:id" element={<ProductPageWrapper title="Live ticket" subtitle="Real-time position, ETA, and counter"><Ticket /></ProductPageWrapper>} />
        <Route path="/staff" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF']}><ProductPageWrapper title="Staff console" subtitle="Counter workflow"><Staff /></ProductPageWrapper></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF']}><ProductPageWrapper title="Company admin console" subtitle="Branches, queues, staff, billing, and access"><Dashboard /></ProductPageWrapper></RequireAuth>} />
        <Route path="/embed" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER']}><ProductPageWrapper title="Embed widget" subtitle="Drop Omukweyo on your own site"><Embed /></ProductPageWrapper></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth allowedRoles={['COMPANY_OWNER', 'COMPANY_MANAGER']}><ProductPageWrapper title="Business settings" subtitle="Branding, profile, branches, services, and widget setup"><BusinessSettings /></ProductPageWrapper></RequireAuth>} />
        <Route path="/businesses" element={<RequireAuth allowedRoles={allRoles}><ProductPageWrapper title="Find businesses" subtitle="Search public queue pages, branches, and services"><BusinessDirectory /></ProductPageWrapper></RequireAuth>} />
        <Route path="/reserve" element={<RequireAuth allowedRoles={allRoles}><ProductPageWrapper title="Reserve future spot" subtitle="Protect an arrival window from your account"><ReserveTicket /></ProductPageWrapper></RequireAuth>} />
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
        <Route path="/signup" element={<Signup />} />
        <Route path="/privacy" element={<Legal type="privacy" />} />
        <Route path="/terms" element={<Legal type="terms" />} />
        <Route path="/login" element={<Login />} />
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

function CustomerHistoryPlaceholder() {
  return (
    <section className="card p-5">
      <h2 className="text-[16px] font-semibold text-ink">Tickets and reservations</h2>
      <p className="mt-1 text-[13px] text-ink-2">Task 3 will replace this with the full history view.</p>
    </section>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Router />
    </>
  );
}
