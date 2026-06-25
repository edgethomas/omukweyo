import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, RefreshCw, Ticket as TicketIcon } from 'lucide-react';
import { api } from '@/lib/api';

export default function KioskPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [step, setStep] = useState<'service' | 'contact' | 'done'>('service');
  const [serviceId, setServiceId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ticket, setTicket] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const requestedCompany = params.get('company');
    const requestedBranch = params.get('branch');
    api.businesses('').then(async (d) => {
      const slug = requestedCompany ?? d.businesses[0]?.slug;
      if (!slug) return;
      const companyPayload = await api.company(slug);
      setCompany(companyPayload.company);
      setServices(companyPayload.services);
      setBranches(companyPayload.branches);
      const targetBranch = requestedBranch ? companyPayload.branches.find((b: any) => b.slug === requestedBranch) : companyPayload.branches[0];
      if (targetBranch) {
        setBranchId(targetBranch.id);
        const branchServices = companyPayload.services.filter((s: any) => !s.branchId || s.branchId === targetBranch.id);
        if (branchServices[0]) setServiceId(branchServices[0].id);
      } else if (companyPayload.services[0]) {
        setServiceId(companyPayload.services[0].id);
        if (companyPayload.branches[0]) setBranchId(companyPayload.branches[0].id);
      }
    });
  }, [params]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const { ticket: t } = await api.joinQueue({
        branchId,
        serviceId,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        source: 'STAFF_WALK_IN',
      });
      setTicket(t);
      setStep('done');
    } catch (err: any) { setError(err.message); } finally { setPending(false); }
  };

  const reset = () => {
    setStep('service');
    setTicket(null);
    setName('');
    setPhone('');
  };

  if (!company) return <div className="min-h-screen grid place-items-center text-ink-3">Loading kiosk...</div>;

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <header className="bg-surface border-b border-line px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md grid place-items-center text-white font-semibold" style={{ background: company.primaryColor }}>{company.logoText}</div>
          <div>
            <div className="text-[12px] text-ink-3">Welcome to</div>
            <h1 className="text-[18px] font-semibold text-ink">{company.name}</h1>
          </div>
        </div>
        <button type="button" onClick={reset} className="btn btn-ghost btn-sm"><RefreshCw size={12} /> Start over</button>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl">
          {step === 'service' && (
            <div className="card p-6">
              <h2 className="text-[22px] font-semibold text-ink">Join the queue</h2>
              <p className="text-[13px] text-ink-2 mt-1">Pick the service you need today.</p>
              <div className="mt-5 grid sm:grid-cols-2 gap-3">
                {services.filter((s) => !s.branchId || s.branchId === branchId).map((service) => (
                  <button key={service.id} type="button" onClick={() => { setServiceId(service.id); setStep('contact'); }} className="text-left rounded-lg border border-line p-4 hover:border-accent hover:bg-accent-soft">
                    <div className="text-[15px] font-semibold text-ink">{service.name}</div>
                    <p className="text-[12px] text-ink-2 mt-1">{service.description}</p>
                    <span className="mt-2 inline-block text-[11px] t-mono text-ink-3">~{service.averageServiceMinutes}m</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'contact' && (
            <form onSubmit={submit} className="card p-6">
              <button type="button" onClick={() => setStep('service')} className="text-[12px] text-ink-3 hover:text-ink">Back to services</button>
              <h2 className="text-[20px] font-semibold text-ink mt-1">Your contact</h2>
              <p className="text-[13px] text-ink-2 mt-1">We will text you when your ticket is close.</p>
              <div className="mt-5 space-y-3">
                <label className="block">
                  <span className="label">Name</span>
                  <input className="input text-[18px] py-3" required value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="block">
                  <span className="label">Phone</span>
                  <input className="input text-[18px] py-3" required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+264 ..." />
                </label>
              </div>
              {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 mt-3">{error}</div>}
              <button type="submit" className="btn btn-primary btn-lg w-full mt-5" disabled={pending}>{pending ? 'Getting ticket...' : 'Get my ticket'}</button>
            </form>
          )}

          {step === 'done' && ticket && (
            <div className="card p-8 text-center">
              <CheckCircle2 size={42} className="text-emerald-600 mx-auto" />
              <h2 className="mt-3 text-[20px] font-semibold text-ink">You are in the queue</h2>
              <div className="mt-4 mx-auto w-fit rounded-xl border-2 border-accent bg-accent-soft px-8 py-4">
                <div className="t-eyebrow text-[10px] text-accent">Your ticket</div>
                <div className="t-mono text-5xl font-semibold text-ink">{ticket.ticketNumber}</div>
              </div>
              <p className="mt-3 text-[14px] text-ink-2">You are <span className="t-mono font-semibold text-ink">#{ticket.position}</span> in line. Wait time: ~{ticket.estimatedWaitMinutes} min.</p>
              <p className="mt-2 text-[12px] text-ink-3">Keep this page open. We will text {ticket.customerPhone} when you are close.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button type="button" onClick={reset} className="btn btn-primary btn-md">Next customer</button>
                <button type="button" onClick={() => navigate(`/ticket/${ticket.id}`)} className="btn btn-outline btn-md"><TicketIcon size={13} /> Open live ticket</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
