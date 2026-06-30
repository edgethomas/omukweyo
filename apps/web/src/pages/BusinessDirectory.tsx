import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Building2, Clock3, MapPin, Search, Users, X } from 'lucide-react';
import type { BusinessDirectoryItem } from '@inline/shared';
import { api } from '@/lib/api';
import { img } from '@/lib/images';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'banking', label: 'Banking' },
  { id: 'clinic', label: 'Clinic' },
  { id: 'government', label: 'Government' },
  { id: 'retail', label: 'Retail' },
  { id: 'service', label: 'Service' },
];

function categoryOf(item: BusinessDirectoryItem) {
  const haystack = `${item.industry} ${item.name}`.toLowerCase();
  if (/bank|finan|atm/.test(haystack)) return 'banking';
  if (/clinic|doctor|health|pharma|hospital/.test(haystack)) return 'clinic';
  if (/govern|ministry|municipal/.test(haystack)) return 'government';
  if (/shop|store|retail/.test(haystack)) return 'retail';
  if (/salon|spa|service|repair/.test(haystack)) return 'service';
  return 'service';
}

export default function BusinessDirectory() {
  const [params, setParams] = useSearchParams();
  const initialQuery = params.get('q') ?? '';
  const initialCategory = params.get('category') ?? 'all';
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [openOnly, setOpenOnly] = useState(params.get('open') === '1');
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

  const filtered = useMemo(() => {
    return businesses.filter((business) => {
      if (category !== 'all' && categoryOf(business) !== category) return false;
      if (openOnly && !business.branches.some((branch) => branch.isOpen)) return false;
      return true;
    });
  }, [businesses, category, openOnly]);

  const title = useMemo(() => {
    if (!activeQuery) return 'Find a business using Omukweyo.';
    return `Search results for "${activeQuery}"`;
  }, [activeQuery]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = query.trim();
    const search = new URLSearchParams();
    if (next) search.set('q', next);
    if (category !== 'all') search.set('category', category);
    if (openOnly) search.set('open', '1');
    setParams(search);
  };

  const clearFilters = () => {
    setQuery('');
    setCategory('all');
    setOpenOnly(false);
    setParams({});
  };

  return (
    <section className="container-x py-10 space-y-6">
      <header className="grid lg:grid-cols-[1fr_420px] gap-6 items-end">
        <div>
          <h1 className="t-h1 text-balance">{title}</h1>
          <p className="t-body mt-3 max-w-2xl">
            Search by company, branch, city, or service. Open a business page to join its live queue or reserve an arrival window.
          </p>
        </div>
        <form onSubmit={submit} className="rounded-lg border border-line bg-surface p-3 flex items-center gap-2">
          <Search size={16} className="text-ink-3 shrink-0 ml-1" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search businesses, branches, services"
            className="flex-1 bg-transparent outline-none text-[14px] text-ink placeholder:text-ink-3 min-w-0"
          />
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => setCategory(item.id)}
            className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${category === item.id ? 'border-accent bg-accent-soft text-ink' : 'border-line bg-surface text-ink-2 hover:bg-surface-2'}`}
          >
            {item.label}
          </button>
        ))}
        <label className="ml-auto inline-flex items-center gap-2 text-[12px] text-ink-2 cursor-pointer">
          <input type="checkbox" checked={openOnly} onChange={(event) => setOpenOnly(event.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          Open right now
        </label>
        {(category !== 'all' || openOnly || activeQuery) && (
          <button type="button" onClick={clearFilters} className="text-[12px] text-ink-3 hover:text-ink inline-flex items-center gap-1">
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>}
      {loading && <div className="grid gap-2"><div className="rounded-lg border border-line bg-surface h-16 animate-pulse" /><div className="rounded-lg border border-line bg-surface h-16 animate-pulse" /><div className="rounded-lg border border-line bg-surface h-16 animate-pulse" /></div>}

      {!loading && filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-line bg-surface p-10 text-center">
          <Building2 size={28} className="mx-auto text-ink-3" />
          <h2 className="text-[18px] font-semibold text-ink mt-3">No business found.</h2>
          <p className="text-[13px] text-ink-2 mt-1">Try clinics, banking, Windhoek, personal service, or a branch name.</p>
          <button type="button" onClick={clearFilters} className="btn btn-outline btn-md mt-5">Show all businesses</button>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((business) => (
          <BusinessRow key={business.id} business={business} />
        ))}
      </div>
    </section>
  );
}

function BusinessRow({ business }: { business: BusinessDirectoryItem }) {
  const openBranch = business.branches.find((branch) => branch.isOpen);
  const statusLabel = openBranch ? `${openBranch.city} - OPEN` : 'All branches closed';
  const statusClass = openBranch ? 'chip-open' : 'chip-done';
  return (
    <article className="rounded-lg border border-line bg-surface hover:border-accent transition-colors">
      <div className="grid md:grid-cols-[88px_1fr_auto] gap-4 items-center p-3">
        <div className="hidden md:block">
          <div className="aspect-square rounded-md overflow-hidden bg-surface-2 border border-line">
            {business.heroImageUrl || business.logoUrl ? (
              <img src={business.heroImageUrl || business.logoUrl || img.inlinePublicPage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-[12px] font-semibold text-white" style={{ background: business.primaryColor }}>
                {business.logoText}
              </div>
            )}
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[14px] font-semibold text-ink truncate">{business.name}</h2>
            <span className={statusClass}>{statusLabel}</span>
          </div>
          <p className="text-[12px] text-ink-2 mt-0.5">{business.industry} - {business.branches.length} branches - {business.serviceCount} services</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-ink-3">
            <span className="inline-flex items-center gap-1"><Users size={11} /> {business.liveWaiting} waiting</span>
            <span className="inline-flex items-center gap-1"><Clock3 size={11} /> ~{business.avgWaitMin} min</span>
            <span className="inline-flex items-center gap-1"><MapPin size={11} /> {openBranch?.city ?? business.branches[0]?.city ?? 'Windhoek'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 md:justify-end">
          <Link to={business.publicPageUrl} className="btn btn-outline btn-sm">Open page</Link>
          <Link to={`/reserve?company=${encodeURIComponent(business.slug)}`} className="btn btn-primary btn-sm">
            Reserve <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </article>
  );
}
