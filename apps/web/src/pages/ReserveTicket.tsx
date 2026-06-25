import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Banknote, Clock, HelpCircle, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const CUSTOMER_KEY = 'omukweyo_customer';
const LEGACY_CUSTOMER_KEY = 'inline_customer';
const SESSION_KEY = 'omukweyo_session';

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function readLocalJson(key: string) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadCustomer() {
  const savedCustomer = readLocalJson(CUSTOMER_KEY) ?? readLocalJson(LEGACY_CUSTOMER_KEY);
  const session = readLocalJson(SESSION_KEY);
  const sessionUser = session?.user;
  const customer = {
    id: savedCustomer?.id ?? sessionUser?.customerId ?? sessionUser?.id,
    name: savedCustomer?.name ?? sessionUser?.name ?? '',
    phone: savedCustomer?.phone ?? sessionUser?.phone ?? '',
    email: savedCustomer?.email ?? sessionUser?.email ?? '',
    destination: sessionUser?.destination,
  };

  return customer.id || customer.name || customer.phone || customer.email ? customer : null;
}

export default function ReserveTicket() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [customer] = useState<any>(() => loadCustomer());
  const [form, setForm] = useState({
    name: customer?.name ?? '',
    phone: customer?.phone ?? '',
    email: customer?.email ?? '',
    serviceId: '',
    date: defaultDate(),
    time: '17:00',
    arrivalWindowMinutes: 30,
    paymentMethod: 'MOCK_CARD' as 'MOCK_CARD' | 'MOCK_EFT' | 'MOCK_WALLET',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const requestedCompany = searchParams.get('company');
    const requestedBranch = searchParams.get('branch');
    const loadCompany = async () => {
      const slug = requestedCompany || (await api.businesses('')).businesses[0]?.slug;
      if (!slug) throw new Error('No business is available for reservations yet.');
      const payload = await api.company(slug);
      const branch = requestedBranch
        ? payload.branches.find((item: any) => item.slug === requestedBranch) ?? payload.branches[0]
        : payload.branches[0];
      const services = payload.services.filter((service: any) => !service.branchId || service.branchId === branch?.id);
      setData({ ...payload, branches: branch ? [branch, ...payload.branches.filter((item: any) => item.id !== branch.id)] : payload.branches, services });
      setForm((f) => ({ ...f, serviceId: services[0]?.id ?? '' }));
    };
    loadCompany().catch((err) => setError(err.message));
  }, [searchParams]);

  const branch = data?.branches?.[0];
  const selectedService = useMemo(
    () => data?.services?.find((service: any) => service.id === form.serviceId),
    [data, form.serviceId],
  );

  const targetArrivalAt = useMemo(() => {
    const localDate = new Date(`${form.date}T${form.time}:00`);
    return Number.isNaN(localDate.getTime()) ? '' : localDate.toISOString();
  }, [form.date, form.time]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch || !form.serviceId || !targetArrivalAt) return;
    setLoading(true);
    setError(null);
    try {
      const { reservation } = await api.createReservation({
        customerId: customer?.id,
        customerName: form.name,
        customerPhone: form.phone,
        customerEmail: form.email,
        branchId: branch.id,
        serviceId: form.serviceId,
        targetArrivalAt,
        arrivalWindowMinutes: Number(form.arrivalWindowMinutes),
        paymentMethod: form.paymentMethod,
      });
      navigate(`/reservation/${reservation.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!data && error) {
    return (
      <section className="container-x py-12">
        <div className="card p-6 max-w-2xl">
          <h1 className="t-h2">Reservation is not available</h1>
          <p className="t-body mt-2 text-ink-2">{error}</p>
          <Link to="/businesses" className="btn btn-outline btn-md mt-4">Find a business</Link>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="container-x py-12">
        <div className="card h-80 animate-pulse" />
      </section>
    );
  }

  return (
    <section className="container-x py-10 max-w-2xl mx-auto">
      <h1 className="t-h1 text-balance">Reserve a future queue spot.</h1>
      <p className="t-body mt-2 max-w-xl">
        Pick when you need to arrive at {data?.company?.name ?? 'the business'}. We will create your live ticket before the window opens.
      </p>

      <form onSubmit={submit} className="card p-6 space-y-4 mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[18px] font-semibold text-ink">Book {data?.company?.name ?? 'your spot'}</h2>
          <button type="button" onClick={() => setShowHelp((current) => !current)} className="btn btn-ghost btn-sm">
            <HelpCircle size={13} /> How it works
          </button>
        </div>

        {showHelp && (
          <div className="rounded-md border border-line bg-surface-2 p-3 text-[12px] text-ink-2 space-y-1.5">
            <p className="font-medium text-ink">Smart booking in 3 quick steps</p>
            <p>1. Pick a date, time, and service. The fee protects a small arrival window.</p>
            <p>2. Omukweyo watches the live queue and creates your ticket before your window.</p>
            <p>3. You get the ticket by SMS. Arrive close to the start of your window.</p>
          </div>
        )}

        {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>}

        <label className="block">
          <span className="label">Service</span>
          <select
            className="select"
            value={form.serviceId}
            onChange={(e) => setForm((f) => ({ ...f, serviceId: e.target.value }))}
            required
          >
            {(data?.services ?? []).map((service: any) => (
              <option key={service.id} value={service.id}>{service.name}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">Date</span>
            <input className="input" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
          </label>
          <label className="block">
            <span className="label">Target time</span>
            <input className="input" type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} required />
          </label>
        </div>

        <label className="block">
          <span className="label">Arrival window</span>
          <select
            className="select"
            value={form.arrivalWindowMinutes}
            onChange={(e) => setForm((f) => ({ ...f, arrivalWindowMinutes: Number(e.target.value) }))}
          >
            <option value={20}>20 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
        </label>

        <div className="grid grid-cols-1 gap-2">
          {[
            ['MOCK_CARD', 'Pay by card'],
            ['MOCK_EFT', 'Reserve with EFT'],
            ['MOCK_WALLET', 'Use Omukweyo wallet'],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              onClick={() => setForm((f) => ({ ...f, paymentMethod: value as any }))}
              className={cn(
                'h-10 px-3 border border-line text-left text-[13px] font-medium transition-colors',
                form.paymentMethod === value ? 'bg-accent-soft border-accent text-ink' : 'bg-surface hover:bg-surface-2 text-ink-2',
              )}
            >
              <Banknote size={14} className="inline mr-2" />
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">Name</span>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </label>
          <label className="block">
            <span className="label">Phone</span>
            <input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
          </label>
        </div>

        {selectedService && branch && (
          <div className="rounded-md border border-line bg-surface-2 p-3 text-[12px] text-ink-2 flex items-center gap-2">
            <Clock size={13} className="text-accent" />
            <span>
              {selectedService.name} at {branch.name} around {form.time}. <Sparkles size={11} className="inline text-accent" /> Smart join is calculated when you submit.
            </span>
          </div>
        )}

        <div className="rounded-md border border-line bg-surface-2 px-3 py-2 text-[11px] text-ink-3 flex items-center justify-between">
          <span>Reservation fee</span>
          <span className="t-mono text-[14px] font-semibold text-ink">N$35</span>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
          {loading ? 'Reserving...' : 'Pay N$35 and reserve'} <ArrowRight size={15} />
        </button>

        {!customer && (
          <p className="text-center text-[12px] text-ink-3">
            New customer? <Link to="/customer/signup" className="text-accent hover:underline">Sign up first</Link>
          </p>
        )}
      </form>
    </section>
  );
}
