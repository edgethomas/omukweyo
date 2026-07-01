import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, LogOut } from 'lucide-react';
import CustomerProfileForm, { type CustomerProfileFormValues, type ReceiptPreference } from '@/features/customer/CustomerProfileForm';
import { api } from '@/lib/api';

const CUSTOMER_KEY = 'omukweyo_customer';
const LEGACY_CUSTOMER_KEY = 'inline_customer';
const SESSION_KEY = 'omukweyo_session';

type StoredCustomer = {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  createdAt?: string;
  smsConsent?: boolean;
  receiptPreference?: ReceiptPreference;
};

type StoredSession = {
  token?: string;
  user?: {
    id?: string;
    customerId?: string;
    role?: string;
    name?: string;
    phone?: string;
    email?: string;
    avatarUrl?: string;
    destination?: string;
  };
};

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function defaultReceiptPreference(email?: string): ReceiptPreference {
  return email?.trim() ? 'email' : 'sms';
}

function formFromCustomer(customer: StoredCustomer): CustomerProfileFormValues {
  return {
    name: customer.name ?? '',
    phone: customer.phone ?? '',
    email: customer.email ?? '',
    smsConsent: customer.smsConsent ?? true,
    receiptPreference: customer.receiptPreference ?? defaultReceiptPreference(customer.email),
  };
}

function loadCustomerProfile(): StoredCustomer {
  const stored = readJson<StoredCustomer>(CUSTOMER_KEY) ?? readJson<StoredCustomer>(LEGACY_CUSTOMER_KEY);
  const session = readJson<StoredSession>(SESSION_KEY);
  const user = session?.user;

  return {
    id: stored?.id ?? user?.customerId,
    name: stored?.name ?? user?.name ?? '',
    phone: stored?.phone ?? user?.phone ?? '',
    email: stored?.email ?? user?.email ?? '',
    avatarUrl: stored?.avatarUrl ?? user?.avatarUrl,
    createdAt: stored?.createdAt,
    smsConsent: stored?.smsConsent ?? true,
    receiptPreference: stored?.receiptPreference ?? defaultReceiptPreference(stored?.email ?? user?.email),
  };
}

function updateStoredProfile(customer: StoredCustomer, preferences?: Pick<CustomerProfileFormValues, 'smsConsent' | 'receiptPreference'>) {
  const nextCustomer: StoredCustomer = {
    ...customer,
    smsConsent: preferences?.smsConsent ?? customer.smsConsent ?? true,
    receiptPreference: preferences?.receiptPreference ?? customer.receiptPreference ?? defaultReceiptPreference(customer.email),
  };

  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(nextCustomer));
  localStorage.setItem(LEGACY_CUSTOMER_KEY, JSON.stringify(nextCustomer));

  const session = readJson<StoredSession>(SESSION_KEY);
  if (!session?.user) return;

  const nextSession: StoredSession = {
    ...session,
    user: {
      ...session.user,
      customerId: nextCustomer.id ?? session.user.customerId,
      name: nextCustomer.name ?? session.user.name,
      phone: nextCustomer.phone ?? session.user.phone,
      email: nextCustomer.email ?? session.user.email,
      avatarUrl: nextCustomer.avatarUrl ?? session.user.avatarUrl,
      destination: session.user.destination ?? '/customer',
    },
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
  window.dispatchEvent(new Event('omukweyo:profile-updated'));
}

function initials(name: string) {
  return name
    .trim()
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CU';
}

function sameForm(left: CustomerProfileFormValues, right: CustomerProfileFormValues) {
  return (
    left.name === right.name &&
    left.phone === right.phone &&
    left.email === right.email &&
    left.smsConsent === right.smsConsent &&
    left.receiptPreference === right.receiptPreference
  );
}

function savedFormFromApi(customer: StoredCustomer, submitted: CustomerProfileFormValues): CustomerProfileFormValues {
  return {
    name: customer.name ?? submitted.name.trim(),
    phone: customer.phone ?? submitted.phone.trim(),
    email: customer.email ?? submitted.email.trim(),
    smsConsent: submitted.smsConsent,
    receiptPreference: submitted.receiptPreference,
  };
}

export default function CustomerProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialProfile = useMemo(() => loadCustomerProfile(), []);
  const initialForm = useMemo(() => formFromCustomer(initialProfile), [initialProfile]);
  const [form, setForm] = useState<CustomerProfileFormValues>(initialForm);
  const [savedForm, setSavedForm] = useState<CustomerProfileFormValues>(initialForm);
  const [customerId, setCustomerId] = useState(initialProfile.id);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl);
  const [createdAt, setCreatedAt] = useState(initialProfile.createdAt);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editing, setEditing] = useState(false);
  const dirty = !sameForm(form, savedForm);
  const summary = form.email.trim() || form.phone.trim() || 'Add contact details for receipts and SMS';

  useEffect(() => {
    if (!initialProfile.id) return;
    api.customerVisit(initialProfile.id)
      .then((payload) => {
        const nextCustomer: StoredCustomer = {
          ...payload.customer,
          smsConsent: initialForm.smsConsent,
          receiptPreference: initialForm.receiptPreference,
        };
        const nextForm = formFromCustomer(nextCustomer);
        setForm(nextForm);
        setSavedForm(nextForm);
        setCustomerId(payload.customer.id);
        setAvatarUrl(payload.customer.avatarUrl);
        setCreatedAt(payload.customer.createdAt);
        updateStoredProfile(payload.customer, {
          smsConsent: nextForm.smsConsent,
          receiptPreference: nextForm.receiptPreference,
        });
      })
      .catch(() => {
        // The profile form still works with the current session data if the demo record is missing.
      });
  }, [initialForm.receiptPreference, initialForm.smsConsent, initialProfile.id]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const submitted: CustomerProfileFormValues = {
        ...form,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      };
      const { customer } = await api.customerSignup({
        name: submitted.name,
        phone: submitted.phone,
        email: submitted.email || undefined,
      });
      const nextForm = savedFormFromApi(customer, submitted);
      setCustomerId(customer.id);
      setAvatarUrl(customer.avatarUrl);
      setCreatedAt(customer.createdAt);
      setForm(nextForm);
      setSavedForm(nextForm);
      updateStoredProfile(customer, {
        smsConsent: nextForm.smsConsent,
        receiptPreference: nextForm.receiptPreference,
      });
      setNotice('Profile saved.');
      setEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ensureSavedCustomer = async () => {
    if (customerId) return customerId;
    const submitted: CustomerProfileFormValues = {
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
    };
    const { customer } = await api.customerSignup({
      name: submitted.name,
      phone: submitted.phone,
      email: submitted.email || undefined,
    });
    const nextForm = savedFormFromApi(customer, submitted);
    setCustomerId(customer.id);
    setCreatedAt(customer.createdAt);
    setForm(nextForm);
    setSavedForm(nextForm);
    updateStoredProfile(customer, {
      smsConsent: nextForm.smsConsent,
      receiptPreference: nextForm.receiptPreference,
    });
    return customer.id;
  };

  const uploadAvatar = async (file: File) => {
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Add your name and phone before uploading a profile photo.');
      return;
    }
    setUploadingAvatar(true);
    setError(null);
    setNotice(null);
    try {
      const id = await ensureSavedCustomer();
      const { customer } = await api.customerUploadAvatar(id, file);
      setAvatarUrl(customer.avatarUrl);
      updateStoredProfile(customer, {
        smsConsent: form.smsConsent,
        receiptPreference: form.receiptPreference,
      });
      setNotice('Profile photo uploaded.');
    } catch (err: any) {
      setError(err.message);
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
      navigate('/login');
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-50 text-[18px] font-semibold text-accent"
              aria-label="Upload photo"
            >
              {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(form.name)}
              <span className="absolute inset-0 hidden place-items-center bg-black/45 text-white group-hover:grid">
                <Camera size={18} />
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadAvatar(file);
                event.currentTarget.value = '';
              }}
            />
            <div className="min-w-0">
              <h2 className="truncate text-[20px] font-semibold text-ink">{form.name.trim() || 'Customer profile'}</h2>
              <p className="mt-1 truncate text-[13px] text-ink-2">{summary}</p>
              {createdAt && <p className="mt-1 text-[11px] text-ink-3">Created {new Date(createdAt).toLocaleDateString('en-NA')}</p>}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar || loading} className="btn btn-outline btn-md">
              {uploadingAvatar ? 'Uploading...' : 'Edit photo'}
            </button>
            <button type="button" onClick={signOut} className="btn btn-outline btn-md border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>

        {notice && <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">{notice}</div>}
        {error && <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>}

        <div className="mt-6">
          <CustomerProfileForm
            values={form}
            onChange={setForm}
            disabled={loading || uploadingAvatar}
            readOnly={!editing}
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-end">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setForm(savedForm);
                  setNotice(null);
                  setError(null);
                  setEditing(false);
                }}
                disabled={loading || uploadingAvatar}
                className="btn btn-outline btn-md"
              >
                Cancel
              </button>
              <button type="submit" disabled={loading || uploadingAvatar} className="btn btn-primary btn-md">
                {loading ? 'Saving...' : 'Save changes'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setNotice(null);
                setError(null);
                setEditing(true);
              }}
              className="btn btn-primary btn-md"
            >
              Edit profile
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
