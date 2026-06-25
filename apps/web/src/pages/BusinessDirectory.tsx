import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Building2, Clock3, MapPin, Search, Users } from 'lucide-react';
import type { BusinessDirectoryItem } from '@inline/shared';
import { api } from '@/lib/api';
import BusinessQr from '@/components/BusinessQr';
import { img } from '@/lib/images';

export default function BusinessDirectory() {
  const [params, setParams] = useSearchParams();
  const initialQuery = params.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [businesses, setBusinesses] = useState<BusinessDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeQuery = params.get('q') ?? '';

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.businesses(activeQuery)
      .then((payload) => setBusinesses(payload.businesses))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeQuery]);

  const title = useMemo(() => {
    if (!activeQuery) return 'Find a business using Omukweyo.';
    return `Search results for "${activeQuery}"`;
  }, [activeQuery]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = query.trim();
    setParams(next ? { q: next } : {});
  };

  return (
    <section className="container-x py-12 space-y-8">
      <header className="grid lg:grid-cols-[1fr_420px] gap-8 items-end">
        <div>
          <div className="text-[12px] text-ink-3 mb-3">
            <Link to="/" className="hover:text-ink">Home</Link>
            <span className="mx-2 text-ink-3/40">/</span>
            Businesses
          </div>
          <div className="t-eyebrow mb-2">Business search</div>
          <h1 className="t-h1 text-balance">{title}</h1>
          <p className="t-body mt-3 max-w-2xl">
            Search for a branch, company, city, or service. Scan a QR code to join the queue or open the business page directly.
          </p>
        </div>
        <form onSubmit={submit} className="rounded-lg border border-line bg-surface p-3 flex items-center gap-2">
          <Search size={16} className="text-ink-3 shrink-0 ml-1" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search businesses"
            className="flex-1 bg-transparent outline-none text-[14px] text-ink placeholder:text-ink-3 min-w-0"
          />
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>
      </header>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>}
      {loading && <div className="rounded-lg border border-line bg-surface h-80 animate-pulse" />}

      {!loading && businesses.length === 0 && (
        <div className="rounded-lg border border-dashed border-line bg-surface p-10 text-center">
          <Building2 size={28} className="mx-auto text-ink-3" />
          <h2 className="text-[18px] font-semibold text-ink mt-3">No business found.</h2>
          <p className="text-[13px] text-ink-2 mt-1">Try clinics, banking, Windhoek, personal service, or a branch name.</p>
          <button type="button" onClick={() => { setQuery(''); setParams({}); }} className="btn btn-outline btn-md mt-5">Show all businesses</button>
        </div>
      )}

      <div className="space-y-6">
        {businesses.map((business) => (
          <article key={business.id} className="rounded-xl border border-line bg-surface overflow-hidden shadow-sm">
            <div className="grid lg:grid-cols-[1fr_360px]">
              <div>
                <div className="relative h-48 md:h-60 bg-surface-2 overflow-hidden">
                  <img src={business.heroImageUrl || img.inlinePublicPage} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                  <div className="absolute left-5 right-5 bottom-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 text-white">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium backdrop-blur">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {business.branches.filter((branch) => branch.isOpen).length} open branches
                      </div>
                      <h2 className="text-3xl font-semibold mt-3">{business.name}</h2>
                      <p className="text-sm text-white/80 mt-1">{business.industry}</p>
                    </div>
                    <Link to={business.publicPageUrl} className="btn btn-primary btn-md bg-white text-ink hover:bg-white/90">
                      Open page <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-px bg-line border-y border-line">
                  <Metric icon={Users} label="Waiting now" value={String(business.liveWaiting)} />
                  <Metric icon={Clock3} label="Avg wait" value={`${business.avgWaitMin} min`} />
                  <Metric icon={Building2} label="Services" value={String(business.serviceCount)} />
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-[14px] font-semibold text-ink">Branches</h3>
                    <span className="t-eyebrow text-[10px]">{business.branches.length} listed</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2">
                    {business.branches.map((branch) => (
                      <div key={branch.id} className="border border-line bg-surface-2 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-ink truncate">{branch.name}</div>
                            <div className="text-[11px] text-ink-3 mt-0.5 inline-flex items-center gap-1.5">
                              <MapPin size={10} /> {branch.city}
                            </div>
                          </div>
                          <span className={branch.isOpen ? 'chip-open' : 'chip-done'}>{branch.isOpen ? 'OPEN' : 'CLOSED'}</span>
                        </div>
                        <div className="font-mono text-[10px] text-ink-3 mt-2 truncate">{branch.address}</div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-ink-2">
                          <span>{branch.liveWaiting} waiting</span>
                          <span>~{branch.avgWaitMin} min</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="border-t lg:border-t-0 lg:border-l border-line bg-surface-2 p-5 space-y-4">
                <BusinessQr
                  title="Scan to join"
                  subtitle="Put this at the door, receipt desk, poster, or front counter."
                  path={business.qr.joinUrl}
                  color={business.primaryColor}
                />
                <BusinessQr
                  title="Scan to reserve"
                  subtitle="For customers who need a future arrival window protected."
                  path={business.qr.reserveUrl}
                  color={business.primaryColor}
                  compact
                />
              </aside>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="bg-surface p-4">
      <div className="flex items-center gap-2 text-ink-3">
        <Icon size={14} />
        <span className="t-eyebrow text-[9px]">{label}</span>
      </div>
      <div className="t-mono text-2xl font-semibold text-ink mt-1">{value}</div>
    </div>
  );
}
