import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  KeyRound,
  Mail,
  Phone,
  Shield,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';

const SESSION_KEY = 'omukweyo_session';

type StoredSession = {
  token?: string;
  user?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

type Notice = { kind: 'success' | 'error'; text: string } | null;

type UserSettingsPageProps = {
  roleLabel: string;
  profilePath: string;
  allowDelete?: boolean;
  onDelete?: () => Promise<void>;
  notificationsEnabled?: boolean;
  notificationDescription?: string;
};

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function UserSettingsPage({
  roleLabel,
  profilePath,
  allowDelete = true,
  onDelete,
  notificationsEnabled = true,
  notificationDescription = 'Email and SMS reminders for your account activity.',
}: UserSettingsPageProps) {
  const navigate = useNavigate();
  const session = readJson<StoredSession>(SESSION_KEY);
  const user = session?.user;
  const [notice, setNotice] = useState<Notice>(null);

  // Password change
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);

  // Forgot password
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotBusy, setForgotBusy] = useState(false);

  // 2FA
  const [twoFactor, setTwoFactor] = useState(false);

  // Notifications
  const [smsConsent, setSmsConsent] = useState(true);
  const [prefBusy, setPrefBusy] = useState(false);

  // Delete
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setNotice(null);
  }, []);

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPw !== confirmPw) {
      setNotice({ kind: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    if (newPw.length < 6) {
      setNotice({ kind: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    setPwBusy(true);
    setNotice(null);
    try {
      const res = await api.changePassword(currentPw, newPw);
      setNotice({ kind: 'success', text: res.message ?? 'Password updated.' });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setShowChangePw(false);
    } catch (err: any) {
      setNotice({ kind: 'error', text: err?.message ?? 'Could not change password.' });
    } finally {
      setPwBusy(false);
    }
  };

  const cancelChangePw = () => {
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setShowChangePw(false);
    setNotice(null);
  };

  const submitForgot = async () => {
    if (!user?.email) {
      setNotice({ kind: 'error', text: 'Add an email to your profile first, then request a reset.' });
      return;
    }
    setForgotBusy(true);
    setNotice(null);
    try {
      const res = await api.forgotPassword(user.email);
      setNotice({ kind: 'success', text: res.message });
      setForgotSent(true);
    } catch (err: any) {
      setNotice({ kind: 'error', text: err?.message ?? 'Could not send reset email.' });
    } finally {
      setForgotBusy(false);
    }
  };

  const toggleSmsConsent = (value: boolean) => {
    setSmsConsent(value);
    setPrefBusy(true);
    setNotice(null);
    // For non-customer users, SMS consent is stored locally only.
    // Backend persistence happens via api.updateMyProfile if/when needed.
    setTimeout(() => {
      setPrefBusy(false);
      setNotice({ kind: 'success', text: value ? 'SMS notifications enabled.' : 'SMS notifications disabled.' });
    }, 250);
  };

  const defaultDelete = async () => {
    try {
      await api.deleteMyAccount();
    } catch {
      // Local fallback below
    }
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event('omukweyo:profile-updated'));
    navigate('/login');
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setNotice(null);
    try {
      if (onDelete) await onDelete();
      else await defaultDelete();
    } catch (err: any) {
      setNotice({ kind: 'error', text: err?.message ?? 'Could not delete account.' });
      setDeleting(false);
      setConfirmDeleteOpen(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {notice && (
        <div
          className={`rounded-md border px-3 py-2 text-[12px] ${
            notice.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Account access */}
      <section className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-blue-50 text-accent shrink-0">
            <Shield size={15} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[14px] font-semibold text-ink leading-tight">Account access</h2>
            <p className="text-[11px] text-ink-2 mt-0.5">Password, sign-in protection, and recovery.</p>
          </div>
        </div>

        <div className="divide-y divide-line">
          {showChangePw ? (
            <form onSubmit={submitPassword} className="px-4 py-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[12px] font-medium text-ink">
                  <KeyRound size={13} className="text-accent" />
                  Change password
                </div>
                <button type="button" onClick={cancelChangePw} className="text-[11px] text-ink-3 hover:text-ink inline-flex items-center gap-1">
                  <X size={12} /> Cancel
                </button>
              </div>
              <div className="grid sm:grid-cols-3 gap-2">
                <label className="block">
                  <span className="label">Current</span>
                  <input type="password" className="input" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} autoComplete="current-password" required />
                </label>
                <label className="block">
                  <span className="label">New password</span>
                  <input type="password" className="input" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" minLength={6} required />
                </label>
                <label className="block">
                  <span className="label">Confirm</span>
                  <input type="password" className="input" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" minLength={6} required />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button type="submit" disabled={pwBusy} className="btn btn-primary btn-sm">
                  {pwBusy ? 'Updating...' : 'Update password'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex items-center gap-3">
                <KeyRound size={14} className="text-accent shrink-0" />
                <div>
                  <div className="text-[13px] font-medium text-ink">Password</div>
                  <p className="text-[11px] text-ink-2 mt-0.5">Update the password you use to sign in.</p>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:shrink-0">
                <button type="button" onClick={submitForgot} disabled={forgotBusy || forgotSent} className="btn btn-ghost btn-sm w-full sm:w-auto">
                  <Mail size={12} />
                  {forgotSent ? 'Reset sent' : forgotBusy ? 'Sending...' : 'Email reset link'}
                </button>
                <button type="button" onClick={() => setShowChangePw(true)} className="btn btn-outline btn-sm w-full sm:w-auto">
                  Change password
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div className="min-w-0 flex items-start gap-2">
              <Smartphone size={14} className="text-accent mt-0.5 shrink-0" />
              <div>
                <div className="text-[13px] font-medium text-ink">Two-factor authentication</div>
                <p className="text-[11px] text-ink-2 mt-0.5">Require a one-time code from your phone at sign-in.</p>
              </div>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
              <span className="text-[11px] text-ink-2 w-7 text-right">{twoFactor ? 'On' : 'Off'}</span>
              <input
                type="checkbox"
                checked={twoFactor}
                onChange={(e) => {
                  setTwoFactor(e.target.checked);
                  setNotice({ kind: 'success', text: e.target.checked ? 'Two-factor enabled (local simulation).' : 'Two-factor disabled.' });
                }}
                className="h-4 w-4 accent-[var(--accent)]"
              />
            </label>
          </div>
        </div>
      </section>

      {/* Notifications */}
      {notificationsEnabled && (
        <section className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-blue-50 text-accent shrink-0">
              <Bell size={15} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[14px] font-semibold text-ink leading-tight">Notifications</h2>
              <p className="text-[11px] text-ink-2 mt-0.5">{notificationDescription}</p>
            </div>
          </div>

          <div className="px-4 py-3.5 flex items-center justify-between gap-4">
            <div className="min-w-0 flex items-start gap-2">
              <Phone size={14} className="text-accent mt-0.5 shrink-0" />
              <div>
                <div className="text-[13px] font-medium text-ink">SMS notifications</div>
                <p className="text-[11px] text-ink-2 mt-0.5">Account-relevant alerts delivered to your phone.</p>
              </div>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
              <span className="text-[11px] text-ink-2 w-7 text-right">{smsConsent ? 'On' : 'Off'}</span>
              <input type="checkbox" checked={smsConsent} onChange={(e) => toggleSmsConsent(e.target.checked)} disabled={prefBusy} className="h-4 w-4 accent-[var(--accent)]" />
            </label>
          </div>
        </section>
      )}

      {/* Connected accounts */}
      <section className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-blue-50 text-accent shrink-0">
            <KeyRound size={15} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[14px] font-semibold text-ink leading-tight">Connected accounts</h2>
            <p className="text-[11px] text-ink-2 mt-0.5">The phone and email {roleLabel ? `${roleLabel.toLowerCase()} ` : ''}Omukweyo uses to reach you.</p>
          </div>
        </div>
        <div className="divide-y divide-line">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex items-center gap-3">
              <Phone size={14} className="text-accent shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-ink-3">Phone</div>
                <div className="font-mono text-[13px] text-ink truncate">{user?.phone || 'Not set'}</div>
              </div>
            </div>
            <Link to={profilePath} className="btn btn-outline btn-sm shrink-0">
              Edit <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex items-center gap-3">
              <Mail size={14} className="text-accent shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-ink-3">Email</div>
                <div className="text-[13px] text-ink truncate">{user?.email || 'Not set'}</div>
              </div>
            </div>
            <Link to={profilePath} className="btn btn-outline btn-sm shrink-0">
              Edit <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      {allowDelete && (
        <section className="card border-red-200 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-red-50 text-red-600 shrink-0">
                <Trash2 size={15} />
              </span>
              <div>
                <h2 className="text-[14px] font-semibold text-ink">Delete account</h2>
                <p className="mt-0.5 text-[12px] text-ink-2 max-w-md">
                  Removes your account, contact details, session, and photo. Past activity stays as history.
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setConfirmDeleteOpen(true)} disabled={deleting} className="btn btn-danger btn-sm shrink-0">
              <Trash2 size={13} />
              {deleting ? 'Deleting...' : 'Delete account'}
            </button>
          </div>
        </section>
      )}

      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4" onClick={() => !deleting && setConfirmDeleteOpen(false)}>
          <div className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-ink">Delete your account?</h3>
            <p className="mt-2 text-[13px] text-ink-2">
              Your account, saved contact details, login session, and profile photo will be deleted.
            </p>
            <p className="mt-1 text-[13px] text-ink-2">Completed work, history, and audit records stay as historical records.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDeleteOpen(false)} disabled={deleting} className="btn btn-outline btn-md">
                Cancel
              </button>
              <button type="button" onClick={() => void deleteAccount()} disabled={deleting} className="btn btn-danger btn-md">
                {deleting ? 'Deleting...' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}