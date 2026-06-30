import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  History as HistoryIcon,
  Search,
  Ticket as TicketIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatTime, relativeTime } from '@/lib/utils';
import type { QueueTicket, FutureReservation, TicketStatus, ReservationStatus } from '@inline/shared';

const CUSTOMER_KEY = 'omukweyo_customer';
const LEGACY_CUSTOMER_KEY = 'inline_customer';
const SESSION_KEY = 'omukweyo_session';

type FilterTab = 'all' | 'tickets' | 'reservations';
type TicketFilter = 'all' | TicketStatus;
type ReservationFilter = 'all' | ReservationStatus;

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadCustomerId(): string | undefined {
  const stored = readJson<{ id?: string }>(CUSTOMER_KEY) ?? readJson<{ id?: string }>(LEGACY_CUSTOMER_KEY);
  if (stored?.id) return stored.id;
  const session = readJson<{ user?: { role?: string; customerId?: string } }>(SESSION_KEY);
  if (session?.user?.role === 'CUSTOMER') return session.user.customerId;
  return undefined;
}

function statusChip(status: TicketStatus) {
  const map: Record<TicketStatus, string> = {
    WAITING: 'chip-wait',
    CALLED: 'chip-call',
    SERVING: 'chip-serve',
    SERVED: 'chip-done',
    MISSED: 'chip-miss',
    CANCELLED: 'chip-done',
    TRANSFERRED: 'chip-neutral',
    ON_HOLD: 'chip-hold',
  };
  return map[status] ?? 'chip-neutral';
}

function reservationChip(status: ReservationStatus) {
  const map: Record<ReservationStatus, string> = {
    SCHEDULED: 'chip-wait',
    BOOKED: 'chip-serve',
    CANCELLED: 'chip-done',
    EXPIRED: 'chip-done',
  };
  return map[status] ?? 'chip-neutral';
}

function titleFromSlug(slug?: string) {
  if (!slug) return 'Branch';
  return slug
    .split('-')
    .map((part) => (part ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : ''))
    .join(' ');
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-NA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

type HistoryEntry =
  | { kind: 'ticket'; at: string; ticket: QueueTicket }
  | { kind: 'reservation'; at: string; reservation: FutureReservation };

export default function CustomerHistory() {
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [reservations, setReservations] = useState<FutureReservation[]>([]);
  const [customerName, setCustomerName] = useState<string>('Customer');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<FilterTab>('all');
  const [ticketFilter, setTicketFilter] = useState<TicketFilter>('all');
  const [reservationFilter, setReservationFilter] = useState<ReservationFilter>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const customerId = loadCustomerId();
    if (!customerId) {
      setLoading(false);
      setError('Sign in as a customer to see your history.');
      return;
    }
    setLoading(true);
    api.customerHistory(customerId)
      .then((payload) => {
        setCustomerName(payload.customer.name);
        setTickets(payload.tickets);
        setReservations(payload.reservations);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (ticketFilter !== 'all' && ticket.status !== ticketFilter) return false;
      if (!query.trim()) return true;
      const haystack = `${ticket.ticketNumber} ${ticket.serviceName} ${ticket.branchSlug} ${ticket.companySlug}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    });
  }, [tickets, ticketFilter, query]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      if (reservationFilter !== 'all' && reservation.status !== reservationFilter) return false;
      if (!query.trim()) return true;
      const haystack = `${reservation.serviceName} ${reservation.branchName} ${reservation.companySlug}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    });
  }, [reservations, reservationFilter, query]);

  const merged: HistoryEntry[] = useMemo(() => {
    const entries: HistoryEntry[] = [];
    for (const ticket of tickets) {
      entries.push({ kind: 'ticket', at: ticket.joinedAt, ticket });
    }
    for (const reservation of reservations) {
      entries.push({ kind: 'reservation', at: reservation.createdAt, reservation });
    }
    return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [tickets, reservations]);

  const totalCount = tickets.length + reservations.length;
  const activeTicketCount = tickets.filter((t) => t.status === 'WAITING' || t.status === 'CALLED' || t.status === 'SERVING' || t.status === 'ON_HOLD').length;
  const completedTicketCount = tickets.filter((t) => t.status === 'SERVED').length;
  const cancelledTicketCount = tickets.filter((t) => t.status === 'CANCELLED' || t.status === 'MISSED').length;

  if (loading) {
    return <div className="card p-8 h-72 animate-pulse" aria-label="Loading history" />;
  }

  if (error) {
    return (
      <div className="card p-6 max-w-2xl">
        <h2 className="text-[16px] font-semibold text-ink">No history yet</h2>
        <p className="mt-2 text-[13px] text-ink-2">{error}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/customer/signup" className="btn btn-primary btn-md">Create customer account</Link>
          <Link to="/businesses" className="btn btn-outline btn-md">Find a business</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden">
        <Stat label="Total visits" value={totalCount} />
        <Stat label="Live tickets" value={activeTicketCount} accent={activeTicketCount > 0} />
        <Stat label="Completed tickets" value={completedTicketCount} />
        <Stat label="Cancelled or missed" value={cancelledTicketCount} />
      </div>

      <section className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Tickets and reservations for {customerName}</h2>
            <p className="t-eyebrow text-[10px] mt-0.5">All past and upcoming queue activity</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search size={13} className="text-ink-3 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search ticket, service, or branch"
                className="input h-9 w-full pl-8 text-[12px] sm:w-64"
              />
            </div>
          </div>
        </div>

        <div className="px-5 pt-3 flex flex-wrap items-center gap-2">
          <TabButton active={tab === 'all'} onClick={() => setTab('all')}>
            All <span className="ml-1.5 t-mono text-[10px] text-ink-3">{totalCount}</span>
          </TabButton>
          <TabButton active={tab === 'tickets'} onClick={() => setTab('tickets')}>
            <TicketIcon size={12} /> Tickets <span className="ml-1.5 t-mono text-[10px] text-ink-3">{tickets.length}</span>
          </TabButton>
          <TabButton active={tab === 'reservations'} onClick={() => setTab('reservations')}>
            <CalendarClock size={12} /> Reservations <span className="ml-1.5 t-mono text-[10px] text-ink-3">{reservations.length}</span>
          </TabButton>
        </div>

        {tab === 'tickets' && (
          <div className="px-5 pt-3 flex flex-wrap gap-1.5">
            <FilterPill active={ticketFilter === 'all'} onClick={() => setTicketFilter('all')}>All</FilterPill>
            <FilterPill active={ticketFilter === 'WAITING'} onClick={() => setTicketFilter('WAITING')}>Waiting</FilterPill>
            <FilterPill active={ticketFilter === 'CALLED'} onClick={() => setTicketFilter('CALLED')}>Called</FilterPill>
            <FilterPill active={ticketFilter === 'SERVING'} onClick={() => setTicketFilter('SERVING')}>Serving</FilterPill>
            <FilterPill active={ticketFilter === 'SERVED'} onClick={() => setTicketFilter('SERVED')}>Served</FilterPill>
            <FilterPill active={ticketFilter === 'MISSED'} onClick={() => setTicketFilter('MISSED')}>Missed</FilterPill>
            <FilterPill active={ticketFilter === 'CANCELLED'} onClick={() => setTicketFilter('CANCELLED')}>Cancelled</FilterPill>
          </div>
        )}

        {tab === 'reservations' && (
          <div className="px-5 pt-3 flex flex-wrap gap-1.5">
            <FilterPill active={reservationFilter === 'all'} onClick={() => setReservationFilter('all')}>All</FilterPill>
            <FilterPill active={reservationFilter === 'SCHEDULED'} onClick={() => setReservationFilter('SCHEDULED')}>Scheduled</FilterPill>
            <FilterPill active={reservationFilter === 'BOOKED'} onClick={() => setReservationFilter('BOOKED')}>Booked</FilterPill>
            <FilterPill active={reservationFilter === 'CANCELLED'} onClick={() => setReservationFilter('CANCELLED')}>Cancelled</FilterPill>
            <FilterPill active={reservationFilter === 'EXPIRED'} onClick={() => setReservationFilter('EXPIRED')}>Expired</FilterPill>
          </div>
        )}

        <div className="divide-y divide-line">
          {tab === 'all' && merged.length === 0 && <EmptyHistory />}
          {tab === 'tickets' && filteredTickets.length === 0 && <EmptyHistory message="No tickets match those filters." />}
          {tab === 'reservations' && filteredReservations.length === 0 && <EmptyHistory message="No reservations match those filters." />}

          {tab === 'tickets' && filteredTickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} />
          ))}

          {tab === 'reservations' && filteredReservations.map((reservation) => (
            <ReservationRow key={reservation.id} reservation={reservation} />
          ))}

          {tab === 'all' && merged.map((entry) => (
            entry.kind === 'ticket'
              ? <TicketRow key={entry.ticket.id} ticket={entry.ticket} />
              : <ReservationRow key={entry.reservation.id} reservation={entry.reservation} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-surface p-4">
      <div className="t-eyebrow text-[10px]">{label}</div>
      <div className={cn('t-mono text-2xl font-semibold mt-1', accent ? 'text-accent' : 'text-ink')}>{value}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium',
        active
          ? 'border-accent bg-accent-soft text-ink'
          : 'border-line bg-surface text-ink-2 hover:bg-surface-2',
      )}
    >
      {children}
    </button>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-2.5 py-1 text-[11px] font-medium',
        active ? 'border-ink text-ink bg-surface-2' : 'border-line bg-surface text-ink-2 hover:bg-surface-2',
      )}
    >
      {children}
    </button>
  );
}

function EmptyHistory({ message }: { message?: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <HistoryIcon size={22} className="text-ink-3 mx-auto mb-2" />
      <div className="text-[14px] font-semibold text-ink">Nothing here yet</div>
      <p className="text-[12px] text-ink-2 mt-1">{message ?? 'Join a queue or reserve a spot to start building history.'}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link to="/businesses" className="btn btn-primary btn-sm">Find a business</Link>
        <Link to="/reserve" className="btn btn-outline btn-sm">Reserve arrival window</Link>
      </div>
    </div>
  );
}

function TicketRow({ ticket }: { ticket: QueueTicket }) {
  return (
    <Link to={`/ticket/${ticket.id}`} className="grid md:grid-cols-[80px_1fr_180px_120px] gap-3 items-center px-5 py-3 hover:bg-surface-2">
      <div className="t-mono text-[14px] text-ink font-semibold">{ticket.ticketNumber}</div>
      <div className="min-w-0">
        <div className="text-[13px] text-ink font-medium truncate">{ticket.serviceName}</div>
        <div className="text-[11px] text-ink-3 mt-0.5 truncate">
          {titleFromSlug(ticket.companySlug)} · {titleFromSlug(ticket.branchSlug)} · {relativeTime(ticket.joinedAt)}
        </div>
      </div>
      <div className="text-[11px] text-ink-2 truncate">
        {ticket.servedAt ? `Served ${relativeTime(ticket.servedAt)}` : ticket.calledAt ? `Called ${relativeTime(ticket.calledAt)}` : `Joined ${formatDate(ticket.joinedAt)}`}
      </div>
      <div className="flex md:justify-end">
        <span className={cn(statusChip(ticket.status), 'text-[10px]')}>{ticket.status}</span>
      </div>
    </Link>
  );
}

function ReservationRow({ reservation }: { reservation: FutureReservation }) {
  return (
    <Link to={`/reservation/${reservation.id}`} className="grid md:grid-cols-[120px_1fr_180px_120px] gap-3 items-center px-5 py-3 hover:bg-surface-2">
      <div className="text-[12px] text-ink-2 font-mono">{formatTime(reservation.targetArrivalAt)}</div>
      <div className="min-w-0">
        <div className="text-[13px] text-ink font-medium truncate">{reservation.serviceName}</div>
        <div className="text-[11px] text-ink-3 mt-0.5 truncate">
          {titleFromSlug(reservation.companySlug)} · {reservation.branchName} · {formatDate(reservation.targetArrivalAt)}
        </div>
      </div>
      <div className="text-[11px] text-ink-2 truncate">
        Smart join around {formatTime(reservation.smartJoinAt)} · {reservation.arrivalWindowMinutes}m window
      </div>
      <div className="flex md:justify-end">
        <span className={cn(reservationChip(reservation.status), 'text-[10px]')}>{reservation.status}</span>
      </div>
    </Link>
  );
}
