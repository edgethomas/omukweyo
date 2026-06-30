import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { getBrowserSupabase } from '@/lib/supabase';

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getBrowserSupabase().auth.getSession()
      .then(({ data, error: sessionError }: { data: any; error: any }) => {
        if (!mounted) return;
        if (sessionError) {
          setError(sessionError.message);
          return;
        }
        setReady(Boolean(data.session));
        if (!data.session) setError('Open the latest password reset email link to set a new password.');
      })
      .catch((err: any) => {
        if (mounted) setError(err?.message ?? 'Could not read the reset session.');
      });
    return () => {
      mounted = false;
    };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    const { error: updateError } = await getBrowserSupabase().auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await getBrowserSupabase().auth.signOut();
    setPassword('');
    setConfirm('');
    setReady(false);
    setNotice('Password updated. Sign in with your new password.');
  };

  return (
    <section className="container-x py-12">
      <div className="mx-auto max-w-md rounded-xl border border-line bg-surface p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-accent">
            <KeyRound size={18} />
          </span>
          <div>
            <h1 className="text-[22px] font-semibold text-ink leading-tight">Reset password</h1>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-2">Choose a new password for your Omukweyo account.</p>
          </div>
        </div>

        {notice && (
          <div className="mt-5 flex gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}
        {error && (
          <div className="mt-5 flex gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-3">
          <label className="block">
            <span className="label">New password</span>
            <input
              type="password"
              minLength={8}
              required
              disabled={!ready || busy}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input"
              autoComplete="new-password"
            />
          </label>
          <label className="block">
            <span className="label">Confirm password</span>
            <input
              type="password"
              minLength={8}
              required
              disabled={!ready || busy}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="input"
              autoComplete="new-password"
            />
          </label>
          <button type="submit" disabled={!ready || busy} className="btn btn-primary btn-lg w-full">
            {busy ? 'Updating...' : 'Update password'}
          </button>
          <Link to="/login" className="btn btn-outline btn-lg w-full">Back to login</Link>
        </form>
      </div>
    </section>
  );
}
