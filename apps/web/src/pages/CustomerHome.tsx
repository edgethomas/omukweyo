import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Search,
  Ticket,
  UserPlus,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatTime, relativeTime } from '@/lib/utils';

const CUSTOMER_KEY = 'omukweyo_customer';
const LEGACY_CUSTOMER_KEY = 'inline_customer';
const SESSION_KEY = 'omukweyo_session';

type StoredCustomer = {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
};

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadCustomer(): StoredCustomer | null {
  const stored = readJson<StoredCustomer>(CUSTOMER_KEY) ?? readJson<StoredCustomer>(LEGACY_CUSTOMER_KEY);
  if (stored?.id) return stored;

  const session = readJson<{
    user?: {
      role?: string;
      name?: string;
      email?: string;
      phone?: string;
      customerId?: string;
    };
  }>(SESSION_KEY);

  if (session?.user?.role === 'CUSTOMER' && session.user.customerId) {
    return {
      id: session.user.customerId,
      name: session.user.name ?? 'Customer',
      phone: session.user.phone,
      email: session.user.email,
    };
  }

  return null;
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-NA', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function money(cents: number) {
  return `N$${Math.round(cents / 100)}`;
}

function titleFromSlug(slug?: string) {
  if (!slug) return 'the selected branch';
  return slug.split('-').map((part) => part ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : '').join(' ');
}

export default function CustomerHome() {
  const [customer, setCustomer] = useState<StoredCustomer | null>(() => loadCustomer());
  const [visit, setVisit] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customer?.id) return;
    setLoading(true);
    api.customerVisit(customer.id)
      .then((payload) => {
        setVisit(payload);
        setCustomer(payload.customer);
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify(payload.customer));
        localStorage.setItem(LEGACY_CUSTOMER_KEY, JSON.stringify(payload.customer));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [customer?.id]);

  const currentTicket = visit?.currentTicket;
  const reservations = visit?.reservations ?? [];
  const nextReservation = useMemo(() => (
    reservations
      .slice()
      .sort((a: any, b: any) => new Date(a.targetArrivalAt).getTime() - new Date(b.targetArrivalAt).getTime())[0]
  ), [reservations]);
  const notifications = visit?.notifications ?? [];

  if (!customer) {
    return (
      <div className="grid lg:grid-cols-[1fr_340px] gap-5">
        <section className="card p-6">
          <div className="t-eyebrow mb-2">Customer visit</div>
          <h2 className="t-h2 max-w-2xl">Start with the place you need to visit.</h2>
          <p className="t-body mt-3 max-w-2xl">
            Customers need a ticket, an arrival time, and clear SMS updates while they wait somewhere else.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/businesses" className="btn btn-primary btn-md">
              <Search size={14} /> Find a business
            </Link>
            <Link to="/reserve" className="btn btn-outline btn-md">
              Reserve arrival window <ArrowRight size={14} />
            </Link>
            <Link to="/customer/signup" className="btn btn-outline btn-md">
              <UserPlus size={14} /> Create account
            </Link>
          </div>
        </section>
        <aside className="card p-5">
          <div className="t-eyebrow mb-3">What customers see</div>
          <div className="space-y-3 text-[13px] text-ink-2">
            <VisitPoint icon={Ticket} text="Ticket number, position, and expected wait." />
            <VisitPoint icon={MessageSquare} text="SMS updates for join, almost turn, and called." />
            <VisitPoint icon={CalendarClock} text="Future reservation timing and payment status." />
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>}

      <section className="grid lg:grid-cols-[1.45fr_0.55fr] gap-5">
        <div className="card p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="t-eyebrow mb-2">Your visit</div>
              <h2 className="text-[26px] md:text-[30px] font-semibold tracking-normal text-ink leading-tight">
                {currentTicket ? `You are ${currentTicket.peopleAhead <= 0 ? 'being served now' : `#${currentTicket.position} in line`}.` : 'Choose a queue when you are ready.'}
              </h2>
              <p className="text-[13px] text-ink-2 mt-2 max-w-xl">
                {currentTicket
                  ? `${currentTicket.serviceName} at ${titleFromSlug(currentTicket.companySlug)} ${titleFromSlug(currentTicket.branchSlug)}. We will keep sending SMS updates as your turn gets closer.`
                  : 'Find a business, join a live queue, or reserve a protected arrival window for later.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentTicket && (
                <Link to={`/ticket/${currentTicket.id}`} className="btn btn-primary btn-md">
                  Track live ticket <Ticket size={14} />
                </Link>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden">
            <VisitMetric label="Ticket" value={currentTicket?.ticketNumber ?? '-'} />
            <VisitMetric label="People ahead" value={currentTicket ? currentTicket.peopleAhead : '-'} />
            <VisitMetric label="Estimated wait" value={currentTicket ? `${currentTicket.estimatedWaitMinutes}m` : '-'} />
            <VisitMetric label="Status" value={currentTicket?.status ?? 'READY'} />
          </div>

          {currentTicket && (
            <p className="mt-4 text-[12px] text-ink-3">
              Joined {relativeTime(currentTicket.joinedAt)} · Counter {currentTicket.counter ?? 'Waiting'} · Source {currentTicket.source.replaceAll('_', ' ')}
            </p>
          )}
        </div>

        <aside className="card p-5">
          <div className="flex items-center justify-between">
            <div className="t-eyebrow">Customer</div>
            <CheckCircle2 size={15} className="text-emerald-600" />
          </div>
          <div className="mt-3 text-[15px] font-semibold text-ink">{visit?.customer?.name ?? customer.name}</div>
          <div className="font-mono text-[11px] text-ink-3 mt-1">{visit?.customer?.phone ?? customer.phone}</div>
          <div className="mt-4 grid gap-2">
            <Link to="/reserve" className="btn btn-primary btn-sm">
              Reserve arrival window <CalendarClock size={13} />
            </Link>
            <Link to={currentTicket?.companySlug ? `/c/${currentTicket.companySlug}` : '/businesses'} className="btn btn-outline btn-sm">
              Find a business queue <ArrowRight size={13} />
            </Link>
          </div>
        </aside>
      </section>

      {loading && <div className="card p-5 text-[13px] text-ink-3">Refreshing visit status...</div>}

      <div className="grid lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-ink">Future reservations</h3>
              <p className="t-eyebrow text-[10px] mt-0.5">Protected arrival windows</p>
            </div>
            <span className="chip-neutral">{reservations.length}</span>
          </div>
          {reservations.length === 0 ? (
            <div className="p-8 text-center">
              <CalendarClock size={24} className="text-ink-3 mx-auto mb-2" />
              <div className="text-[14px] font-semibold text-ink">No reservations yet</div>
              <p className="text-[12px] text-ink-2 mt-1">Reserve a spot when being late is not an option.</p>
              <Link to="/reserve" className="btn btn-primary btn-sm mt-4">Reserve a spot</Link>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {reservations.map((reservation: any) => (
                <Link
                  key={reservation.id}
                  to={`/reservation/${reservation.id}`}
                  className="grid md:grid-cols-[1fr_160px_120px] gap-3 px-5 py-3 hover:bg-surface-2"
                >
                  <div>
                    <div className="text-[13px] font-semibold text-ink">{reservation.serviceName}</div>
                    <div className="text-[12px] text-ink-2 mt-0.5">{reservation.branchName} - target {formatDateTime(reservation.targetArrivalAt)}</div>
                  </div>
                  <div className="text-[12px] text-ink-2">
                    Book live spot
                    <div className="t-mono text-ink">{formatTime(reservation.smartJoinAt)}</div>
                  </div>
                  <div className="flex md:justify-end items-center">
                    <span className={reservation.status === 'BOOKED' ? 'chip-serve' : 'chip-wait'}>{reservation.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-line">
              <h3 className="text-[14px] font-semibold text-ink">SMS updates</h3>
              <p className="t-eyebrow text-[10px] mt-0.5">What the customer received</p>
            </div>
            <div className="divide-y divide-line max-h-72 overflow-auto">
              {notifications.length === 0 ? (
                <div className="p-5 text-[12px] text-ink-3">No SMS updates yet.</div>
              ) : notifications.map((notification: any) => (
                <div key={notification.id} className="px-5 py-3 text-[12px]">
                  <div className="flex items-center gap-2">
                    <Bell size={13} className="text-accent shrink-0" />
                    <span className="t-eyebrow text-[9px] text-accent">{notification.template.replaceAll('_', ' ')}</span>
                    <span className="font-mono text-[10px] text-ink-3 ml-auto">{formatTime(notification.at)}</span>
                  </div>
                  <p className="text-ink-2 mt-1.5 leading-relaxed">{notification.message}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <div className="t-eyebrow mb-2">Next reservation</div>
            {nextReservation ? (
              <>
                <div className="text-[15px] font-semibold text-ink">{formatDateTime(nextReservation.targetArrivalAt)}</div>
                <p className="text-[12px] text-ink-2 mt-1">{money(nextReservation.feeCents)} paid. Live spot booking starts around {formatTime(nextReservation.smartJoinAt)}.</p>
              </>
            ) : (
              <p className="text-[12px] text-ink-2">No protected arrival window yet.</p>
            )}
          </div>
          <div className="card p-5">
            <div className="t-eyebrow mb-3">Useful next steps</div>
            <div className="space-y-3 text-[12px] text-ink-2">
              <VisitPoint icon={MapPin} text="Arrive only when your ticket is close." />
              <VisitPoint icon={MessageSquare} text="Keep SMS on. No app install required." />
              <VisitPoint icon={CalendarClock} text="Reserve tomorrow if the queue is risky." />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function VisitPoint({ icon: Icon, text }: { icon: typeof Ticket; text: string }) {
  return (
    <div className="flex gap-2">
      <Icon size={15} className="text-accent mt-0.5 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

function VisitMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface p-4">
      <div className="t-eyebrow text-[10px]">{label}</div>
      <div className="t-mono text-2xl text-ink font-semibold mt-1">{value}</div>
    </div>
  );
}
