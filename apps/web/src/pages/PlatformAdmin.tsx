import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Building2, CalendarClock, MessageSquare, Shield, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatTime } from '@/lib/utils';

export default function PlatformAdmin() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.adminOverview()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="p-8 text-ink-2">Error: {error}</div>;
  if (!data) return <div className="card p-6 h-96 animate-pulse" />;

  const totals = data.totals;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <div>
          <div className="t-eyebrow text-[10px] mb-1">Platform operations</div>
          <h2 className="text-[15px] sm:text-[16px] font-semibold text-ink">All roles, queues, reservations, and onboarding activity</h2>
        </div>
        <Link to="/login" className="btn btn-outline btn-sm self-start sm:self-auto">Role login</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-px bg-line border border-line rounded-lg overflow-hidden">
        <Kpi icon={<Building2 size={15} />} label="Companies" value={totals.companies} />
        <Kpi icon={<Users size={15} />} label="Customers" value={totals.customers} />
        <Kpi icon={<CalendarClock size={15} />} label="Reservations" value={totals.futureReservations} />
        <Kpi icon={<Activity size={15} />} label="Live tickets" value={totals.liveTickets} />
        <Kpi icon={<Building2 size={15} />} label="Business signups" value={totals.businessOnboardings} />
        <Kpi icon={<Users size={15} />} label="Runner apps" value={totals.runnerApplications} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-line">
            <h3 className="text-[14px] font-semibold text-ink">Role coverage</h3>
            <p className="t-eyebrow text-[10px] mt-0.5">Every user type has a clear entry point</p>
          </div>
          <div className="divide-y divide-line">
            {data.roleCoverage.map((role: any) => (
              <Link key={role.role} to={role.entry} className="grid sm:grid-cols-[1fr_120px_140px] gap-2 sm:gap-3 px-4 sm:px-5 py-3 hover:bg-surface-2">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-accent" />
                  <span className="text-[13px] font-semibold text-ink">{role.role.replaceAll('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-2 sm:block">
                  <span className={cn(role.status === 'LIVE' ? 'chip-serve' : 'chip-wait')}>{role.status}</span>
                  <span className="font-mono text-[11px] text-ink-3 sm:hidden truncate">{role.entry}</span>
                </div>
                <span className="hidden sm:block font-mono text-[12px] text-ink-3 sm:text-right">{role.entry}</span>
              </Link>
            ))}
          </div>
        </section>

        <aside className="space-y-3 sm:space-y-4">
          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="t-eyebrow">Notifications</div>
              <MessageSquare size={14} className="text-ink-3" />
            </div>
            <div className="t-mono text-2xl sm:text-3xl text-ink font-semibold mt-2">{totals.notifications}</div>
            <p className="text-[12px] text-ink-2 mt-1">SMS and support events logged across the platform.</p>
          </div>
          <div className="card p-4 sm:p-5">
            <div className="t-eyebrow mb-2">Business onboarding</div>
            <div className="t-mono text-2xl sm:text-3xl text-ink font-semibold">{totals.businessOnboardings}</div>
            <Link to="/onboarding" className="btn btn-outline btn-sm mt-4 w-full sm:w-auto">Open business setup</Link>
          </div>
          <div className="card p-4 sm:p-5">
            <div className="t-eyebrow mb-2">Runner applications</div>
            <div className="t-mono text-2xl sm:text-3xl text-ink font-semibold">{totals.runnerApplications}</div>
            <Link to="/runner/signup" className="btn btn-outline btn-sm mt-4 w-full sm:w-auto">Open runner signup</Link>
          </div>
        </aside>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <section className="card p-0 overflow-hidden">
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-line">
            <h3 className="text-[14px] font-semibold text-ink">Branch health</h3>
            <p className="t-eyebrow text-[10px] mt-0.5">Public queue network</p>
          </div>
          <div className="divide-y divide-line">
            {data.liveBranches.map((branch: any) => (
              <div key={branch.id} className="px-4 sm:px-5 py-3 flex flex-col gap-2 sm:grid sm:grid-cols-[1fr_90px_90px] sm:gap-3 sm:items-center">
                <div>
                  <div className="text-[13px] font-semibold text-ink">{branch.name}</div>
                  <div className="text-[11px] text-ink-3">{branch.city}</div>
                </div>
                <div className="flex items-center gap-2 sm:block">
                  <span className="t-mono text-[12px] text-ink-2">{branch.avgWaitMin}m avg</span>
                  <span className={`${branch.isOpen ? 'chip-open' : 'chip-done'} sm:hidden`}>{branch.isOpen ? 'OPEN' : 'CLOSED'}</span>
                </div>
                <div className="hidden sm:block text-right">
                  <span className={branch.isOpen ? 'chip-open' : 'chip-done'}>{branch.isOpen ? 'OPEN' : 'CLOSED'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-0 overflow-hidden">
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-line">
            <h3 className="text-[14px] font-semibold text-ink">Recent business onboarding</h3>
            <p className="t-eyebrow text-[10px] mt-0.5">New companies entering the product</p>
          </div>
          {data.recentBusinessOnboardings.length === 0 ? (
            <div className="p-5 sm:p-6 text-[12px] text-ink-3">No business onboarding records yet. Use Sign up to create one.</div>
          ) : (
            <div className="divide-y divide-line">
              {data.recentBusinessOnboardings.map((item: any) => (
                <Link key={item.id} to={item.launchLinks.dashboard} className="px-4 sm:px-5 py-3 block hover:bg-surface-2">
                  <div className="text-[13px] font-semibold text-ink">{item.companyName}</div>
                  <div className="text-[12px] text-ink-2 mt-0.5">{item.branchName} - {item.serviceName}</div>
                  <div className="t-eyebrow text-[9px] mt-1">{item.plan} - {item.status}</div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="card p-0 overflow-hidden">
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-line">
            <h3 className="text-[14px] font-semibold text-ink">Recent customer reservations</h3>
            <p className="t-eyebrow text-[10px] mt-0.5">Paid future demand</p>
          </div>
          {data.recentReservations.length === 0 ? (
            <div className="p-5 sm:p-6 text-[12px] text-ink-3">No future reservations yet. Use the customer signup flow to create one.</div>
          ) : (
            <div className="divide-y divide-line">
              {data.recentReservations.map((reservation: any) => (
                <Link key={reservation.id} to={`/reservation/${reservation.id}`} className="px-4 sm:px-5 py-3 flex flex-col gap-1 sm:grid sm:grid-cols-[1fr_90px] sm:gap-3 hover:bg-surface-2">
                  <div>
                    <div className="text-[13px] font-semibold text-ink">{reservation.customerName}</div>
                    <div className="text-[12px] text-ink-2">{reservation.serviceName} - {reservation.branchName}</div>
                  </div>
                  <div className="sm:text-right t-mono text-[12px] text-ink-3">{formatTime(reservation.targetArrivalAt)}</div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-surface p-3 sm:p-4">
      <div className="flex items-center gap-1.5 t-eyebrow text-[9px] sm:text-[10px]">{icon}{label}</div>
      <div className="t-mono text-xl sm:text-2xl text-ink font-semibold mt-0.5 sm:mt-1">{value}</div>
    </div>
  );
}
