import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, MessageSquare, Pause, Phone, X, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatTime, relativeTime } from '@/lib/utils';

export default function StaffTicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [smsMessage, setSmsMessage] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [counter, setCounter] = useState('');

  useEffect(() => {
    if (!id) return;
    api.getTicket(id).then((d) => setTicket(d.ticket)).catch((err) => setError(err.message));
    api.dashboard().then((d: any) => {
      setServices(d.services ?? []);
      if (d.staff[0]) setCounter(d.staff[0].counter ?? 'Counter 1');
    });
  }, [id]);

  const update = async (action: 'serve' | 'served' | 'missed' | 'hold' | 'transfer' | 'sms', payload?: any) => {
    if (!ticket) return;
    setPending(true);
    setNotice(null);
    try {
      let result;
      if (action === 'serve') result = await api.staffServe(ticket.id);
      else if (action === 'served') result = await api.staffServed(ticket.id);
      else if (action === 'missed') result = await api.staffMissed(ticket.id);
      else if (action === 'hold') result = await api.staffHold(ticket.id);
      else if (action === 'transfer') result = await api.staffTransfer(ticket.id, payload, counter || 'Staff');
      else if (action === 'sms') result = await api.staffSendSms(ticket.id, payload);
      if (result?.ticket) setTicket(result.ticket);
      setNotice({ kind: 'ok', text: action === 'sms' ? 'SMS sent.' : `Ticket ${action} done.` });
      setSmsMessage('');
    } catch (err: any) {
      setNotice({ kind: 'err', text: err.message });
    } finally {
      setPending(false);
    }
  };

  if (error) return <div className="card p-6 text-red-700">{error}</div>;
  if (!ticket) return <div className="card p-6 h-72 animate-pulse" />;

  const otherServices = services.filter((s) => s.id !== ticket.serviceId);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[12px] text-ink-3">
        <Link to="/staff" className="inline-flex items-center gap-1 hover:text-ink"><ArrowLeft size={12} /> Back to staff console</Link>
        <button type="button" onClick={() => api.getTicket(ticket.id).then((d) => setTicket(d.ticket))} className="ml-auto btn btn-ghost btn-sm"><RefreshCw size={12} /> Refresh</button>
      </div>

      {notice && (
        <div className={cn('rounded-md px-3 py-2 text-[12px]', notice.kind === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700')}>
          {notice.text}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <section className="card p-5 lg:col-span-1">
          <div className="t-eyebrow text-[10px]">Ticket</div>
          <div className="t-mono text-3xl text-ink font-semibold mt-1">{ticket.ticketNumber}</div>
          <span className={cn(
            ticket.status === 'WAITING' ? 'chip-wait' :
            ticket.status === 'CALLED' ? 'chip-call' :
            ticket.status === 'SERVING' ? 'chip-serve' :
            ticket.status === 'SERVED' ? 'chip-done' :
            ticket.status === 'MISSED' ? 'chip-miss' :
            'chip-neutral',
          )}>{ticket.status}</span>
          <hr className="hairline my-4" />
          <div className="space-y-1.5 text-[12px] text-ink-2">
            <p><span className="text-ink-3">Customer</span> {ticket.customerName}</p>
            <p><span className="text-ink-3">Phone</span> <a href={`tel:${ticket.customerPhone}`} className="text-accent hover:underline">{ticket.customerPhone}</a></p>
            <p><span className="text-ink-3">Service</span> {ticket.serviceName}</p>
            <p><span className="text-ink-3">Counter</span> {ticket.counter ?? '-'}</p>
            <p><span className="text-ink-3">Joined</span> {relativeTime(ticket.joinedAt)}</p>
            {ticket.targetArrivalAt && <p><span className="text-ink-3">Target</span> {formatTime(ticket.targetArrivalAt)}</p>}
          </div>
        </section>

        <section className="card p-5 lg:col-span-2 space-y-4">
          <h3 className="text-[14px] font-semibold text-ink">Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button disabled={pending || ticket.status === 'SERVING'} onClick={() => update('serve')} className="btn btn-sm btn-outline disabled:opacity-40">Start serving</button>
            <button disabled={pending} onClick={() => update('served')} className="btn btn-sm btn-outline disabled:opacity-40"><Check size={13} /> Served</button>
            <button disabled={pending} onClick={() => update('missed')} className="btn btn-sm btn-outline disabled:opacity-40"><X size={13} /> Missed</button>
            <button disabled={pending} onClick={() => update('hold')} className="btn btn-sm btn-outline disabled:opacity-40"><Pause size={13} /> Hold</button>
            <a href={`tel:${ticket.customerPhone}`} className="btn btn-sm btn-outline"><Phone size={13} /> Call customer</a>
          </div>

          {otherServices.length > 0 && (
            <div>
              <h4 className="text-[12px] font-semibold text-ink-2 mb-1.5">Transfer to another service</h4>
              <div className="flex flex-wrap gap-2">
                {otherServices.map((service) => (
                  <button key={service.id} disabled={pending} onClick={() => update('transfer', service.id)} className="btn btn-sm btn-outline disabled:opacity-40"><ArrowRightLeft size={13} /> {service.name}</button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-[12px] font-semibold text-ink-2 mb-1.5">Send SMS</h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <input className="input flex-1" placeholder="Type an update..." value={smsMessage} onChange={(e) => setSmsMessage(e.target.value)} />
              <button disabled={pending || !smsMessage.trim()} onClick={() => update('sms', smsMessage.trim())} className="btn btn-primary btn-sm disabled:opacity-40"><MessageSquare size={13} /> Send</button>
            </div>
          </div>
        </section>
      </div>

      <section className="card p-5">
        <h3 className="text-[14px] font-semibold text-ink">Event history</h3>
        <hr className="hairline my-3" />
        <ol className="space-y-2.5">
          {(ticket.events ?? []).slice().reverse().map((ev: any) => (
            <li key={ev.id} className="flex items-start gap-3 text-[12px] border-b border-dashed border-line pb-2.5 last:border-0 last:pb-0">
              <div className="t-mono text-ink-3 w-16 shrink-0">{formatTime(ev.at)}</div>
              <div>
                <div className="text-ink-2">{ev.message}</div>
                <div className="t-eyebrow text-[9px] mt-0.5">{ev.type}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
