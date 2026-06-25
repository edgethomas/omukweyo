import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Search, ShieldCheck, Wallet } from 'lucide-react';
import { api } from '@/lib/api';

const CUSTOMER_KEY = 'omukweyo_customer';
const LEGACY_CUSTOMER_KEY = 'inline_customer';
const SESSION_KEY = 'omukweyo_session';

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadCustomer() {
  const stored = readJson<any>(CUSTOMER_KEY) ?? readJson<any>(LEGACY_CUSTOMER_KEY);
  const session = readJson<any>(SESSION_KEY);
  const user = session?.user;
  const customer = {
    id: stored?.id ?? user?.customerId ?? user?.id,
    name: stored?.name ?? user?.name ?? '',
    phone: stored?.phone ?? user?.phone ?? '',
    email: stored?.email ?? user?.email ?? '',
  };
  return customer.id || customer.name || customer.phone ? customer : null;
}

export default function RunnerRequestPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchSource, setSearchSource] = useState<string>('LOCAL_SEED');
  const [selected, setSelected] = useState<{ name: string; city: string; source: string } | null>(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    destinationName: '',
    destinationCity: 'Windhoek',
    serviceName: 'Public-line stand-in',
    date: defaultDate(),
    time: '17:00',
    maxBudgetNad: 80,
    instructions: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const customer = useMemo(() => loadCustomer(), []);

  useEffect(() => {
    if (customer) {
      setForm((f) => ({
        ...f,
        name: f.name || customer.name,
        phone: f.phone || customer.phone,
      }));
    }
  }, [customer]);

  useEffect(() => {
    const handle = setTimeout(async () => {
      try {
        const payload = await api.searchDestinations(search);
        setSuggestions(payload.results);
        setSearchSource(payload.source);
      } catch {
        setSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [search]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError('Please confirm the safety rules before submitting.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const targetArrival = new Date(`${form.date}T${form.time}:00`).toISOString();
      const { request } = await api.runnerRequest({
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        destinationName: (selected?.name ?? form.destinationName).trim(),
        destinationCity: (selected?.city ?? form.destinationCity).trim(),
        destinationSource: selected?.source ?? 'MANUAL',
        serviceName: form.serviceName.trim(),
        targetArrivalAt: targetArrival,
        maxBudgetCents: Math.round(form.maxBudgetNad * 100),
        instructions: form.instructions.trim(),
      });
      navigate(`/runner/request/${request.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <section className="card p-5">
        <h2 className="text-[18px] font-semibold text-ink">Need a runner at a place without Omukweyo?</h2>
        <p className="text-[13px] text-ink-2 mt-1">Pick the destination, the time you need to be seen, and the maximum you will pay a verified runner.</p>
        <div className="mt-3 rounded-md border border-line bg-surface-2 p-3 text-[12px] text-ink-2 flex gap-2">
          <ShieldCheck size={14} className="text-accent mt-0.5 shrink-0" />
          Destination suggestions come from our local seed list ({searchSource}). If a <code className="text-[11px]">GOOGLE_PLACES_API_KEY</code> is configured, we will use Google Places instead.
        </div>
      </section>

      <form onSubmit={submit} className="card p-6 space-y-4">
        <h3 className="text-[14px] font-semibold text-ink">Where should the runner go?</h3>
        <div className="relative">
          <Search size={13} className="text-ink-3 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            className="input pl-8"
            placeholder="Search bank, government, clinic, or city"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {suggestions.length > 0 && (
          <div className="rounded-md border border-line bg-surface-2 divide-y divide-line">
            {suggestions.slice(0, 8).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelected({ name: item.name, city: item.city, source: item.source });
                  setSearch(item.name);
                  setForm((f) => ({ ...f, destinationName: item.name, destinationCity: item.city }));
                }}
                className="flex w-full min-w-0 items-center gap-2 px-3 py-2 text-left text-[12px] hover:bg-surface"
              >
                <MapPin size={12} className="text-accent" />
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{item.name}</span>
                <span className="shrink-0 text-ink-3">{item.city}</span>
                <span className="ml-auto hidden shrink-0 text-[10px] uppercase tracking-wider text-ink-3 sm:inline">{item.source}</span>
              </button>
            ))}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="label">Destination name</span>
            <input className="input" required value={form.destinationName} onChange={(e) => { setForm((f) => ({ ...f, destinationName: e.target.value })); setSelected(null); }} placeholder="Bank Windhoek Main Branch" />
          </label>
          <label className="block">
            <span className="label">City</span>
            <input className="input" required value={form.destinationCity} onChange={(e) => setForm((f) => ({ ...f, destinationCity: e.target.value }))} />
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Service / reason</span>
            <input className="input" required value={form.serviceName} onChange={(e) => setForm((f) => ({ ...f, serviceName: e.target.value }))} />
          </label>
        </div>

        <h3 className="text-[14px] font-semibold text-ink pt-2">When do you need to be seen?</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="label">Date</span>
            <input className="input" type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </label>
          <label className="block">
            <span className="label">Time</span>
            <input className="input" type="time" required value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
          </label>
        </div>

        <h3 className="text-[14px] font-semibold text-ink pt-2 inline-flex items-center gap-2"><Wallet size={14} /> Budget</h3>
        <label className="block max-w-xs">
          <span className="label">Maximum budget (NAD)</span>
          <input className="input" type="number" min={20} max={2000} required value={form.maxBudgetNad} onChange={(e) => setForm((f) => ({ ...f, maxBudgetNad: Number(e.target.value) }))} />
        </label>

        <h3 className="text-[14px] font-semibold text-ink pt-2">Your contact</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="label">Name</span>
            <input className="input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label className="block">
            <span className="label">Phone</span>
            <input className="input" required type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </label>
        </div>

        <label className="block">
          <span className="label">Notes for the runner</span>
          <textarea className="input min-h-24" required value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} placeholder="What you need done, who the runner is meeting, anything to bring." />
        </label>

        <label className="flex items-start gap-2 text-[12px] text-ink-2">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 accent-[var(--accent)]" />
          <span>
            I confirm this is a normal public line. I understand the runner will not cut in line, impersonate, or use fake documents. The runner is only holding my spot until I arrive.
          </span>
        </label>

        {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>}

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary btn-md w-full sm:w-auto" disabled={pending || !agreed}>
            {pending ? 'Submitting...' : 'Submit request'} <ArrowRight size={13} />
          </button>
        </div>
      </form>

      {!customer && (
        <div className="card p-5 text-[13px] text-ink-2">
          New here? <Link to="/customer/signup" className="text-accent hover:underline">Create a customer account</Link> to track your requests.
        </div>
      )}
    </div>
  );
}
