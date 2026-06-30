import { useEffect, useState } from 'react';
import { Plus, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { api } from '@/lib/api';
import DashboardLayout from './DashboardLayout';

type StaffRow = { id: string; name: string; role: string; counter: string; branchId?: string; servedToday: number; rating: number };
type Branch = { id: string; name: string };

export default function CountersPage() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.businessWorkspace()
      .then((d: any) => {
        setStaff(d.staff ?? []);
        setBranches(d.branches ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const counterMap = new Map<string, StaffRow[]>();
  for (const member of staff) {
    const key = member.counter || 'Counter';
    if (!counterMap.has(key)) counterMap.set(key, []);
    counterMap.get(key)!.push(member);
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Counters</h2>
            <p className="text-[12px] text-ink-3 mt-0.5">Counter labels are managed per staff member - assign them in Staff</p>
          </div>
          <button type="button" onClick={() => api.businessWorkspace().then((d: any) => { setStaff(d.staff ?? []); setBranches(d.branches ?? []); })} className="btn btn-ghost btn-sm"><RefreshCw size={13} /> Refresh</button>
        </div>

        {loading ? (
          <div className="card p-5 text-[12px] text-ink-3">Loading counters...</div>
        ) : counterMap.size === 0 ? (
          <div className="card p-8 text-center text-[12px] text-ink-3">No counters yet. Add staff with a counter name on the Staff page.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from(counterMap.entries()).map(([counter, members]) => (
              <div key={counter} className="card p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-accent" />
                  <h3 className="text-[14px] font-semibold text-ink">{counter}</h3>
                </div>
                <div className="mt-2 space-y-1.5">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between text-[12px]">
                      <span className="inline-flex items-center gap-1.5"><Users size={11} className="text-ink-3" /> {member.name}</span>
                      <span className="font-mono text-[10px] text-ink-3">
                        {member.branchId ? branches.find((b) => b.id === member.branchId)?.name ?? 'All branches' : 'All branches'}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-ink-3 mt-3">
                  {members.length} staff - served {members.reduce((s, m) => s + m.servedToday, 0)} today
                </p>
              </div>
            ))}
            <div className="card p-4 border-dashed flex flex-col items-center justify-center text-center text-[12px] text-ink-3">
              <Plus size={18} className="text-ink-3" />
              <p className="mt-2">Counters are created automatically when you invite staff with a counter name.</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
