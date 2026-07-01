import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { ElementType, FormEvent, ReactNode } from 'react';
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  Clock3,
  Headphones,
  MessageSquare,
  Search,
  Smartphone,
  Ticket,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { img } from '@/lib/images';

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <ProductShowcase />
      <PricingTeaser />
      <FinalCTA />
    </>
  );
}

function Hero() {
  const navigate = useNavigate();
  const [businessQuery, setBusinessQuery] = useState('');

  const searchBusinesses = (event: FormEvent) => {
    event.preventDefault();
    const next = businessQuery.trim();
    navigate(next ? `/businesses?q=${encodeURIComponent(next)}` : '/businesses');
  };

  const runQuickSearch = (term: string) => {
    setBusinessQuery(term);
    navigate(`/businesses?q=${encodeURIComponent(term)}`);
  };

  return (
    <section className="bg-surface border-b border-line">
      <div className="container-x py-14 md:py-20">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <h1 className="t-display text-balance">Stand in line without standing there.</h1>
            <p className="mt-5 t-body text-[15px] md:text-base max-w-lg">
              Omukweyo lets customers join a queue now or reserve an arrival window for later, while businesses manage live queues, counters, SMS updates, analytics, and runner handoffs from one place.
            </p>
            <HeroSearchPanel
              query={businessQuery}
              setQuery={setBusinessQuery}
              onSubmit={searchBusinesses}
              onQuickSearch={runQuickSearch}
            />
            <div className="mt-6 grid sm:grid-cols-2 gap-2 text-[13px] text-ink-2 max-w-xl">
              {[
                'Book tomorrow with a clear arrival window',
                'Join from QR, link, or embedded website',
                'SMS updates without installing an app',
                'Separate workspaces for staff, runners, managers, and admins',
              ].map((item) => (
                <span key={item} className="inline-flex items-start gap-1.5">
                  <Check size={13} className="text-emerald-600 mt-0.5 shrink-0" /> {item}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroSearchPanel({
  query,
  setQuery,
  onSubmit,
  onQuickSearch,
}: {
  query: string;
  setQuery: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onQuickSearch: (term: string) => void;
}) {
  const quickSearches = ['Clinics', 'Salons', 'Government offices'];

  return (
    <div className="mt-8 max-w-xl rounded-xl border border-line bg-white shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="h-10 w-10 rounded-lg bg-blue-50 text-accent grid place-items-center shrink-0">
            <Search size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-ink">Find a business</h2>
            <p className="text-[12px] text-ink-2 mt-0.5">Search public queue pages, branches, services, and QR-ready businesses.</p>
          </div>
        </div>
        <form data-testid="home-business-search-form" onSubmit={onSubmit} className="mt-4 grid sm:grid-cols-[1fr_auto] gap-2">
          <label htmlFor="home-business-search" className="sr-only">Search businesses</label>
          <input
            data-testid="home-business-search-input"
            id="home-business-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search businesses"
            className="input h-11"
          />
          <button data-testid="home-business-search-submit" type="submit" className="btn btn-primary h-11 px-4">Search</button>
        </form>
      </div>
      <div className="border-t border-line bg-surface-2 px-4 py-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-ink-3 mr-1">Try</span>
        {quickSearches.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => onQuickSearch(term)}
            className="rounded-full border border-line bg-surface px-3 py-1 text-[12px] font-medium text-ink-2 hover:border-accent hover:text-accent transition-colors"
          >
            {term}
          </button>
        ))}
        <span className="ml-auto text-[12px] text-ink-3">
          New here? <Link to="/signup" className="font-medium text-accent hover:underline">Sign up</Link>
        </span>
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="rounded-xl bg-surface border border-line shadow-sm overflow-hidden">
      <div className="h-9 px-3 flex items-center gap-2 border-b border-line bg-surface-2">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <div className="ml-3 flex-1 h-5 max-w-xs bg-surface border border-line rounded text-[11px] text-ink-3 px-2 inline-flex items-center font-mono">
          omukweyo.com/customer
        </div>
      </div>
      <div className="grid md:grid-cols-5">
        <div className="md:col-span-2 min-h-64 bg-surface-2 relative overflow-hidden">
          <img src={img.inlineReservationFlow} alt="Customer reservation confirmation on a phone" className="w-full h-full object-cover absolute inset-0" />
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/55 to-transparent text-white">
            <div className="font-mono text-[11px] opacity-80">Tomorrow at 5:00 PM</div>
            <div className="text-[17px] font-semibold">Protected arrival window</div>
          </div>
        </div>
        <div className="md:col-span-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="t-eyebrow">Paid reservation</div>
              <div className="mt-1 text-[20px] font-semibold text-ink">Downtown Service Center</div>
              <p className="text-[12px] text-ink-2 mt-1">Personal banking, smart booking, live ticket handoff.</p>
            </div>
            <span className="chip-wait">SCHEDULED</span>
          </div>
          <div className="grid grid-cols-3 gap-px bg-line border border-line mt-5">
            <MiniMetric label="Fee" value="N$35" />
            <MiniMetric label="Target" value="17:00" />
            <MiniMetric label="Window" value="30m" />
          </div>
          <div className="mt-5 space-y-2">
            <TimelineRow icon={CalendarClock} label="Customer chooses tomorrow's arrival window" done />
            <TimelineRow icon={BarChart3} label="Omukweyo watches live demand" done />
            <TimelineRow icon={Ticket} label="Ticket is created before the visit window" />
            <TimelineRow icon={MessageSquare} label="SMS brings the customer in at the right time" />
          </div>
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Smartphone,
      title: 'Customer joins or reserves',
      body: 'A customer uses a QR link, the public page, the embedded widget, or a customer account to reserve an arrival window.',
    },
    {
      icon: Clock3,
      title: 'Omukweyo controls timing',
      body: 'The platform tracks live queue load, calculates the right booking time, and keeps the customer updated by SMS.',
    },
    {
      icon: Headphones,
      title: 'Staff calls and serves',
      body: 'Front desk staff manage the queue while managers see bottlenecks, branches, and service speed in real time.',
    },
    {
      icon: UserCheck,
      title: 'Runners cover outside lines',
      body: 'When a place is not installed yet, a verified runner can hold an allowed public-line spot with proof updates.',
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-surface border-y border-line">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="t-h1">Simple for walk-ins. Complete for operations.</h2>
          <p className="t-body mt-3">One system powers the public page, customer account, staff console, runner workbench, and admin overview.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden">
          {steps.map((step, index) => (
            <div key={step.title} className="bg-surface p-5">
              <div className="flex items-center justify-between">
                <step.icon size={18} className="text-accent" />
                <span className="t-mono text-[12px] text-ink-3">0{index + 1}</span>
              </div>
              <h3 className="mt-4 text-[14px] font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-[12px] text-ink-2 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductShowcase() {
  const cards = [
    { label: 'Customer account', to: '/customer', title: 'Reservations and live tickets in one place', img: img.inlineCustomerHero, body: <CustomerMock /> },
    { label: 'Public page', to: '/businesses', title: 'Join a live queue from a link', img: img.inlinePublicPage, body: <PublicMock /> },
    { label: 'Staff console', to: '/staff', title: 'A focused counter workflow for staff', img: img.inlineOperationsDashboard, body: <StaffMock /> },
    { label: 'Company admin console', to: '/dashboard', title: 'Users, branches, billing, SMS, and analytics', img: img.inlineBusinessDashboard, body: <DashMock /> },
    { label: 'Runner workbench', to: '/runner/work', title: 'Public-line jobs with proof updates', img: img.inlineRunnerWorkflow, body: <RunnerMock /> },
    { label: 'Platform admin', to: '/admin', title: 'Role access and network health at a glance', img: img.screenMock, body: <AdminMock /> },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="t-h1">Explore the product by role.</h2>
          <p className="t-body mt-3">Each workspace shows the job it supports, from customer reservations to branch operations and platform oversight.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Link key={card.to} to={card.to} className="panel group hover:shadow-md transition-shadow">
              <div className="aspect-[16/8] overflow-hidden bg-surface-2">
                <img src={card.img} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              </div>
              <div className="p-5">
                <div className="t-eyebrow">{card.label}</div>
                <h3 className="mt-1 text-[15px] font-semibold text-ink leading-snug">{card.title}</h3>
                <hr className="hairline my-3" />
                {card.body}
                <div className="mt-4 text-[12px] font-medium text-accent inline-flex items-center gap-1">
                  Open workspace <ArrowRight size={13} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingTeaser() {
  const plans = [
    { name: 'Customer reservation', price: 'N$35', sub: 'per reserved arrival window', href: '/reserve', cta: 'Reserve window' },
    { name: 'Starter business', price: 'N$399', sub: 'per month for one branch', href: '/signup', cta: 'Sign up business' },
    { name: 'Business network', price: 'N$999', sub: 'multi-branch operations', href: '/contact', cta: 'Contact sales' },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="t-h1">Straightforward pricing for queues that grow.</h2>
          <p className="t-body mt-3">Customers pay only when they reserve ahead. Businesses can start small and upgrade when queue operations need more control.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan, index) => (
            <div key={plan.name} className={cn('card p-5 flex flex-col', index === 1 && 'ring-2 ring-accent')}>
              <div className="t-eyebrow">{plan.name}</div>
              <div className="mt-2 t-mono text-3xl text-ink font-semibold">{plan.price}</div>
              <p className="text-[12px] text-ink-2 mt-1">{plan.sub}</p>
              <hr className="hairline my-4" />
              <ul className="space-y-2 text-[13px] text-ink-2 flex-1">
                {[
                  'Clear value before payment',
                  'No app download required',
                  'SMS-first experience',
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check size={13} className="text-emerald-600 mt-0.5 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <Link to={plan.href} className={cn('mt-5', index === 1 ? 'btn btn-primary btn-md' : 'btn btn-outline btn-md')}>{plan.cta}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-16 md:py-20 bg-surface border-t border-line">
      <div className="container-x">
        <div className="card p-8 md:p-10 text-center max-w-3xl mx-auto">
          <h2 className="t-h1">Choose the path that matches your role.</h2>
          <p className="t-body mt-3 max-w-xl mx-auto">
            Open the customer, business, staff, runner, manager, or platform admin workspace and follow the workflow from there.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/signup" className="btn btn-primary btn-lg">Create an account <ArrowRight size={15} /></Link>
            <Link to="/customer/signup" className="btn btn-outline btn-lg">Create customer account</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-3">
      <div className="t-eyebrow text-[9px]">{label}</div>
      <div className="t-mono text-[15px] text-ink font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function TimelineRow({ icon: Icon, label, done }: { icon: ElementType; label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-ink-2">
      <span className={cn('h-7 w-7 rounded-md border grid place-items-center shrink-0', done ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-line bg-surface-2 text-ink-3')}>
        <Icon size={13} />
      </span>
      <span>{label}</span>
    </div>
  );
}

function MockLine({ label, value, chip }: { label: string; value: string; chip?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[12px]">
      <span className="text-ink-2 truncate">{label}</span>
      {chip ?? <span className="font-medium text-ink truncate">{value}</span>}
    </div>
  );
}

function CustomerMock() {
  return (
    <div className="space-y-2">
      <MockLine label="Future reservation" value="Tomorrow 17:00" />
      <MockLine label="Smart booking" value="16:18" />
      <MockLine label="Payment" value="" chip={<span className="chip-serve">PAID</span>} />
    </div>
  );
}

function PublicMock() {
  return (
    <div className="space-y-2">
      <MockLine label="Branch" value="Katutura" />
      <MockLine label="Average wait" value="11 min" />
      <MockLine label="Status" value="" chip={<span className="chip-open">OPEN</span>} />
    </div>
  );
}

function StaffMock() {
  return (
    <div className="space-y-2">
      <MockLine label="Now serving" value="A-031" />
      <MockLine label="Next action" value="Call next" />
      <MockLine label="Counter" value="Counter 3" />
    </div>
  );
}

function DashMock() {
  return (
    <div className="grid grid-cols-3 gap-px bg-line border border-line">
      <MiniMetric label="Waiting" value="7" />
      <MiniMetric label="Avg wait" value="7m" />
      <MiniMetric label="Served" value="142" />
    </div>
  );
}

function RunnerMock() {
  return (
    <div className="space-y-2">
      <MockLine label="Open jobs" value="2" />
      <MockLine label="Payout" value="N$95" />
      <MockLine label="Proof" value="" chip={<span className="chip-wait">REQUIRED</span>} />
    </div>
  );
}

function AdminMock() {
  return (
    <div className="space-y-2">
      <MockLine label="Role coverage" value="6 roles" />
      <MockLine label="Runner applications" value="Live" />
      <MockLine label="Network" value="" chip={<span className="chip-open">HEALTHY</span>} />
    </div>
  );
}
