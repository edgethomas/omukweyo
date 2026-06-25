import { useEffect, useState } from 'react';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import DashboardLayout from './DashboardLayout';

type Company = {
  id: string;
  name: string;
  industry: string;
  websiteUrl?: string;
};

export default function SettingsPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<Company | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    api.dashboard().then((d: any) => {
      setCompany(d.company);
      setForm(d.company);
    });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setPending(true);
    setNotice(null);
    try {
      const { company: updated } = await api.businessProfile({
        name: form.name,
        industry: form.industry,
        websiteUrl: form.websiteUrl,
      });
      setCompany(updated);
      setForm(updated);
      setNotice({ kind: 'ok', text: 'Business details saved.' });
    } catch (err: any) {
      setNotice({ kind: 'err', text: err.message });
    } finally {
      setPending(false);
    }
  };

  if (!form) return <DashboardLayout><div className="card p-6 h-64 animate-pulse" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Business settings</h2>
            <p className="text-[12px] text-ink-3 mt-0.5">Queue rules, security, and business details</p>
          </div>
        </div>

        {notice && (
          <div className={cn('rounded-md px-3 py-2 text-[12px]', notice.kind === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700')}>
            {notice.text}
          </div>
        )}

        <form onSubmit={save} className="card p-6 space-y-4">
          <h3 className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><SettingsIcon size={14} /> Business details</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block sm:col-span-2">
              <span className="label">Company name</span>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">Industry</span>
              <input className="input" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">Website</span>
              <input className="input" value={form.websiteUrl ?? ''} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} />
            </label>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary btn-md" disabled={pending}><Save size={13} /> {pending ? 'Saving...' : 'Save'}</button>
          </div>
        </form>

        <section className="card p-5">
          <h3 className="text-[14px] font-semibold text-ink">Queue rules</h3>
          <p className="text-[12px] text-ink-3 mt-1">Default rule set. Per-branch overrides come in Phase 5.</p>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="label">Default no-show policy</span>
              <select className="select" defaultValue="keep">
                <option value="keep">Keep ticket and resend SMS</option>
                <option value="cancel">Auto-cancel after 5 minutes</option>
                <option value="warn">Warn only</option>
              </select>
            </label>
            <label className="block">
              <span className="label">Transfer across branches</span>
              <select className="select" defaultValue="manager">
                <option value="anyone">Anyone at the counter</option>
                <option value="manager">Manager approval</option>
                <option value="owner">Owner only</option>
              </select>
            </label>
            <label className="block">
              <span className="label">SMS auto top-up</span>
              <select className="select" defaultValue="200">
                <option value="off">Off</option>
                <option value="200">On at 200 credits</option>
                <option value="500">On at 500 credits</option>
              </select>
            </label>
            <label className="block">
              <span className="label">Session timeout (min)</span>
              <input className="input" type="number" min={15} max={720} defaultValue={60} />
            </label>
          </div>
        </section>

        <section className="card p-5">
          <h3 className="text-[14px] font-semibold text-ink">Security</h3>
          <p className="text-[12px] text-ink-3 mt-1">Built in Phase 5 with real 2FA. For now, the session expires after 12 hours.</p>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <div className="rounded-md border border-line bg-surface-2 p-3 text-[12px] text-ink-2">2FA <span className="chip-neutral ml-2">planned</span></div>
            <div className="rounded-md border border-line bg-surface-2 p-3 text-[12px] text-ink-2">Allowed IPs <span className="chip-neutral ml-2">planned</span></div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
