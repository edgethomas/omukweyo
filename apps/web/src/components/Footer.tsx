import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BrandLogo } from './Brand';

const cols = [
  {
    h: 'Platform',
    items: [
      { to: '/how-it-works', label: 'How it works' },
      { to: '/for-companies', label: 'For companies' },
      { to: '/for-customers', label: 'For customers' },
      { to: '/for-runners', label: 'For runners' },
      { to: '/pricing', label: 'Pricing' },
    ],
  },
  {
    h: 'Get started',
    items: [
      { to: '/businesses', label: 'Find businesses' },
      { to: '/customer/signup', label: 'Customer signup' },
      { to: '/runner/signup', label: 'Runner signup' },
    ],
  },
  {
    h: 'Company',
    items: [
      { to: '/contact', label: 'Contact' },
      { to: '/login', label: 'Log in' },
      { to: '/privacy', label: 'Privacy' },
      { to: '/terms', label: 'Terms' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="container-x py-12 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1.5fr]">
          <div className="max-w-md">
            <BrandLogo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-2">
              The queueing operating system for businesses, public counters, and customers who want their time back.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/contact" className="btn btn-primary btn-md">
                Book a walkthrough <ArrowRight size={14} />
              </Link>
              <Link to="/signup" className="btn btn-outline btn-md">
                Start free
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {cols.map((c) => (
              <div key={c.h}>
                <h4 className="t-eyebrow mb-3">{c.h}</h4>
                <ul className="flex flex-col gap-2.5">
                  {c.items.map((it) => (
                    <li key={it.label}>
                      <Link to={it.to} className="text-[13px] font-medium text-ink-2 transition-colors hover:text-ink">
                        {it.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-lg border border-line bg-surface-2 px-4 py-4 sm:px-5 sm:py-5 md:flex md:items-center md:justify-between md:gap-6">
          <div>
            <div className="text-[13px] font-semibold text-ink">Built for busy counters and customers with places to be.</div>
            <div className="mt-1 text-[12px] leading-relaxed text-ink-2">
              Start with public business pages, customer accounts, runner applications, or a guided setup call.
            </div>
          </div>
          <Link to="/contact" className="btn btn-outline btn-md mt-4 md:mt-0 md:shrink-0">
            Talk to us <ArrowRight size={14} />
          </Link>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-line pt-5 text-xs text-ink-3 sm:flex-row sm:items-center">
          <div>&copy; 2026 Omukweyo. A product by Edge Work. Made in Windhoek.</div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>English (NA)</span>
            <span aria-hidden="true">&middot;</span>
            <span>UTC+2</span>
            <span aria-hidden="true">&middot;</span>
            <span>v1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
