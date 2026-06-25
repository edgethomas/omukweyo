import { useEffect, useState } from 'react';
import { CreditCard, RefreshCw, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, relativeTime } from '@/lib/utils';

export default function AdminBillingPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.adminOverview().then(setData).catch(() => undefined);
  }, []);

  if (!data) return <div className="card p-6 h-64 animate-pulse" />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-[18px] font-semibold text-ink">Platform billing</h2>
          <p className="text-[12px] text-ink-3 mt-0.5">Subscriptions, invoices, and SMS revenue</p>
        </div>
        <button type="button" onClick={() => api.adminOverview().then(setData)} className="btn btn-ghost btn-sm"><RefreshCw size={13} /> Refresh</button>
      </div>

      <section className="grid sm:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden">
        <Tile label="Companies" value={String(data.totals.companies)} />
        <Tile label="Future reservations" value={String(data.totals.futureReservations)} />
        <Tile label="Live tickets" value={String(data.totals.liveTickets)} />
        <Tile label="Notifications" value={String(data.totals.notifications)} />
      </section>

      <section className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-line">
          <h3 className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><CreditCard size={14} /> Recent reservations (paid)</h3>
        </div>
        {(data.recentReservations ?? []).length === 0 ? (
          <div className="p-5 text-[12px] text-ink-3">No recent reservations.</div>
        ) : (
          <div className="divide-y divide-line">
            {(data.recentReservations as any[]).map((reservation) => (
              <div key={reservation.id} className="grid md:grid-cols-[1.4fr_120px_140px_120px] gap-3 items-center px-5 py-2.5 text-[12px]">
                <div className="min-w-0">
                  <div className="text-ink font-medium truncate">{reservation.serviceName}</div>
                  <p className="text-[11px] text-ink-3 mt-0.5">{reservation.branchName} - {reservation.customerName}</p>
                </div>
                <div className="text-right t-mono">N${(reservation.feeCents / 100).toFixed(0)}</div>
                <div className="text-right text-[11px] text-ink-2">{reservation.paymentStatus}</div>
                <div className="text-right text-[11px] text-ink-3">{relativeTime(reservation.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-line">
          <h3 className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><Wallet size={14} /> Top live branches</h3>
        </div>
        {(data.liveBranches ?? []).length === 0 ? (
          <div className="p-5 text-[12px] text-ink-3">No live branches.</div>
        ) : (
          <div className="divide-y divide-line">
            {(data.liveBranches as any[]).map((branch) => (
              <div key={branch.id} className="grid md:grid-cols-[1.4fr_120px_120px_120px] gap-3 items-center px-5 py-2.5 text-[12px]">
                <div className="text-ink font-medium">{branch.name}</div>
                <div className="text-right text-ink-2">{branch.city}</div>
                <div className="text-right t-mono">{branch.liveWaiting}</div>
                <div className="text-right">
                  <span className={cn('text-[10px]', branch.isOpen ? 'chip-open' : 'chip-done')}>{branch.isOpen ? 'OPEN' : 'CLOSED'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-4">
      <div className="t-eyebrow text-[10px]">{label}</div>
      <div className="t-mono text-2xl text-ink font-semibold mt-1">{value}</div>
    </div>
  );
}
