import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useQueueEvents } from '@/lib/useQueueEvents';
import { cn, relativeTime } from '@/lib/utils';
import { downloadTextFile } from '@/lib/browserActions';
import { AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ArrowUpRight, RefreshCw, Download, Plus, Bell, Wallet, MapPin, Shield, Activity } from 'lucide-react';
import DashboardLayout from '@/features/business-admin/DashboardLayout';

function metricValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('en-NA') : '-';
}

function minuteValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? `${value}m` : '-';
}

function percentValue(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    api.dashboard().then(d => mounted && setData(d)).catch(e => mounted && setError(e.message));
    return () => { mounted = false; };
  }, []);
  const { tickets: liveQueueTickets, metrics: liveMetrics, latestNotification } = useQueueEvents(data?.liveTickets ?? [], {
    enabled: Boolean(data),
    metrics: true,
    notifications: true,
    refreshOnMount: false,
  });
  const metrics = liveMetrics ?? data?.metrics;

  if (error) return <DashboardLayout><div className="p-8 text-red-700">Error: {error}</div></DashboardLayout>;
  if (!data) return <DashboardLayout><div className="card p-6 h-96 animate-pulse" /></DashboardLayout>;

  const company = data.company;
  const branches = data.branches;
  const staff = data.staff;
  const liveTickets = liveQueueTickets;
  const companyUsers = staff.map((member: any) => ({
    ...member,
    roleLabel: member.role === 'OWNER' ? 'Owner' : member.role === 'MANAGER' ? 'Manager' : 'Operator',
    access: member.role === 'OWNER'
      ? ['All branches', 'Users', 'Billing']
      : member.role === 'MANAGER'
        ? ['Branch queues', 'Staff', 'Reports']
        : ['Counter', 'Tickets', 'SMS'],
  }));
  const smsBalance = metrics?.smsBalance ?? company.smsBalance ?? 0;
  const smsLowAt = metrics?.smsLowAt ?? 0;
  const waitTimeSeries = metrics?.waitTimeSeries ?? [];
  const hasWaitHistory = waitTimeSeries.some((point: any) => (point.wait ?? 0) > 0 || (point.service ?? 0) > 0);

  const refresh = async () => {
    setError(null);
    const fresh = await api.dashboard();
    setData(fresh);
    setNotice('Admin overview refreshed.');
  };

  const exportCsv = () => {
    const headers = ['Ticket', 'Customer', 'Service', 'Counter', 'Status', 'Joined'];
    const rows = liveTickets.map((ticket: any) => [
      ticket.ticketNumber, ticket.customerName, ticket.serviceName, ticket.counter ?? '', ticket.status, ticket.joinedAt,
    ]);
    const csv = [headers, ...rows].map((row: (string | number)[]) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadTextFile(`${company.slug}-live-tickets.csv`, csv, 'text/csv;charset=utf-8');
    setNotice(`${rows.length} live tickets exported.`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:flex-wrap">
          <div>
            <h2 className="text-[16px] sm:text-[18px] font-semibold text-ink">Overview</h2>
            <p className="text-[11px] sm:text-[12px] text-ink-3 mt-0.5">{branches.length} branches reporting - live data</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={refresh} className="btn btn-sm btn-ghost"><RefreshCw size={13} /> Refresh</button>
            <button type="button" onClick={exportCsv} className="btn btn-sm btn-ghost"><Download size={13} /> Export CSV</button>
            <Link to="/dashboard/branches" className="btn btn-sm btn-secondary"><Plus size={13} /> New branch</Link>
          </div>
        </div>

        {notice && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">{notice}</div>}

        {latestNotification && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="card p-3 flex items-center gap-3 text-[12px]">
            <Bell size={14} className="text-accent shrink-0" />
            <span className="text-ink-2">
              <span className="t-eyebrow text-[9px] mr-2 text-accent">New SMS</span>
              <span className="text-ink">{latestNotification.message.slice(0, 120)}</span>
              <span className="text-ink-3 ml-2">to {latestNotification.to}</span>
            </span>
          </motion.div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden">
          <Kpi label="Live waiting" value={metricValue(metrics?.liveWaiting)} note="Waiting tickets" />
          <Kpi label="Avg wait" value={minuteValue(metrics?.avgWaitTodayMin)} note="Active queue" />
          <Kpi label="Served today" value={metricValue(metrics?.servedToday)} note="Closed tickets" />
          <Kpi label="No-show rate" value={percentValue(metrics?.noShowRatePct)} note="Missed vs closed" />
        </div>

        <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-5">
          <section className="card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[14px] font-semibold text-ink">Live tickets</h3>
              <span className="t-eyebrow text-[10px]">All queues - {liveTickets.length}</span>
            </div>
            <div className="hidden sm:grid px-1 py-2 grid-cols-12 gap-3 text-[10px] t-eyebrow uppercase tracking-wider text-ink-3 border-b border-line">
              <div className="col-span-2">Ticket</div>
              <div className="col-span-4">Customer</div>
              <div className="col-span-2">Counter</div>
              <div className="col-span-2">Joined</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            <div className="divide-y divide-line">
              {liveTickets.length === 0 && <div className="px-1 py-8 text-center text-[12px] text-ink-3">No live tickets.</div>}
              {liveTickets.slice(0, 10).map((t: any) => (
                <div key={t.id} className="px-1 py-3 sm:py-2.5 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center hover:bg-surface-2 text-[12px]">
                  {/* Mobile card layout */}
                  <div className="flex sm:hidden flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="t-mono text-ink font-semibold text-[14px]">{t.ticketNumber}</span>
                      <span className={cn(
                        t.status === 'WAITING' ? 'chip-wait' :
                        t.status === 'CALLED' ? 'chip-call' :
                        t.status === 'SERVING' ? 'chip-serve' : 'chip-done',
                      )}>{t.status}</span>
                    </div>
                    <div className="text-ink truncate">{t.customerName}</div>
                    <div className="font-mono text-[10px] text-ink-3 truncate">{t.serviceName}</div>
                    <div className="font-mono text-[10px] text-ink-3 truncate">{t.counter ?? 'No counter'} - {relativeTime(t.joinedAt)}</div>
                  </div>
                  {/* Desktop columns */}
                  <div className="hidden sm:block sm:col-span-2 t-mono text-ink font-medium">{t.ticketNumber}</div>
                  <div className="hidden sm:block sm:col-span-4 truncate">
                    <div className="text-ink truncate">{t.customerName}</div>
                    <div className="font-mono text-[10px] text-ink-3 truncate">{t.serviceName}</div>
                  </div>
                  <div className="hidden sm:block sm:col-span-2 font-mono text-[12px] text-ink-3">{t.counter ?? '-'}</div>
                  <div className="hidden sm:block sm:col-span-2 font-mono text-[12px] text-ink-3">{relativeTime(t.joinedAt)}</div>
                  <div className="hidden sm:block sm:col-span-2 sm:text-right">
                    <span className={cn(
                      t.status === 'WAITING' ? 'chip-wait' :
                      t.status === 'CALLED' ? 'chip-call' :
                      t.status === 'SERVING' ? 'chip-serve' : 'chip-done',
                    )}>{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-right">
              <Link to="/dashboard/queues" className="text-[12px] text-accent hover:underline">View full live queue <ArrowUpRight size={11} className="inline" /></Link>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><Wallet size={14} /> SMS wallet</h3>
              </div>
              <hr className="hairline my-3" />
              <div className="flex items-baseline gap-1">
                <div className="t-mono text-3xl text-ink font-semibold">{metricValue(smsBalance)}</div>
                <span className="font-mono text-[11px] text-ink-3">credits</span>
              </div>
              <div className="font-mono text-[12px] text-ink-2 mt-1">Sent: <strong className="text-ink">{metricValue(metrics?.smsSentToday)}</strong></div>
              <div className={cn('mt-3 rounded-md border px-3 py-2 text-[11px] font-medium', smsLowAt && smsBalance <= smsLowAt ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-line bg-surface-2 text-ink-2')}>
                Auto top-up {metrics?.autoTopUp ? 'on' : 'off'}{smsLowAt ? ` at ${smsLowAt} credits` : ''}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><Shield size={14} /> Company users</h3>
              <hr className="hairline my-3" />
              <div className="space-y-2.5">
                {companyUsers.slice(0, 4).map((user: any) => (
                  <div key={user.id} className="text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-ink truncate">{user.name}</span>
                      <span className="chip-neutral text-[9px]">{user.roleLabel}</span>
                    </div>
                    <div className="font-mono text-[10px] text-ink-3 mt-0.5">{user.counter}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-right">
                <Link to="/dashboard/staff" className="text-[12px] text-accent hover:underline">Manage staff <ArrowUpRight size={11} className="inline" /></Link>
              </div>
            </div>
          </aside>
        </div>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><Activity size={14} /> Wait time today</h3>
            <span className="t-eyebrow text-[10px]">08-17</span>
          </div>
          <div className="h-52 mt-3">
            {hasWaitHistory ? (
              <ResponsiveContainer>
                <AreaChart data={waitTimeSeries}>
                  <defs>
                    <linearGradient id="wfb" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="#2563EB" stopOpacity={0.18} />
                      <stop offset="1" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 4" />
                  <XAxis dataKey="hour" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} unit="m" />
                  <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12 }} labelStyle={{ color: '#0F172A' }} />
                  <Area dataKey="wait" stroke="#2563EB" strokeWidth={2} fill="url(#wfb)" name="Wait" />
                  <Line dataKey="service" stroke="#475569" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Service" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-md border border-dashed border-line bg-surface-2 text-center text-[12px] text-ink-3">
                No ticket history yet.
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-3 t-eyebrow text-[10px] text-ink-2">
            <span>Peak <strong className="text-ink">{metrics?.peakHour ?? '-'}</strong> - Slowest <strong className="text-ink">{metrics?.slowestHour ?? '-'}</strong></span>
          </div>
        </section>

        <section className="card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-line flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><MapPin size={14} /> Branches</h3>
            <Link to="/dashboard/branches" className="text-[12px] text-accent hover:underline">Manage <ArrowUpRight size={11} className="inline" /></Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line">
            {branches.map((b: any) => (
              <div key={b.id} className="bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-[13px] font-semibold text-ink truncate">{b.name}</h4>
                  <span className={cn(b.isOpen ? (b.avgWaitMin > 10 ? 'chip-call' : 'chip-open') : 'chip-done')}>
                    {b.isOpen ? (b.avgWaitMin > 10 ? 'Busy' : 'Open') : 'Closed'}
                  </span>
                </div>
                <p className="font-mono text-[10px] text-ink-3 mt-0.5">{b.city} - {b.servedToday} served - avg {b.avgWaitMin}m</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h3 className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><Shield size={14} /> Access control</h3>
          <p className="text-[12px] text-ink-3 mt-1">Roles control who can see which page. Backend permissions are enforced on every API call.</p>
          <div className="mt-3 grid sm:grid-cols-3 gap-2">
            {[
              ['Owner', 'All branches, users, billing, settings.'],
              ['Manager', 'Branch queues, staff, reports.'],
              ['Operator', 'Counter actions, tickets, SMS.'],
            ].map(([role, description]) => (
              <div key={role} className="rounded-md border border-line bg-surface-2 p-3">
                <div className="text-[12px] font-semibold text-ink">{role}</div>
                <p className="text-[11px] text-ink-2 mt-1 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}


function Kpi({ label, value, note }: { label: string; value: any; note?: string }) {
  return (
    <div className="bg-surface p-3 sm:p-4">
      <div className="t-eyebrow text-[9px] sm:text-[10px]">{label}</div>
      <div className="t-mono text-xl sm:text-2xl text-ink font-semibold mt-0.5 sm:mt-1">{value}</div>
      {note && <div className="t-eyebrow mt-0.5 text-[9px] text-ink-3 sm:mt-1 sm:text-[10px]">{note}</div>}
    </div>
  );
}
