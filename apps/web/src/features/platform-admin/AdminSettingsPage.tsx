import { useState } from 'react';
import { Save, Settings as SettingsIcon, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type FeatureFlag = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
};

const FLAGS: FeatureFlag[] = [
  { key: 'GOOGLE_PLACES', label: 'Google Places destination search', description: 'Use Google Places to suggest places that are not yet on Omukweyo.', enabled: false },
  { key: 'REAL_SMS', label: 'Real SMS provider', description: 'Send through Twilio or Africa\'s Talking when keys are present.', enabled: false },
  { key: 'REAL_PAYMENTS', label: 'Real payment provider', description: 'Charge through DPO Pay or PayToday when keys are present.', enabled: false },
  { key: 'RUNNER_AUTO_DISPATCH', label: 'Auto-dispatch runner', description: 'Match runner jobs to nearby runners automatically.', enabled: false },
  { key: 'MAINTENANCE', label: 'Maintenance mode', description: 'Show a maintenance page to all non-admin users.', enabled: false },
];

export default function AdminSettingsPage() {
  const [flags, setFlags] = useState(FLAGS);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const toggle = (key: string) => setFlags((current) => current.map((f) => f.key === key ? { ...f, enabled: !f.enabled } : f));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setTimeout(() => {
      setPending(false);
      setNotice({ kind: 'ok', text: 'Platform settings saved locally for this workspace.' });
    }, 500);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[16px] sm:text-[18px] font-semibold text-ink">Platform settings</h2>
        <p className="text-[11px] sm:text-[12px] text-ink-3 mt-0.5">Plans, integrations, and feature flags</p>
      </div>

      {notice && (
        <div className={cn('rounded-md px-3 py-2 text-[12px]', notice.kind === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700')}>
          {notice.text}
        </div>
      )}

      <form onSubmit={save} className="space-y-5">
        <section className="card p-4 sm:p-5">
          <h3 className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><SettingsIcon size={14} /> Plans</h3>
          <p className="text-[12px] text-ink-3 mt-1">Adjust the trial length and default plan prices for the workspace.</p>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="label">Free trial (days)</span>
              <input className="input" type="number" defaultValue={14} min={0} max={60} />
            </label>
            <label className="block">
              <span className="label">Default plan</span>
              <select className="select" defaultValue="FREE">
                <option value="FREE">Free</option>
                <option value="STARTER">Starter</option>
                <option value="BUSINESS">Business</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </label>
            <label className="block">
              <span className="label">Starter (NAD/mo)</span>
              <input className="input" type="number" defaultValue={399} min={0} />
            </label>
            <label className="block">
              <span className="label">Business (NAD/mo)</span>
              <input className="input" type="number" defaultValue={999} min={0} />
            </label>
          </div>
        </section>

        <section className="card p-4 sm:p-5">
          <h3 className="text-[14px] font-semibold text-ink">Feature flags</h3>
          <p className="text-[12px] text-ink-3 mt-1">Toggle integrations on or off per environment.</p>
          <div className="mt-3 space-y-2">
            {flags.map((flag) => (
              <div key={flag.key} className="flex items-start gap-3 rounded-md border border-line bg-surface p-3">
                <button type="button" onClick={() => toggle(flag.key)} className="mt-0.5 text-accent">
                  {flag.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} className="text-ink-3" />}
                </button>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-ink">{flag.label}</div>
                  <p className="text-[12px] text-ink-2 mt-0.5">{flag.description}</p>
                  <p className="text-[10px] font-mono text-ink-3 mt-1">{flag.key}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary btn-md" disabled={pending}><Save size={13} /> {pending ? 'Saving...' : 'Save platform settings'}</button>
        </div>
      </form>
    </div>
  );
}
