import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock3, CreditCard, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { formatTime } from '@/lib/utils';

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-NA', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function ReservationStatus() {
  const { id } = useParams();
  const [reservation, setReservation] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getReservation(id)
      .then((payload) => {
        setReservation(payload.reservation);
        setTicket(payload.ticket ?? null);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const bookNow = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const payload = await api.bookReservationNow(id);
      setReservation(payload.reservation);
      setTicket(payload.ticket);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) return <section className="container-x py-12 text-ink-2">Error: {error}</section>;
  if (!reservation) return <section className="container-x py-12"><div className="card h-72 animate-pulse" /></section>;

  return (
    <section className="container-x py-12">
      <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        <div className="card p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-ink leading-tight">
                {reservation.serviceName} at {reservation.branchName}
              </h1>
              <p className="t-body mt-2 max-w-2xl">
                Omukweyo will create your live ticket before the target window, based on branch wait time and service speed.
              </p>
            </div>
            <span className={reservation.status === 'BOOKED' ? 'chip-serve' : 'chip-wait'}>{reservation.status}</span>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-line border border-line mt-6">
            <Metric icon={<Clock3 size={14} />} label="Target arrival" value={formatDateTime(reservation.targetArrivalAt)} />
            <Metric icon={<Sparkles size={14} />} label="Smart booking" value={formatDateTime(reservation.smartJoinAt)} />
            <Metric icon={<CreditCard size={14} />} label="Paid" value={`N$${(reservation.feeCents / 100).toFixed(0)}`} />
          </div>

          <div className="mt-6 rounded-lg border border-line bg-surface-2 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <h2 className="text-[14px] font-semibold text-ink">Reservation timeline</h2>
            </div>
            <ol className="mt-4 space-y-3">
              {reservation.events.slice().reverse().map((event: any) => (
                <li key={event.id} className="flex items-start gap-3 text-[12px]">
                  <div className="t-mono text-ink-3 w-14 shrink-0">{formatTime(event.at)}</div>
                  <div>
                    <div className="text-ink-2">{event.message}</div>
                    <div className="t-eyebrow text-[9px] mt-0.5">{event.type}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {ticket ? (
              <Link to={`/ticket/${ticket.id}`} className="btn btn-primary btn-md">
                Open live ticket <ArrowRight size={14} />
              </Link>
            ) : (
              <button onClick={bookNow} disabled={loading} className="btn btn-primary btn-md">
                {loading ? 'Booking...' : 'Create ticket now'} <Sparkles size={14} />
              </button>
            )}
            <Link to="/reserve" className="btn btn-outline btn-md">Reserve another spot</Link>
          </div>
        </div>

        <aside className="card p-5">
          <div className="t-eyebrow mb-2">Customer</div>
          <div className="text-[15px] font-semibold text-ink">{reservation.customerName}</div>
          <div className="font-mono text-[12px] text-ink-3 mt-1">{reservation.customerPhone}</div>
          {reservation.customerEmail && <div className="text-[12px] text-ink-2 mt-1">{reservation.customerEmail}</div>}
          <hr className="hairline my-4" />
          <div className="space-y-2 text-[12px] text-ink-2">
            <div className="flex justify-between gap-3">
              <span>Payment</span>
              <span className="font-medium text-ink">{reservation.paymentStatus}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Window</span>
              <span className="font-medium text-ink">{reservation.arrivalWindowMinutes} min</span>
            </div>
            {ticket && (
              <div className="flex justify-between gap-3">
                <span>Ticket</span>
                <span className="t-mono text-accent font-semibold">{ticket.ticketNumber}</span>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="bg-surface p-4">
      <div className="flex items-center gap-1.5 t-eyebrow text-[9px]">{icon}{label}</div>
      <div className="text-[14px] font-semibold text-ink mt-1.5">{value}</div>
    </div>
  );
}
