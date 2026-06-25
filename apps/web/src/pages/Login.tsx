import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Briefcase, Building2, KeyRound, LogIn, Shield, User, Footprints } from 'lucide-react';
import { BrandLogo } from '@/components/Brand';
import { demoAccounts, demoPassword, destinationForDemoEmail, type DemoAccount } from '@/lib/demoAccounts';
import { api } from '@/lib/api';

const SESSION_KEY = 'omukweyo_session';

const roleIcons: Record<DemoAccount['role'], typeof User> = {
  Customer: User,
  'Business owner': Building2,
  Staff: Briefcase,
  Runner: Footprints,
  'Platform admin': Shield,
};

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.969 32.165 29.418 35 24 35c-6.075 0-11-4.925-11-11s4.925-11 11-11c2.803 0 5.357 1.05 7.318 2.77l5.657-5.657C33.046 6.053 28.74 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c2.803 0 5.357 1.05 7.318 2.77l5.657-5.657C33.046 6.053 28.74 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c4.66 0 8.897-1.79 12.078-4.708l-5.572-4.717C28.421 36.105 26.305 37 24 37c-5.392 0-9.928-2.812-11.288-6.745l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a11.022 11.022 0 0 1-3.78 5.575l.003-.002 5.572 4.717C36.972 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('owner@omukweyo.demo');
  const [password, setPassword] = useState(demoPassword);
  const [demoIndex, setDemoIndex] = useState(0);
  const [opening, setOpening] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedAccount = demoAccounts[demoIndex];

  useEffect(() => {
    if (!selectedAccount) return;
    setEmail(selectedAccount.email);
  }, [selectedAccount]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') setDemoIndex((index) => (index - 1 + demoAccounts.length) % demoAccounts.length);
      if (event.key === 'ArrowRight') setDemoIndex((index) => (index + 1) % demoAccounts.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openSession = (session: any, fallbackDestination: string) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setNotice(session.verificationNote ?? 'Demo session created.');
    navigate(session.user?.destination ?? fallbackDestination);
  };

  const enterWorkspace = async (account: DemoAccount) => {
    setOpening(account.role);
    setError(null);
    try {
      const payload = await api.login({ email: account.email, password: account.password });
      openSession(payload.session, account.destination);
    } catch (err: any) {
      setError(err.message);
      setOpening(null);
    }
  };

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    await loginWithCredentials();
  };

  const loginWithCredentials = async () => {
    setOpening('Workspace');
    setError(null);
    try {
      const payload = await api.login({ email, password });
      openSession(payload.session, destinationForDemoEmail(email));
    } catch (err: any) {
      setError(err.message);
      setOpening(null);
    }
  };

  const RoleIcon = roleIcons[selectedAccount.role];

  return (
    <section className="container-x py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link to="/" aria-label="Omukweyo home">
            <BrandLogo />
          </Link>
          <Link to="/signup" className="btn btn-outline btn-sm">Sign up</Link>
        </div>

        <div className="grid lg:grid-cols-[1fr_1fr] gap-5 items-start">
          <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <span className="h-10 w-10 rounded-lg bg-blue-50 text-accent grid place-items-center">
                <KeyRound size={18} />
              </span>
              <div>
                <h1 className="text-[22px] font-semibold text-ink leading-tight">Open a demo workspace.</h1>
                <p className="text-[12px] text-ink-2 mt-0.5">Use the arrows to flip through demo accounts. Password for all: <span className="font-mono text-ink">{demoPassword}</span></p>
              </div>
            </div>

            <div
              data-testid={`demo-account-${selectedAccount.role.toLowerCase().replace(/\s+/g, '-')}`}
              className="relative rounded-xl border border-accent/40 bg-blue-50/60 p-5"
            >
              <button
                type="button"
                onClick={() => setDemoIndex((index) => (index - 1 + demoAccounts.length) % demoAccounts.length)}
                aria-label="Previous demo account"
                className="absolute left-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-ink-2 hover:text-ink hover:border-accent transition-colors"
              >
                <ArrowLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setDemoIndex((index) => (index + 1) % demoAccounts.length)}
                aria-label="Next demo account"
                className="absolute right-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-ink-2 hover:text-ink hover:border-accent transition-colors"
              >
                <ArrowRight size={14} />
              </button>

              <div className="flex items-start gap-4 px-10">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-white text-accent border border-accent/30">
                  <RoleIcon size={26} />
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-accent font-semibold">{selectedAccount.role}</div>
                  <div className="text-[18px] font-semibold text-ink mt-1">{selectedAccount.name}</div>
                  <div className="font-mono text-[12px] text-ink-3 mt-0.5 truncate">{selectedAccount.email}</div>
                  <p className="text-[13px] text-ink-2 mt-3 leading-relaxed">{selectedAccount.description}</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  {demoAccounts.map((account, index) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => setDemoIndex(index)}
                      aria-label={`Show ${account.role}`}
                      aria-current={index === demoIndex}
                      className={`h-2 rounded-full transition-all ${index === demoIndex ? 'w-6 bg-accent' : 'w-2 bg-ink-3/40 hover:bg-ink-3'}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => void enterWorkspace(selectedAccount)}
                  disabled={!!opening}
                  className="btn btn-primary btn-lg"
                >
                  {opening === selectedAccount.role ? 'Opening...' : `Log in as ${selectedAccount.role}`}
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {demoAccounts.map((account, index) => {
                const Icon = roleIcons[account.role];
                const active = index === demoIndex;
                return (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => setDemoIndex(index)}
                    title={account.role}
                    aria-label={`Show ${account.role}`}
                    aria-current={active}
                    className={`flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors ${active ? 'border-accent bg-blue-50 text-accent' : 'border-line bg-surface text-ink-2 hover:text-ink hover:border-ink-3'}`}
                  >
                    <Icon size={12} />
                    <span className="truncate">{account.role.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {opening && (
              <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
                Opening {opening} workspace...
              </div>
            )}
            {notice && (
              <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] text-blue-700">
                {notice}
              </div>
            )}
            {error && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                {error}
              </div>
            )}
          </div>

          <form onSubmit={submitLogin} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <LogIn size={16} className="text-accent" />
              <h2 className="text-[16px] font-semibold text-ink">Use credentials</h2>
            </div>
            <label className="block">
              <span className="label">Email</span>
              <input
                data-testid="login-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="owner@omukweyo.demo"
                className="input"
              />
            </label>
            <label className="block mt-3">
              <span className="label">Password</span>
              <input
                data-testid="login-password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="demo123"
                className="input"
              />
            </label>
            <button data-testid="login-submit" type="submit" disabled={!!opening} className="btn btn-primary btn-lg w-full mt-5">
              {opening ? 'Opening...' : 'Log in'}
            </button>
            <button type="button" onClick={loginWithCredentials} disabled={!!opening} className="btn btn-outline btn-lg w-full mt-2">
              <GoogleIcon size={18} />
              Continue with Google
            </button>
            <p className="text-[11px] text-ink-3 mt-3">Email verification and Google OAuth run in sandbox mode for this local build.</p>
          </form>
        </div>
      </div>
    </section>
  );
}
