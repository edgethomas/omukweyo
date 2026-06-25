import { useMemo, useState } from 'react';
import type { ElementType } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Check, Code2, CreditCard, Headphones, QrCode } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const BUSINESS_KEY = 'inline_business';

const industries = [
  'Banking and financial services',
  'Healthcare and clinic',
  'Government office',
  'Salon and spa',
  'School and university',
  'Restaurant and food',
  'Telco and retail',
  'Service center',
  'Other',
];

const plans = [
  { value: 'FREE', label: 'Free', price: 'N$0', body: 'One branch, one service, public page, trial SMS.' },
  { value: 'STARTER', label: 'Starter', price: 'N$399', body: 'One branch, many services, embed, analytics, SMS enabled.' },
  { value: 'BUSINESS', label: 'Business', price: 'N$999', body: 'Multi-branch, custom branding, exports, priority support.' },
] as const;

const setupCards: { Icon: ElementType; title: string; body: string }[] = [
  { Icon: QrCode, title: 'Public queue page', body: 'Customers can join from a QR or link.' },
  { Icon: Headphones, title: 'Staff console', body: 'Operators can call, serve, hold, or miss tickets.' },
  { Icon: BarChart3, title: 'Company admin console', body: 'Owners manage users, branches, billing, SMS, and analytics.' },
  { Icon: Code2, title: 'Website embed', body: 'Businesses can drop the queue into their own site.' },
];

const stepFields: Record<number, Array<keyof FormState>> = {
  1: ['ownerName', 'ownerEmail', 'ownerPhone', 'companyName', 'industry'],
  2: ['branchName', 'city', 'openingHours'],
  3: ['serviceName', 'averageServiceMinutes'],
  4: ['plan'],
};

type FormState = {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  companyName: string;
  industry: string;
  branchName: string;
  address: string;
  city: string;
  branchPhone: string;
  openingHours: string;
  serviceName: string;
  averageServiceMinutes: number;
  plan: 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
};

const initialForm: FormState = {
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
  companyName: '',
  industry: 'Service center',
  branchName: '',
  address: '',
  city: 'Windhoek',
  branchPhone: '',
  openingHours: '08:00 - 16:30',
  serviceName: '',
  averageServiceMinutes: 8,
  plan: 'STARTER',
};

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [onboarding, setOnboarding] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = useMemo(() => Math.round((step / 4) * 100), [step]);

  const update = (key: keyof FormState, value: string | number) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const missingForStep = (targetStep = step) => {
    return stepFields[targetStep].filter((key) => {
      const value = form[key];
      return typeof value === 'string' ? value.trim().length === 0 : !value;
    });
  };

  const continueStep = () => {
    const missing = missingForStep();
    if (missing.length > 0) {
      setError('Fill the required fields before continuing.');
      return;
    }
    setError(null);
    setStep((current) => Math.min(4, current + 1));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const missing = [1, 2, 3, 4].flatMap((targetStep) => missingForStep(targetStep));
    if (missing.length > 0) {
      setError('Fill all required fields before creating the company.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = await api.businessOnboard(form);
      localStorage.setItem(BUSINESS_KEY, JSON.stringify(payload.onboarding));
      setOnboarding(payload.onboarding);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-x py-12">
      <div className="grid lg:grid-cols-[1fr_420px] gap-8 items-start">
        <div>
          <h1 className="t-h1 text-balance max-w-3xl">Set up a business queue workspace in minutes.</h1>
          <p className="t-body mt-3 max-w-2xl">
            Create the owner account, first branch, first service, and starter plan. The demo returns live links for the admin console, public queue page, staff console, and embed.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 mt-7 max-w-2xl">
            {setupCards.map(({ Icon, title, body }) => (
              <div key={title} className="card p-4">
                <Icon size={17} className="text-accent" />
                <h3 className="text-[13px] font-semibold text-ink mt-2">{title}</h3>
                <p className="text-[12px] text-ink-2 mt-1">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          {onboarding ? (
            <LaunchState onboarding={onboarding} />
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="t-eyebrow">Step {step} of 4 - {['Owner', 'Branch', 'Service', 'Plan'][step - 1]}</div>
                  <span className="t-mono text-[11px] text-ink-3">{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-line overflow-hidden">
                  <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>}

              {step === 1 && (
                <div className="space-y-3">
                  <h2 className="text-[16px] font-semibold text-ink">Owner and company</h2>
                  <Field label="Owner name" value={form.ownerName} onChange={(value) => update('ownerName', value)} placeholder="Selma Nakale" />
                  <Field label="Work email" type="email" value={form.ownerEmail} onChange={(value) => update('ownerEmail', value)} placeholder="selma@company.com" />
                  <Field label="Phone" type="tel" value={form.ownerPhone} onChange={(value) => update('ownerPhone', value)} placeholder="+264 81 555 1212" />
                  <Field label="Company name" value={form.companyName} onChange={(value) => update('companyName', value)} placeholder="Selma Services" />
                  <Select label="Industry" value={form.industry} onChange={(value) => update('industry', value)} options={industries} />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <h2 className="text-[16px] font-semibold text-ink">First branch</h2>
                  <Field label="Branch name" value={form.branchName} onChange={(value) => update('branchName', value)} placeholder="Main branch" />
                  <Field label="Address" value={form.address} onChange={(value) => update('address', value)} placeholder="Independence Ave" optional />
                  <Field label="City" value={form.city} onChange={(value) => update('city', value)} placeholder="Windhoek" />
                  <Field label="Branch phone" type="tel" value={form.branchPhone} onChange={(value) => update('branchPhone', value)} placeholder="+264 61 200 1000" optional />
                  <Field label="Opening hours" value={form.openingHours} onChange={(value) => update('openingHours', value)} placeholder="08:00 - 16:30" />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <h2 className="text-[16px] font-semibold text-ink">First service</h2>
                  <Field label="Service name" value={form.serviceName} onChange={(value) => update('serviceName', value)} placeholder="General service" />
                  <Field
                    label="Average service time"
                    type="number"
                    value={String(form.averageServiceMinutes)}
                    onChange={(value) => update('averageServiceMinutes', Number(value))}
                    placeholder="8"
                  />
                  <div className="rounded-md border border-line bg-surface-2 p-3 text-[12px] text-ink-2">
                    This controls ETA estimates and smart reservation timing.
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <h2 className="text-[16px] font-semibold text-ink">Choose plan</h2>
                  <div className="grid gap-2">
                    {plans.map((plan) => (
                      <button
                        key={plan.value}
                        type="button"
                        onClick={() => update('plan', plan.value)}
                        className={cn(
                          'border text-left p-3 rounded-md transition-colors',
                          form.plan === plan.value ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:bg-surface-2',
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-[13px] font-semibold text-ink">{plan.label}</div>
                          <div className="t-mono text-[13px] text-ink">{plan.price}</div>
                        </div>
                        <p className="text-[12px] text-ink-2 mt-1">{plan.body}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                {step > 1 ? (
                  <button type="button" onClick={() => { setError(null); setStep((current) => current - 1); }} className="btn btn-outline btn-md">Back</button>
                ) : <span />}
                {step < 4 ? (
                  <button type="button" onClick={continueStep} className="btn btn-primary btn-md">
                    Continue <ArrowRight size={14} />
                  </button>
                ) : (
                  <button type="submit" disabled={loading} className="btn btn-primary btn-md">
                    {loading ? 'Creating...' : 'Create company'} <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  optional,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <span className="label">{label}{optional ? <span className="text-ink-3 font-normal"> optional</span> : null}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} type={type} placeholder={placeholder} className="input" />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="select">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function LaunchState({ onboarding }: { onboarding: any }) {
  const links = [
    { label: 'Open admin console', to: onboarding.launchLinks.dashboard, icon: BarChart3 },
    { label: 'Public page', to: onboarding.launchLinks.publicPage, icon: QrCode },
    { label: 'Staff console', to: onboarding.launchLinks.staffConsole, icon: Headphones },
    { label: 'Embed widget', to: onboarding.launchLinks.embed, icon: Code2 },
    { label: 'Billing', to: onboarding.launchLinks.billing, icon: CreditCard },
  ];

  return (
    <div className="space-y-5">
      <div className="text-center py-2">
        <div className="t-eyebrow mb-2 text-emerald-700">Company ready</div>
        <h2 className="text-[18px] font-semibold text-ink">{onboarding.companyName} is ready to operate.</h2>
        <p className="text-[12px] text-ink-2 mt-1.5">Branch, service, staff console, public page, embed, and billing links are ready.</p>
      </div>

      <div className="grid gap-2">
        {links.map((link) => (
          <Link key={link.label} to={link.to} className="btn btn-outline btn-md justify-between">
            <span className="inline-flex items-center gap-2"><link.icon size={14} /> {link.label}</span>
            <ArrowRight size={14} />
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-line bg-surface-2 p-4">
        <div className="t-eyebrow mb-3">Launch checklist</div>
        <div className="space-y-2">
          {onboarding.checklist.map((item: any) => (
            <div key={item.label} className="flex items-center gap-2 text-[12px] text-ink-2">
              <Check size={13} className="text-emerald-600" />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
