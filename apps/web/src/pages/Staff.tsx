import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useQueueEvents } from '@/lib/useQueueEvents';
import { cn, formatTime, relativeTime } from '@/lib/utils';
import { downloadTextFile } from '@/lib/browserActions';
import {
  Phone, MessageSquare, Pause, ArrowRightLeft, X, Check,
  Plus, Coffee, ArrowUpRight, UserPlus,
} from 'lucide-react';
import type { Role } from '@inline/shared';

const SESSION_KEY = 'omukweyo_session';

type SessionUser = {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone?: string;
  destination?: string;
  companyId?: string;
  companySlug?: string;
  staffId?: string;
};

type DashboardPayload = {
  company: { id: string; slug: string; name: string; smsBalance: number; plan: string; logoText: string; primaryColor: string };
  branches: { id: string; slug: string; name: string; city: string; liveWaiting: number; avgWaitMin: number; isOpen: boolean }[];
  services: { id: string; name: string; averageServiceMinutes: number }[];
  staff: { id: string; name: string; role: string; counter: string; branchId?: string; servedToday: number; rating: number }[];
  liveTickets: any[];
  notifications: any[];
  metrics: { smsBalance: number; servedToday: number; liveWaiting: number };
};

function loadSessionUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw)?.user : null;
  } catch {
    return null;
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CU';
}

function roleLabel(role: string) {
  if (role === 'OWNER') return 'Owner';
  if (role === 'MANAGER') return 'Manager';
  if (role === 'OPERATOR') return 'Operator';
  return 'Staff';
}

function customerCounter(value?: string) {
  const trimmed = value?.trim();
  return trimmed && trimmed.toLowerCase() !== 'admin' ? trimmed : 'Counter 1';
}

export default function Staff() {
  const [session, setSession] = useState<SessionUser | null>(() => loadSessionUser());
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [counter, setCounter] = useState<string>('');
  const [actionPending, setActionPending] = useState(false);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ name: '', phone: '', serviceId: '' });
  const [smsOpen, setSmsOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    api.staffWorkspace().then((d: DashboardPayload) => {
      setData(d);
      // pick branch from staff assignment if available, else first
      const me = session?.staffId ? d.staff.find((s) => s.id === session.staffId) : null;
      const myBranch = me?.branchId ? d.branches.find((b) => b.id === me.branchId) : null;
      const fallbackBranch = d.branches[0] ?? null;
      const branch = myBranch ?? fallbackBranch;
      setBranchId(branch?.id ?? null);
      setCounter(customerCounter(me?.counter));
      if (d.services[0] && !walkInForm.serviceId) {
        setWalkInForm((f) => ({ ...f, serviceId: d.services[0].id }));
      }
    });
  }, [session?.staffId]);

  const { tickets } = useQueueEvents(data?.liveTickets ?? [], {
    branchId,
    enabled: Boolean(data),
    refreshOnMount: false,
  });
  const live = useMemo(
    () => tickets.filter((t) => ['WAITING', 'CALLED', 'SERVING', 'ON_HOLD'].includes(t.status) && (!branchId || t.branchId === branchId)),
    [tickets, branchId],
  );
  const head = useMemo(() => live.find((t) => t.status === 'SERVING') ?? live.find((t) => t.status === 'CALLED') ?? null, [live]);
  const next = useMemo(() => live.find((t) => t.status === 'WAITING'), [live]);

  const me = data?.staff.find((s) => s.id === session?.staffId) ?? null;
  const branch = data?.branches.find((b) => b.id === branchId) ?? null;
  const services = data?.services ?? [];

  const callNext = async () => {
    if (!branchId) return;
    setActionPending(true);
    try {
      const { ticket } = await api.staffCallNext(branchId, counter);
      setNotice({ kind: 'ok', text: `${ticket.ticketNumber} called to ${ticket.counter ?? customerCounter(counter)}.` });
    } catch (err: any) {
      setNotice({ kind: 'err', text: err.message });
    } finally {
      setActionPending(false);
    }
  };
  const markServed = async () => {
    if (!head) return;
    setActionPending(true);
    try {
      await api.staffServed(head.id);
      setNotice({ kind: 'ok', text: `${head.ticketNumber} marked served.` });
    } catch (err: any) {
      setNotice({ kind: 'err', text: err.message });
    } finally {
      setActionPending(false);
    }
  };
  const markMissed = async () => {
    if (!head) return;
    setActionPending(true);
    try {
      await api.staffMissed(head.id);
      setNotice({ kind: 'ok', text: `${head.ticketNumber} marked missed.` });
    } catch (err: any) {
      setNotice({ kind: 'err', text: err.message });
    } finally {
      setActionPending(false);
    }
  };
  const hold = async () => {
    if (!head) return;
    setActionPending(true);
    try {
      await api.staffHold(head.id);
      setNotice({ kind: 'ok', text: `${head.ticketNumber} placed on hold.` });
    } catch (err: any) {
      setNotice({ kind: 'err', text: err.message });
    } finally {
      setActionPending(false);
    }
  };
  const transfer = async () => {
    if (!head) return;
    const targetService = services.find((s) => s.id !== head.serviceId);
    if (!targetService) {
      setNotice({ kind: 'err', text: 'No alternate service is configured for transfer.' });
      return;
    }
    setActionPending(true);
    try {
      const { ticket } = await api.staffTransfer(head.id, targetService.id, counter || me?.name || 'Staff');
      setNotice({ kind: 'ok', text: `${ticket.ticketNumber} transferred to ${ticket.serviceName}.` });
    } catch (err: any) {
      setNotice({ kind: 'err', text: err.message });
    } finally {
      setActionPending(false);
    }
  };
  const sendSms = async () => {
    if (!head || !smsMessage.trim()) return;
    setActionPending(true);
    try {
      const { notification } = await api.staffSendSms(head.id, smsMessage.trim());
      setNotice({ kind: 'ok', text: `SMS ${notification.status.toLowerCase()} sent to ${head.customerName}.` });
      setSmsMessage('');
      setSmsOpen(false);
    } catch (err: any) {
      setNotice({ kind: 'err', text: err.message });
    } finally {
      setActionPending(false);
    }
  };
  const addWalkIn = async () => {
    if (!branchId || !walkInForm.serviceId || !walkInForm.name.trim() || !walkInForm.phone.trim()) return;
    setActionPending(true);
    try {
      const { ticket } = await api.joinQueue({
        branchId,
        serviceId: walkInForm.serviceId,
        customerName: walkInForm.name.trim(),
        customerPhone: walkInForm.phone.trim(),
        source: 'STAFF_WALK_IN',
      });
      setNotice({ kind: 'ok', text: `Walk-in ${ticket.ticketNumber} added to ${ticket.serviceName}.` });
      setWalkInForm({ name: '', phone: '', serviceId: walkInForm.serviceId });
      setWalkInOpen(false);
    } catch (err: any) {
      setNotice({ kind: 'err', text: err.message });
    } finally {
      setActionPending(false);
    }
  };

  if (!data) {
    return <div className="card p-6 h-72 animate-pulse" aria-label="Loading staff console" />;
  }

  if (!session) {
    return (
      <div className="card p-6 max-w-2xl">
        <h2 className="text-[16px] font-semibold text-ink">Sign in to use the staff console</h2>
        <p className="mt-2 text-[13px] text-ink-2">Your counter workflow lives behind a staff login.</p>
        <Link to="/login" className="btn btn-primary btn-md mt-4">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-3 sm:flex-1 sm:min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-full grid place-items-center text-white text-[15px] font-semibold" style={{ background: data.company.primaryColor }}>
            {initials(me?.name ?? session.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="t-eyebrow text-[10px]">{counter || 'Counter'} - {me ? roleLabel(me.role) : roleLabel('OPERATOR')} console</div>
            <h2 className="text-[16px] font-semibold text-ink truncate">{me?.name ?? session.name}</h2>
            <p className="text-[12px] text-ink-3 truncate sm:whitespace-normal">
              {data.company.name}{branch ? ` - ${branch.name}` : ''}<span className="hidden sm:inline">{branch ? ` - ${branch.city}` : ''} - Counter workflow</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:flex-nowrap">
          {data.branches.length > 1 && (
            <select value={branchId ?? ''} onChange={(e) => setBranchId(e.target.value)} className="select h-9 text-[13px] w-full sm:flex-none sm:w-auto">
              {data.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <input
            value={counter}
            onChange={(e) => setCounter(e.target.value)}
            placeholder="Counter name"
            className="input h-9 w-full text-[13px] sm:w-32"
          />
          <span className="inline-flex items-center self-start gap-1.5 px-2 py-0.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full shrink-0 sm:self-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
          </span>
        </div>
      </div>

      {notice && (
        <div className={cn('rounded-md px-3 py-2 text-[12px]', notice.kind === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700')}>
          {notice.text}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-px bg-line border border-line rounded-lg overflow-hidden">
        <KpiCard label="Now serving" value={head?.ticketNumber ?? '-'} sub={head?.customerName ?? 'No active ticket'} chip={head ? (head.status === 'SERVING' ? 'chip-serve' : 'chip-call') : 'chip-neutral'} chipText={head?.status ?? 'IDLE'} />
        <KpiCard label="In line" value={String(live.filter((t) => t.status === 'WAITING').length)} sub={`~ wait ${next?.estimatedWaitMinutes ?? 0} min`} />
        <KpiCard label="Served today" value={String(me?.servedToday ?? 0)} sub={me ? `Rating ${me.rating.toFixed(1)}` : '+18% vs your avg'} subAccent={Boolean(me)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-ink">Waiting list</h3>
            <span className="t-eyebrow text-[10px]">{branch ? `${branch.name} - auto-updates` : 'Auto-updates via WebSocket'}</span>
          </div>
          <hr className="hairline my-3" />
          <div className="space-y-1.5">
            <AnimatePresence>
              {live.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className={cn(
                    'border',
                    t.status === 'CALLED' ? 'border-ink bg-surface-2' :
                    t.status === 'SERVING' ? 'border-emerald-300 bg-emerald-50' :
                    t.status === 'ON_HOLD' ? 'border-line bg-surface-2' :
                    'border-line bg-surface',
                  )}
                >
                  <Link to={`/staff/ticket/${t.id}`} className="flex items-start sm:items-center gap-3 px-3 py-2.5">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-blue-50 text-accent grid place-items-center text-[12px] font-semibold">
                      {initials(t.customerName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="t-mono text-[13px] text-ink font-medium">{t.ticketNumber}</span>
                        <span className="text-[13px] text-ink font-medium truncate">{t.customerName}</span>
                        <span className={cn(
                          'sm:hidden ml-auto',
                          t.status === 'WAITING' ? 'chip-wait' :
                          t.status === 'CALLED' ? 'chip-call' :
                          t.status === 'SERVING' ? 'chip-serve' :
                          'chip-hold',
                        )}>{t.status}</span>
                      </div>
                      <div className="font-mono text-[11px] text-ink-3 truncate">{t.serviceName} - joined {relativeTime(t.joinedAt)}</div>
                    </div>
                    <span className="hidden sm:inline-flex text-[11px] text-ink-3 hover:text-ink items-center gap-1 shrink-0">
                      Detail <ArrowUpRight size={11} />
                    </span>
                    <span className={cn(
                      'hidden sm:inline-flex shrink-0',
                      t.status === 'WAITING' ? 'chip-wait' :
                      t.status === 'CALLED' ? 'chip-call' :
                      t.status === 'SERVING' ? 'chip-serve' :
                      'chip-hold',
                    )}>{t.status}</span>
                  </Link>
                </motion.div>
              ))}
              {live.length === 0 && (
                <div className="border border-dashed border-line p-8 text-center text-[12px] text-ink-3 flex flex-col items-center gap-2">
                  <Coffee size={22} className="text-ink-3" />
                  Queue is clear. Take a sip of water.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-3">
          <button onClick={callNext} disabled={actionPending || !next} className="btn btn-primary btn-lg w-full">
            <ArrowRightLeft size={15} /> Call next
          </button>
          <div className="grid grid-cols-2 gap-px bg-line border border-line">
            <button onClick={markServed} disabled={!head || actionPending} className="btn btn-sm btn-outline bg-surface disabled:opacity-40"><Check size={13} /> Served</button>
            <button onClick={markMissed} disabled={!head || actionPending} className="btn btn-sm btn-outline bg-surface disabled:opacity-40"><X size={13} /> Missed</button>
            <button onClick={hold} disabled={!head || actionPending} className="btn btn-sm btn-outline bg-surface disabled:opacity-40"><Pause size={13} /> Hold</button>
            <button onClick={transfer} disabled={!head || actionPending} className="btn btn-sm btn-outline bg-surface disabled:opacity-40"><ArrowRightLeft size={13} /> Transfer</button>
          </div>
          <div className="grid grid-cols-2 gap-px bg-line border border-line">
            <button onClick={() => setSmsOpen(true)} disabled={!head || actionPending} className="btn btn-sm btn-outline bg-surface disabled:opacity-40"><MessageSquare size={13} /> SMS</button>
            <a href={head?.customerPhone ? `tel:${head.customerPhone}` : undefined} className={cn('btn btn-sm btn-outline bg-surface', !head && 'opacity-40 pointer-events-none')}><Phone size={13} /> Call</a>
          </div>
          <button type="button" onClick={() => setWalkInOpen(true)} disabled={actionPending || !branchId || services.length === 0} className="btn btn-sm btn-ghost w-full disabled:opacity-40"><UserPlus size={13} /> Add walk-in</button>
          <button type="button" onClick={() => downloadTextFile('staff-queue.csv', toCsv(live), 'text/csv;charset=utf-8')} disabled={live.length === 0} className="btn btn-sm btn-ghost w-full disabled:opacity-40">Export waiting list</button>
          <div className="card p-3 mt-1">
            <div className="flex items-center gap-2 text-[12px] text-ink-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {data.metrics.smsBalance.toLocaleString()} SMS credits
            </div>
            <div className="mt-0.5 t-eyebrow text-[9px]">Auto top-up ON - refills at 200</div>
          </div>
        </div>
      </div>

      {walkInOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4" onClick={() => !actionPending && setWalkInOpen(false)}>
          <div className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-ink">Add a walk-in customer</h3>
            <p className="text-[12px] text-ink-3 mt-1">Create a ticket on the spot for someone at the counter.</p>
            <form onSubmit={(e) => { e.preventDefault(); void addWalkIn(); }} className="mt-4 space-y-3">
              <label className="block">
                <span className="label">Service</span>
                <select className="select" value={walkInForm.serviceId} onChange={(e) => setWalkInForm((f) => ({ ...f, serviceId: e.target.value }))} required>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="label">Customer name</span>
                <input className="input" required value={walkInForm.name} onChange={(e) => setWalkInForm((f) => ({ ...f, name: e.target.value }))} />
              </label>
              <label className="block">
                <span className="label">Phone for SMS</span>
                <input className="input" required type="tel" value={walkInForm.phone} onChange={(e) => setWalkInForm((f) => ({ ...f, phone: e.target.value }))} />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-outline btn-md" onClick={() => setWalkInOpen(false)} disabled={actionPending}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-md" disabled={actionPending}><Plus size={13} /> Add ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {smsOpen && head && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4" onClick={() => !actionPending && setSmsOpen(false)}>
          <div className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-ink">Send SMS to {head.customerName}</h3>
            <p className="text-[12px] text-ink-3 mt-1">Going to {head.customerPhone} for ticket {head.ticketNumber}.</p>
            <textarea
              className="input mt-4 min-h-28"
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              placeholder="Hi, this is an update from your service team..."
              required
            />
            <div className="flex justify-end gap-2 pt-3">
              <button type="button" className="btn btn-outline btn-md" onClick={() => setSmsOpen(false)} disabled={actionPending}>Cancel</button>
              <button type="button" className="btn btn-primary btn-md" onClick={sendSms} disabled={actionPending || !smsMessage.trim()}><MessageSquare size={13} /> Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function toCsv(rows: any[]) {
  const headers = ['Ticket', 'Customer', 'Phone', 'Service', 'Status', 'Joined', 'Position'];
  const lines = rows.map((r) => [r.ticketNumber, r.customerName, r.customerPhone, r.serviceName, r.status, r.joinedAt, r.position].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  return [headers.join(','), ...lines].join('\n');
}

function KpiCard({ label, value, sub, chip, chipText, subAccent }: { label: string; value: string; sub?: string; chip?: string; chipText?: string; subAccent?: boolean }) {
  return (
    <div className="bg-surface p-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="t-eyebrow text-[10px]">{label}</div>
        <div className="t-mono text-2xl text-ink font-semibold mt-0.5">{value}</div>
        {sub && <div className={cn('font-mono text-[11px] mt-0.5', subAccent ? 'text-emerald-700' : 'text-ink-3')}>{sub}</div>}
      </div>
      {chip && <span className={cn(chip, 'text-[9px]')}>{chipText}</span>}
    </div>
  );
}
