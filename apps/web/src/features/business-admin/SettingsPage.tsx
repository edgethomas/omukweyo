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
  const [form, setForm] = useState<Company | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    api.companyProfile().then((d: any) => {
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
      setForm(updated);
      setNotice({ kind: 'ok', text: 'Business details saved.' });
    } catch (err: any) {
      setNotice({ kind: 'err', text: err.message });
    } finally {
      setPending(false);
    }
  };

  if (!form) return <DashboardLayout><SettingsSkeleton /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Business settings</h2>
            <p className="text-[12px] text-ink-3 mt-0.5">Company name, industry, and website</p>
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
      </div>
    </DashboardLayout>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading business settings">
      <div className="space-y-2">
        <div className="h-5 w-40 rounded bg-surface-2 animate-pulse" />
        <div className="h-3 w-56 max-w-[70vw] rounded bg-surface-2 animate-pulse" />
      </div>
      <div className="card p-6 space-y-4">
        <div className="h-4 w-32 rounded bg-surface-2 animate-pulse" />
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="h-10 rounded-md bg-surface-2 animate-pulse sm:col-span-2" />
          <div className="h-10 rounded-md bg-surface-2 animate-pulse" />
          <div className="h-10 rounded-md bg-surface-2 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
