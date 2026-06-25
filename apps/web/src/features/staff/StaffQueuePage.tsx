import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, Pause, Phone, MessageSquare, Plus, X, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { useQueueEvents } from '@/lib/useQueueEvents';
import { cn, relativeTime } from '@/lib/utils';

export default function StaffQueuePage() {
  const [data, setData] = useState<any>(null);
  const [counter, setCounter] = useState<string>('');
  const [actionPending, setActionPending] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkIn, setWalkIn] = useState({ name: '', phone: '', serviceId: '' });
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    api.dashboard().then((d: any) => {
      setData(d);
      if (d.staff[0] && !counter) setCounter(d.staff[0].counter ?? 'Counter 1');
      if (d.services[0] && !walkIn.serviceId) setWalkIn((f) => ({ ...f, serviceId: d.services[0].id }));
    });
  }, []);

  const { tickets } = useQueueEvents(data?.liveTickets ?? []);
  const live = useMemo(() => tickets.filter((t) => ['WAITING', 'CALLED', 'SERVING', 'ON_HOLD'].includes(t.status)), [tickets]);
  const head = live.find((t) => t.status === 'SERVING') ?? live.find((t) => t.status === 'CALLED') ?? null;
  const next = live.find((t) => t.status === 'WAITING');

  if (!data) return <div className="card p-6 h-72 animate-pulse" />;

  const services = data.services ?? [];
  const branches = data.branches ?? [];

  const callNext = async () => {
    if (!branches[0]) return;
    setActionPending(true);
    try {
      const { ticket } = await api.staffCallNext(branches[0].id, counter);
      setNotice({ kind: 'ok', text: `${ticket.ticketNumber} called to ${counter}.` });
    } catch (err: any) { setNotice({ kind: 'err', text: err.message }); }
    finally { setActionPending(false); }
  };
  const markServed = async () => {
    if (!head) return;
    setActionPending(true);
    try { await api.staffServed(head.id); setNotice({ kind: 'ok', text: `${head.ticketNumber} served.` }); }
    catch (err: any) { setNotice({ kind: 'err', text: err.message }); } finally { setActionPending(false); }
  };
  const markMissed = async () => {
    if (!head) return;
    setActionPending(true);
    try { await api.staffMissed(head.id); setNotice({ kind: 'ok', text: `${head.ticketNumber} missed.` }); }
    catch (err: any) { setNotice({ kind: 'err', text: err.message }); } finally { setActionPending(false); }
  };
  const hold = async () => {
    if (!head) return;
    setActionPending(true);
    try { await api.staffHold(head.id); setNotice({ kind: 'ok', text: `${head.ticketNumber} on hold.` }); }
    catch (err: any) { setNotice({ kind: 'err', text: err.message }); } finally { setActionPending(false); }
  };
  const transfer = async () => {
    if (!head) return;
    const targetService = services.find((s: any) => s.id !== head.serviceId);
    if (!targetService) { setNotice({ kind: 'err', text: 'No alternate service.' }); return; }
    setActionPending(true);
    try { const { ticket } = await api.staffTransfer(head.id, targetService.id, counter || 'Staff'); setNotice({ kind: 'ok', text: `${ticket.ticketNumber} transferred to ${ticket.serviceName}.` }); }
    catch (err: any) { setNotice({ kind: 'err', text: err.message }); } finally { setActionPending(false); }
  };
  const sendSms = async () => {
    if (!head || !smsMessage.trim()) return;
    setActionPending(true);
    try { const { notification } = await api.staffSendSms(head.id, smsMessage.trim()); setNotice({ kind: 'ok', text: `SMS ${notification.status.toLowerCase()} to ${head.customerName}.` }); setSmsMessage(''); setSmsOpen(false); }
    catch (err: any) { setNotice({ kind: 'err', text: err.message }); } finally { setActionPending(false); }
  };
  const addWalkIn = async () => {
    if (!branches[0] || !walkIn.serviceId) return;
    setActionPending(true);
    try { const { ticket } = await api.joinQueue({ branchId: branches[0].id, serviceId: walkIn.serviceId, customerName: walkIn.name.trim(), customerPhone: walkIn.phone.trim(), source: 'STAFF_WALK_IN' }); setNotice({ kind: 'ok', text: `Walk-in ${ticket.ticketNumber} added.` }); setWalkIn({ name: '', phone: '', serviceId: walkIn.serviceId }); setWalkInOpen(false); }
    catch (err: any) { setNotice({ kind: 'err', text: err.message }); } finally { setActionPending(false); }
  };

  return (
    <div className="space-y-5">
      {notice && (
        <div className={cn('rounded-md px-3 py-2 text-[12px]', notice.kind === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700')}>
          {notice.text}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-px bg-line border border-line rounded-lg overflow-hidden">
        <Kpi label="Now serving" value={head?.ticketNumber ?? '-'} sub={head?.customerName ?? 'No active ticket'} chip={head ? (head.status === 'SERVING' ? 'chip-serve' : 'chip-call') : 'chip-neutral'} chipText={head?.status ?? 'IDLE'} />
        <Kpi label="In line" value={String(live.filter((t) => t.status === 'WAITING').length)} sub={`~ wait ${next?.estimatedWaitMinutes ?? 0} min`} />
        <Kpi label="Counter" value={<input className="input h-9 w-24 text-[13px]" value={counter} onChange={(e) => setCounter(e.target.value)} />} />
      </div>

      <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-5">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-ink">Waiting list</h3>
            <button type="button" onClick={() => api.dashboard().then((d: any) => setData(d))} className="btn btn-ghost btn-sm"><RefreshCw size={13} /> Refresh</button>
          </div>
          <hr className="hairline my-3" />
          {live.length === 0 ? (
            <div className="border border-dashed border-line p-8 text-center text-[12px] text-ink-3">Queue is clear.</div>
          ) : (
            <div className="space-y-1.5">
              {live.map((t) => (
                <div key={t.id} className={cn(
                  'flex items-center gap-3 border px-3 py-2.5',
                  t.status === 'CALLED' ? 'border-ink bg-surface-2' :
                  t.status === 'SERVING' ? 'border-emerald-300 bg-emerald-50' :
                  t.status === 'ON_HOLD' ? 'border-line bg-surface-2' : 'border-line bg-surface',
                )}>
                  <span className="t-mono text-[13px] text-ink font-medium">{t.ticketNumber}</span>
                  <span className="text-[13px] text-ink font-medium truncate flex-1">{t.customerName}</span>
                  <span className="font-mono text-[11px] text-ink-3">{t.serviceName} - {relativeTime(t.joinedAt)}</span>
                  <Link to={`/staff/ticket/${t.id}`} className="text-[11px] text-ink-3 hover:text-ink inline-flex items-center gap-1">Detail <ArrowUpRight size={11} /></Link>
                  <span className={cn(
                    t.status === 'WAITING' ? 'chip-wait' :
                    t.status === 'CALLED' ? 'chip-call' :
                    t.status === 'SERVING' ? 'chip-serve' : 'chip-hold',
                  )}>{t.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>

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
          <button type="button" onClick={() => setWalkInOpen(true)} disabled={actionPending || services.length === 0} className="btn btn-sm btn-ghost w-full disabled:opacity-40"><Plus size={13} /> Add walk-in</button>
        </div>
      </div>

      {walkInOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4" onClick={() => !actionPending && setWalkInOpen(false)}>
          <div className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-ink">Add a walk-in</h3>
            <form onSubmit={(e) => { e.preventDefault(); void addWalkIn(); }} className="mt-4 space-y-3">
              <label className="block">
                <span className="label">Service</span>
                <select className="select" value={walkIn.serviceId} onChange={(e) => setWalkIn((f) => ({ ...f, serviceId: e.target.value }))}>
                  {services.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="label">Name</span>
                <input className="input" required value={walkIn.name} onChange={(e) => setWalkIn((f) => ({ ...f, name: e.target.value }))} />
              </label>
              <label className="block">
                <span className="label">Phone</span>
                <input className="input" required type="tel" value={walkIn.phone} onChange={(e) => setWalkIn((f) => ({ ...f, phone: e.target.value }))} />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-outline btn-md" onClick={() => setWalkInOpen(false)} disabled={actionPending}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-md" disabled={actionPending}>Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {smsOpen && head && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4" onClick={() => !actionPending && setSmsOpen(false)}>
          <div className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-ink">SMS to {head.customerName}</h3>
            <textarea className="input mt-3 min-h-28" value={smsMessage} onChange={(e) => setSmsMessage(e.target.value)} placeholder="Type your message" />
            <div className="flex justify-end gap-2 pt-3">
              <button type="button" className="btn btn-outline btn-md" onClick={() => setSmsOpen(false)} disabled={actionPending}>Cancel</button>
              <button type="button" className="btn btn-primary btn-md" onClick={sendSms} disabled={actionPending || !smsMessage.trim()}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, sub, chip, chipText }: { label: string; value: any; sub?: string; chip?: string; chipText?: string }) {
  return (
    <div className="bg-surface p-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="t-eyebrow text-[10px]">{label}</div>
        <div className="t-mono text-2xl text-ink font-semibold mt-0.5">{value}</div>
        {sub && <div className="font-mono text-[11px] mt-0.5 text-ink-3">{sub}</div>}
      </div>
      {chip && <span className={cn(chip, 'text-[9px]')}>{chipText}</span>}
    </div>
  );
}
