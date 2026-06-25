import { useEffect, useState } from 'react';
import { Activity, Filter, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, relativeTime } from '@/lib/utils';

type EventRow = {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
};

export default function AdminAuditLogsPage() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    const combined: EventRow[] = [];
    Promise.all([api.adminOverview().catch(() => null), api.notifications().catch(() => ({ notifications: [] }))]).then(([overview, notifs]) => {
      if (overview?.recentReservations) {
        for (const r of overview.recentReservations) {
          combined.push({
            id: `res-${r.id}`, at: r.createdAt, actor: 'customer', action: 'RESERVATION_CREATED', target: r.id, detail: `${r.serviceName} at ${r.branchName} (${r.paymentStatus})`,
          });
        }
      }
      for (const n of (notifs as any)?.notifications ?? []) {
        combined.push({
          id: `n-${n.id}`, at: n.at, actor: 'system', action: n.template, target: n.to, detail: n.message,
        });
      }
      combined.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      setRows(combined);
    });
  }, []);

  const actions = Array.from(new Set(rows.map((r) => r.action)));
  const filtered = rows.filter((r) => {
    if (actorFilter && !r.actor.toLowerCase().includes(actorFilter.toLowerCase())) return false;
    if (actionFilter !== 'all' && r.action !== actionFilter) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-[18px] font-semibold text-ink">Audit logs</h2>
          <p className="text-[12px] text-ink-3 mt-0.5">System events across reservations, SMS, and runner updates</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Filter size={13} className="text-ink-3 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input className="input h-9 pl-8 text-[12px] w-40" placeholder="Actor" value={actorFilter} onChange={(e) => setActorFilter(e.target.value)} />
          </div>
          <select className="select h-9 text-[12px]" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="all">All actions</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button type="button" onClick={() => window.location.reload()} className="btn btn-ghost btn-sm"><RefreshCw size={13} /> Refresh</button>
        </div>
      </div>

      <section className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-line flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><Activity size={14} /> Recent events</h3>
          <span className="t-eyebrow text-[10px]">{filtered.length} entries</span>
        </div>
        {filtered.length === 0 ? (
          <div className="p-5 text-[12px] text-ink-3">No events match those filters.</div>
        ) : (
          <div className="divide-y divide-line max-h-[36rem] overflow-auto">
            {filtered.map((row) => (
              <div key={row.id} className="grid md:grid-cols-[140px_140px_140px_1fr_120px] gap-3 items-center px-5 py-2.5 text-[12px]">
                <div className="font-mono text-[11px] text-ink-3">{relativeTime(row.at)}</div>
                <div className="text-ink-2">{row.actor}</div>
                <div>
                  <span className={cn('text-[10px]', row.action.includes('FAILED') ? 'chip-miss' : row.action.includes('CREATED') ? 'chip-wait' : 'chip-done')}>{row.action}</span>
                </div>
                <div className="text-ink-2 truncate">{row.detail}</div>
                <div className="text-right font-mono text-[10px] text-ink-3">{row.target.slice(-6)}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
