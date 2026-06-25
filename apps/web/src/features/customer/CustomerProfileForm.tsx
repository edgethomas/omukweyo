import { Check, X } from 'lucide-react';

export type ReceiptPreference = 'email' | 'sms';

export type CustomerProfileFormValues = {
  name: string;
  phone: string;
  email: string;
  smsConsent: boolean;
  receiptPreference: ReceiptPreference;
};

type CustomerProfileFormProps = {
  values: CustomerProfileFormValues;
  disabled?: boolean;
  readOnly?: boolean;
  onChange: (values: CustomerProfileFormValues) => void;
};

function valueOrFallback(value: string, fallback: string) {
  return value.trim() ? value.trim() : fallback;
}

export default function CustomerProfileForm({
  values,
  disabled = false,
  readOnly = false,
  onChange,
}: CustomerProfileFormProps) {
  const update = <Key extends keyof CustomerProfileFormValues>(key: Key, value: CustomerProfileFormValues[Key]) => {
    onChange({ ...values, [key]: value });
  };

  const locked = disabled || readOnly;
  const inputClass = `input ${readOnly ? 'bg-surface-2 text-ink-2 cursor-default focus:border-line focus:ring-0' : ''}`;
  const selectClass = `select ${readOnly ? 'bg-surface-2 text-ink-2 cursor-default focus:border-line focus:ring-0' : ''}`;

  const smsLabel = values.smsConsent ? 'Yes — queue calls and reservation reminders' : 'No';
  const receiptLabel = values.receiptPreference === 'email' ? 'Email' : 'SMS';

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="block sm:col-span-2">
        <span className="label">Full name</span>
        {readOnly ? (
          <p className="mt-1 text-[14px] text-ink">{valueOrFallback(values.name, '—')}</p>
        ) : (
          <input
            className={inputClass}
            value={values.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="Martha Customer"
            disabled={disabled}
            required
          />
        )}
      </div>

      <div className="block">
        <span className="label">Phone</span>
        {readOnly ? (
          <p className="mt-1 text-[14px] text-ink">{valueOrFallback(values.phone, '—')}</p>
        ) : (
          <input
            className={inputClass}
            value={values.phone}
            onChange={(event) => update('phone', event.target.value)}
            placeholder="+264 81 555 1212"
            type="tel"
            disabled={disabled}
            required
          />
        )}
      </div>

      <div className="block">
        <span className="label">Email</span>
        {readOnly ? (
          <p className="mt-1 text-[14px] text-ink">{valueOrFallback(values.email, '—')}</p>
        ) : (
          <input
            className={inputClass}
            value={values.email}
            onChange={(event) => update('email', event.target.value)}
            placeholder="you@example.com"
            type="email"
            disabled={disabled}
          />
        )}
      </div>

      <div className="block">
        <span className="label">SMS consent</span>
        {readOnly ? (
          <p className="mt-1 inline-flex items-center gap-2 text-[14px] text-ink">
            {values.smsConsent ? <Check size={14} className="text-emerald-600" /> : <X size={14} className="text-ink-3" />}
            {smsLabel}
          </p>
        ) : (
          <label className="flex items-start gap-3 rounded-md border border-line bg-surface-2 px-3 py-3">
            <input
              type="checkbox"
              checked={values.smsConsent}
              onChange={(event) => update('smsConsent', event.target.checked)}
              disabled={disabled}
              className="mt-0.5 h-4 w-4 rounded border-line text-accent focus:ring-accent"
            />
            <span>
              <span className="block text-[13px] font-medium text-ink">SMS consent</span>
              <span className="block text-[12px] text-ink-2">Queue calls and reservation reminders.</span>
            </span>
          </label>
        )}
      </div>

      <div className="block">
        <span className="label">Receipt preference</span>
        {readOnly ? (
          <p className="mt-1 text-[14px] text-ink">{receiptLabel}</p>
        ) : (
          <select
            className={selectClass}
            value={values.receiptPreference}
            onChange={(event) => update('receiptPreference', event.target.value as ReceiptPreference)}
            disabled={disabled}
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        )}
      </div>

      {locked && readOnly && (
        <p className="sm:col-span-2 text-[12px] text-ink-3">Click <span className="font-medium text-ink-2">Edit profile</span> below to change these details.</p>
      )}
    </div>
  );
}
