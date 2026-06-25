import { useEffect, useState } from 'react';
import { Hash, Plus, RefreshCw, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import DashboardLayout from './DashboardLayout';

type Service = { id: string; name: string; description: string; branchId?: string; averageServiceMinutes: number; icon: string };
type Branch = { id: string; name: string };

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', branchId: '', averageServiceMinutes: 8 });
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const load = () => {
    setLoading(true);
    api.dashboard()
      .then((payload: any) => {
        setServices(payload.services ?? []);
        setBranches(payload.branches ?? []);
      })
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
      await api.createService({
        name: form.name.trim(),
        description: form.description.trim() || `${form.name} queue`,
        branchId: form.branchId || undefined,
        averageServiceMinutes: form.averageServiceMinutes,
      });
      setNotice({ kind: 'ok', text: `Service ${form.name} created.` });
      setForm({ name: '', description: '', branchId: form.branchId, averageServiceMinutes: form.averageServiceMinutes });
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
            <h2 className="text-[18px] font-semibold text-ink">Services</h2>
            <p className="text-[12px] text-ink-3 mt-0.5">{services.length} services offered to customers</p>
          </div>
          <button type="button" onClick={load} className="btn btn-ghost btn-sm"><RefreshCw size={13} /> Refresh</button>
        </div>

        {notice && (
          <div className={cn('rounded-md px-3 py-2 text-[12px]', notice.kind === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700')}>
            {notice.text}
          </div>
        )}

        <section className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <h3 className="text-[14px] font-semibold text-ink">All services</h3>
          </div>
          {loading ? (
            <div className="p-5 text-[12px] text-ink-3">Loading services...</div>
          ) : error ? (
            <div className="p-5 text-[12px] text-red-700">{error}</div>
          ) : services.length === 0 ? (
            <div className="p-8 text-center text-[12px] text-ink-3">No services yet. Add the first one below.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-px bg-line">
              {services.map((service) => (
                <div key={service.id} className="bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="text-accent" />
                        <h4 className="text-[13px] font-semibold text-ink">{service.name}</h4>
                      </div>
                      <p className="text-[11px] text-ink-2 mt-1">{service.description}</p>
                      {service.branchId && (
                        <p className="text-[10px] text-ink-3 mt-1.5 inline-flex items-center gap-1">
                          <Building2 size={10} /> {branches.find((b) => b.id === service.branchId)?.name ?? 'Branch-specific'}
                        </p>
                      )}
                    </div>
                    <span className="rounded-md border border-line bg-surface-2 px-2 py-1 font-mono text-[11px] text-ink-2">~{service.averageServiceMinutes}m</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card p-6">
          <h3 className="text-[14px] font-semibold text-ink">Add a service</h3>
          <p className="text-[12px] text-ink-3 mt-1">A service is a queue the customer can join (Account opening, Doctor visit, etc.).</p>
          <form onSubmit={submit} className="mt-4 grid sm:grid-cols-2 gap-3">
            <label className="block sm:col-span-2">
              <span className="label">Service name</span>
              <input className="input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Account opening" />
            </label>
            <label className="block sm:col-span-2">
              <span className="label">Description</span>
              <input className="input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional, helps customers pick the right queue" />
            </label>
            <label className="block">
              <span className="label">Branch (optional)</span>
              <select className="select" value={form.branchId} onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}>
                <option value="">All branches</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label">Average service time (min)</span>
              <input className="input" type="number" min={1} max={120} value={form.averageServiceMinutes} onChange={(e) => setForm((f) => ({ ...f, averageServiceMinutes: Number(e.target.value) }))} />
            </label>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className="btn btn-primary btn-md" disabled={pending}>
                <Plus size={13} /> {pending ? 'Creating...' : 'Create service'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}
