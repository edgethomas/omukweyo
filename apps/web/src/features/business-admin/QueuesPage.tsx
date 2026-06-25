import { useEffect, useState } from 'react';
import { useQueueEvents } from '@/lib/useQueueEvents';
import { api } from '@/lib/api';
import { cn, formatTime, relativeTime } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';
import DashboardLayout from './DashboardLayout';

export default function QueuesPage() {
  const [data, setData] = useState<any>(null);
  const [branchId, setBranchId] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const { tickets } = useQueueEvents(data?.liveTickets ?? []);

  useEffect(() => {
    api.dashboard()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <DashboardLayout><div className="card p-6 text-red-700">{error}</div></DashboardLayout>;
  if (!data) return <DashboardLayout><div className="card p-6 h-72 animate-pulse" /></DashboardLayout>;

  const branches: any[] = data.branches ?? [];
  const visible = tickets.filter((t) => branchId === 'all' || t.branchId === branchId);

  const refresh = () => api.dashboard().then(setData);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Live queues</h2>
            <p className="text-[12px] text-ink-3 mt-0.5">All active tickets across branches - updates via WebSocket</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="select h-9 text-[12px]" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="all">All branches</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button type="button" onClick={refresh} className="btn btn-ghost btn-sm"><RefreshCw size={13} /> Refresh</button>
          </div>
        </div>

        <section className="card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-line flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-ink">Active tickets</h3>
            <span className="t-eyebrow text-[10px]">{visible.length} live</span>
          </div>
          <div className="px-5 py-2 grid grid-cols-12 gap-3 text-[10px] t-eyebrow uppercase tracking-wider text-ink-3 border-b border-line">
            <div className="col-span-2">Ticket</div>
            <div className="col-span-3">Customer</div>
            <div className="col-span-2">Service</div>
            <div className="col-span-2">Counter</div>
            <div className="col-span-1">Joined</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          {visible.length === 0 ? (
            <div className="p-5 text-[12px] text-ink-3">No live tickets in this view.</div>
          ) : (
            <div className="divide-y divide-line">
              {visible.map((t) => (
                <div key={t.id} className="px-5 py-2.5 grid grid-cols-12 gap-3 items-center hover:bg-surface-2 text-[12px]">
                  <div className="col-span-2 t-mono text-ink font-medium">{t.ticketNumber}</div>
                  <div className="col-span-3 truncate">
                    <div className="text-ink truncate">{t.customerName}</div>
                    <div className="font-mono text-[10px] text-ink-3 truncate">{t.customerPhone}</div>
                  </div>
                  <div className="col-span-2 truncate font-mono text-[11px] text-ink-3">{t.serviceName}</div>
                  <div className="col-span-2 font-mono text-[12px] text-ink-3">{t.counter ?? '-'}</div>
                  <div className="col-span-1 font-mono text-[11px] text-ink-3">{relativeTime(t.joinedAt)}</div>
                  <div className="col-span-2 text-right">
                    <span className={cn(
                      t.status === 'WAITING' ? 'chip-wait' :
                      t.status === 'CALLED' ? 'chip-call' :
                      t.status === 'SERVING' ? 'chip-serve' : 'chip-done',
                    )}>{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
