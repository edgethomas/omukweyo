import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

type CellValue = string | boolean;
type FeatureRow = [string, CellValue, CellValue, CellValue, CellValue];

const plans = [
  { n: 'Free', p: 'N$0', sub: '/mo', items: ['1 branch, 1 service, 1 staff', 'Unlimited tickets', 'Basic public page + QR', 'Trial SMS credits', 'Community support'], cta: 'Start free', href: '/onboarding' },
  { n: 'Starter', p: 'N$399', sub: '/mo', items: ['1 branch, many services, 3 staff', 'QR + iframe embed', 'Basic analytics', 'SMS pay-as-you-go', 'Email support'], cta: 'Choose Starter', href: '/onboarding', hot: true },
  { n: 'Business', p: 'N$999', sub: '/mo', items: ['Multi-branch operations', 'Custom branding and reservations', 'Advanced analytics and exports', 'Priority queues and SMS bundles', 'Priority support'], cta: 'Choose Business', href: '/contact' },
  { n: 'Enterprise', p: 'Custom', sub: '', items: ['Unlimited limits and SLA', 'Custom domain and white-label', 'API access and dedicated CSM', 'Invoice billing', 'Custom onboarding'], cta: 'Contact sales', href: '/contact' },
];

const features: FeatureRow[] = [
  ['Branches', '1', '1', 'Unlimited', 'Unlimited'],
  ['Services per branch', '1', 'Unlimited', 'Unlimited', 'Unlimited'],
  ['Staff users', '1', '3', '15', 'Unlimited'],
  ['Tickets / month', 'Unlimited', 'Unlimited', 'Unlimited', 'Unlimited'],
  ['Public company page', true, true, true, true],
  ['QR code generator', true, true, true, true],
  ['Iframe embed', false, true, true, true],
  ['JS embed + allowed domains', false, false, true, true],
  ['Custom branding', false, 'Colors + logo', 'Full', 'White-label'],
  ['Custom domain', false, false, false, true],
  ['Analytics and exports', 'Basic', 'Basic', 'Advanced', 'Advanced + API'],
  ['Reservations', false, false, true, true],
  ['TV mode + kiosk', false, false, true, true],
  ['API access', false, false, 'Paid add-on', true],
  ['SLA + dedicated CSM', false, false, false, true],
  ['Support', 'Community', 'Email', 'Priority', '24/7 phone'],
];

function cell(v: CellValue) {
  if (v === true) return <Check size={14} className="text-emerald-600 mx-auto" />;
  if (v === false) return <span className="text-ink-3">-</span>;
  return <span className="text-ink-2 text-[13px] leading-snug">{v}</span>;
}

export default function Pricing() {
  return (
    <div className="container-x py-12 space-y-10">
      <header>
        <h1 className="t-h1 text-balance max-w-3xl">Plans that match your queue volume.</h1>
        <p className="t-body mt-3 max-w-2xl">Start with one branch, then add capacity when you need more staff, analytics, reservations, or SMS volume.</p>
      </header>

      <section>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden">
          {plans.map((pl) => (
            <div key={pl.n} className={`bg-surface p-5 flex flex-col ${pl.hot ? 'ring-2 ring-accent' : ''}`}>
              {pl.hot && <div className="self-start text-[10px] font-semibold uppercase tracking-wider text-white bg-accent px-1.5 py-0.5 rounded mb-2">Most popular</div>}
              <div className="t-eyebrow">{pl.n}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <div className="t-mono text-3xl text-ink font-semibold">{pl.p}</div>
                {pl.sub && <div className="text-[12px] text-ink-3">{pl.sub}</div>}
              </div>
              <hr className="hairline my-3" />
              <ul className="space-y-1.5 text-[12px] text-ink-2 flex-1">
                {pl.items.map((it) => (
                  <li key={it} className="flex items-start gap-1.5"><Check size={12} className="text-emerald-600 mt-0.5 shrink-0" /> {it}</li>
                ))}
              </ul>
              <Link to={pl.href} className={`mt-4 ${pl.hot ? 'btn-primary' : 'btn-outline'} btn-md`}>{pl.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="t-eyebrow mb-4">Compare features</div>
        <div className="hidden lg:block card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full table-fixed text-left">
              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead>
                <tr className="bg-surface-2 border-b border-line">
                  <th className="px-4 py-3 t-eyebrow text-[10px]">Feature</th>
                  {plans.map((p) => <th key={p.n} className="px-4 py-3 t-eyebrow text-[10px] text-center">{p.n}</th>)}
                </tr>
              </thead>
              <tbody>
                {features.map((row) => (
                  <tr key={row[0]} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 text-[13px] text-ink font-medium align-middle">{row[0]}</td>
                    {row.slice(1).map((c, j) => <td key={j} className="px-4 py-3 text-center align-middle">{cell(c)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <FeatureComparisonCards />
      </section>

      <section>
        <div className="t-eyebrow mb-4">SMS credits</div>
        <div className="grid md:grid-cols-3 gap-px bg-line border border-line rounded-lg overflow-hidden">
          {[
            { n: 'Starter', p: 'N$100', d: '~330 SMS' },
            { n: 'Growth', p: 'N$500', d: '~1,800 SMS + 10% bonus', hot: true },
            { n: 'Scale', p: 'N$1,000', d: '~4,000 SMS + 15% bonus' },
          ].map((b) => (
            <div key={b.n} className={`bg-surface p-5 ${b.hot ? 'ring-2 ring-accent' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="t-eyebrow">{b.n}</div>
                {b.hot && <span className="text-[10px] font-semibold uppercase tracking-wider text-white bg-accent px-1.5 py-0.5 rounded">Best value</span>}
              </div>
              <div className="mt-2 t-mono text-2xl text-ink font-semibold">{b.p}</div>
              <div className="mt-1 text-[12px] text-ink-2">{b.d}</div>
              <Link to="/billing" className="btn btn-outline btn-sm mt-3 w-full">Buy credits</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FeatureComparisonCards() {
  return (
    <div className="lg:hidden grid gap-3">
      {plans.map((plan, planIndex) => (
        <div key={plan.n} className="card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="t-eyebrow text-[10px]">{plan.n}</div>
              <div className="mt-1 t-mono text-xl font-semibold text-ink">{plan.p}</div>
            </div>
            {plan.hot && <span className="chip-open">POPULAR</span>}
          </div>
          <hr className="hairline my-3" />
          <div className="space-y-2">
            {features.map((feature) => (
              <div key={feature[0]} className="flex items-center justify-between gap-3 text-[12px]">
                <span className="text-ink-2">{feature[0]}</span>
                <span className="text-right font-medium text-ink">{cell(feature[planIndex + 1])}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
