import { Link } from 'react-router-dom';
import { ArrowRight, Building2, User, UserCheck } from 'lucide-react';
import { BrandLogo } from '@/components/Brand';

const signupOptions = [
  {
    title: 'Customer',
    body: 'Reserve future spots and track live tickets.',
    to: '/customer/signup',
    cta: 'Customer signup',
    icon: User,
  },
  {
    title: 'Business',
    body: 'Create branches, QR codes, widgets, and the company admin console.',
    to: '/onboarding',
    cta: 'Business signup',
    icon: Building2,
  },
  {
    title: 'Runner',
    body: 'Apply for approved public-line jobs.',
    to: '/runner/signup',
    cta: 'Runner signup',
    icon: UserCheck,
  },
];

export default function Signup() {
  return (
    <section className="container-x py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-7 flex items-center justify-between gap-4">
          <Link to="/" aria-label="Omukweyo home">
            <BrandLogo />
          </Link>
          <Link to="/login" className="btn btn-outline btn-sm">Log in</Link>
        </div>

        <div className="mb-6">
          <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight text-ink leading-tight">Sign up for Omukweyo.</h1>
          <p className="text-[14px] text-ink-2 mt-2">Choose one account type. You can add the others later.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {signupOptions.map((option) => (
            <Link
              key={option.title}
              to={option.to}
              className="rounded-xl border border-line bg-surface p-5 hover:border-accent hover:shadow-sm transition-all group"
            >
              <span className="h-11 w-11 rounded-lg bg-blue-50 text-accent grid place-items-center">
                <option.icon size={20} />
              </span>
              <h2 className="text-[18px] font-semibold text-ink mt-4">{option.title}</h2>
              <p className="text-[12px] text-ink-2 mt-1 min-h-10">{option.body}</p>
              <div className="btn btn-primary btn-sm mt-5">
                {option.cta} <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-5 rounded-lg border border-line bg-surface-2 px-4 py-3 text-[12px] text-ink-2">
          Presenting the system? Use <Link to="/login" className="font-medium text-accent hover:underline">demo login</Link> to open each workspace instantly.
        </div>
      </div>
    </section>
  );
}
