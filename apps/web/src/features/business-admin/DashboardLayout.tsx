import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Building2, ChartLine, CreditCard, Globe, Hash, LayoutDashboard,
  LineChart, MessageSquare, Palette, QrCode, Settings as SettingsIcon, ShieldCheck, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SECTIONS = [
  {
    label: 'Operate',
    items: [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/dashboard/queues', label: 'Live queues', icon: LineChart },
      { to: '/dashboard/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    label: 'Setup',
    items: [
      { to: '/dashboard/branches', label: 'Branches', icon: Building2 },
      { to: '/dashboard/services', label: 'Services', icon: Hash },
      { to: '/dashboard/counters', label: 'Counters', icon: ShieldCheck },
      { to: '/dashboard/staff', label: 'Staff', icon: Users },
    ],
  },
  {
    label: 'Reach',
    items: [
      { to: '/dashboard/qr-codes', label: 'QR codes', icon: QrCode },
      { to: '/dashboard/embed', label: 'Embed widget', icon: Globe },
      { to: '/dashboard/sms', label: 'SMS', icon: MessageSquare },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/dashboard/analytics', label: 'Analytics', icon: ChartLine },
      { to: '/dashboard/reports', label: 'Reports', icon: LineChart },
    ],
  },
  {
    label: 'Store page',
    items: [
      { to: '/dashboard/branding', label: 'Store page', icon: Palette },
    ],
  },
  {
    label: 'Billing',
    items: [
      { to: '/dashboard/billing', label: 'Billing', icon: CreditCard },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
];

function findSection(pathname: string) {
  return SECTIONS.find((section) => section.items.some((item) => {
    if (item.end) return pathname === item.to;
    return pathname === item.to || pathname.startsWith(`${item.to}/`);
  })) ?? SECTIONS[0];
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const section = useMemo(() => findSection(loc.pathname), [loc.pathname]);
  const showSectionNav = section.items.length > 1;
  return (
    <div className="space-y-4">
      {showSectionNav && (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="t-eyebrow text-[10px] uppercase tracking-wide text-ink-3 sm:hidden">{section.label}</span>
            <span className="t-eyebrow text-[10px] uppercase tracking-wide text-ink-3 hidden sm:inline">{section.label}</span>
          </div>
          <nav>
            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-line bg-surface p-1 sm:inline-flex">
              {section.items.map((item) => {
                const active = item.end ? loc.pathname === item.to : loc.pathname === item.to || loc.pathname.startsWith(`${item.to}/`);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={cn(
                      'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                      active ? 'bg-accent-soft text-accent' : 'text-ink-2 hover:text-ink hover:bg-surface-2',
                    )}
                  >
                    <item.icon size={12} />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </>
      )}
      {children}
    </div>
  );
}
