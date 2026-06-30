import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Phone, Plus, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, relativeTime } from '@/lib/utils';
import ConfirmDialog from '@/components/ConfirmDialog';
import DashboardLayout from './DashboardLayout';

type Branch = {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  openingHours: string;
  isOpen: boolean;
  liveWaiting: number;
  avgWaitMin: number;
  servedToday: number;
};

export default function BranchesPage() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', address: '', city: 'Windhoek', phone: '', openingHours: '08:00 - 17:00', avgWaitMin: 8 });
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const load = () => {
    setLoading(true);
    api.businessWorkspace()
      .then((payload: any) => setBranches(payload.branches ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setPending(true);
    setNotice(null);
    try {
      await api.createBranch({ ...form, name: form.name.trim() });
      setNotice({ kind: 'ok', text: `Branch ${form.name} created.` });
      setForm({ name: '', address: '', city: form.city, phone: '', openingHours: form.openingHours, avgWaitMin: form.avgWaitMin });
      load();
    } catch (err: any) {
      setNotice({ kind: 'err', text: err.message });
    } finally {
      setPending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Branches</h2>
            <p className="text-[12px] text-ink-3 mt-0.5">{branches.length} branches reporting live data</p>
          </div>
          <button type="button" onClick={load} className="btn btn-ghost btn-sm"><RefreshCw size={13} /> Refresh</button>
        </div>

        {notice && (
          <div className={cn('rounded-md px-3 py-2 text-[12px]', notice.kind === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700')}>
            {notice.text}
          </div>
        )}

        <section className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-ink">All branches</h3>
            <span className="t-eyebrow text-[10px]">{branches.length} listed</span>
          </div>
          {loading ? (
            <div className="p-5 text-[12px] text-ink-3">Loading branches...</div>
          ) : error ? (
            <div className="p-5 text-[12px] text-red-700">{error}</div>
          ) : branches.length === 0 ? (
            <div className="p-8 text-center text-[12px] text-ink-3">No branches yet. Add the first one below.</div>
          ) : (
            <div className="divide-y divide-line">
              {branches.map((branch) => (
                <div key={branch.id} className="grid md:grid-cols-[1fr_220px_120px] gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-accent" />
                      <h4 className="text-[13px] font-semibold text-ink truncate">{branch.name}</h4>
                      <span className={branch.isOpen ? 'chip-open' : 'chip-done'}>{branch.isOpen ? 'OPEN' : 'CLOSED'}</span>
                    </div>
                    <p className="text-[11px] text-ink-2 mt-1 inline-flex items-center gap-1.5"><MapPin size={10} /> {branch.address}, {branch.city}</p>
                  </div>
                  <div className="text-[11px] text-ink-2">
                    <p className="inline-flex items-center gap-1.5"><Phone size={10} /> {branch.phone || 'No phone'}</p>
                    <p className="mt-1 font-mono">{branch.openingHours}</p>
                  </div>
                  <div className="text-right text-[11px] text-ink-3">
                    <p className="t-mono text-[15px] text-ink font-semibold">{branch.liveWaiting}</p>
                    <p>waiting</p>
                    <p className="mt-1">~{branch.avgWaitMin}m</p>
                    <p>{branch.servedToday} served</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card p-6">
          <h3 className="text-[14px] font-semibold text-ink">Add a new branch</h3>
          <p className="text-[12px] text-ink-3 mt-1">Each branch has its own queue, opening hours, and SMS log.</p>
          <form onSubmit={submit} className="mt-4 grid sm:grid-cols-2 gap-3">
            <label className="block sm:col-span-2">
              <span className="label">Branch name</span>
              <input className="input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Bank Windhoek - Klein Windhoek" />
            </label>
            <label className="block sm:col-span-2">
              <span className="label">Address</span>
              <input className="input" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Street and number" />
            </label>
            <label className="block">
              <span className="label">City</span>
              <input className="input" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </label>
            <label className="block">
              <span className="label">Phone</span>
              <input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+264 61 ..." />
            </label>
            <label className="block">
              <span className="label">Opening hours</span>
              <input className="input" value={form.openingHours} onChange={(e) => setForm((f) => ({ ...f, openingHours: e.target.value }))} />
            </label>
            <label className="block">
              <span className="label">Average wait (min)</span>
              <input className="input" type="number" min={1} max={120} value={form.avgWaitMin} onChange={(e) => setForm((f) => ({ ...f, avgWaitMin: Number(e.target.value) }))} />
            </label>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className="btn btn-primary btn-md" disabled={pending}>
                <Plus size={13} /> {pending ? 'Creating...' : 'Create branch'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}
