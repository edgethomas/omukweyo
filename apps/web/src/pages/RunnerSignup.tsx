import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, MapPin, Wallet } from 'lucide-react';
import { api } from '@/lib/api';

const RUNNER_KEY = 'inline_runner';

export default function RunnerSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
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
      const { application } = await api.runnerApply(form);
      localStorage.setItem(RUNNER_KEY, JSON.stringify(application));
      navigate('/runner/work');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-x py-12">
      <div className="grid lg:grid-cols-[1fr_420px] gap-8 items-start">
        <div className="pt-4">
          <div className="t-eyebrow mb-2">Verified queue assistant</div>
          <h1 className="t-h1 text-balance max-w-3xl">Apply to earn by holding allowed public-line spots.</h1>
          <p className="t-body mt-3 max-w-2xl">
            Runners help customers in places where Omukweyo is not installed yet. The product keeps proof, updates, payout, and support visible.
          </p>

          <div className="grid sm:grid-cols-3 gap-px bg-line border border-line rounded-lg overflow-hidden mt-7 max-w-3xl">
            {[
              [<BadgeCheck size={16} />, 'Verified identity', 'Phone, profile, ratings, and support review.'],
              [<MapPin size={16} />, 'Location proof', 'Check in at the correct public place before taking the job.'],
              [<Wallet size={16} />, 'Escrow payout', 'Customer payment is held until the job is complete.'],
            ].map(([icon, title, body]) => (
              <div key={String(title)} className="bg-surface p-4">
                <div className="text-accent mb-2">{icon}</div>
                <div className="text-[13px] font-semibold text-ink">{title}</div>
                <p className="text-[12px] text-ink-2 mt-1">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          <div>
            <div className="t-eyebrow mb-1">Runner application</div>
            <h2 className="text-[18px] font-semibold text-ink">Create runner profile</h2>
            <p className="text-[12px] text-ink-2 mt-1">This demo creates a pending profile and opens the workbench.</p>
          </div>

          {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>}

          <label className="block">
            <span className="label">Full name</span>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </label>
          <label className="block">
            <span className="label">Phone</span>
            <input className="input" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
          </label>
          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-2 gap-3">
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
              <input className="input" value={form.canStartAt} onChange={(e) => setForm((f) => ({ ...f, canStartAt: e.target.value }))} required />
            </label>
          </div>
          <label className="block">
            <span className="label">Notes</span>
            <textarea
              className="input min-h-20 py-2"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Areas you can cover, languages, availability"
            />
          </label>

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Submitting...' : 'Submit and open workbench'} <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </section>
  );
}
