import { Link } from 'react-router-dom';
import { BrandLogo } from './Brand';

const cols = [
  {
    h: 'Product',
    items: [
      { to: '/how-it-works', label: 'How it works' },
      { to: '/for-companies', label: 'For companies' },
      { to: '/for-customers', label: 'For customers' },
      { to: '/customer/signup', label: 'Customer signup' },
      { to: '/businesses', label: 'Find businesses' },
      { to: '/customer', label: 'Your visit' },
      { to: '/for-runners', label: 'For runners' },
      { to: '/runner/signup', label: 'Runner signup' },
      { to: '/pricing', label: 'Pricing' },
    ],
  },
  {
    h: 'Live preview',
    items: [
      { to: '/businesses', label: 'Public company pages' },
      { to: '/ticket', label: 'Live ticket' },
      { to: '/staff', label: 'Staff console' },
      { to: '/dashboard', label: 'Company admin console' },
      { to: '/billing', label: 'Billing workspace' },
      { to: '/runner/work', label: 'Runner workbench' },
      { to: '/admin', label: 'Platform admin' },
      { to: '/embed', label: 'Embed widget' },
    ],
  },
  {
    h: 'Company',
    items: [
      { to: '/contact', label: 'Contact' },
      { to: '/login', label: 'Log in' },
      { to: '/signup', label: 'Sign up' },
      { to: '/privacy', label: 'Privacy' },
      { to: '/terms', label: 'Terms' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-x py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <BrandLogo />
            <p className="text-ink-2 text-sm mt-3 max-w-sm">The queueing operating system for any business. Built for Namibia, designed for the world.</p>
            <div className="flex items-center gap-2 mt-4 text-[12px] text-ink-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              All systems operational · v1.0
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.h}>
              <h4 className="t-eyebrow mb-3">{c.h}</h4>
              <ul className="flex flex-col gap-2">
                {c.items.map((it) => (
                  <li key={it.label}>
                    <Link to={it.to} className="text-[13px] text-ink-2 hover:text-ink transition-colors">
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-ink-3">
          <div>© 2026 Omukweyo · A product by Edge Work · Made in Windhoek</div>
          <div>English (NA) · UTC+2</div>
        </div>
      </div>
    </footer>
  );
}
