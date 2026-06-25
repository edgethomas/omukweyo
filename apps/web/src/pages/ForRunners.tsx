import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { img } from '@/lib/images';

const rules = [
  'The runner only stands in a normal public line where allowed.',
  'No impersonation, no fake documents, no trespassing.',
  'No queuing on behalf of multiple people at once.',
  'GPS check-in at location with timestamp and optional photo proof.',
  'Identity verified, phone verified, photo, rating, and optional background check.',
  'Users see runner profile, rating, and price before they accept.',
  'Support can review updates, messages, proof, and resolve disputes.',
  'Both sides rate each other and bad actors are removed quickly.',
];

const pricing = [
  { l: 'Base fee', d: 'Covers runner time, transport, and platform access.' },
  { l: 'Waiting time', d: 'A per-minute rate for the time the runner actually stands in line.' },
  { l: 'Platform fee', d: 'Covers verification, support, escrow, and dispute resolution.' },
];

export default function ForRunners() {
  return (
    <div className="container-x py-12 space-y-12">
      <header className="grid lg:grid-cols-[1fr_470px] gap-8 items-center">
        <div>
          <h1 className="t-h1 text-balance max-w-3xl">Runner work is a real workspace.</h1>
          <p className="t-body mt-3 max-w-2xl">
            Accept allowed public-line jobs, send proof updates, and keep the customer informed from one screen.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/runner/signup" className="btn btn-primary btn-md">Apply as runner</Link>
            <Link to="/runner/work" className="btn btn-outline btn-md">View workbench</Link>
          </div>
        </div>
        <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-sm">
          <img src={img.inlineRunnerWorkflow} alt="Omukweyo runner sharing a queue update" className="h-80 w-full object-cover" />
        </div>
      </header>

      <section>
        <div className="t-eyebrow mb-4">Safety first</div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-5">
            <ul className="space-y-2.5 text-[13px] text-ink-2">
              {rules.map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <ShieldCheck size={13} className="text-emerald-600 mt-0.5 shrink-0" /> {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5 border-ink-2">
            <div className="flex items-center gap-1.5 mb-2 text-ink-2">
              <AlertTriangle size={14} />
              <span className="t-eyebrow text-[9px]">In one sentence</span>
            </div>
            <p className="text-[15px] text-ink leading-relaxed font-semibold">
              "I stood in line at a public place where I was allowed to be, and handed the spot to the person who asked for it."
            </p>
            <p className="mt-3 text-[12px] text-ink-2">No fakes, no tricks, no replacements.</p>
          </div>
        </div>
      </section>

      <section>
        <div className="t-eyebrow mb-4">Pricing</div>
        <div className="grid md:grid-cols-3 gap-px bg-line border border-line rounded-lg overflow-hidden">
          {pricing.map((p) => (
            <div key={p.l} className="bg-surface p-5">
              <h3 className="text-[14px] font-semibold text-ink">{p.l}</h3>
              <p className="mt-1.5 text-[12px] text-ink-2 leading-relaxed">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <h3 className="t-h2">Ready to start earning from verified queue jobs?</h3>
          <Link to="/runner/signup" className="btn btn-primary btn-md">Create runner profile</Link>
        </div>
      </section>
    </div>
  );
}
