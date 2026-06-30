import { useEffect, useState } from 'react';
import { CreditCard, RefreshCw, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatTime, relativeTime } from '@/lib/utils';
import DashboardLayout from './DashboardLayout';

type Invoice = { id: string; type: string; description: string; amountCents: number; status: string; createdAt: string; paymentMethod: string };
type Purchase = { id: string; packageId: string; credits: number; amountCents: number; createdAt: string; paymentMethod: string };

export default function DashboardBillingPage() {
  const [billing, setBilling] = useState<any>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setPending(true);
    setError(null);
    api.billingOverview()
      .then(setBilling)
      .catch((err) => setError(err.message))
      .finally(() => setPending(false));
  };

  useEffect(() => { load(); }, []);

  const changePlan = async (plan: 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE') => {
    setPending(true);
    try {
      await api.updateSubscription({ plan, paymentMethod: 'MOCK_CARD' });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  const buyCredits = async (packageId: 'STARTER' | 'GROWTH' | 'SCALE') => {
    setPending(true);
    try {
      await api.purchaseSmsCredits({ packageId, paymentMethod: 'MOCK_CARD' });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  if (error) {
    return <DashboardLayout><div className="card p-6 text-red-700">{error}</div></DashboardLayout>;
  }

  if (!billing) return <DashboardLayout><BillingSkeleton /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Billing</h2>
            <p className="text-[12px] text-ink-3 mt-0.5">Plan, invoices, and SMS credit top-ups</p>
          </div>
          <button type="button" onClick={load} className="btn btn-ghost btn-sm"><RefreshCw size={13} /> Refresh</button>
        </div>

        <section className="card p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-[14px] font-semibold text-ink">Current plan</h3>
              <p className="text-[12px] text-ink-2 mt-0.5">Status: <span className="font-medium text-ink">{billing.subscription.status}</span> - renews {new Date(billing.subscription.renewsAt).toLocaleDateString('en-NA')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['FREE', 'STARTER', 'BUSINESS', 'ENTERPRISE'] as const).map((plan) => (
                <button key={plan} type="button" disabled={pending} onClick={() => changePlan(plan)} className={cn('btn btn-sm', billing.company.plan === plan ? 'btn-primary' : 'btn-outline')}>
                  {plan}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid sm:grid-cols-3 gap-px bg-line border border-line rounded-lg overflow-hidden">
            <Stat label="Monthly cost" value={`N$${(billing.subscription.amountCents / 100).toFixed(0)}`} />
            <Stat label="Payment method" value={billing.subscription.paymentMethod.replace('MOCK_', '')} />
            <Stat label="SMS balance" value={billing.company.smsBalance.toLocaleString()} />
          </div>
        </section>

        <section className="card p-5">
          <h3 className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><Wallet size={14} /> SMS credit packages</h3>
          <div className="mt-3 grid md:grid-cols-3 gap-3">
            {billing.smsPackages.map((pack: any) => (
              <div key={pack.id} className="rounded-lg border border-line bg-surface p-4 flex flex-col">
                <div className="text-[12px] t-eyebrow">{pack.id}</div>
                <h4 className="text-[15px] font-semibold text-ink mt-1">{pack.name}</h4>
                <p className="text-[12px] text-ink-2 mt-1">{pack.credits.toLocaleString()} credits{pack.bonusCredits ? ` + ${pack.bonusCredits} bonus` : ''}</p>
                <p className="t-mono text-[20px] font-semibold text-ink mt-2">N$${(pack.priceCents / 100).toFixed(0)}</p>
                <button type="button" disabled={pending} onClick={() => buyCredits(pack.id)} className="btn btn-primary btn-sm mt-3">
                  <CreditCard size={12} /> Buy
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-5">
          <section className="card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-line">
              <h3 className="text-[14px] font-semibold text-ink">Recent invoices</h3>
            </div>
            {billing.recentInvoices.length === 0 ? (
              <div className="p-5 text-[12px] text-ink-3">No invoices yet.</div>
            ) : (
              <div className="divide-y divide-line">
                {billing.recentInvoices.map((invoice: Invoice) => (
                  <div key={invoice.id} className="grid grid-cols-[1fr_120px_100px] gap-3 items-center px-5 py-2.5 text-[12px]">
                    <div className="min-w-0">
                      <div className="font-medium text-ink truncate">{invoice.description}</div>
                      <div className="text-[11px] text-ink-3 mt-0.5">{invoice.paymentMethod.replace('MOCK_', '')} - {relativeTime(invoice.createdAt)}</div>
                    </div>
                    <div className="text-right t-mono">N$${(invoice.amountCents / 100).toFixed(0)}</div>
                    <div className="text-right">
                      <span className={cn('text-[10px]', invoice.status === 'PAID' ? 'chip-done' : 'chip-call')}>{invoice.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-line">
              <h3 className="text-[14px] font-semibold text-ink">Recent SMS purchases</h3>
            </div>
            {billing.recentPurchases.length === 0 ? (
              <div className="p-5 text-[12px] text-ink-3">No purchases yet.</div>
            ) : (
              <div className="divide-y divide-line">
                {billing.recentPurchases.map((purchase: Purchase) => (
                  <div key={purchase.id} className="grid grid-cols-[1fr_120px_100px] gap-3 items-center px-5 py-2.5 text-[12px]">
                    <div className="min-w-0">
                      <div className="font-medium text-ink truncate">{purchase.packageId} pack</div>
                      <div className="text-[11px] text-ink-3 mt-0.5">{purchase.credits.toLocaleString()} credits - {relativeTime(purchase.createdAt)}</div>
                    </div>
                    <div className="text-right t-mono">N$${(purchase.amountCents / 100).toFixed(0)}</div>
                    <div className="text-right text-[10px] text-ink-3">{formatTime(purchase.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

function BillingSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading billing">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-5 w-20 rounded bg-surface-2 animate-pulse" />
          <div className="h-3 w-56 max-w-[70vw] rounded bg-surface-2 animate-pulse" />
        </div>
        <div className="h-8 w-20 rounded-md bg-surface-2 animate-pulse" />
      </div>
      <section className="card p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-2">
            <div className="h-4 w-28 rounded bg-surface-2 animate-pulse" />
            <div className="h-3 w-48 rounded bg-surface-2 animate-pulse" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-8 w-20 rounded-md bg-surface-2 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 bg-surface p-4">
              <div className="h-3 w-20 rounded bg-surface-2 animate-pulse" />
              <div className="mt-3 h-5 w-24 rounded bg-surface-2 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
      <section className="card p-5">
        <div className="h-4 w-36 rounded bg-surface-2 animate-pulse" />
        <div className="mt-3 grid md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-32 rounded-lg border border-line bg-surface-2 animate-pulse" />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-4">
      <div className="t-eyebrow text-[10px]">{label}</div>
      <div className="t-mono text-[18px] text-ink font-semibold mt-1 truncate">{value}</div>
    </div>
  );
}
