import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Download, MessageSquare, RefreshCw, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatTime } from '@/lib/utils';
import { downloadTextFile } from '@/lib/browserActions';

const planCards = [
  { plan: 'FREE', price: 'N$0', body: 'One branch, one service, public page, trial SMS.' },
  { plan: 'STARTER', price: 'N$399', body: 'One branch, embed, many services, analytics.' },
  { plan: 'BUSINESS', price: 'N$999', body: 'Multi-branch, branding, exports, priority support.' },
  { plan: 'ENTERPRISE', price: 'Custom', body: 'White-label, custom domain, API, SLA.' },
] as const;

const paymentMethods = [
  ['MOCK_INVOICE', 'Invoice'],
  ['MOCK_EFT', 'EFT'],
  ['MOCK_CARD', 'Card'],
] as const;

export default function Billing() {
  const [data, setData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'MOCK_CARD' | 'MOCK_EFT' | 'MOCK_INVOICE'>('MOCK_INVOICE');
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    api.billingOverview()
      .then(setData)
      .catch((err) => setError(err.message));
  };

  useEffect(load, []);

  const renewal = useMemo(() => {
    if (!data?.subscription?.renewsAt) return '';
    return new Intl.DateTimeFormat('en-NA', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(data.subscription.renewsAt));
  }, [data?.subscription?.renewsAt]);

  const changePlan = async (plan: typeof planCards[number]['plan']) => {
    setPending(`plan-${plan}`);
    setNotice(null);
    setError(null);
    try {
      const payload = await api.updateSubscription({ plan, paymentMethod });
      setData(payload.billing);
      setNotice(`${plan} plan activated.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPending(null);
    }
  };

  const buyCredits = async (packageId: 'STARTER' | 'GROWTH' | 'SCALE') => {
    setPending(`sms-${packageId}`);
    setNotice(null);
    setError(null);
    try {
      const payload = await api.purchaseSmsCredits({ packageId, paymentMethod });
      setData(payload.billing);
      setNotice(`${payload.purchase.credits.toLocaleString()} SMS credits added.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPending(null);
    }
  };

  const exportInvoices = () => {
    const headers = ['Description', 'Type', 'Amount', 'Status', 'Created'];
    const rows = data.recentInvoices.map((invoice: any) => [
      invoice.description,
      invoice.type,
      money(invoice.amountCents),
      invoice.status,
      invoice.createdAt,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell: unknown) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    downloadTextFile('inline-invoices.csv', csv, 'text/csv;charset=utf-8');
    setNotice(`${rows.length} invoices exported.`);
  };

  if (error && !data) return <div className="p-8 text-ink-2">Error: {error}</div>;
  if (!data) return <div className="card p-6 h-96 animate-pulse" />;

  const subscription = data.subscription;
  const company = data.company;

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div>
          <div className="t-eyebrow text-[10px] mb-1">Billing</div>
          <h2 className="text-[16px] font-semibold text-ink">{company.name} subscription and SMS wallet</h2>
          <p className="text-[12px] text-ink-3 mt-0.5">Mock billing flow for plan upgrades, invoices, and SMS credit top-ups.</p>
        </div>
        <div className="lg:ml-auto flex flex-wrap items-center gap-2">
          {paymentMethods.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setPaymentMethod(value)}
              className={cn('btn btn-sm', paymentMethod === value ? 'btn-secondary' : 'btn-outline')}
            >
              {label}
            </button>
          ))}
          <button onClick={load} className="btn btn-ghost btn-sm"><RefreshCw size={13} /> Refresh</button>
        </div>
      </div>

      {notice && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">{notice}</div>}
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>}

      <div className="grid lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-ink">Current plan</h3>
            <span className="chip-serve">{subscription.status}</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-px bg-line border border-line mt-4">
            <Metric label="Plan" value={subscription.plan} />
            <Metric label="Amount" value={money(subscription.amountCents)} />
            <Metric label="Renews" value={renewal} />
          </div>

          <div className="grid md:grid-cols-4 gap-3 mt-5">
            {planCards.map((plan) => {
              const active = subscription.plan === plan.plan;
              return (
                <div key={plan.plan} className={cn('border rounded-lg p-4 bg-surface', active ? 'border-accent ring-2 ring-accent/20' : 'border-line')}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="t-eyebrow">{plan.plan}</div>
                    {active && <span className="chip-open">ACTIVE</span>}
                  </div>
                  <div className="t-mono text-2xl text-ink font-semibold mt-2">{plan.price}</div>
                  <p className="text-[12px] text-ink-2 mt-1 min-h-12">{plan.body}</p>
                  <button
                    onClick={() => changePlan(plan.plan)}
                    disabled={active || pending === `plan-${plan.plan}`}
                    className="btn btn-outline btn-sm w-full mt-4"
                  >
                    {active ? 'Current plan' : pending === `plan-${plan.plan}` ? 'Updating...' : 'Switch plan'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-ink">SMS wallet</h3>
              <Wallet size={14} className="text-ink-3" />
            </div>
            <div className="t-mono text-4xl text-ink font-semibold mt-3">{company.smsBalance.toLocaleString()}</div>
            <p className="text-[12px] text-ink-2 mt-1">credits available for queue and reservation messages.</p>
          </div>
          <div className="card p-5">
            <div className="t-eyebrow mb-3">Payment method</div>
            <div className="flex items-center gap-2 text-[13px] text-ink">
              <CreditCard size={14} className="text-accent" />
              {paymentMethods.find(([value]) => value === paymentMethod)?.[1]}
            </div>
            <p className="text-[12px] text-ink-2 mt-2">This demo records a paid invoice immediately.</p>
          </div>
        </aside>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <h3 className="text-[14px] font-semibold text-ink">SMS credit packages</h3>
            <p className="t-eyebrow text-[10px] mt-0.5">Top up when the queue gets busy</p>
          </div>
          <div className="grid md:grid-cols-3 gap-px bg-line">
            {data.smsPackages.map((pkg: any) => (
              <div key={pkg.id} className="bg-surface p-5">
                <MessageSquare size={16} className="text-accent" />
                <div className="text-[14px] font-semibold text-ink mt-3">{pkg.name}</div>
                <div className="t-mono text-2xl text-ink font-semibold mt-1">{money(pkg.priceCents)}</div>
                <p className="text-[12px] text-ink-2 mt-1">{pkg.credits.toLocaleString()} credits{pkg.bonusCredits ? ` + ${pkg.bonusCredits} bonus` : ''}</p>
                <button
                  onClick={() => buyCredits(pkg.id)}
                  disabled={pending === `sms-${pkg.id}`}
                  className="btn btn-primary btn-sm w-full mt-4"
                >
                  {pending === `sms-${pkg.id}` ? 'Buying...' : 'Buy credits'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <h3 className="text-[14px] font-semibold text-ink">Recent invoices</h3>
            <p className="t-eyebrow text-[10px] mt-0.5">Sandbox payment records</p>
          </div>
          <div className="divide-y divide-line max-h-80 overflow-auto">
            {data.recentInvoices.map((invoice: any) => (
              <div key={invoice.id} className="px-5 py-3 text-[12px]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{invoice.description}</div>
                    <div className="t-eyebrow text-[9px] mt-1">{invoice.type} - {formatTime(invoice.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="t-mono text-ink">{money(invoice.amountCents)}</div>
                    <span className="chip-serve mt-1">{invoice.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={exportInvoices} className="btn btn-ghost btn-sm w-full rounded-none border-t border-line"><Download size={13} /> Export invoices</button>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-4">
      <div className="t-eyebrow text-[9px]">{label}</div>
      <div className="t-mono text-[16px] font-semibold text-ink mt-0.5">{value}</div>
    </div>
  );
}

function money(cents: number) {
  return `N$${(cents / 100).toLocaleString('en-NA', { maximumFractionDigits: 0 })}`;
}
