import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock3, Users, X } from 'lucide-react';
import type { Branch, Company, Service } from '@inline/shared';
import { api } from '@/lib/api';

type WidgetPayload = {
  company: Company;
  branches: Branch[];
  services: Service[];
};

export default function Widget() {
  const { companySlug = '' } = useParams();
  const [data, setData] = useState<WidgetPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setError(null);
    setData(null);
    api.company(companySlug).then(setData).catch((err) => setError(err.message));
  }, [companySlug]);

  const branch = data?.branches[0];
  const services = useMemo(() => {
    if (!data || !branch) return [];
    return data.services.filter((service) => !service.branchId || service.branchId === branch.id).slice(0, 4);
  }, [branch, data]);
  const activeService = services.find((service) => service.id === activeServiceId);

  const submitJoin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeService || !branch) return;
    setLoading(true);
    setError(null);
    try {
      const payload = await api.joinQueue({
        branchId: branch.id,
        serviceId: activeService.id,
        customerName: form.name,
        customerPhone: form.phone,
        source: 'EMBED',
      });
      setTicket(payload.ticket);
      setForm({ name: '', phone: '' });
      setActiveServiceId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <div className="min-h-screen bg-white p-4 text-[13px] text-red-700">Widget error: {error}</div>;
  }

  if (!data || !branch) {
    return <div className="min-h-screen bg-white p-4"><div className="h-72 rounded-xl border border-line bg-surface-2 animate-pulse" /></div>;
  }

  const { company } = data;
  const waitValue = branch.avgWaitMin ? `${branch.avgWaitMin} min` : 'Live';

  return (
    <main className="min-h-screen bg-white text-ink" style={{ '--accent': company.primaryColor, '--accent-soft': `${company.primaryColor}18` } as React.CSSProperties}>
      <div className="p-4">
        <div className="rounded-xl border border-line bg-surface shadow-sm overflow-hidden">
          <div className="p-4 border-b border-line flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
              ) : (
                <div className="h-9 w-9 rounded-lg grid place-items-center text-white text-[12px] font-semibold" style={{ background: company.primaryColor }}>{company.logoText}</div>
              )}
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-ink truncate">{company.name}</div>
                <div className="text-[11px] text-ink-3 truncate">{branch.name}</div>
              </div>
            </div>
            <span className={branch.isOpen ? 'chip-open' : 'chip-done'}>{branch.isOpen ? 'OPEN' : 'CLOSED'}</span>
          </div>

          <div className="p-4">
            <p className="text-[12px] text-ink-2">{company.tagline || 'Join the queue without waiting at the branch.'}</p>

            <div className="grid grid-cols-2 gap-px bg-line border border-line mt-4 rounded-md overflow-hidden">
              <Metric icon={Users} label="In line" value={String(branch.liveWaiting)} />
              <Metric icon={Clock3} label="Avg wait" value={waitValue} />
            </div>

            {ticket && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[12px] text-emerald-800">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold">Ticket {ticket.ticketNumber} created</div>
                    <div className="mt-0.5">SMS logged. Track your live ticket from the link below.</div>
                    <a href={`/ticket/${ticket.id}`} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm w-full mt-3">Open ticket</a>
                  </div>
                  <button type="button" onClick={() => setTicket(null)} className="text-emerald-700 hover:text-ink"><X size={14} /></button>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2">
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => setActiveServiceId(service.id)}
                  className="w-full flex items-center justify-between gap-3 rounded-md border border-line bg-surface-2 px-3 py-2 hover:border-accent hover:bg-[var(--accent-soft)] transition-colors text-left"
                >
                  <span>
                    <span className="block text-[13px] font-semibold text-ink">{service.name}</span>
                    <span className="block text-[11px] text-ink-3">~{service.averageServiceMinutes} min service</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-accent">
                    Join <ArrowRight size={13} />
                  </span>
                </button>
              ))}
            </div>

            {activeService && (
              <form onSubmit={submitJoin} className="mt-4 rounded-lg border border-line bg-white p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[12px] font-semibold text-ink">Join {activeService.name}</div>
                    <div className="text-[10px] text-ink-3">Ticket source: embedded website widget</div>
                  </div>
                  <button type="button" onClick={() => setActiveServiceId(null)} className="text-ink-3 hover:text-ink"><X size={14} /></button>
                </div>
                <label className="block">
                  <span className="label text-[10px]">Name</span>
                  <input className="input h-9 text-[12px]" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
                </label>
                <label className="block">
                  <span className="label text-[10px]">Phone for SMS</span>
                  <input className="input h-9 text-[12px]" type="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} required />
                </label>
                <button type="submit" disabled={loading} className="btn btn-primary btn-sm w-full">
                  {loading ? 'Joining...' : 'Get ticket'}
                </button>
              </form>
            )}

            <a href={`/reserve?company=${encodeURIComponent(company.slug)}&branch=${encodeURIComponent(branch.slug)}`} target="_blank" rel="noreferrer" className="btn btn-outline w-full mt-3">
              Reserve an arrival window
            </a>
            <div className="text-center text-[10px] uppercase tracking-[0.12em] text-ink-3 mt-3">Powered by Omukweyo</div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="bg-surface p-3">
      <div className="flex items-center gap-1.5 text-ink-3">
        <Icon size={13} />
        <span className="t-eyebrow text-[9px]">{label}</span>
      </div>
      <div className="t-mono text-[17px] font-semibold text-ink mt-1">{value}</div>
    </div>
  );
}
