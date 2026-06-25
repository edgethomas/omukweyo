import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Navigation, Share2, X, Coffee, MapPin, Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { cn, formatTime } from '@/lib/utils';
import { shareOrCopy } from '@/lib/browserActions';
import type { QueueTicket, ServerEvent } from '@inline/shared';
import { img } from '@/lib/images';

const SESSION_KEY = 'omukweyo_session';
const CUSTOMER_KEY = 'omukweyo_customer';
const LEGACY_CUSTOMER_KEY = 'inline_customer';

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function customerIdForTicket() {
  const customer = readJson<{ id?: string }>(CUSTOMER_KEY) ?? readJson<{ id?: string }>(LEGACY_CUSTOMER_KEY);
  const session = readJson<{ user?: { role?: string; customerId?: string } }>(SESSION_KEY);
  if (session?.user?.role === 'CUSTOMER') return customer?.id ?? session.user.customerId;
  return undefined;
}

export default function Ticket() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<QueueTicket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(!id);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedEmpty, setLoadedEmpty] = useState(false);

  useEffect(() => {
    setDemoMode(false);
    setTicket(null);
    setError(null);
    setLoadedEmpty(false);
    setLoading(true);
    if (id) {
      api.getTicket(id)
        .then(({ ticket }) => setTicket(ticket))
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
      return;
    }
    const customerId = customerIdForTicket();
    if (customerId) {
      setDemoMode(false);
      api.customerVisit(customerId)
        .then(({ currentTicket }) => {
          setTicket(currentTicket ?? null);
          setLoadedEmpty(!currentTicket);
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
      return;
    }
    setDemoMode(true);
    api.liveQueue()
      .then(({ tickets }) => {
        setTicket(tickets[0] ?? null);
        setLoadedEmpty(tickets.length === 0);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const s = getSocket();
    const on = (raw: any) => {
      const ev = raw as ServerEvent;
      if (ev.type === 'ticket:updated' && id && ev.ticket.id === id) setTicket(ev.ticket);
      if (ev.type === 'ticket:created' && demoMode) setTicket(ev.ticket);
    };
    s.on('omukweyo:event', on);
    return () => { s.off('omukweyo:event', on); };
  }, [id, demoMode]);

  const cancel = async () => { if (!ticket) return; await api.cancelTicket(ticket.id); const { ticket: t } = await api.getTicket(ticket.id); setTicket(t); };
  const onMyWay = async () => {
    if (!ticket) return;
    await api.onMyWay(ticket.id);
    setNotice('Front desk notified that you are on your way.');
  };
  const shareTicket = async () => {
    if (!ticket) return;
    try {
      const message = await shareOrCopy(`Omukweyo ticket ${ticket.ticketNumber}`, `Track ${ticket.ticketNumber} at ${ticket.serviceName}.`, window.location.href);
      setNotice(message);
    } catch {
      setNotice('Unable to share from this browser. Copy the page URL instead.');
    }
  };

  if (error) return <div className="p-8 text-ink-2">{error}</div>;
  if (loading) return <div className="card p-6 h-72 animate-pulse" />;
  if (!ticket && loadedEmpty) {
    return (
      <div className="card p-8 text-center max-w-2xl mx-auto">
        <TicketIcon />
        <h2 className="mt-3 text-[20px] font-semibold text-ink">No active ticket right now</h2>
        <p className="mt-2 text-[13px] text-ink-2">
          Join a business queue or reserve a future arrival window. Your live ticket will appear here when it is created.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link to="/businesses" className="btn btn-primary btn-md">Find a queue</Link>
          <Link to="/reserve" className="btn btn-outline btn-md">Reserve future spot</Link>
        </div>
      </div>
    );
  }
  if (!ticket) return <div className="card p-6 h-72 animate-pulse" />;

  const stages = [
    { k: 'JOINED', label: 'Joined' },
    { k: 'WAITING', label: 'Waiting' },
    { k: 'CALLED', label: 'Called' },
    { k: 'SERVED', label: 'Served' },
  ];
  const stageIndex = stages.findIndex(s => s.k === ticket.status);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Phone mockup */}
        <div className="lg:col-span-1">
          <div className="rounded-[28px] border-[8px] border-ink-2 bg-ink-2 p-1 shadow-md mx-auto max-w-[240px]">
            <div className="rounded-[20px] bg-surface overflow-hidden">
              <div className="bg-ink text-white px-4 py-1.5 flex items-center justify-between font-mono text-[10px]">
                <span>11:42</span>
                <div className="flex items-center gap-1">
                  <span>●●●</span><span>50%</span>
                </div>
              </div>
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={ticket.status}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="p-4"
                >
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="t-eyebrow text-[9px]">Ticket</div>
                      <div className="t-mono text-3xl text-ink mt-0.5 font-semibold">{ticket.ticketNumber}</div>
                    </div>
                    <span className={cn(
                      ticket.status === 'SERVING' ? 'chip-serve' :
                      ticket.status === 'CALLED' ? 'chip-call' :
                      ticket.status === 'SERVED' ? 'chip-done' :
                      ticket.status === 'CANCELLED' ? 'chip-done' :
                      ticket.status === 'MISSED' ? 'chip-miss' :
                      'chip-wait',
                    )}>{ticket.status}</span>
                  </div>
                  <hr className="hairline my-3" />
                  <div className="grid grid-cols-2 gap-px bg-line border border-line">
                    <Stat k="People" v={String(ticket.peopleAhead)} />
                    <Stat k="ETA" v={`~${ticket.estimatedWaitMinutes}m`} />
                    <Stat k="Counter" v={ticket.counter ?? '—'} />
                    <Stat k="Joined" v={formatTime(ticket.joinedAt)} />
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    <span className="font-mono uppercase tracking-wider text-[9px] text-ink-3">SMS</span>
                    We'll text you when your turn is close.
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-px bg-line border border-line">
                    <button onClick={onMyWay} className="bg-surface p-2 text-[11px] flex items-center justify-center gap-1 font-medium hover:bg-surface-2"><Navigation size={11} /> On my way</button>
                    <button onClick={shareTicket} className="bg-surface p-2 text-[11px] flex items-center justify-center gap-1 font-medium hover:bg-surface-2"><Share2 size={11} /> Share</button>
                  </div>
                  {notice && (
                    <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[11px] text-emerald-700 flex gap-1.5">
                      <CheckCircle2 size={13} className="shrink-0 mt-0.5" />
                      {notice}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right: status + actions + while-you-wait */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={ticket.status}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="card p-5"
            >
              <div className="t-eyebrow text-[10px]">Status</div>
              <h2 className="mt-1 text-[20px] font-semibold text-ink leading-tight">
                {ticket.status === 'WAITING' && <>You're in. <span className="text-accent">~{ticket.estimatedWaitMinutes} min.</span></>}
                {ticket.status === 'CALLED' && <>You're up. <span className="text-amber-600">Go to {ticket.counter}.</span></>}
                {ticket.status === 'SERVING' && <>Being served.</>}
                {ticket.status === 'SERVED' && <>All done. Thanks for coming.</>}
                {ticket.status === 'MISSED' && <>Turn missed.</>}
                {ticket.status === 'CANCELLED' && <>Ticket cancelled.</>}
              </h2>
              <p className="text-[13px] text-ink-2 mt-2">
                {ticket.status === 'WAITING' && `There are ${ticket.peopleAhead} people ahead of you at ${ticket.serviceName}. We'll text you when your number is close.`}
                {ticket.status === 'CALLED' && `Your ticket has been called. Head over to ${ticket.counter ?? 'your counter'} and let the front desk know your number.`}
                {ticket.status === 'SERVING' && `Take a breath. The team is helping you now.`}
                {ticket.status === 'SERVED' && `Hope the visit went well. You can rate the experience below.`}
                {ticket.status === 'MISSED' && `Your turn came and went. Open the page to rejoin if your company allows.`}
                {ticket.status === 'CANCELLED' && `If this was a mistake, open the company page to rejoin.`}
              </p>

              {stageIndex >= 0 && (
                <div className="mt-4 flex items-center gap-0 border border-line rounded-md overflow-hidden">
                  {stages.map((s, i) => (
                    <div
                      key={s.k}
                      className={cn(
                        'flex-1 py-2.5 text-center border-r border-line last:border-r-0',
                        i < stageIndex ? 'text-accent bg-accent-soft' :
                        i === stageIndex ? 'bg-ink text-white' :
                        'text-ink-3 bg-surface-2',
                      )}
                    >
                      <div className="t-mono text-[10px]">{String(i+1).padStart(2,'0')}</div>
                      <div className="font-medium text-[11px] mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {ticket.status !== 'CANCELLED' && ticket.status !== 'SERVED' && (
                  <button onClick={cancel} className="btn btn-sm btn-outline"><X size={13} /> Cancel ticket</button>
                )}
                <Link to={ticket.companySlug ? `/c/${ticket.companySlug}` : '/businesses'} className="btn btn-sm btn-ghost">View company page</Link>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-ink">While you wait</h3>
              <span className="t-eyebrow text-[10px]">~{ticket.estimatedWaitMinutes} min</span>
            </div>
            <hr className="hairline mb-3" />
            <div className="grid grid-cols-3 gap-2">
              <WaitCard img={img.personCafe} title="Café Anton" sub="3 min walk" />
              <WaitCard img={img.qrCoffee} title="Grab a coffee" sub="2 min walk" />
              <WaitCard img={img.bookOpen} title="Library" sub="Across the street" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-ink">Ticket history</h3>
          <span className="t-eyebrow text-[10px]">{ticket.events.length} events</span>
        </div>
        <hr className="hairline my-3" />
        <ol className="space-y-2.5">
          {ticket.events.slice().reverse().map(ev => (
            <li key={ev.id} className="flex items-start gap-3 text-[12px] border-b border-dashed border-line pb-2.5 last:border-0 last:pb-0">
              <div className="t-mono text-ink-3 w-14 shrink-0">{formatTime(ev.at)}</div>
              <div>
                <div className="text-ink-2">{ev.message}</div>
                <div className="t-eyebrow text-[9px] mt-0.5">{ev.type}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {demoMode && (
        <div className="text-center t-eyebrow text-[10px] text-ink-3">Live demo · showing the most recently created ticket</div>
      )}
    </div>
  );
}

function TicketIcon() {
  return (
    <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-accent">
      <Bell size={20} />
    </span>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-surface p-2.5">
      <div className="t-eyebrow text-[9px]">{k}</div>
      <div className="t-mono text-[13px] text-ink font-medium mt-0.5">{v}</div>
    </div>
  );
}

function WaitCard({ img: src, title, sub }: { img: string; title: string; sub: string }) {
  return (
    <div className="border border-line bg-surface overflow-hidden">
      <div className="aspect-[4/3] overflow-hidden bg-surface-2">
        <img src={src} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="p-2.5">
        <div className="text-[12px] text-ink font-medium leading-tight">{title}</div>
        <div className="font-mono text-[10px] text-ink-3 mt-0.5">{sub}</div>
      </div>
    </div>
  );
}
