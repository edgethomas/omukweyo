import { useState } from 'react';
import { ArrowRight, RefreshCw, UserCheck, Wallet } from 'lucide-react';

const RUNNER_KEY = 'inline_runner';
const SESSION_KEY = 'omukweyo_session';

type Runner = {
  id: string;
  name: string;
  phone: string;
  city: string;
  transportMode: string;
  payoutMethod: string;
  status: string;
};

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadRunner(): Runner | null {
  const stored = readJson<Runner>(RUNNER_KEY);
  if (stored) return stored;
  const session = readJson<{ user?: { role?: string; name?: string; email?: string } }>(SESSION_KEY);
  if (session?.user?.role === 'RUNNER') {
    return {
      id: 'session',
      name: session.user.name ?? 'Runner',
      phone: '',
      city: '',
      transportMode: 'Walk',
      payoutMethod: 'Mobile money',
      status: 'APPROVED',
    };
  }
  return null;
}

export default function RunnerProfilePage() {
  const [runner, setRunner] = useState<Runner | null>(() => loadRunner());
  const [form, setForm] = useState<Runner | null>(runner);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setPending(true);
    setNotice(null);
    try {
      localStorage.setItem(RUNNER_KEY, JSON.stringify(form));
      setRunner(form);
      setNotice({ kind: 'ok', text: 'Profile saved. Admin will review the change.' });
    } catch (err: any) {
      setNotice({ kind: 'err', text: err.message });
    } finally {
      setPending(false);
    }
  };

  if (!form) {
    return (
      <div className="card p-6 max-w-2xl">
        <h2 className="text-[16px] font-semibold text-ink">Apply as a runner first</h2>
        <p className="mt-2 text-[13px] text-ink-2">Once your application is in, you can update your profile here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-2 text-[12px] text-ink-3">
        <UserCheck size={14} className="text-accent" />
        Runner profile
        <button type="button" className="ml-auto btn btn-ghost btn-sm" onClick={() => setForm(runner)}><RefreshCw size={12} /> Reset</button>
      </div>

      {notice && (
        <div className={`rounded-md px-3 py-2 text-[12px] ${notice.kind === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700'}`}>
          {notice.text}
        </div>
      )}

      <form onSubmit={save} className="card p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="label">Full name</span>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">Phone</span>
            <input className="input" required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">City</span>
            <input className="input" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">Transport mode</span>
            <select className="select" value={form.transportMode} onChange={(e) => setForm({ ...form, transportMode: e.target.value })}>
              <option>Walk</option>
              <option>Taxi</option>
              <option>Bike</option>
              <option>Own car</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Payout method</span>
            <select className="select" value={form.payoutMethod} onChange={(e) => setForm({ ...form, payoutMethod: e.target.value })}>
              <option>Mobile money</option>
              <option>Bank transfer</option>
              <option>Cash pickup</option>
            </select>
          </label>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary btn-md w-full sm:w-auto" disabled={pending}>
            <Wallet size={13} /> {pending ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
