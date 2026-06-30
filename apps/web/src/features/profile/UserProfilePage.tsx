import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, LogOut, Settings as SettingsIcon, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import UserProfileForm, { type UserProfileFormValues } from './UserProfileForm';

const SESSION_KEY = 'omukweyo_session';

type SessionUser = {
  id?: string;
  role?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  destination?: string;
};

type StoredSession = {
  token?: string;
  user?: SessionUser;
};

type Notice = { kind: 'success' | 'error'; text: string } | null;

type UserProfilePageProps = {
  roleLabel: string;
  settingsPath?: string;
  allowDelete?: boolean;
  deleteMessage?: string;
  emailOptional?: boolean;
  emailRequired?: boolean;
};

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CU'
  );
}

function persistUser(user: SessionUser) {
  const session = readJson<StoredSession>(SESSION_KEY);
  if (!session) return;
  const next: StoredSession = {
    ...session,
    user: {
      ...session.user,
      id: user.id ?? session.user?.id,
      name: user.name ?? session.user?.name,
      email: user.email ?? session.user?.email,
      phone: user.phone ?? session.user?.phone,
      avatarUrl: user.avatarUrl ?? session.user?.avatarUrl,
      role: user.role ?? session.user?.role,
      destination: user.destination ?? session.user?.destination,
    },
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('omukweyo:profile-updated'));
}

function sameForm(left: UserProfileFormValues, right: UserProfileFormValues) {
  return left.name === right.name && left.phone === right.phone && left.email === right.email;
}

export default function UserProfilePage({
  roleLabel,
  settingsPath,
  allowDelete = false,
  deleteMessage = 'Removes your account, contact details, session, and photo. Past tickets and history stay as records.',
  emailOptional = false,
  emailRequired = false,
}: UserProfilePageProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialSession = useMemo(() => readJson<StoredSession>(SESSION_KEY)?.user ?? null, []);
  const initialForm: UserProfileFormValues = useMemo(
    () => ({
      name: initialSession?.name ?? '',
      phone: initialSession?.phone ?? '',
      email: initialSession?.email ?? '',
    }),
    [initialSession],
  );

  const [form, setForm] = useState<UserProfileFormValues>(initialForm);
  const [savedForm, setSavedForm] = useState<UserProfileFormValues>(initialForm);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initialSession?.avatarUrl);
  const [notice, setNotice] = useState<Notice>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dirty = !sameForm(form, savedForm);

  // Re-sync from /auth/me on mount so we have the latest avatarUrl
  useEffect(() => {
    const token = readJson<StoredSession>(SESSION_KEY)?.token;
    if (!token) return;
    api.me(token)
      .then(({ user }) => {
        if (!user) return;
        const nextForm: UserProfileFormValues = {
          name: user.name ?? '',
          phone: user.phone ?? '',
          email: user.email ?? '',
        };
        setForm(nextForm);
        setSavedForm(nextForm);
        setAvatarUrl(user.avatarUrl);
        persistUser(user);
      })
      .catch(() => {
        // Stale token or offline — keep local session data.
      });
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setNotice(null);
    try {
      const submitted: UserProfileFormValues = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      };
      const { user } = await api.updateMyProfile({
        name: submitted.name,
        phone: submitted.phone || null,
        email: emailOptional && !submitted.email ? undefined : submitted.email,
      });
      const nextForm: UserProfileFormValues = {
        name: user.name ?? submitted.name,
        phone: user.phone ?? submitted.phone,
        email: user.email ?? submitted.email,
      };
      setSavedForm(nextForm);
      setForm(nextForm);
      setAvatarUrl(user.avatarUrl);
      persistUser(user);
      setNotice({ kind: 'success', text: 'Profile saved.' });
      setEditing(false);
    } catch (err: any) {
      setNotice({ kind: 'error', text: err?.message ?? 'Could not save profile.' });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!form.name.trim() || (!emailOptional && !form.email.trim())) {
      setNotice({ kind: 'error', text: 'Add your name and email before uploading a profile photo.' });
      return;
    }
    if (emailRequired && !form.email.trim()) {
      setNotice({ kind: 'error', text: 'Add your email first — it is your sign-in handle.' });
      return;
    }
    setUploadingAvatar(true);
    setNotice(null);
    try {
      const { user } = await api.uploadMyAvatar(file);
      setAvatarUrl(user.avatarUrl);
      persistUser(user);
      setNotice({ kind: 'success', text: 'Profile photo uploaded.' });
    } catch (err: any) {
      setNotice({ kind: 'error', text: err?.message ?? 'Could not upload avatar.' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const signOut = async () => {
    try {
      const token = readJson<StoredSession>(SESSION_KEY)?.token;
      if (token) await api.logout(token);
    } catch {
      // Local sign-out still clears the browser session.
    } finally {
      localStorage.removeItem(SESSION_KEY);
      window.dispatchEvent(new Event('omukweyo:profile-updated'));
      navigate('/login');
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setNotice(null);
    try {
      await api.deleteMyAccount();
      localStorage.removeItem(SESSION_KEY);
      window.dispatchEvent(new Event('omukweyo:profile-updated'));
      navigate('/login');
    } catch (err: any) {
      setDeleting(false);
      setConfirmDeleteOpen(false);
      setNotice({ kind: 'error', text: err?.message ?? 'Could not delete account.' });
    }
  };

  const summary = form.email.trim() || form.phone.trim() || `${roleLabel} profile`;

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="card p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative grid h-14 w-14 sm:h-16 sm:w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-50 text-[16px] sm:text-[18px] font-semibold text-accent"
              aria-label="Upload photo"
              title="Upload photo"
            >
              {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(form.name)}
              <span className="absolute inset-0 hidden place-items-center bg-black/45 text-white group-hover:grid">
                <Camera size={18} />
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadAvatar(file);
                event.currentTarget.value = '';
              }}
            />
            <div className="min-w-0">
              <div className="t-eyebrow text-[10px]">{roleLabel}</div>
              <h2 className="truncate text-[17px] sm:text-[20px] font-semibold text-ink">{form.name.trim() || `${roleLabel} profile`}</h2>
              <p className="mt-1 truncate text-[12px] sm:text-[13px] text-ink-2">{summary}</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar || loading} className="btn btn-outline btn-sm sm:btn-md">
              {uploadingAvatar ? 'Uploading...' : 'Edit photo'}
            </button>
            {settingsPath && (
              <Link to={settingsPath} className="btn btn-outline btn-sm sm:btn-md">
                <SettingsIcon size={14} />
                Settings
              </Link>
            )}
            <button type="button" onClick={signOut} className="btn btn-outline btn-sm sm:btn-md">
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>

        {notice && (
          <div
            className={`mt-5 rounded-md border px-3 py-2 text-[12px] ${
              notice.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {notice.text}
          </div>
        )}

        <div className="mt-6">
          <UserProfileForm values={form} onChange={setForm} disabled={loading || uploadingAvatar} readOnly={!editing} emailOptional={emailOptional} />
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-end">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setForm(savedForm);
                  setNotice(null);
                  setEditing(false);
                }}
                disabled={loading || uploadingAvatar}
                className="btn btn-outline btn-md"
              >
                Cancel
              </button>
              <button type="submit" disabled={loading || uploadingAvatar || !dirty} className="btn btn-primary btn-md">
                {loading ? 'Saving...' : 'Save changes'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setNotice(null);
                setEditing(true);
              }}
              className="btn btn-primary btn-md"
            >
              Edit profile
            </button>
          )}
        </div>
      </form>

      {settingsPath && (
        <section className="card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-ink">Need more options?</h2>
              <p className="mt-1 max-w-2xl text-[13px] text-ink-2">
                Change your password, two-factor, notification preferences, or delete your account from Settings.
              </p>
            </div>
            <Link to={settingsPath} className="btn btn-primary btn-md">
              <SettingsIcon size={14} />
              Open settings
            </Link>
          </div>
        </section>
      )}

      {allowDelete && (
        <section className="card border-red-200 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-red-50 text-red-600 shrink-0">
                <Trash2 size={15} />
              </span>
              <div>
                <h2 className="text-[14px] font-semibold text-ink">Delete account</h2>
                <p className="mt-0.5 text-[12px] text-ink-2 max-w-md">{deleteMessage}</p>
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
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4"
          onClick={() => !deleting && setConfirmDeleteOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Delete account confirmation"
        >
          <div className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-ink">Delete your account?</h3>
            <p className="mt-2 text-[13px] text-ink-2">{deleteMessage}</p>
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