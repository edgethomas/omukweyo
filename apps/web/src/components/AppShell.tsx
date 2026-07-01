import { ElementType, ReactNode, useMemo, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ScanLine, Headphones, Code2, Settings, LogOut, Bell, User, UserCheck, Shield,
  CalendarClock, Building2, Tv, Tablet, ListOrdered, IdCard, CreditCard, Palette, QrCode,
  Users, Hash, HelpCircle,
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

function roleNavGroups(_publicPagePath: string): Record<Role, NavGroup[]> {
  return {
  CUSTOMER: [
    {
      label: 'Customer',
      items: [
        { to: '/customer', label: 'Your visit', icon: User },
        { to: '/businesses', label: 'Find businesses', icon: ScanLine },
        { to: '/reserve', label: 'Reserve window', icon: CalendarClock },
        { to: '/ticket', label: 'Live ticket', icon: ScanLine },
        { to: '/runner/request', label: 'Request a runner', icon: UserCheck },
      ],
    },
  ],
  COMPANY_OWNER: [
    {
      label: 'Operate',
      items: [
        { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { to: '/dashboard/queues', label: 'Live queues', icon: ListOrdered },
        { to: '/dashboard/customers', label: 'Customers', icon: Users },
        { to: '/staff', label: 'Staff console', icon: Headphones },
      ],
    },
    {
      label: 'Setup',
      items: [
        { to: '/dashboard/branches', label: 'Branches', icon: Building2 },
        { to: '/dashboard/services', label: 'Services', icon: Hash },
        { to: '/dashboard/counters', label: 'Counters', icon: ScanLine },
        { to: '/dashboard/staff', label: 'Team', icon: User },
        { to: '/dashboard/qr-codes', label: 'QR codes', icon: QrCode },
        { to: '/dashboard/embed', label: 'Widget', icon: Code2 },
      ],
    },
    {
      label: 'Business',
      items: [
        { to: '/dashboard/branding', label: 'Store page', icon: Palette },
        { to: '/dashboard/billing', label: 'Billing', icon: CreditCard },
        { to: '/dashboard/settings', label: 'Settings', icon: Settings },
      ],
    },
    {
      label: 'Account',
      items: [
        { to: '/dashboard/profile', label: 'My profile', icon: IdCard },
        { to: '/contact', label: 'Help', icon: HelpCircle },
      ],
    },
  ],
  COMPANY_MANAGER: [
    {
      label: 'Operate',
      items: [
        { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { to: '/dashboard/queues', label: 'Live queues', icon: ListOrdered },
        { to: '/dashboard/customers', label: 'Customers', icon: Users },
        { to: '/staff', label: 'Staff console', icon: Headphones },
      ],
    },
    {
      label: 'Setup',
      items: [
        { to: '/dashboard/branches', label: 'Branches', icon: Building2 },
        { to: '/dashboard/services', label: 'Services', icon: Hash },
        { to: '/dashboard/counters', label: 'Counters', icon: ScanLine },
        { to: '/dashboard/staff', label: 'Team', icon: User },
        { to: '/dashboard/qr-codes', label: 'QR codes', icon: QrCode },
        { to: '/dashboard/embed', label: 'Widget', icon: Code2 },
      ],
    },
    {
      label: 'Business',
      items: [
        { to: '/dashboard/branding', label: 'Store page', icon: Palette },
        { to: '/dashboard/billing', label: 'Billing', icon: CreditCard },
        { to: '/dashboard/settings', label: 'Settings', icon: Settings },
      ],
    },
    {
      label: 'Account',
      items: [
        { to: '/dashboard/profile', label: 'My profile', icon: IdCard },
        { to: '/contact', label: 'Help', icon: HelpCircle },
      ],
    },
  ],
  STAFF: [
    {
      label: 'Counter',
      items: [
        { to: '/staff', label: 'Staff console', icon: Headphones },
        { to: '/staff/queue', label: 'Queue view', icon: ListOrdered },
        { to: '/staff/kiosk', label: 'Kiosk', icon: Tablet },
        { to: '/staff/tv', label: 'Waiting room TV', icon: Tv },
      ],
    },
    {
      label: 'Account',
      items: [
        { to: '/staff/profile', label: 'My profile', icon: IdCard },
        { to: '/staff/settings', label: 'Settings', icon: Settings },
      ],
    },
  ],
  RUNNER: [
    {
      label: 'Runner',
      items: [
        { to: '/runner/work', label: 'Runner workbench', icon: UserCheck },
        { to: '/runner/profile', label: 'Runner profile', icon: User },
        { to: '/runner/settings', label: 'Settings', icon: Settings },
      ],
    },
  ],
  SUPER_ADMIN: [
    {
      label: 'Platform',
      items: [
        { to: '/admin', label: 'Overview', icon: Shield },
        { to: '/admin/companies', label: 'Companies', icon: Building2 },
        { to: '/admin/runners', label: 'Runners', icon: UserCheck },
        { to: '/admin/billing', label: 'Billing', icon: CreditCard },
        { to: '/admin/support', label: 'Support', icon: Headphones },
        { to: '/admin/audit-logs', label: 'Audit logs', icon: Shield },
        { to: '/admin/settings', label: 'Platform settings', icon: Settings },
      ],
    },
    {
      label: 'Account',
      items: [
        { to: '/admin/profile', label: 'My profile', icon: IdCard },
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

function navIsActive(pathname: string, target: string) {
  if (target === '/runner/work') return pathname === target || pathname.startsWith('/runner/jobs');
  if (['/dashboard', '/staff', '/admin', '/customer'].includes(target)) return pathname === target;
  return pathname === target || (target !== '/' && pathname.startsWith(target));
}

function mobileNavForRole(role: Role, navGroups: NavGroup[], profilePath: string) {
  const allItems = navGroups.flatMap((group) => group.items);
  const byPath = new Map(allItems.map((item) => [item.to, item]));
  const picksByRole: Partial<Record<Role, string[]>> = {
    COMPANY_OWNER: ['/dashboard', '/dashboard/queues', '/staff', '/dashboard/branding'],
    COMPANY_MANAGER: ['/dashboard', '/dashboard/queues', '/staff', '/dashboard/branding'],
    STAFF: ['/staff', '/staff/queue', '/staff/kiosk', '/staff/tv'],
    RUNNER: ['/runner/work', '/runner/profile', '/runner/settings'],
    SUPER_ADMIN: ['/admin', '/admin/companies', '/admin/runners', '/admin/support'],
  };
  const picked = (picksByRole[role] ?? allItems.map((item) => item.to))
    .map((path) => byPath.get(path))
    .filter((item): item is NavItem => Boolean(item))
    .filter((item) => item.to !== profilePath)
    .slice(0, 4);
  return picked.concat([{ to: profilePath, label: 'Profile', icon: IdCard }]).slice(0, 5);
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
  const profilePath = currentRole === 'COMPANY_OWNER' || currentRole === 'COMPANY_MANAGER'
    ? '/dashboard/profile'
    : currentRole === 'STAFF'
      ? '/staff/profile'
      : currentRole === 'RUNNER'
        ? '/runner/profile'
        : currentRole === 'SUPER_ADMIN'
          ? '/admin/profile'
          : '/customer/profile';
  const mobileNavItems = mobileNavForRole(currentRole, navGroups, profilePath);

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
                  const active = navIsActive(loc.pathname, l.to);
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
          <Link to={profilePath} className="flex items-center gap-3 flex-1 min-w-0 hover:bg-surface-2 -m-1 p-1 rounded-md transition-colors" title="Open my profile">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-accent grid place-items-center text-[11px] font-semibold shrink-0">
              {identity.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-ink truncate">{identity.name}</div>
              <div className="text-[11px] text-ink-3 truncate">{identity.email}</div>
            </div>
          </Link>
          <Link
            to="/login"
            onClick={() => localStorage.removeItem(SESSION_KEY)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-red-600 hover:bg-red-50 hover:text-red-700"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={15} />
          </Link>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <Link to={homePath} className="flex shrink-0 md:hidden">
            <BrandLogo />
          </Link>
          <div className="min-w-0 flex-1 text-center md:text-left">
            <h1 className="text-[15px] font-semibold text-ink truncate">{title}</h1>
            {subtitle && <p className="text-[12px] text-ink-3 truncate">{subtitle}</p>}
          </div>
          <div className="ml-auto flex min-w-0 items-center gap-2 md:gap-3">
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

      {mobileNavItems.length > 0 && (
        <nav className="app-mobile-nav" aria-label={`${currentRole.toLowerCase().replace('_', ' ')} navigation`} style={{ gridTemplateColumns: `repeat(${mobileNavItems.length}, minmax(0, 1fr))` }}>
          {mobileNavItems.map((item) => {
            const active = navIsActive(loc.pathname, item.to);
            return (
              <NavLink key={item.to} to={item.to} className={() => cn('app-mobile-link', active && 'active')}>
                <item.icon size={16} strokeWidth={1.9} />
                <span className="app-mobile-label">{item.label.replace('Runner ', '').replace('Company ', '')}</span>
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}
