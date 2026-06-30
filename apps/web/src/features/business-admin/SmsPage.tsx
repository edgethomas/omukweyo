import { useEffect, useState } from 'react';
import { Bell, MessageSquare, RefreshCw, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatTime, relativeTime } from '@/lib/utils';
import DashboardLayout from './DashboardLayout';

type Notification = { id: string; to: string; template: string; status: string; message: string; at: string };

const TEMPLATES = [
  { id: 'TICKET_CREATED', label: 'Ticket created', body: 'Hi {firstName}, you joined {company} {branch} for {service}. Ticket {ticketNumber}. Track: /ticket/{ticketId}' },
  { id: 'ALMOST_TURN', label: 'Almost your turn', body: 'Hi {firstName}, 2 people are ahead of you at {company} {branch}. Be ready for ticket {ticketNumber}.' },
  { id: 'CALLED', label: 'Called to counter', body: 'Hi {firstName}, ticket {ticketNumber} has been called at {company}. Go to {counter}.' },
  { id: 'MISSED', label: 'Turn missed', body: 'Hi {firstName}, ticket {ticketNumber} was missed. Reopen the page to rejoin if allowed.' },
  { id: 'RESERVATION_CREATED', label: 'Reservation paid', body: 'Hi {firstName}, your {service} reservation at {company} {branch} is paid. Smart join around {time}.' },
  { id: 'RESERVATION_BOOKED', label: 'Reservation booked', body: 'Hi {firstName}, your live ticket {ticketNumber} is ready. Track: /ticket/{ticketId}' },
  { id: 'RUNNER_UPDATE', label: 'Runner update', body: 'Your Omukweyo runner update: {message}' },
  { id: 'LOW_SMS_BALANCE', label: 'Low SMS balance', body: 'Omukweyo: your company has fewer than 200 SMS credits left. Top up in Billing.' },
  { id: 'MANUAL_UPDATE', label: 'Manual staff message', body: 'Staff message from {company}.' },
];

export default function SmsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'SENT' | 'FAILED' | 'QUEUED'>('all');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    api.notifications()
      .then((payload: { notifications: Notification[] }) => setNotifications(payload.notifications))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = notifications.filter((n) => {
    if (filter !== 'all' && n.status !== filter) return false;
    if (search.trim() && !`${n.message} ${n.to} ${n.template}`.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  const sentToday = notifications.filter((n) => {
    const at = new Date(n.at);
    const today = new Date();
    return n.status === 'SENT' && at.toDateString() === today.toDateString();
  }).length;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">SMS</h2>
            <p className="text-[12px] text-ink-3 mt-0.5">Templates, logs, balance, and top-ups</p>
          </div>
          <button type="button" onClick={load} className="btn btn-ghost btn-sm"><RefreshCw size={13} /> Refresh</button>
        </div>

        {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>}

        <section className="grid sm:grid-cols-3 gap-px bg-line border border-line rounded-lg overflow-hidden">
          <Tile label="Sent today" value={String(sentToday)} />
          <Tile label="Total log entries" value={String(notifications.length)} />
          <Tile label="Templates ready" value={String(TEMPLATES.length)} />
        </section>

        <section className="card p-5">
          <h3 className="text-[14px] font-semibold text-ink">Templates</h3>
          <p className="text-[12px] text-ink-3 mt-1">Review the message templates used for queue, reservation, runner, and low-balance updates.</p>
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            {TEMPLATES.map((template) => (
              <div key={template.id} className="rounded-md border border-line bg-surface-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="t-eyebrow text-[10px] text-accent">{template.id}</span>
                  <span className="text-[10px] text-ink-3 inline-flex items-center gap-1"><Send size={10} /> ready</span>
                </div>
                <h4 className="text-[13px] font-semibold text-ink mt-1">{template.label}</h4>
                <p className="text-[11px] text-ink-2 mt-1.5 leading-relaxed">{template.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-line flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h3 className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><MessageSquare size={14} /> Live SMS log</h3>
            <div className="flex flex-wrap items-center gap-2">
              <input className="input h-9 w-56" placeholder="Search by phone, template, or content" value={search} onChange={(e) => setSearch(e.target.value)} />
              {(['all', 'SENT', 'FAILED', 'QUEUED'] as const).map((status) => (
                <button key={status} type="button" onClick={() => setFilter(status)} className={cn('rounded-full border px-2.5 py-1 text-[11px] font-medium', filter === status ? 'border-accent bg-accent-soft text-ink' : 'border-line bg-surface text-ink-2')}>{status}</button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="p-5 text-[12px] text-ink-3">Loading log...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-[12px] text-ink-3">
              <Bell size={20} className="mx-auto text-ink-3" />
              <p className="mt-2">No SMS log entries match those filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-line max-h-[28rem] overflow-auto">
              {filtered.slice(0, 80).map((entry) => (
                <div key={entry.id} className="px-5 py-2.5 text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="t-eyebrow text-[9px] text-accent">{entry.template}</span>
                    <span className={cn('text-[9px]', entry.status === 'SENT' ? 'chip-done' : entry.status === 'FAILED' ? 'chip-miss' : 'chip-wait')}>{entry.status}</span>
                    <span className="font-mono text-[10px] text-ink-3 ml-auto">{formatTime(entry.at)} - {relativeTime(entry.at)}</span>
                  </div>
                  <p className="text-ink-2 mt-1.5 leading-relaxed">{entry.message}</p>
                  <p className="font-mono text-ink-3 text-[10px] mt-0.5">to {entry.to}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-4">
      <div className="t-eyebrow text-[10px]">{label}</div>
      <div className="t-mono text-2xl font-semibold text-ink mt-1">{value}</div>
    </div>
  );
}
