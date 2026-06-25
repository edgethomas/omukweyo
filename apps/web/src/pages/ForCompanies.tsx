import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { img } from '@/lib/images';
import { Banknote, Stethoscope, Scissors, Building2, GraduationCap, Car } from 'lucide-react';

const outcomes = [
  { t: 'Walk-in complaints ↓ 60–80%', d: 'Customers stop showing up at 6am for a 9am service. They join from home and arrive when it\'s time.' },
  { t: 'Lower SMS cost, full audit', d: 'Only SMS at the right moments. Every action is logged for compliance and dispute resolution.' },
  { t: 'Real-time branch comparison', d: 'See which branch is slow, which service dominates, and where to add a counter.' },
  { t: 'Front desk loves it', d: 'One big "Call next" button. No more sticky notes, no more angry customers at the front.' },
  { t: 'Multi-tenant, multi-branch', d: 'Isolated data, role-based access, branch-level controls, corporate-level analytics.' },
  { t: 'No procurement. No IT.', d: 'No hardware to buy, no system to install, no vendor to negotiate with.' },
];

const industries = [
  { l: 'Banks', i: Banknote },
  { l: 'Clinics', i: Stethoscope },
  { l: 'Salons', i: Scissors },
  { l: 'Government', i: Building2 },
  { l: 'Schools', i: GraduationCap },
  { l: 'Service centers', i: Car },
];

const faqs = [
  { q: 'Do we need to install anything?', a: 'No. Omukweyo runs in the browser on phones, tablets, laptops, and existing waiting-room TVs. No hardware, no integration.' },
  { q: 'How long does setup take?', a: 'A small business can be live in under an hour. A multi-branch company usually finishes onboarding in 3–7 days.' },
  { q: 'What if the internet drops?', a: 'Staff console shows the last-known waiting list and queues actions locally. As soon as you\'re back online, everything syncs.' },
  { q: 'Can we use our own brand?', a: 'Yes. Starter plans can match company colors and logo. Business and Enterprise support custom domains and white-label.' },
  { q: 'How do you handle data privacy?', a: 'Phone numbers are masked in public views. We never expose customer lists outside your tenant. Every action is audit-logged.' },
  { q: 'What payment methods do you accept?', a: 'EFT / manual invoice by default. Online card payments via DPO Pay and PayToday. Enterprise customers can pay on invoice.' },
];

export default function ForCompanies() {
  return (
    <div className="container-x py-12 space-y-12">
      <header className="grid lg:grid-cols-[1fr_500px] gap-8 items-center">
        <div>
        <div className="text-[12px] text-ink-3 mb-3"><Link to="/" className="hover:text-ink">Home</Link> <span className="mx-2 text-ink-3/40">/</span> For companies</div>
        <h1 className="t-h1 text-balance max-w-3xl">Your queue should open as an admin console, not a brochure.</h1>
        <p className="t-body mt-3 max-w-2xl">Banks, clinics, salons, government offices, schools, restaurants, and service centers — Omukweyo replaces paper lists, ticket machines, and WhatsApp chaos with a fast, fair, auditable queue.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/signup" className="btn btn-primary btn-md">Sign up <ArrowRight size={14} /></Link>
          <Link to="/contact" className="btn btn-outline btn-md">Book a walkthrough</Link>
          <Link to="/dashboard" className="btn btn-ghost btn-md">View admin console</Link>
        </div>
        </div>
        <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-sm">
          <img src={img.inlineBusinessDashboard} alt="Omukweyo business admin console on laptop and tablet" className="h-80 w-full object-cover" />
        </div>
      </header>

      <section>
        <div className="t-eyebrow mb-4">Outcomes in week one</div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line rounded-lg overflow-hidden">
          {outcomes.map((o) => (
            <div key={o.t} className="bg-surface p-5">
              <Check size={16} className="text-emerald-600" />
              <h3 className="mt-2 text-[14px] font-semibold text-ink">{o.t}</h3>
              <p className="mt-1.5 text-[12px] text-ink-2 leading-relaxed">{o.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="t-eyebrow mb-4">For your industry</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-line border border-line rounded-lg overflow-hidden">
          {industries.map(({ l, i: I }) => (
            <div key={l} className="bg-surface p-3 flex items-center gap-2">
              <I size={13} className="text-ink-2" />
              <span className="text-[13px] font-medium text-ink">{l}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="t-eyebrow mb-4">Company admin console preview</div>
        <div className="card p-5">
          <div className="grid grid-cols-4 gap-px bg-line border border-line">
            {[['Live waiting','18'],['Avg wait','7m'],['Served','142'],['No-show','3.4%']].map(([k,v]) => (
              <div key={k} className="bg-surface-2 p-3">
                <div className="t-eyebrow text-[9px]">{k}</div>
                <div className="t-mono text-xl text-ink font-semibold mt-0.5">{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 border border-line bg-surface-2 p-3">
            <div className="t-eyebrow text-[9px] mb-1">Wait time today</div>
            <svg viewBox="0 0 400 60" className="w-full h-14" preserveAspectRatio="none">
              <path d="M0,45 L40,32 L80,40 L120,18 L160,28 L200,12 L240,22 L280,8 L320,18 L360,5 L400,12" fill="none" stroke="#2563EB" strokeWidth="2" />
            </svg>
          </div>
          <div className="mt-4">
            <Link to="/dashboard" className="btn btn-primary btn-md">Open admin console <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      <section>
        <div className="t-eyebrow mb-4">FAQ</div>
        <div className="grid md:grid-cols-2 gap-px bg-line border border-line rounded-lg overflow-hidden">
          {faqs.map((f) => (
            <details key={f.q} className="bg-surface p-4 group">
              <summary className="cursor-pointer text-[13px] font-semibold text-ink list-none flex items-center justify-between gap-2">
                {f.q}
                <span className="text-ink-3 group-open:rotate-45 transition-transform text-base leading-none">+</span>
              </summary>
              <p className="mt-2 text-[12px] text-ink-2 leading-relaxed border-t border-line pt-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
