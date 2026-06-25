import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarClock, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';

const CUSTOMER_KEY = 'omukweyo_customer';
const LEGACY_CUSTOMER_KEY = 'inline_customer';
const SESSION_KEY = 'omukweyo_session';

function syncCustomerSession(customer: any) {
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
  localStorage.setItem(LEGACY_CUSTOMER_KEY, JSON.stringify(customer));

  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const session = JSON.parse(raw);
    if (!session?.user) return;
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      ...session,
      user: {
        ...session.user,
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email ?? session.user.email,
        destination: session.user.destination ?? '/customer',
      },
    }));
    window.dispatchEvent(new Event('omukweyo:profile-updated'));
  } catch {
    // Ignore invalid demo session storage.
  }
}

export default function CustomerSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { customer } = await api.customerSignup(form);
      syncCustomerSession(customer);
      navigate('/reserve');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-x py-12">
      <div className="text-[12px] text-ink-3 mb-3">
        <Link to="/" className="hover:text-ink">Home</Link>
        <span className="mx-2 text-ink-3/40">/</span>
        Customer signup
      </div>

      <div className="grid lg:grid-cols-[1fr_420px] gap-8 items-start">
        <div className="pt-4">
          <h1 className="t-h1 text-balance max-w-3xl">Create a customer account for time-critical queue reservations.</h1>
          <p className="t-body mt-3 max-w-2xl">
            Use this when you know your window in advance, like tomorrow at 5:00 PM before a meeting.
            Omukweyo can reserve your place, watch the queue, and create your live ticket at the right time.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 mt-7 max-w-2xl">
            <div className="card p-4">
              <CalendarClock size={18} className="text-accent mb-2" />
              <h3 className="text-[13px] font-semibold text-ink">Reserve tomorrow</h3>
              <p className="text-[12px] text-ink-2 mt-1">Pick the branch, service, and target arrival window.</p>
            </div>
            <div className="card p-4">
              <ShieldCheck size={18} className="text-emerald-600 mb-2" />
              <h3 className="text-[13px] font-semibold text-ink">Pay to protect the slot</h3>
              <p className="text-[12px] text-ink-2 mt-1">Mock payment confirms intent before the smart booking engine takes over.</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          <div>
            <div className="t-eyebrow mb-1">Customer account</div>
            <h2 className="text-[18px] font-semibold text-ink">Sign up as a customer</h2>
            <p className="text-[12px] text-ink-2 mt-1">This demo uses your phone for reservation and SMS updates.</p>
          </div>

          {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>}

          <label className="block">
            <span className="label">Full name</span>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Selma Nakale"
              required
            />
          </label>
          <label className="block">
            <span className="label">Phone</span>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+264 81 555 1212"
              type="tel"
              required
            />
          </label>
          <label className="block">
            <span className="label">Email</span>
            <input
              className="input"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              type="email"
            />
          </label>

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Creating account...' : 'Continue to reservation'} <ArrowRight size={14} />
          </button>

          <p className="text-center text-[12px] text-ink-3">
            Already created one? <Link to="/reserve" className="text-accent hover:underline">Reserve a future spot</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
