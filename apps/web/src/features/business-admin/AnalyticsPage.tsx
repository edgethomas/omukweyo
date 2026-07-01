import { useEffect, useState } from 'react';
import { LineChart, Line, Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { Calendar, RefreshCw, Users } from 'lucide-react';
import { useQueueEvents } from '@/lib/useQueueEvents';
import { api } from '@/lib/api';
import DashboardLayout from './DashboardLayout';

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

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { metrics: liveMetrics } = useQueueEvents([], {
    enabled: Boolean(data),
    tickets: false,
    metrics: true,
    refreshOnMount: false,
  });
  const metrics = liveMetrics ?? data?.metrics;
  const branches = data?.branches ?? [];

  useEffect(() => {
    api.analyticsOverview()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <DashboardLayout><div className="card p-6 text-red-700">{error}</div></DashboardLayout>;
  if (!data) return <DashboardLayout><div className="card p-6 h-96 animate-pulse" /></DashboardLayout>;

  const totalServed = branches.reduce((sum: number, b: any) => sum + (b.servedToday ?? 0), 0);
  const totalWaiting = branches.reduce((sum: number, b: any) => sum + (b.liveWaiting ?? 0), 0);
  const avgWait = branches.length ? Math.round(branches.reduce((sum: number, b: any) => sum + b.avgWaitMin, 0) / branches.length) : 0;
  const waitTimeSeries = metrics?.waitTimeSeries ?? [];
  const hasWaitHistory = waitTimeSeries.some((point: any) => (point.wait ?? 0) > 0 || (point.service ?? 0) > 0);
  const topTemplates = metrics?.topTemplates ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Analytics</h2>
            <p className="text-[12px] text-ink-3 mt-0.5">Live wait times, served counts, and peak hours</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="select h-9 text-[12px]" defaultValue="today">
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
            </select>
            <button type="button" onClick={() => api.analyticsOverview().then(setData)} className="btn btn-ghost btn-sm"><RefreshCw size={13} /> Refresh</button>
          </div>
        </div>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden">
          <Kpi label="Live waiting" value={metricValue(metrics?.liveWaiting ?? totalWaiting)} />
          <Kpi label="Avg wait" value={minuteValue(metrics?.avgWaitTodayMin ?? avgWait)} />
          <Kpi label="Served today" value={metricValue(metrics?.servedToday ?? totalServed)} />
          <Kpi label="No-show rate" value={percentValue(metrics?.noShowRatePct)} />
        </section>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><Calendar size={14} /> Wait time today</h3>
              <span className="t-eyebrow text-[10px]">08-17</span>
            </div>
            <div className="h-56 mt-3">
              {hasWaitHistory ? (
                <ResponsiveContainer>
                  <AreaChart data={waitTimeSeries}>
                    <defs>
                      <linearGradient id="wfa" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0" stopColor="#2563EB" stopOpacity={0.18} />
                        <stop offset="1" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 4" />
                    <XAxis dataKey="hour" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} unit="m" />
                    <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12 }} labelStyle={{ color: '#0F172A' }} />
                    <Area dataKey="wait" stroke="#2563EB" strokeWidth={2} fill="url(#wfa)" name="Wait" />
                    <Line dataKey="service" stroke="#475569" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Service" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center rounded-md border border-dashed border-line bg-surface-2 text-center text-[12px] text-ink-3">
                  No ticket history yet.
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 t-eyebrow text-[10px] text-ink-2">
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-3 bg-accent inline-block" /> Wait</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-px w-3 border-t border-dashed border-ink-2 inline-block" /> Service</span>
              <span className="ml-auto">Peak <strong className="text-ink">{metrics?.peakHour ?? '-'}</strong> - Slowest <strong className="text-ink">{metrics?.slowestHour ?? '-'}</strong></span>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><Users size={14} /> Top SMS templates</h3>
            <div className="mt-3 space-y-2.5">
              {topTemplates.map((t: any) => (
                <div key={t.name} className="flex items-center gap-3 text-[12px]">
                  <div className="text-ink-2 w-28 truncate font-mono text-[11px]">{t.name}</div>
                  <div className="flex-1 h-1.5 border border-line overflow-hidden rounded-sm">
                    <div className="h-full bg-accent" style={{ width: `${t.share * 100}%` }} />
                  </div>
                  <div className="font-mono text-ink-3 text-[11px] w-10 text-right">{t.sent}</div>
                </div>
              ))}
              {topTemplates.length === 0 && <div className="text-[12px] text-ink-3">No SMS data yet.</div>}
            </div>
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-line">
            <h3 className="text-[14px] font-semibold text-ink">Branch comparison</h3>
          </div>
          {branches.length === 0 ? (
            <div className="p-5 text-[12px] text-ink-3">No branches to compare.</div>
          ) : (
            <div className="divide-y divide-line">
              {branches.map((branch: any) => (
                <div key={branch.id} className="grid md:grid-cols-[1.4fr_1fr_120px_120px] gap-3 items-center px-5 py-3">
                  <div>
                    <div className="text-[13px] font-semibold text-ink">{branch.name}</div>
                    <p className="text-[11px] text-ink-3 mt-0.5">{branch.city} - {branch.isOpen ? 'Open' : 'Closed'}</p>
                  </div>
                  <div className="h-8">
                    <ResponsiveContainer>
                      <BarChart data={[{ name: branch.name, value: branch.avgWaitMin }]}>
                        <Bar dataKey="value" fill="#2563EB" radius={[2, 2, 0, 0]} />
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-right text-[11px] text-ink-2">
                    <p className="t-mono text-[15px] text-ink font-semibold">{branch.avgWaitMin}m</p>
                    <p>avg wait</p>
                  </div>
                  <div className="text-right text-[11px] text-ink-2">
                    <p className="t-mono text-[15px] text-ink font-semibold">{branch.servedToday}</p>
                    <p>served</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-4">
      <div className="t-eyebrow text-[10px]">{label}</div>
      <div className="t-mono text-2xl text-ink font-semibold mt-1">{value}</div>
    </div>
  );
}
