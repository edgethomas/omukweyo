import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Navigation, Share2, X, Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { cn, formatTime } from '@/lib/utils';
import { shareOrCopy } from '@/lib/browserActions';
import type { QueueTicket, ServerEvent } from '@inline/shared';

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
    <div className="space-y-5 max-w-2xl mx-auto">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={ticket.status}
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="card p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="t-eyebrow text-[10px]">Status</div>
              <h2 className="mt-1 text-[20px] font-semibold text-ink leading-tight">
                {ticket.status === 'WAITING' && <>You're in. <span className="text-accent">~{ticket.estimatedWaitMinutes} min.</span></>}
                {ticket.status === 'CALLED' && <>You're up. <span className="text-amber-600">Go to {ticket.counter}.</span></>}
                {ticket.status === 'SERVING' && <>Being served.</>}
                {ticket.status === 'SERVED' && <>All done. Thanks for coming.</>}
                {ticket.status === 'MISSED' && <>Turn missed.</>}
                {ticket.status === 'CANCELLED' && <>Ticket cancelled.</>}
              </h2>
            </div>
            <div className="text-right shrink-0">
              <div className="t-eyebrow text-[10px]">Ticket</div>
              <div className="t-mono text-[28px] text-ink font-semibold mt-0.5">{ticket.ticketNumber}</div>
            </div>
          </div>

          <p className="text-[13px] text-ink-2 mt-2">
            {ticket.status === 'WAITING' && `There ${ticket.peopleAhead === 1 ? 'is 1 person' : `are ${ticket.peopleAhead} people`} ahead of you at ${ticket.serviceName}. We'll text you when your number is close.`}
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

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-md overflow-hidden">
            <Stat k="People ahead" v={String(ticket.peopleAhead)} />
            <Stat k="ETA" v={`~${ticket.estimatedWaitMinutes}m`} />
            <Stat k="Counter" v={ticket.counter ?? '—'} />
            <Stat k="Joined" v={formatTime(ticket.joinedAt)} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {ticket.status !== 'CANCELLED' && ticket.status !== 'SERVED' && (
              <>
                <button onClick={onMyWay} className="btn btn-sm btn-primary"><Navigation size={13} /> On my way</button>
                <button onClick={shareTicket} className="btn btn-sm btn-outline"><Share2 size={13} /> Share</button>
                <button onClick={cancel} className="btn btn-sm btn-ghost text-ink-2"><X size={13} /> Cancel ticket</button>
              </>
            )}
            <Link to={ticket.companySlug ? `/c/${ticket.companySlug}` : '/businesses'} className="btn btn-sm btn-ghost ml-auto">View company page</Link>
          </div>

          {notice && (
            <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700 flex gap-1.5">
              <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
              {notice}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

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
