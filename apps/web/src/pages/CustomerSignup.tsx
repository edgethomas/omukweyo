import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

const CUSTOMER_KEY = 'omukweyo_customer';
const LEGACY_CUSTOMER_KEY = 'inline_customer';
const SESSION_KEY = 'omukweyo_session';

function syncCustomerSession(customer: any, session?: any) {
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
  localStorage.setItem(LEGACY_CUSTOMER_KEY, JSON.stringify(customer));

  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.dispatchEvent(new Event('omukweyo:profile-updated'));
    return;
  }

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
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { customer, session } = await api.customerSignup({ ...form, password: form.password || undefined });
      syncCustomerSession(customer, session);
      if (session) navigate('/customer');
      else navigate('/reserve');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-x py-10 sm:py-14">
      <div className="mx-auto max-w-md">
        <div className="mb-5 text-center">
          <h1 className="t-h1">Create customer account</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
            Save your profile for tickets, reservations, receipts, and SMS updates.
          </p>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Sign up as a customer</h2>
            <p className="text-[12px] text-ink-2 mt-1">Create a login for tickets, reservations, and SMS updates.</p>
          </div>

          {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>}

          <label className="block">
            <span className="label">Full name</span>
            <input
              className="input"
              name="name"
              autoComplete="name"
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
              name="phone"
              autoComplete="tel"
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
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              type="email"
              required
            />
          </label>
          <label className="block">
            <span className="label">Password</span>
            <input
              className="input"
              name="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="At least 6 characters"
              type="password"
              minLength={6}
              required
            />
          </label>

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Creating account...' : 'Create account'} <ArrowRight size={14} />
          </button>

          <p className="text-center text-[12px] text-ink-3">
            Already created one? <Link to="/login" className="text-accent hover:underline">Log in</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
