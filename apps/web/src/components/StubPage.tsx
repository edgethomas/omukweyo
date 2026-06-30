import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Construction, Sparkles } from 'lucide-react';

type StubPageProps = {
  title: string;
  subtitle?: string;
  phase: 1 | 2 | 3 | 4 | 5;
  bullets?: string[];
  actions?: ReactNode;
  backTo?: string;
  backLabel?: string;
};

const PHASE_COPY: Record<1 | 2 | 3 | 4 | 5, { label: string; tagline: string }> = {
  1: { label: 'Customer area', tagline: 'Profile, visit history, and live ticket tools.' },
  2: { label: 'Discovery area', tagline: 'Business search, public pages, and reservation flow.' },
  3: { label: 'Business area', tagline: 'Admin tools and the staff counter console.' },
  4: { label: 'Runner area', tagline: 'Public-line jobs, proof updates, and platform oversight.' },
  5: { label: 'Platform area', tagline: 'Shared settings, QA surfaces, and release controls.' },
};

export default function StubPage({ title, subtitle, phase, bullets, actions, backTo = '/', backLabel = 'Back to home' }: StubPageProps) {
  const copy = PHASE_COPY[phase];
  return (
    <div className="space-y-5 max-w-3xl">
      <div className="card p-6">
        <div className="flex items-center gap-2 text-[12px] text-ink-3">
          <Construction size={14} className="text-accent" />
          <span className="t-eyebrow text-[10px]">{copy.label} - planned</span>
        </div>
        <h1 className="mt-2 text-[22px] font-semibold text-ink leading-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-[13px] text-ink-2 max-w-2xl">{subtitle}</p>}
        <p className="mt-3 text-[12px] text-ink-3 inline-flex items-center gap-1.5">
          <Sparkles size={12} className="text-accent" />
          {copy.tagline}
        </p>

        {bullets && bullets.length > 0 && (
          <ul className="mt-5 space-y-2 text-[13px] text-ink-2">
            {bullets.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-accent">-</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {actions}
          <Link to={backTo} className="btn btn-outline btn-md">
            <ArrowLeft size={14} /> {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
