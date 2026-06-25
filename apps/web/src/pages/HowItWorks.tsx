import { Link } from 'react-router-dom';
import { ArrowRight, UserCheck } from 'lucide-react';
import { img } from '@/lib/images';

const steps = [
  { n: '01', t: 'Customer searches or scans', d: 'They find a business, open the public page, or reserve a future spot.', img: img.inlinePublicPage },
  { n: '02', t: 'Business operates the queue', d: 'Staff call tickets while managers watch live demand and branch load.', img: img.inlineOperationsDashboard },
  { n: '03', t: 'Runner covers outside lines', d: 'Approved runners can handle public-line jobs with proof updates.', img: img.inlineRunnerWorkflow },
];

const customerSteps = [
  { n: '01', t: 'Scan the QR or open the link', d: 'No app, no account, no friction. Just a phone.' },
  { n: '02', t: 'Pick a service and your name', d: 'Two fields. Under five seconds. That\'s the whole form.' },
  { n: '03', t: 'Get a ticket and walk away', d: 'Live position, live ETA, live counter. Stay at the café.' },
  { n: '04', t: 'Get an SMS when it\'s your turn', d: '"Your turn is coming. 2 people ahead. Please start heading there."' },
  { n: '05', t: 'Walk in, get served, rate the visit', d: 'Optionally save your favorites for next time.' },
];

const staffSteps = [
  { n: '01', t: 'Open the console', d: 'Phone, tablet, laptop, or a kiosk at reception.' },
  { n: '02', t: 'See the waiting list', d: 'Names, services, wait times, priority flags. Sorted by position.' },
  { n: '03', t: 'Click Call next', d: 'The right person moves up. SMS goes out automatically.' },
  { n: '04', t: 'Mark served, missed, or hold', d: 'All ticket state changes are audit-logged. The admin console updates live.' },
];

const companySteps = [
  { n: '01', t: 'Sign up in 60 seconds', d: 'Free forever for one branch. No card. No procurement.' },
  { n: '02', t: 'Add a branch and services', d: '"Personal banking" or "Haircut" — name them as your customers know them.' },
  { n: '03', t: 'Generate a QR or copy an embed', d: 'Print and stick. Drop on your site. Both work.' },
  { n: '04', t: 'Take your first ticket', d: 'You\'re live. The SMS wallet is prefilled with trial credits.' },
];

export default function HowItWorks() {
  return (
    <div className="container-x py-12 space-y-12">
      <header>
        <h1 className="t-h1 text-balance max-w-3xl">How Omukweyo actually works — customer, staff, and company in three flows.</h1>
        <p className="t-body mt-3 max-w-2xl">Omukweyo works the same way for a one-chair salon, a 14-branch bank, or a government service center. Here's the whole story.</p>
      </header>

      <section>
        <div className="t-eyebrow mb-4">Three-step overview</div>
        <div className="grid md:grid-cols-3 gap-4">
          {steps.map((s) => (
            <div key={s.n} className="panel">
              <div className="aspect-[4/3] overflow-hidden bg-surface-2">
                <img src={s.img} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="p-4">
                <div className="t-mono text-[12px] text-ink-3">{s.n}</div>
                <h3 className="mt-1 text-[14px] font-semibold text-ink leading-snug">{s.t}</h3>
                <p className="mt-1.5 text-[12px] text-ink-2 leading-relaxed">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="t-eyebrow mb-4">Customer flow · 5 steps</div>
        <div className="card p-5 grid sm:grid-cols-2 lg:grid-cols-5 gap-px bg-line">
          {customerSteps.map((s) => (
            <div key={s.n} className="bg-surface p-4">
              <div className="t-mono text-[12px] text-ink-3">{s.n}</div>
              <h3 className="mt-1 text-[13px] font-semibold text-ink leading-snug">{s.t}</h3>
              <p className="mt-1.5 text-[12px] text-ink-2 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="t-eyebrow mb-4">Staff flow · 4 steps</div>
        <div className="card p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line">
          {staffSteps.map((s) => (
            <div key={s.n} className="bg-surface p-4">
              <div className="t-mono text-[12px] text-ink-3">{s.n}</div>
              <h3 className="mt-1 text-[13px] font-semibold text-ink leading-snug">{s.t}</h3>
              <p className="mt-1.5 text-[12px] text-ink-2 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="t-eyebrow mb-4">Company flow · 4 steps</div>
        <div className="card p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line">
          {companySteps.map((s) => (
            <div key={s.n} className="bg-surface p-4">
              <div className="t-mono text-[12px] text-ink-3">{s.n}</div>
              <h3 className="mt-1 text-[13px] font-semibold text-ink leading-snug">{s.t}</h3>
              <p className="mt-1.5 text-[12px] text-ink-2 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="t-eyebrow mb-4">Runner flow · live demo</div>
        <div className="card p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line">
          {[
            { t: 'Review jobs', d: 'The workbench lists allowed public-line jobs with payout and instructions.' },
            { t: 'Accept', d: 'A verified runner accepts a job and status changes through the backend.' },
            { t: 'Track', d: 'Runner check-in and proof updates log customer SMS records.' },
            { t: 'Handover', d: 'The runner completes the handoff and the job moves to complete.' },
          ].map((s) => (
            <div key={s.t} className="bg-surface p-4">
              <h3 className="text-[13px] font-semibold text-ink">{s.t}</h3>
              <p className="mt-1.5 text-[12px] text-ink-2 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
        <Link to="/runner/work" className="btn btn-outline btn-md mt-4"><UserCheck size={14} /> Open runner workbench</Link>
      </section>

      <section className="card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <h3 className="t-h2 max-w-xl">Spin up a working Omukweyo in under five minutes.</h3>
        <div className="flex gap-2">
          <Link to="/onboarding" className="btn btn-primary btn-md">Start free <ArrowRight size={14} /></Link>
          <Link to="/businesses" className="btn btn-outline btn-md">Find a live queue</Link>
        </div>
      </section>
    </div>
  );
}
