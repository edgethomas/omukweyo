import type { ElementType, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CalendarClock, History, Home, Search, Ticket } from 'lucide-react';
import type { Role } from '@inline/shared';
import { cn } from '@/lib/utils';
import AccountMenu from '@/features/customer/AccountMenu';
import { BrandLogo } from './Brand';

const SESSION_KEY = 'omukweyo_session';
const CUSTOMER_KEY = 'omukweyo_customer';

type DemoSession = {
  user?: {
    role?: Role;
    name?: string;
    email?: string;
    phone?: string;
    destination?: string;
    avatarUrl?: string;
  };
};

type StoredCustomer = {
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
};

type CustomerNavItem = {
  to: string;
  label: string;
  mobileLabel: string;
  icon: ElementType;
};

const customerNav: CustomerNavItem[] = [
  { to: '/customer', label: 'Home', mobileLabel: 'Visit', icon: Home },
  { to: '/businesses', label: 'Find businesses', mobileLabel: 'Find', icon: Search },
  { to: '/reserve', label: 'Reserve spot', mobileLabel: 'Reserve', icon: CalendarClock },
  { to: '/ticket', label: 'My ticket', mobileLabel: 'Ticket', icon: Ticket },
  { to: '/customer/history', label: 'History', mobileLabel: 'History', icon: History },
];
const customerMobileNav = customerNav.slice(0, 4);

function loadSession(): DemoSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadCustomerSnapshot(): StoredCustomer {
  try {
    const raw = localStorage.getItem(CUSTOMER_KEY);
    return raw ? JSON.parse(raw) as StoredCustomer : {};
  } catch {
    return {};
  }
}

function navIsActive(pathname: string, target: string) {
  if (target === '/ticket') return pathname === '/ticket' || pathname.startsWith('/ticket/');
  return pathname === target;
}

export default function CustomerShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const loc = useLocation();
  const [sessionVersion, setSessionVersion] = useState(0);
  const session = useMemo(() => loadSession(), [loc.pathname, sessionVersion]);
  const customer = useMemo(() => loadCustomerSnapshot(), [loc.pathname, sessionVersion]);
  const identity = {
    name: customer.name ?? session?.user?.name ?? 'Martha Customer',
    email: customer.email ?? session?.user?.email,
    phone: customer.phone ?? session?.user?.phone,
  };
  const avatarUrl = customer.avatarUrl ?? session?.user?.avatarUrl;
  const homePath = session?.user?.destination ?? '/customer';
  const accountActive = loc.pathname === '/customer/profile' || loc.pathname === '/customer/history';

  useEffect(() => {
    const refreshSession = () => setSessionVersion((version) => version + 1);
    window.addEventListener('storage', refreshSession);
    window.addEventListener('omukweyo:profile-updated', refreshSession);
    return () => {
      window.removeEventListener('storage', refreshSession);
      window.removeEventListener('omukweyo:profile-updated', refreshSession);
    };
  }, []);

  return (
    <div className="customer-shell">
      <header className="customer-topbar">
        <div className="container-x customer-header-grid">
          <Link to={homePath} className="justify-self-start shrink-0">
            <BrandLogo />
          </Link>

          <nav className="hidden md:flex h-full items-center justify-center gap-8 justify-self-center">
            {customerNav.map((item) => {
              const active = navIsActive(loc.pathname, item.to);
              return (
                <NavLink key={item.to} to={item.to} end={item.to === '/customer'} className={() => cn('customer-nav-link', active && 'active')}>
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 justify-self-end">
            <AccountMenu to="/customer/profile" name={identity.name} summary={identity.email ?? identity.phone} avatarUrl={avatarUrl} active={accountActive} />
          </div>
        </div>
      </header>

      <main className="customer-main">
        <div className="container-x py-5 pb-24 md:py-7 md:pb-8">
          <section className="customer-hero-panel">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink md:text-2xl">{title}</h1>
                {subtitle && <p className="mt-1 max-w-2xl text-[13px] text-ink-2 md:text-sm">{subtitle}</p>}
              </div>
              {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
            </div>
          </section>

          <div className="customer-content">{children}</div>
        </div>
      </main>

      <nav className="customer-bottom-nav md:hidden" aria-label="Customer navigation">
        {customerMobileNav.map((item) => {
          const active = navIsActive(loc.pathname, item.to);
          return (
            <NavLink key={item.to} to={item.to} end={item.to === '/customer'} className={() => cn('customer-bottom-link', active && 'active')}>
              <item.icon size={16} strokeWidth={1.9} />
              <span>{item.mobileLabel}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
