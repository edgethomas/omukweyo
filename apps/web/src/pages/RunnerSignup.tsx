import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

const RUNNER_KEY = 'inline_runner';
const SESSION_KEY = 'omukweyo_session';

export default function RunnerSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: 'Windhoek',
    transportMode: 'taxi',
    payoutMethod: 'wallet',
    canStartAt: 'Tomorrow morning',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { application, session } = await api.runnerApply(form);
      localStorage.setItem(RUNNER_KEY, JSON.stringify(application));
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      navigate('/runner/work');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-x py-8 sm:py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-5 text-center">
          <div className="t-eyebrow mb-2">Runner application</div>
          <h1 className="t-h1">Create runner profile</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
            Add the details needed for review and payouts.
          </p>
        </div>

        <form onSubmit={submit} className="card p-4 space-y-4 sm:p-6">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Create runner profile</h2>
            <p className="text-[12px] text-ink-2 mt-1">Submit your profile and open the workbench.</p>
          </div>

          {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>}

          <label className="block">
            <span className="label">Full name</span>
            <input className="input" name="name" autoComplete="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </label>
          <label className="block">
            <span className="label">Email</span>
            <input className="input" name="email" autoComplete="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          </label>
          <label className="block">
            <span className="label">Password</span>
            <input className="input" name="password" autoComplete="new-password" type="password" minLength={6} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
          </label>
          <label className="block">
            <span className="label">Phone</span>
            <input className="input" name="phone" autoComplete="tel" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">City</span>
              <select className="select" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}>
                <option>Windhoek</option>
                <option>Swakopmund</option>
                <option>Ongwediva</option>
              </select>
            </label>
            <label className="block">
              <span className="label">Transport</span>
              <select className="select" value={form.transportMode} onChange={(e) => setForm((f) => ({ ...f, transportMode: e.target.value }))}>
                <option value="taxi">Taxi</option>
                <option value="walk">Walk</option>
                <option value="car">Car</option>
                <option value="bus">Bus</option>
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">Payout</span>
              <select className="select" value={form.payoutMethod} onChange={(e) => setForm((f) => ({ ...f, payoutMethod: e.target.value }))}>
                <option value="wallet">Omukweyo wallet</option>
                <option value="eft">Bank EFT</option>
                <option value="mobile">Mobile money</option>
              </select>
            </label>
            <label className="block">
              <span className="label">Can start</span>
              <input className="input" name="canStartAt" value={form.canStartAt} onChange={(e) => setForm((f) => ({ ...f, canStartAt: e.target.value }))} required />
            </label>
          </div>
          <label className="block">
            <span className="label">Notes</span>
            <textarea
              className="input min-h-20 py-2"
              name="notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Areas you can cover, languages, availability"
            />
          </label>

          <button type="submit" disabled={loading} className="btn btn-primary btn-md w-full">
            {loading ? 'Submitting...' : 'Submit and open workbench'} <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </section>
  );
}
