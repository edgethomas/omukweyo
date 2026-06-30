import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarClock, Clock3, Globe, MapPin, Phone, Search, Users, X } from 'lucide-react';
import type { Branch, Company, QueueTicket, Service } from '@inline/shared';
import { api } from '@/lib/api';
import { useQueueEvents } from '@/lib/useQueueEvents';
import { cn } from '@/lib/utils';
import { img } from '@/lib/images';
import BusinessQr from '@/components/BusinessQr';

type CompanyPayload = {
  company: Company;
  branches: Branch[];
  services: Service[];
};

export default function CompanyPublic() {
  const { companySlug = '', branchSlug, serviceSlug } = useParams();
  const [data, setData] = useState<CompanyPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeService, setActiveService] = useState<string | null>(null);
  const [joinForm, setJoinForm] = useState({ name: '', phone: '' });
  const [joinResult, setJoinResult] = useState<QueueTicket | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    setData(null);
    setError(null);
    api.company(companySlug).then(setData).catch((err) => setError(err.message));
  }, [companySlug]);

  const branch = useMemo(() => {
    if (!data) return null;
    return data.branches.find((item) => item.slug === branchSlug) ?? data.branches[0] ?? null;
  }, [branchSlug, data]);

  const services = useMemo(() => {
    if (!data || !branch) return [];
    return data.services.filter((service) => !service.branchId || service.branchId === branch.id);
  }, [branch, data]);

  useEffect(() => {
    if (!serviceSlug || services.length === 0) return;
    const match = services.find((service) => service.slug === serviceSlug);
    if (match) setActiveService(match.id);
  }, [serviceSlug, services]);

  const { tickets } = useQueueEvents([], {
    branchId: branch?.id,
    enabled: Boolean(branch),
  });
  const branchTickets = tickets.filter((ticket) => !branch || ticket.branchId === branch.id).slice(0, 6);
  const liveWaiting = branchTickets.filter((ticket) => ticket.status === 'WAITING').length || branch?.liveWaiting || 0;
  const avgWait = liveWaiting === 0 ? branch?.avgWaitMin ?? 0 : Math.round(branchTickets.reduce((sum, ticket) => sum + ticket.estimatedWaitMinutes, 0) / Math.max(1, liveWaiting));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeService || !branch) return;
    setJoinLoading(true);
    setError(null);
    try {
      const { ticket } = await api.joinQueue({
        branchId: branch.id,
        serviceId: activeService,
        customerName: joinForm.name,
        customerPhone: joinForm.phone,
        source: 'PUBLIC_PAGE',
      });
      setJoinResult(ticket);
      setJoinForm({ name: '', phone: '' });
      setActiveService(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setJoinLoading(false);
    }
  };

  if (error) {
    return (
      <section className="container-x py-14">
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
          <Link to="/businesses" className="btn btn-outline btn-sm ml-3"><Search size={13} /> Search businesses</Link>
        </div>
      </section>
    );
  }

  if (!data || !branch) {
    return (
      <section className="container-x py-12 space-y-4">
        <div className="h-72 rounded-xl border border-line bg-surface animate-pulse" />
        <div className="h-64 rounded-xl border border-line bg-surface animate-pulse" />
      </section>
    );
  }

  const { company } = data;
  const hero = company.heroImageUrl || img.inlineCustomerHero;
  const publicPath = `/c/${company.slug}${branch ? `/${branch.slug}` : ''}`;
  const reservePath = `/reserve?company=${encodeURIComponent(company.slug)}&branch=${encodeURIComponent(branch.slug)}`;
  const selectedService = services.find((service) => service.id === activeService);

  return (
    <main
      className="bg-white"
      style={{
        '--accent': company.primaryColor,
        '--accent-soft': `${company.primaryColor}18`,
      } as React.CSSProperties}
    >
      <section className="relative min-h-[520px] overflow-hidden border-b border-line">
        <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/25" />
        <div className="container-x relative z-10 py-8 md:py-12 min-h-[520px] flex flex-col">
          <div className="flex items-center justify-between gap-4 text-white">
            <Link to="/" className="text-sm font-semibold">Omukweyo</Link>
            <Link to="/businesses" className="btn btn-outline btn-sm border-white/30 bg-white/10 text-white hover:bg-white/20">
              <Search size={13} /> Find businesses
            </Link>
          </div>

          <div className="mt-auto max-w-4xl pb-8">
            <div className="flex items-center gap-3">
              <CompanyLogo company={company} className="h-14 w-14" />
              <div className="min-w-0 text-white">
                <div className="text-[12px] uppercase tracking-[0.16em] text-white/65">{company.industry}</div>
                <div className="text-[15px] text-white/85 truncate">{branch.name} - {branch.city}</div>
              </div>
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl md:text-6xl font-semibold leading-[1.02] tracking-tight text-white">
              {company.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base md:text-lg font-medium text-white drop-shadow-lg leading-relaxed">
              {company.tagline || company.publicDescription || 'Join the queue, reserve an arrival window, and get SMS updates without waiting around.'}
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={() => setActiveService(services[0]?.id ?? null)} className="btn btn-primary btn-lg bg-white text-ink hover:bg-white/90">
                Join queue <ArrowRight size={15} />
              </button>
              <Link to={reservePath} className="btn btn-outline btn-lg border-white/35 bg-white/10 text-white hover:bg-white/20">
                <CalendarClock size={15} /> Reserve arrival window
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-x -mt-10 relative z-20 pb-14">
        <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
          <div className="rounded-xl border border-line bg-surface shadow-sm overflow-hidden">
            <div className="grid sm:grid-cols-3 gap-px bg-line">
              <Metric icon={Users} label="In line now" value={String(liveWaiting)} />
              <Metric icon={Clock3} label="Average wait" value={`${avgWait || branch.avgWaitMin || 0} min`} />
              <Metric icon={MapPin} label="Open branch" value={branch.isOpen ? 'Open' : 'Closed'} />
            </div>

            <div className="p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-[20px] font-semibold text-ink">Choose a service</h2>
                  <p className="text-[13px] text-ink-2 mt-1">Pick the queue that matches your visit. Your ticket and updates are sent by SMS.</p>
                </div>
                <BranchPicker company={company} branches={data.branches} activeBranch={branch} />
              </div>

              <div className="mt-5 grid md:grid-cols-2 gap-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setActiveService(service.id)}
                    className="group min-h-28 rounded-lg border border-line bg-surface p-4 text-left transition hover:border-accent hover:bg-[var(--accent-soft)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-[15px] font-semibold text-ink">{service.name}</h3>
                        <p className="mt-1 text-[12px] text-ink-2 leading-relaxed">{service.description}</p>
                      </div>
                      <span className="rounded-md border border-line bg-surface-2 px-2 py-1 font-mono text-[11px] text-ink-2">~{service.averageServiceMinutes}m</span>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-accent">
                      Join this queue <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <CompanyLogo company={company} className="h-11 w-11" />
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-ink">{branch.name}</h3>
                  <div className="mt-1 space-y-1 text-[12px] text-ink-2">
                    <p className="inline-flex items-center gap-1.5"><MapPin size={12} /> {branch.address}, {branch.city}</p>
                    <p className="inline-flex items-center gap-1.5"><Phone size={12} /> {branch.phone}</p>
                    {company.websiteUrl && <p className="inline-flex items-center gap-1.5"><Globe size={12} /> {company.websiteUrl.replace(/^https?:\/\//, '')}</p>}
                  </div>
                </div>
              </div>
            </div>

            <BusinessQr
              title="Scan to join"
              subtitle="Use this QR at the door, counter, receipt desk, or poster."
              path={publicPath}
              color={company.primaryColor}
            />
            <BusinessQr
              title="Scan to reserve"
              subtitle="For customers booking tomorrow or later."
              path={reservePath}
              color={company.primaryColor}
              compact
            />

            <div className="rounded-xl border border-line bg-surface p-4">
              <div className="text-[13px] font-semibold text-ink">Live queue</div>
              <div className="mt-3 space-y-2">
                {branchTickets.length === 0 ? (
                  <div className="rounded-md border border-dashed border-line p-4 text-center text-[12px] text-ink-3">No live tickets right now.</div>
                ) : branchTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center gap-2.5 rounded-md border border-line bg-surface-2 p-2.5">
                    <div className="t-mono text-[12px] font-semibold text-ink">{ticket.ticketNumber}</div>
                    <div className="min-w-0 flex-1 text-[12px] text-ink-2 truncate">{ticket.serviceName}</div>
                    <span className={cn(ticket.status === 'WAITING' ? 'chip-wait' : ticket.status === 'CALLED' ? 'chip-call' : ticket.status === 'SERVING' ? 'chip-serve' : 'chip-done')}>
                      {ticket.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {joinResult && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-xl border border-emerald-200 bg-white p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-600 text-white grid place-items-center font-semibold">OK</div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-ink">Ticket {joinResult.ticketNumber} created</div>
              <div className="text-[12px] text-ink-2 truncate">{joinResult.serviceName} - SMS updates are logged.</div>
            </div>
            <Link to={`/ticket/${joinResult.id}`} className="btn btn-primary btn-sm">Open</Link>
            <button type="button" onClick={() => setJoinResult(null)} className="p-1 text-ink-3 hover:text-ink"><X size={15} /></button>
          </div>
        </motion.div>
      )}

      {activeService && selectedService && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4" onClick={() => setActiveService(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-3">Join queue</div>
                <h3 className="mt-1 text-[18px] font-semibold text-ink">{selectedService.name}</h3>
                <p className="text-[12px] text-ink-2 mt-1">{branch.name} - {branch.city}</p>
              </div>
              <button type="button" onClick={() => setActiveService(null)} className="p-1 text-ink-3 hover:text-ink"><X size={16} /></button>
            </div>
            <form onSubmit={submit} className="mt-5 space-y-3">
              <label className="block">
                <span className="label">Your name</span>
                <input className="input" required value={joinForm.name} onChange={(event) => setJoinForm((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label className="block">
                <span className="label">Phone for SMS updates</span>
                <input className="input" required type="tel" value={joinForm.phone} onChange={(event) => setJoinForm((current) => ({ ...current, phone: event.target.value }))} />
              </label>
              <button type="submit" disabled={joinLoading} className="btn btn-primary w-full">
                {joinLoading ? 'Joining...' : 'Get my ticket'} <ArrowRight size={14} />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </main>
  );
}

function CompanyLogo({ company, className }: { company: Company; className?: string }) {
  if (company.logoUrl) {
    return <img src={company.logoUrl} alt={`${company.name} logo`} className={cn('rounded-lg object-cover bg-white', className)} />;
  }
  return (
    <div className={cn('rounded-lg grid place-items-center text-white font-semibold shadow-sm', className)} style={{ background: company.primaryColor }}>
      {company.logoText}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="bg-surface p-4">
      <div className="flex items-center gap-2 text-ink-3">
        <Icon size={14} />
        <span className="text-[10px] font-medium uppercase tracking-[0.12em]">{label}</span>
      </div>
      <div className="t-mono mt-1 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function BranchPicker({ company, branches, activeBranch }: { company: Company; branches: Branch[]; activeBranch: Branch }) {
  if (branches.length <= 1) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {branches.map((branch) => (
        <Link
          key={branch.id}
          to={`/c/${company.slug}/${branch.slug}`}
          className={cn(
            'rounded-md border px-3 py-2 text-[12px] font-medium transition',
            branch.id === activeBranch.id ? 'border-accent bg-[var(--accent-soft)] text-ink' : 'border-line bg-surface text-ink-2 hover:bg-surface-2',
          )}
        >
          {branch.name}
        </Link>
      ))}
    </div>
  );
}
