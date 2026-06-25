import { useEffect, useState } from 'react';
import { Calendar, Download, FileText, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { downloadTextFile } from '@/lib/browserActions';
import DashboardLayout from './DashboardLayout';

type ReportKind = 'tickets' | 'reservations' | 'sms' | 'staff';
type ReportRange = 'today' | 'week' | 'month';

const RANGES: Record<ReportRange, number> = {
  today: 24 * 60 * 60_000,
  week: 7 * 24 * 60 * 60_000,
  month: 30 * 24 * 60 * 60_000,
};

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [range, setRange] = useState<ReportRange>('today');
  const [kind, setKind] = useState<ReportKind>('tickets');

  useEffect(() => {
    api.dashboard().then(setData);
  }, []);

  if (!data) return <DashboardLayout><div className="card p-6 h-64 animate-pulse" /></DashboardLayout>;

  const since = Date.now() - RANGES[range];

  const buildCsv = () => {
    let rows: any[] = [];
    let headers: string[] = [];
    if (kind === 'tickets') {
      headers = ['Ticket', 'Customer', 'Service', 'Status', 'Joined', 'Counter'];
      rows = (data.liveTickets as any[]).map((t) => [t.ticketNumber, t.customerName, t.serviceName, t.status, t.joinedAt, t.counter ?? '']);
    } else if (kind === 'reservations') {
      headers = ['Service', 'Customer', 'Phone', 'Branch', 'Target arrival', 'Status', 'Paid'];
      rows = ((data as any).reservations ?? []) as any[];
    } else if (kind === 'sms') {
      headers = ['Template', 'Status', 'To', 'When', 'Message'];
      rows = ((data.notifications as any[]) ?? []).filter((n) => new Date(n.at).getTime() >= since).map((n) => [n.template, n.status, n.to, n.at, n.message]);
    } else {
      headers = ['Name', 'Role', 'Counter', 'Served today', 'Rating'];
      rows = (data.staff as any[]).map((s) => [s.name, s.role, s.counter, s.servedToday, s.rating]);
    }
    const csv = [headers, ...rows].map((row: (string | number)[]) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadTextFile(`${kind}-${range}.csv`, csv, 'text/csv;charset=utf-8');
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Reports</h2>
            <p className="text-[12px] text-ink-3 mt-0.5">Build a CSV for finance, operations, or compliance</p>
          </div>
          <button type="button" onClick={() => api.dashboard().then(setData)} className="btn btn-ghost btn-sm"><RefreshCw size={13} /> Refresh</button>
        </div>

        <section className="card p-5">
          <h3 className="text-[14px] font-semibold text-ink">Build a report</h3>
          <div className="mt-3 grid sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="label">Report</span>
              <select className="select" value={kind} onChange={(e) => setKind(e.target.value as ReportKind)}>
                <option value="tickets">Live tickets</option>
                <option value="reservations">Reservations</option>
                <option value="sms">SMS log</option>
                <option value="staff">Staff performance</option>
              </select>
            </label>
            <label className="block">
              <span className="label">Range</span>
              <select className="select" value={range} onChange={(e) => setRange(e.target.value as ReportRange)}>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </select>
            </label>
            <div className="flex items-end">
              <button type="button" className="btn btn-primary btn-md" onClick={buildCsv}>
                <Download size={13} /> Export CSV
              </button>
            </div>
          </div>
          <p className="text-[12px] text-ink-3 mt-3 inline-flex items-center gap-1.5"><Calendar size={12} /> {range === 'today' ? 'Last 24 hours' : range === 'week' ? 'Last 7 days' : 'Last 30 days'}</p>
        </section>

        <section className="card p-5">
          <h3 className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><FileText size={14} /> Schedule (coming soon)</h3>
          <p className="text-[12px] text-ink-3 mt-1">Pick a weekly or monthly report, the email it goes to, and we will deliver it on time. Built in Phase 5 with the email adapter.</p>
        </section>
      </div>
    </DashboardLayout>
  );
}
