import { useEffect, useState } from 'react';
import { Building2, RefreshCw, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, relativeTime } from '@/lib/utils';

type CompanyRow = {
  id: string;
  companyName: string;
  industry: string;
  plan: string;
  smsBalance: number;
  createdAt: string;
  launchLinks?: { publicPage: string; dashboard: string };
};

export default function AdminCompaniesPage() {
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE'>('all');

  const load = () => api.adminOverview().then(setData).catch(() => undefined);

  useEffect(() => { load(); }, []);

  if (!data) return <div className="card p-6 h-64 animate-pulse" />;

  const rows: CompanyRow[] = data.recentBusinessOnboardings ?? [];
  const filtered = rows.filter((row) => {
    if (planFilter !== 'all' && row.plan !== planFilter) return false;
    if (search.trim() && !`${row.companyName} ${row.industry} ${row.plan}`.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-[18px] font-semibold text-ink">Companies</h2>
          <p className="text-[12px] text-ink-3 mt-0.5">{data.totals.companies} companies on the platform</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={13} className="text-ink-3 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input className="input h-9 pl-8 text-[12px] w-64" placeholder="Search by name, industry, plan" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="select h-9 text-[12px]" value={planFilter} onChange={(e) => setPlanFilter(e.target.value as any)}>
            <option value="all">All plans</option>
            <option value="FREE">Free</option>
            <option value="STARTER">Starter</option>
            <option value="BUSINESS">Business</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
          <button type="button" onClick={load} className="btn btn-ghost btn-sm"><RefreshCw size={13} /> Refresh</button>
        </div>
      </div>

      <section className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-line">
          <h3 className="text-[14px] font-semibold text-ink">Recent onboardings</h3>
          <p className="t-eyebrow text-[10px] mt-0.5">{filtered.length} matches</p>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-ink-3">No companies in the recent onboarding list.</div>
        ) : (
          <div className="divide-y divide-line">
            {filtered.map((row) => (
              <div key={row.id} className="grid md:grid-cols-[1.4fr_140px_120px_120px_120px] gap-3 items-center px-5 py-3 text-[12px]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-accent" />
                    <h4 className="text-[13px] font-semibold text-ink truncate">{row.companyName}</h4>
                  </div>
                  <p className="text-[11px] text-ink-3 mt-1">{row.industry} - {row.launchLinks?.publicPage ?? `/c/${row.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}</p>
                </div>
                <div>
                  <span className={cn('text-[10px]', row.plan === 'ENTERPRISE' ? 'chip-serve' : row.plan === 'BUSINESS' ? 'chip-open' : 'chip-neutral')}>{row.plan}</span>
                </div>
                <div className="text-[11px] text-ink-2">Created {relativeTime(row.createdAt)}</div>
                <div className="text-[11px] text-ink-2">SMS {row.smsBalance.toLocaleString()}</div>
                <div className="text-right">
                  <a className="text-[12px] text-accent hover:underline" href={row.launchLinks?.publicPage ?? `/c/${row.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>Open</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
