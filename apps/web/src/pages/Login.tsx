import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, KeyRound, LogIn } from 'lucide-react';
import { BrandLogo } from '@/components/Brand';
import { demoAccounts, demoPassword, destinationForDemoEmail, type DemoAccount } from '@/lib/demoAccounts';
import { api } from '@/lib/api';

const SESSION_KEY = 'omukweyo_session';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('owner@omukweyo.demo');
  const [password, setPassword] = useState(demoPassword);
  const [opening, setOpening] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <section className="container-x py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link to="/" aria-label="Omukweyo home">
            <BrandLogo />
          </Link>
          <Link to="/signup" className="btn btn-outline btn-sm">Sign up</Link>
        </div>

        <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-5 items-start">
          <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <span className="h-10 w-10 rounded-lg bg-blue-50 text-accent grid place-items-center">
                <KeyRound size={18} />
              </span>
              <div>
                <h1 className="text-[22px] font-semibold text-ink leading-tight">Open a demo workspace.</h1>
                <p className="text-[12px] text-ink-2 mt-0.5">One click. No setup. Password for all accounts: <span className="font-mono text-ink">{demoPassword}</span></p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  data-testid={`demo-account-${account.role.toLowerCase().replace(/\s+/g, '-')}`}
                  type="button"
                  onClick={() => enterWorkspace(account)}
                  className="rounded-lg border border-line bg-surface-2 p-3 text-left hover:border-accent hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[14px] font-semibold text-ink">{account.role}</span>
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-accent">
                      Enter <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-ink-3 truncate mt-1">{account.email}</div>
                  <p className="text-[11px] text-ink-2 mt-2 leading-relaxed">{account.description}</p>
                </button>
              ))}
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
            <button data-testid="login-submit" type="submit" disabled={!!opening} className="btn btn-primary w-full mt-4">
              {opening ? 'Opening...' : 'Log in'}
            </button>
            <button type="button" onClick={loginWithCredentials} disabled={!!opening} className="btn btn-outline w-full mt-2">Continue with Google</button>
            <p className="text-[11px] text-ink-3 mt-3">Email verification and Google OAuth run in sandbox mode for this local build.</p>
          </form>
        </div>
      </div>
    </section>
  );
}
