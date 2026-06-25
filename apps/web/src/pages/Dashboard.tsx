import { useEffect, useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useQueueEvents } from '@/lib/useQueueEvents';
import { cn, formatTime, relativeTime } from '@/lib/utils';
import { downloadTextFile } from '@/lib/browserActions';
import { LineChart, Line, Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Download, Plus, Bell, Wallet, MapPin, Shield, UserPlus, Settings } from 'lucide-react';
import { img } from '@/lib/images';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    const tick = () => api.dashboard().then(d => mounted && setData(d)).catch(e => mounted && setError(e.message));
    tick();
    const id = setInterval(tick, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, []);
  const { metrics: liveMetrics, latestNotification } = useQueueEvents([]);
  const metrics = liveMetrics ?? data?.metrics;

  if (error) return <div className="p-8 text-ink-2">Error: {error}</div>;
  if (!data) return <div className="card p-6 h-96 animate-pulse" />;

  const company = data.company;
  const branches = data.branches;
  const staff = data.staff;
  const liveTickets = data.liveTickets;
  const notifications = data.notifications;
  const companyUsers = staff.map((member: any) => ({
    ...member,
    roleLabel: member.role === 'OWNER' ? 'Owner' : member.role === 'MANAGER' ? 'Manager' : 'Operator',
    access: member.role === 'OWNER'
      ? ['All branches', 'Users', 'Billing']
      : member.role === 'MANAGER'
        ? ['Branch queues', 'Staff', 'Reports']
        : ['Counter', 'Tickets', 'SMS'],
  }));

  const branchImg = (name: string) => {
    if (/katutura|windhoek/i.test(name)) return img.bankBranch;
    if (/swakop/i.test(name)) return img.storeFront;
    if (/klein/i.test(name)) return img.bankLobby;
    return img.office;
  };

  const refresh = async () => {
    setError(null);
    const fresh = await api.dashboard();
    setData(fresh);
    setNotice('Company admin console refreshed from the live API.');
  };

  const exportCsv = () => {
    const headers = ['Ticket', 'Customer', 'Service', 'Counter', 'Status', 'Joined'];
    const rows = liveTickets.map((ticket: any) => [
      ticket.ticketNumber,
      ticket.customerName,
      ticket.serviceName,
      ticket.counter ?? '',
      ticket.status,
      ticket.joinedAt,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell: unknown) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    downloadTextFile('inline-live-tickets.csv', csv, 'text/csv;charset=utf-8');
    setNotice(`${rows.length} live tickets exported.`);
  };

  const inviteStaff = () => {
    setNotice('Open Business settings to invite staff with branch scope and role access.');
  };

  return (
    <div className="space-y-5">
      {/* Action bar */}
      <div className="flex items-center gap-2">
        <div className="t-eyebrow text-[10px]">Company admin - live API - {branches.length} branches reporting</div>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={refresh} className="btn btn-sm btn-ghost"><RefreshCw size={13} /> Refresh</button>
          <button type="button" onClick={exportCsv} className="btn btn-sm btn-ghost"><Download size={13} /> Export CSV</button>
          <Link to="/onboarding" className="btn btn-sm btn-secondary"><Plus size={13} /> New branch</Link>
        </div>
      </div>

      {notice && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
          {notice}
        </div>
      )}

      {latestNotification && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="card p-3 flex items-center gap-3 text-[12px]">
          <Bell size={14} className="text-accent shrink-0" />
          <span className="text-ink-2">
            <span className="t-eyebrow text-[9px] mr-2 text-accent">New SMS</span>
            <span className="text-ink">{latestNotification.message.slice(0, 120)}</span>
            <span className="text-ink-3 ml-2">→ {latestNotification.to}</span>
          </span>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-5">
        <section className="card p-5 self-start">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="t-eyebrow mb-2">Company admin console</div>
              <h2 className="text-[22px] font-semibold tracking-normal text-ink leading-tight">Manage branches, staff, billing, and queue rules from one place.</h2>
              <p className="text-[13px] text-ink-2 mt-2 max-w-2xl">
                The owner account is the main admin. Managers supervise assigned branches, while operators only see the counter workflow they need.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={inviteStaff} className="btn btn-primary btn-sm"><UserPlus size={13} /> Invite staff</button>
              <Link to="/billing" className="btn btn-outline btn-sm"><Settings size={13} /> Billing</Link>
            </div>
          </div>
          <div className="mt-5 grid sm:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden">
            <AdminTile label="Branches" value={branches.length} />
            <AdminTile label="Company users" value={companyUsers.length} />
            <AdminTile label="SMS credits" value={metrics?.smsBalance?.toLocaleString() ?? company.smsBalance.toLocaleString()} />
            <AdminTile label="Plan" value={company.plan} />
          </div>
          <div className="mt-4 grid sm:grid-cols-3 gap-2">
            {[
              ['Owner', 'All branches, users, billing, and settings.'],
              ['Manager', 'Branch queues, staff oversight, and reports.'],
              ['Operator', 'Counter actions, tickets, and customer SMS.'],
            ].map(([role, description]) => (
              <div key={role} className="rounded-md border border-line bg-surface-2 p-3">
                <div className="text-[12px] font-semibold text-ink">{role}</div>
                <p className="text-[11px] text-ink-2 mt-1 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-ink">Company users</h3>
              <p className="t-eyebrow text-[10px] mt-0.5">Access control by role</p>
            </div>
            <Shield size={15} className="text-accent" />
          </div>
          <div className="divide-y divide-line">
            {companyUsers.map((user: any, index: number) => (
              <div key={user.id} className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <img src={[img.personAvatar2,img.personAvatar3,img.personAvatar4,img.personAvatar5][index % 4]} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-ink truncate">{user.name}</span>
                      <span className="chip-neutral">{user.roleLabel}</span>
                    </div>
                    <div className="font-mono text-[10px] text-ink-3 mt-0.5">{user.counter}</div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {user.access.map((item: string) => (
                    <span key={item} className="rounded border border-line bg-surface-2 px-2 py-1 text-[10px] font-medium text-ink-2">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden">
        <Kpi label="Live waiting" value={metrics?.liveWaiting ?? '–'} delta="+4 vs avg" bad />
        <Kpi label="Avg wait today" value={`${metrics?.avgWaitTodayMin ?? 7}m`} delta="−2m faster" />
        <Kpi label="Served today" value={metrics?.servedToday ?? 142} delta="+12% higher" />
        <Kpi label="No-show rate" value={`${metrics?.noShowRatePct ?? 3.4}%`} delta="−1.1% lower" />
      </div>

      {/* Chart + heatmap */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-ink">Wait time, today</h3>
            <span className="t-eyebrow text-[10px]">Live · 08–17</span>
          </div>
          <hr className="hairline my-3" />
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={metrics?.waitTimeSeries ?? []}>
                <defs>
                  <linearGradient id="wF" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#2563EB" stopOpacity={0.18} />
                    <stop offset="1" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 4" />
                <XAxis dataKey="hour" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} unit="m" />
                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12 }} labelStyle={{ color: '#0F172A' }} />
                <Area dataKey="wait" stroke="#2563EB" strokeWidth={2} fill="url(#wF)" name="Wait" />
                <Line dataKey="service" stroke="#475569" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Service" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3 t-eyebrow text-[10px] text-ink-2">
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-3 bg-accent inline-block" /> Wait</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-px w-3 border-t border-dashed border-ink-2 inline-block" /> Service</span>
            <span className="ml-auto">Peak <strong className="text-ink">{metrics?.peakHour}</strong> · Slowest <strong className="text-ink">{metrics?.slowestHour}</strong></span>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-[14px] font-semibold text-ink">Peak hour heatmap</h3>
          <p className="t-eyebrow text-[10px] mt-0.5">Mon–Thu · 08–17</p>
          <hr className="hairline my-3" />
          <div className="grid grid-cols-9 gap-1 t-eyebrow text-[10px] text-ink-3">
            <div></div>
            {['08','09','10','11','12','14','15','16'].map((h) => <div key={h} className="text-center">{h}</div>)}
            {['Mon','Tue','Wed','Thu'].map((d, di) => (
              <Fragment key={`row-${di}`}>
                <div className="flex items-center">{d}</div>
                {metrics?.heatmap?.[di]?.map((v: number, i: number) => (
                  <div key={`${di}-${i}`} className="h-6 border border-line" style={{ background: `rgba(37, 99, 235, ${0.05 + v * 0.85})` }} title={`${d} slot ${i+1}: ${Math.round(v*100)}% load`} />
                ))}
              </Fragment>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between t-eyebrow text-[10px] text-ink-3">
            <span>Quiet</span>
            <div className="flex-1 mx-2 h-1.5 border border-line" style={{ background: 'linear-gradient(90deg, rgba(37,99,235,0.05), rgba(37,99,235,0.90))' }} />
            <span>Busy</span>
          </div>
        </div>
      </div>

      {/* Live tickets + SMS wallet */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-5 pt-4 pb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-ink">Live tickets</h3>
            <span className="t-eyebrow text-[10px]">All queues · {liveTickets.length}</span>
          </div>
          <div className="px-5 pb-2 grid grid-cols-12 gap-3 text-[10px] t-eyebrow uppercase tracking-wider text-ink-3 border-b border-line">
            <div className="col-span-2">Ticket</div>
            <div className="col-span-4">Customer</div>
            <div className="col-span-2">Counter</div>
            <div className="col-span-2">Joined</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          <div className="divide-y divide-line">
            {liveTickets.length === 0 && <div className="px-5 py-8 text-center text-[12px] text-ink-3">No live tickets.</div>}
            {liveTickets.map((t: any, i: number) => (
              <div key={t.id} className="px-5 py-2.5 grid grid-cols-12 gap-3 items-center hover:bg-surface-2">
                <div className="col-span-2 t-mono text-[13px] text-ink font-medium">{t.ticketNumber}</div>
                <div className="col-span-4 flex items-center gap-2">
                  <img src={[img.personAvatar1,img.personAvatar2,img.personAvatar3,img.personAvatar4,img.personAvatar5,img.personAvatar6][i%6]} alt="" className="w-6 h-6 rounded-full object-cover" />
                  <div className="min-w-0">
                    <div className="text-[13px] text-ink truncate">{t.customerName}</div>
                    <div className="font-mono text-[10px] text-ink-3 truncate">{t.serviceName}</div>
                  </div>
                </div>
                <div className="col-span-2 font-mono text-[12px] text-ink-3">{t.counter ?? '—'}</div>
                <div className="col-span-2 font-mono text-[12px] text-ink-3">{relativeTime(t.joinedAt)}</div>
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
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-ink">SMS wallet</h3>
              <Wallet size={14} className="text-ink-3" />
            </div>
            <hr className="hairline my-3" />
            <div className="flex items-baseline gap-1">
              <div className="t-mono text-3xl text-ink font-semibold">{metrics?.smsBalance?.toLocaleString() ?? 1832}</div>
              <span className="font-mono text-[11px] text-ink-3">credits</span>
            </div>
            <div className="font-mono text-[12px] text-ink-2 mt-1">Sent today: <strong className="text-ink">{metrics?.smsSentToday ?? 412}</strong></div>
            <div className="mt-3 h-1.5 border border-line overflow-hidden rounded-sm">
              <div className="h-full bg-accent" style={{ width: `${Math.min(100, ((metrics?.smsBalance ?? 1832) / 2000) * 100)}%` }} />
            </div>
            <div className="t-eyebrow text-[9px] mt-2">Auto top-up {metrics?.autoTopUp ? 'ON' : 'OFF'} · refills at {metrics?.smsLowAt ?? 200}</div>
          </div>

          <div className="card p-5">
            <h3 className="text-[14px] font-semibold text-ink">Top templates</h3>
            <hr className="hairline my-3" />
            <div className="space-y-2.5">
              {metrics?.topTemplates?.map((t: any) => (
                <div key={t.name} className="flex items-center gap-3 text-[12px]">
                  <div className="text-ink-2 w-28 truncate font-mono text-[11px]">{t.name}</div>
                  <div className="flex-1 h-1.5 border border-line overflow-hidden rounded-sm">
                    <div className="h-full bg-accent" style={{ width: `${t.share * 100}%` }} />
                  </div>
                  <div className="font-mono text-ink-3 text-[11px] w-10 text-right">{t.sent}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Branches + staff */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold text-ink">Branch comparison</h3>
            <span className="t-eyebrow text-[10px]">{branches.length} branches</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-px bg-line border border-line rounded-lg overflow-hidden">
            {branches.slice(0, 4).map((b: any) => {
              const m = metrics?.branches?.find((x: any) => x.id === b.id);
              return (
                <div key={b.id} className="bg-surface">
                  <div className="aspect-[16/8] overflow-hidden bg-surface-2">
                    <img src={branchImg(b.name)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-ink">{b.name}</div>
                      <div className="font-mono text-[10px] text-ink-3 flex items-center gap-1.5 mt-0.5">
                        <MapPin size={9} /> {b.city} · {b.servedToday} served · avg {b.avgWaitMin}m
                      </div>
                    </div>
                    <span className={cn(
                      b.isOpen ? (b.avgWaitMin > 10 ? 'chip-call' : 'chip-open') : 'chip-done',
                    )}>{b.isOpen ? (b.avgWaitMin > 10 ? 'Busy' : 'Open') : 'Closed'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-line">
            <h3 className="text-[14px] font-semibold text-ink">Staff performance</h3>
            <p className="t-eyebrow text-[10px] mt-0.5">Today, by tickets served</p>
          </div>
          <div className="divide-y divide-line">
            {staff.map((s: any, i: number) => (
              <div key={s.id} className="px-5 py-2.5 flex items-center gap-3">
                <img src={[img.personAvatar2,img.personAvatar3,img.personAvatar4,img.personAvatar5][i%4]} alt="" className="w-8 h-8 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-ink truncate">{s.name}</div>
                  <div className="font-mono text-[10px] text-ink-3">{s.role} · {s.counter}</div>
                </div>
                <div className="text-right">
                  <div className="t-mono text-[13px] text-ink font-semibold">{s.servedToday}</div>
                  <div className="font-mono text-[10px] text-amber-600">★ {s.rating}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SMS log + testimonial */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-line">
            <h3 className="text-[14px] font-semibold text-ink">SMS log</h3>
            <p className="t-eyebrow text-[10px] mt-0.5">Live · {notifications.length} total</p>
          </div>
          <div className="max-h-72 overflow-auto divide-y divide-line">
            {notifications.length === 0 && <div className="px-5 py-6 text-[12px] text-ink-3">No SMS yet. Try joining a queue from the public page.</div>}
            {notifications.slice(0, 12).map((n: any) => (
              <div key={n.id} className="px-5 py-2.5 text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="t-eyebrow text-[9px] text-accent">{n.template}</span>
                  <span className="font-mono text-ink-3 text-[10px]">{formatTime(n.at)}</span>
                </div>
                <div className="text-ink-2 mt-0.5">{n.message}</div>
                <div className="font-mono text-ink-3 text-[10px] mt-0.5">→ {n.to}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="aspect-[4/3] bg-surface-2">
            <img src={img.office} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="p-4">
            <div className="t-eyebrow text-[9px]">Customer</div>
            <h3 className="text-[14px] font-semibold text-ink mt-1">Selma · Head of Operations</h3>
            <p className="text-[12px] text-ink-2 mt-1">"We rolled out Omukweyo in 11 branches in two weeks. Walk-in complaints dropped 70% in the first month."</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface p-4">
      <div className="t-eyebrow text-[10px]">{label}</div>
      <div className="t-mono text-xl text-ink font-semibold mt-1 truncate">{value}</div>
    </div>
  );
}

function Kpi({ label, value, delta, bad }: { label: string; value: any; delta?: string; bad?: boolean }) {
  return (
    <div className="bg-surface p-4">
      <div className="t-eyebrow text-[10px]">{label}</div>
      <div className="t-mono text-2xl text-ink font-semibold mt-1">{value}</div>
      {delta && (
        <div className={cn('t-eyebrow text-[10px] mt-1 inline-flex items-center gap-1', bad ? 'text-amber-600' : 'text-emerald-700')}>
          {bad ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {delta}
        </div>
      )}
    </div>
  );
}
