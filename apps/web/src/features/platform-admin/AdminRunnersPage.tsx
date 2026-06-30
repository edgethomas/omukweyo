import { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, ShieldAlert, UserCheck, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, relativeTime } from '@/lib/utils';

type AppRow = {
  id: string;
  name: string;
  phone: string;
  city: string;
  transportMode: string;
  payoutMethod: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
};

export default function AdminRunnersPage() {
  const [rows, setRows] = useState<AppRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const load = () => {
    setLoading(true);
    api.adminOverview()
      .then((d: any) => setRows(d.recentRunnerApplications ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActionPending(id);
    setNotice(null);
    try {
      const res = await api.setRunnerApplicationStatus(id, status);
      setRows((current) => current.map((row) => row.id === id ? { ...row, status: res.application.status } : row));
      const label = status === 'APPROVED' ? 'approved' : 'rejected';
      setNotice({ kind: 'ok', text: `${rows.find((r) => r.id === id)?.name ?? 'Runner'} ${label}.` });
    } catch (err: any) {
      setNotice({ kind: 'err', text: err?.message ?? `Could not ${status.toLowerCase()} runner.` });
    } finally {
      setActionPending(null);
    }
  };

  const filtered = rows.filter((r) => filter === 'all' || r.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:flex-wrap">
        <div>
          <h2 className="text-[16px] sm:text-[18px] font-semibold text-ink">Runners</h2>
          <p className="text-[11px] sm:text-[12px] text-ink-3 mt-0.5">{rows.length} applications - approve, reject, or audit</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
            <button key={status} type="button" onClick={() => setFilter(status)} className={cn('rounded-full border px-2.5 py-1 text-[11px] font-medium', filter === status ? 'border-accent bg-accent-soft text-ink' : 'border-line bg-surface text-ink-2')}>{status}</button>
          ))}
          <button type="button" onClick={load} className="btn btn-ghost btn-sm"><RefreshCw size={13} /> Refresh</button>
        </div>
      </div>

      {notice && (
        <div className={cn('rounded-md px-3 py-2 text-[12px]', notice.kind === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700')}>
          {notice.text}
        </div>
      )}

      <section className="card p-0 overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-line">
          <h3 className="text-[14px] font-semibold text-ink">Applications</h3>
          <p className="t-eyebrow text-[10px] mt-0.5">{filtered.length} matches</p>
        </div>
        {loading ? (
          <div className="p-5 text-[12px] text-ink-3">Loading applications...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-[12px] text-ink-3">No runner applications match.</div>
        ) : (
          <div className="divide-y divide-line">
            {filtered.map((row) => (
              <div key={row.id} className="flex flex-col gap-2 px-4 sm:px-5 py-3 text-[12px] md:grid md:grid-cols-[1.4fr_140px_120px_120px] md:gap-3 md:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <UserCheck size={14} className="text-accent" />
                    <h4 className="text-[13px] font-semibold text-ink truncate">{row.name}</h4>
                    <span className={cn('text-[10px]', row.status === 'APPROVED' ? 'chip-done' : row.status === 'REJECTED' ? 'chip-miss' : 'chip-wait')}>{row.status}</span>
                  </div>
                  <p className="text-[11px] text-ink-3 mt-1 font-mono break-words">{row.phone} - {row.city} - {row.transportMode} - payout {row.payoutMethod}</p>
                </div>
                <div className="text-[11px] text-ink-2">Applied {relativeTime(row.createdAt)}</div>
                {row.status === 'PENDING' ? (
                  <div className="flex gap-2 flex-wrap">
                    <button type="button" disabled={actionPending === row.id} onClick={() => void setStatus(row.id, 'APPROVED')} className="btn btn-sm btn-outline text-emerald-700"><CheckCircle2 size={12} /> Approve</button>
                    <button type="button" disabled={actionPending === row.id} onClick={() => void setStatus(row.id, 'REJECTED')} className="btn btn-sm btn-outline text-red-700"><X size={12} /> Reject</button>
                  </div>
                ) : (
                  <div className="text-[11px] text-ink-3 inline-flex items-center gap-1 md:justify-end"><ShieldAlert size={12} /> Audit only</div>
                )}
                <div className="text-[10px] text-ink-3 md:text-right">ID {row.id.slice(-6)}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
