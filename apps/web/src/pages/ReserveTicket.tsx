import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Banknote, Clock, Sparkles } from 'lucide-react';
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

  return (
    <section className="container-x py-12">
      <div className="text-[12px] text-ink-3 mb-3">
        <Link to={customer?.destination ?? '/'} className="hover:text-ink">Home</Link>
        <span className="mx-2 text-ink-3/40">/</span>
        Reserve future spot
      </div>

      <div className="grid lg:grid-cols-[1fr_420px] gap-8 items-start">
        <div>
          <h1 className="t-h1 text-balance max-w-3xl">Reserve a future queue spot for a tight arrival window.</h1>
          <p className="t-body mt-3 max-w-2xl">
            Choose when you need to arrive at {data?.company?.name ?? 'a business'}. Omukweyo calculates a smart booking time and creates your live ticket before your window is lost.
          </p>

          <div className="mt-7 card p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              <h2 className="text-[14px] font-semibold text-ink">How smart booking works</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-px bg-line border border-line mt-4">
              {[
                ['1', 'You pick 5:00 PM', 'Set a date, target time, and service.'],
                ['2', 'Omukweyo watches demand', 'The engine uses live queue length and service speed.'],
                ['3', 'Ticket is created early', 'Your live ticket appears before your arrival window.'],
              ].map(([n, title, body]) => (
                <div key={n} className="bg-surface p-4">
                  <div className="t-mono text-ink text-lg">{n}</div>
                  <div className="text-[13px] font-semibold text-ink mt-1">{title}</div>
                  <div className="text-[12px] text-ink-2 mt-1">{body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          <div>
            <div className="t-eyebrow mb-1">Paid reservation</div>
            <h2 className="text-[18px] font-semibold text-ink">Book tomorrow's slot</h2>
            <p className="text-[12px] text-ink-2 mt-1">{data?.company?.name ?? 'Business'} · Demo fee: <span className="font-semibold text-ink">N$35</span>. Payment is recorded in MySQL as mock paid.</p>
          </div>

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

          <div className="rounded-md border border-line bg-surface-2 p-3 text-[12px] text-ink-2">
            <div className="flex items-center gap-1.5 font-medium text-ink">
              <Clock size={13} />
              Smart estimate
            </div>
            <div className="mt-1">
              {selectedService ? `${selectedService.name} at ${branch?.name ?? 'selected branch'} around ${form.time}.` : 'Loading services...'}
            </div>
          </div>

          <button type="submit" disabled={loading || !data} className="btn btn-primary w-full">
            {loading ? 'Reserving...' : 'Pay N$35 and reserve'} <ArrowRight size={14} />
          </button>

          {!customer && (
            <p className="text-center text-[12px] text-ink-3">
              New customer? <Link to="/customer/signup" className="text-accent hover:underline">Sign up first</Link>
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
