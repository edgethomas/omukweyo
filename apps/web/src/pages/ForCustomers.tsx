import { Link } from 'react-router-dom';
import { useState } from 'react';
import { CheckCircle2, MessageSquare, Navigation, Share2, Smartphone } from 'lucide-react';
import { img } from '@/lib/images';

const templates = [
  { k: 'TICKET_CREATED', m: '"Hi Maria, you joined Downtown Service Center for personal service. Ticket A-028. Track: omukweyo.app/t/AB12."' },
  { k: 'ALMOST_TURN', m: '"Hi Maria, your turn is coming. 2 people ahead. Please start heading there."' },
  { k: 'CALLED', m: '"Hi Maria, ticket A-028 has been called. Go to Counter 3."' },
  { k: 'MISSED', m: '"Hi Maria, ticket A-028 was missed. Open your ticket to rejoin if allowed."' },
  { k: 'RESERVATION', m: '"Your reserved arrival window is tomorrow at 09:30. We will book your live spot before it is gone."' },
  { k: 'OPT_OUT', m: '"Reply STOP at any time. We will honor it instantly and never text you again."' },
];

const steps = [
  { i: '01', t: 'Search or scan', d: 'Open a business page from search, QR, or a website widget.' },
  { i: '02', t: 'Join or reserve', d: 'Take a live ticket now, or pay for a protected future arrival window.' },
  { i: '03', t: 'Move freely', d: 'Track your place and get an SMS when your turn is close.' },
];

export default function ForCustomers() {
  const [ticketNotice, setTicketNotice] = useState<string | null>(null);

  return (
    <div className="container-x py-12 space-y-12">
      <header className="grid lg:grid-cols-[1fr_460px] gap-8 items-center">
        <div>
          <div className="text-[12px] text-ink-3 mb-3"><Link to="/" className="hover:text-ink">Home</Link> <span className="mx-2 text-ink-3/40">/</span> For customers</div>
          <h1 className="t-h1 text-balance max-w-3xl">Join a queue, then get on with your day.</h1>
          <p className="t-body mt-3 max-w-2xl">Search a business, scan its QR, or reserve a future arrival window from your account.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/signup" className="btn btn-primary btn-md">Sign up</Link>
            <Link to="/businesses" className="btn btn-outline btn-md">Find a business</Link>
          </div>
        </div>
        <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-sm">
          <img src={img.inlineReservationFlow} alt="Customer using Omukweyo instead of standing in line" className="h-72 w-full object-cover" />
        </div>
      </header>

      <section>
        <div className="t-eyebrow mb-4">Your phone, your queue</div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="space-y-3.5">
              {steps.map((s) => (
                <div key={s.i} className="flex items-start gap-3 border-b border-dashed border-line pb-3 last:border-0 last:pb-0">
                  <div className="t-mono text-ink text-base w-7 shrink-0">{s.i}</div>
                  <div>
                    <strong className="text-ink">{s.t}</strong> <span className="text-ink-2">{s.d}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 mt-1 border-t border-line">
              <p className="text-[12px] text-ink-2">If you have a smartphone, you can also tap "I'm on my way" to let the front desk know.</p>
            </div>
          </div>
          <div className="card p-5">
            <div className="t-eyebrow text-[10px]">Ticket</div>
            <div className="t-mono text-4xl text-ink mt-0.5 font-semibold">A-028</div>
            <span className="chip-wait mt-2">WAITING</span>
            <hr className="hairline my-4" />
            <div className="grid grid-cols-2 gap-px bg-line border border-line">
              {[
                ['People ahead', '4'],
                ['ETA', '~9 min'],
                ['Counter', '-'],
                ['Service', 'Personal service'],
              ].map(([k, v]) => (
                <div key={k} className="bg-surface p-2.5">
                  <div className="t-eyebrow text-[9px]">{k}</div>
                  <div className="text-[13px] text-ink font-medium mt-0.5">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setTicketNotice('Front desk notified that you are on your way.')} className="btn btn-sm btn-outline">
                <Navigation size={13} /> On my way
              </button>
              <button type="button" onClick={() => setTicketNotice('Demo ticket link copied.')} className="btn btn-sm btn-outline">
                <Share2 size={13} /> Share
              </button>
            </div>
            {ticketNotice && (
              <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700 flex gap-2">
                <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                {ticketNotice}
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="t-eyebrow mb-4">SMS you will receive</div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line rounded-lg overflow-hidden">
          {templates.map((t) => (
            <div key={t.k} className="bg-surface p-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <MessageSquare size={12} className="text-ink-2" />
                <span className="t-eyebrow text-[9px]">{t.k}</span>
              </div>
              <p className="text-[12px] text-ink-2 leading-relaxed">{t.m}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="t-eyebrow mb-4">No smartphone?</div>
        <div className="card p-5 flex flex-col md:flex-row items-center gap-5">
          <Smartphone size={28} className="text-ink-2 shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] text-ink-2 leading-relaxed">You do not need to install an app. Keep the ticket page open or rely on SMS updates. Businesses only see the details needed to serve you.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link to="/businesses" className="btn btn-outline btn-md">Find a live queue</Link>
            <Link to="/customer/signup" className="btn btn-primary btn-md">Reserve a future spot</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
