import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useQueueEvents } from '@/lib/useQueueEvents';
import { cn } from '@/lib/utils';

export default function WaitingRoomTvPage() {
  const [params] = useSearchParams();
  const [company, setCompany] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState<string>('');

  useEffect(() => {
    const slug = params.get('company');
    api.businesses('').then(async (d) => {
      const companySlug = slug ?? d.businesses[0]?.slug;
      if (!companySlug) return;
      const companyPayload = await api.company(companySlug);
      setCompany(companyPayload.company);
      setBranches(companyPayload.branches);
      setBranchId(companyPayload.branches[0]?.id ?? '');
    });
  }, [params]);

  const { tickets } = useQueueEvents([]);
  const live = tickets.filter((t) => !branchId || t.branchId === branchId);
  const serving = live.find((t) => t.status === 'SERVING');
  const called = live.filter((t) => t.status === 'CALLED');
  const waiting = live.filter((t) => t.status === 'WAITING').slice(0, 6);

  if (!company) return <div className="min-h-screen grid place-items-center text-ink-3">Loading TV...</div>;

  return (
    <div className="min-h-screen bg-ink text-white px-8 py-10">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-md grid place-items-center font-semibold" style={{ background: company.primaryColor }}>{company.logoText}</div>
          <div>
            <div className="t-eyebrow text-[10px] text-white/60">Now serving</div>
            <h1 className="text-[24px] font-semibold">{company.name}</h1>
          </div>
        </div>
        {branches.length > 1 && (
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="bg-white/10 border border-white/20 rounded-md h-9 px-3 text-[12px]">
            {branches.map((b) => <option key={b.id} value={b.id} className="text-ink">{b.name}</option>)}
          </select>
        )}
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border-2 border-white/20 bg-white/5 p-8">
          <div className="t-eyebrow text-[10px] text-white/60">Now serving</div>
          <div className="t-mono text-[120px] leading-none font-semibold mt-3">
            {serving?.ticketNumber ?? called[0]?.ticketNumber ?? '-'}
          </div>
          <div className="text-[20px] mt-3">
            {serving ? serving.serviceName : called[0]?.serviceName ?? 'Queue is clear'}
          </div>
          <div className="text-[14px] text-white/70 mt-1">
            {serving ? `Counter ${serving.counter ?? 'TBD'}` : called[0] ? `Go to counter ${called[0].counter ?? 'TBD'}` : 'Have a seat. We will call you soon.'}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-white/10 bg-white/5 p-6">
          <div className="t-eyebrow text-[10px] text-white/60">Up next</div>
          <div className="mt-3 space-y-2">
            {waiting.length === 0 ? (
              <div className="text-white/60 text-[14px]">Nobody waiting</div>
            ) : waiting.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-2">
                <span className="t-mono text-[20px] font-semibold">{t.ticketNumber}</span>
                <span className="text-[14px] text-white/80 truncate flex-1">{t.serviceName}</span>
                <span className="t-mono text-[12px] text-white/60">~{t.estimatedWaitMinutes}m</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="mt-10 text-center text-[12px] text-white/40">
        {company.tagline ?? 'Powered by Omukweyo'}
      </footer>
    </div>
  );
}
