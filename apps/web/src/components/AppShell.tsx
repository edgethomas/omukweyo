import { ElementType, ReactNode, useMemo, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ScanLine, Headphones, Code2, Settings, LogOut, Bell, User, UserCheck, Shield,
  CalendarClock, Building2,
} from 'lucide-react';
import type { Role } from '@inline/shared';
import { cn } from '@/lib/utils';
import StatusPill from './StatusPill';
import { BrandLogo } from './Brand';

const SESSION_KEY = 'omukweyo_session';

type NavItem = { to: string; label: string; icon: ElementType };
type NavGroup = { label: string; items: NavItem[] };
type DemoSession = {
  user?: {
    role?: Role;
    name?: string;
    email?: string;
    destination?: string;
    companySlug?: string;
  };
};

function roleNavGroups(publicPagePath: string): Record<Role, NavGroup[]> {
  return {
  CUSTOMER: [
    {
      label: 'Customer',
      items: [
        { to: '/customer', label: 'Your visit', icon: User },
        { to: '/businesses', label: 'Find businesses', icon: ScanLine },
        { to: '/reserve', label: 'Reserve future spot', icon: CalendarClock },
        { to: '/ticket', label: 'Live ticket', icon: ScanLine },
      ],
    },
  ],
  COMPANY_OWNER: [
    {
      label: 'Operate',
      items: [
        { to: '/dashboard', label: 'Admin console', icon: LayoutDashboard },
        { to: '/staff', label: 'Staff console', icon: Headphones },
        { to: publicPagePath, label: 'Public page', icon: ScanLine },
        { to: '/embed', label: 'Embed widget', icon: Code2 },
      ],
    },
    {
      label: 'Setup',
      items: [
        { to: '/billing', label: 'Billing', icon: Settings },
        { to: '/settings', label: 'Business settings', icon: Settings },
        { to: '/onboarding', label: 'Onboarding', icon: Building2 },
        { to: '/contact', label: 'Help', icon: Settings },
      ],
    },
  ],
  COMPANY_MANAGER: [
    {
      label: 'Manage',
      items: [
        { to: '/dashboard', label: 'Operations', icon: LayoutDashboard },
        { to: '/staff', label: 'Staff console', icon: Headphones },
        { to: publicPagePath, label: 'Public page', icon: ScanLine },
        { to: '/embed', label: 'Embed widget', icon: Code2 },
        { to: '/settings', label: 'Business settings', icon: Settings },
      ],
    },
  ],
  STAFF: [
    {
      label: 'Counter',
      items: [
        { to: '/staff', label: 'Staff console', icon: Headphones },
        { to: '/ticket', label: 'Live ticket', icon: ScanLine },
        { to: publicPagePath, label: 'Public page', icon: ScanLine },
      ],
    },
  ],
  RUNNER: [
    {
      label: 'Runner',
      items: [
        { to: '/runner/work', label: 'Runner workbench', icon: UserCheck },
        { to: '/runner/signup', label: 'Runner profile', icon: User },
      ],
    },
  ],
  SUPER_ADMIN: [
    {
      label: 'Platform',
      items: [
        { to: '/admin', label: 'Platform admin', icon: Shield },
        { to: '/dashboard', label: 'Company admin', icon: LayoutDashboard },
        { to: '/runner/work', label: 'Runner workbench', icon: UserCheck },
      ],
    },
    {
      label: 'Setup',
      items: [
        { to: '/onboarding', label: 'Onboarding', icon: Building2 },
        { to: '/billing', label: 'Billing', icon: Settings },
      ],
    },
  ],
  };
}

const fallbackIdentity: Record<Role, { name: string; email: string }> = {
  CUSTOMER: { name: 'Martha Customer', email: 'customer@omukweyo.demo' },
  COMPANY_OWNER: { name: 'Selma Owner', email: 'owner@omukweyo.demo' },
  COMPANY_MANAGER: { name: 'Selma Manager', email: 'manager@omukweyo.demo' },
  STAFF: { name: 'Tendai Staff', email: 'staff@omukweyo.demo' },
  RUNNER: { name: 'Jonas Runner', email: 'runner@omukweyo.demo' },
  SUPER_ADMIN: { name: 'Aina Admin', email: 'admin@omukweyo.demo' },
};

function loadSession(): DemoSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function fallbackHomeForRole(role: Role) {
  if (role === 'CUSTOMER') return '/customer';
  if (role === 'RUNNER') return '/runner/work';
  if (role === 'STAFF') return '/staff';
  if (role === 'SUPER_ADMIN') return '/admin';
  return '/dashboard';
}

/**
 * AppShell — persistent left nav, top app header, dense content.
 * Used on /dashboard, /staff, /ticket, /c/:slug, /embed.
 */
export default function AppShell({ children, title, subtitle, actions }: { children: ReactNode; title: string; subtitle?: string; actions?: ReactNode }) {
  const loc = useLocation();
  const [notice, setNotice] = useState<string | null>(null);
  const session = useMemo(() => loadSession(), [loc.pathname]);
  const currentRole = session?.user?.role ?? 'CUSTOMER';
  const companySlug = session?.user?.companySlug;
  const nav = roleNavGroups(companySlug ? `/c/${companySlug}` : '/businesses');
  const navGroups = nav[currentRole] ?? nav.COMPANY_OWNER;
  const identity = {
    name: session?.user?.name ?? fallbackIdentity[currentRole].name,
    email: session?.user?.email ?? fallbackIdentity[currentRole].email,
  };
  const homePath = session?.user?.destination ?? fallbackHomeForRole(currentRole);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link to={homePath} className="h-14 flex items-center gap-2 px-5 border-b border-line">
          <BrandLogo />
        </Link>

        <nav className="flex-1 px-3 py-4 overflow-auto">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4 last:mb-0">
              <div className="app-nav-section">{group.label}</div>
              <div className="flex flex-col gap-0.5">
                {group.items.map((l) => {
                  const active = loc.pathname === l.to || (l.to !== '/' && loc.pathname.startsWith(l.to));
                  return (
                    <NavLink
                      key={l.to}
                      to={l.to}
                      className={cn('app-nav-link', active && 'active')}
                    >
                      <l.icon size={15} strokeWidth={1.8} />
                      {l.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-accent grid place-items-center text-[11px] font-semibold">
            {identity.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-ink truncate">{identity.name}</div>
            <div className="text-[11px] text-ink-3 truncate">{identity.email}</div>
          </div>
          <Link
            to="/login"
            onClick={() => localStorage.removeItem(SESSION_KEY)}
            className="text-ink-3 hover:text-ink p-1"
            title="Log out"
          >
            <LogOut size={15} />
          </Link>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold text-ink truncate">{title}</h1>
            {subtitle && <p className="text-[12px] text-ink-3 truncate">{subtitle}</p>}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <StatusPill />
            <button
              type="button"
              onClick={() => setNotice((current) => current ? null : 'No unread notifications. Live queue alerts appear here.')}
              className="text-ink-2 hover:text-ink p-1"
              title="Notifications"
            >
              <Bell size={17} />
            </button>
            {actions}
          </div>
        </header>
        {notice && (
          <div className="mx-5 mt-4 rounded-md border border-line bg-surface px-3 py-2 text-[12px] text-ink-2">
            {notice}
          </div>
        )}
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
