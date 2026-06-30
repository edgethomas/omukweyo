import { Check, X } from 'lucide-react';

export type UserProfileFormValues = {
  name: string;
  phone: string;
  email: string;
};

type UserProfileFormProps = {
  values: UserProfileFormValues;
  disabled?: boolean;
  readOnly?: boolean;
  onChange: (values: UserProfileFormValues) => void;
  emailOptional?: boolean;
};

function valueOrFallback(value: string, fallback: string) {
  return value.trim() ? value.trim() : fallback;
}

/**
 * Reusable form for any logged-in user (staff, owner, manager, runner, admin).
 * Customer has its own richer form because it also captures SMS consent + receipt
 * preference — see features/customer/CustomerProfileForm.
 */
export default function UserProfileForm({
  values,
  disabled = false,
  readOnly = false,
  onChange,
  emailOptional = false,
}: UserProfileFormProps) {
  const update = <Key extends keyof UserProfileFormValues>(key: Key, value: UserProfileFormValues[Key]) => {
    onChange({ ...values, [key]: value });
  };

  const inputClass = `input ${readOnly ? 'bg-surface-2 text-ink-2 cursor-default focus:border-line focus:ring-0' : ''}`;

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
            placeholder="Your full name"
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
        <span className="label">
          Email
          {emailOptional && !readOnly && <span className="ml-1 text-[11px] font-normal text-ink-3">(optional, but used for sign-in)</span>}
        </span>
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
            required={!emailOptional}
          />
        )}
      </div>

      {readOnly && (
        <p className="sm:col-span-2 text-[12px] text-ink-3">
          Click <span className="font-medium text-ink-2">Edit profile</span> below to change these details.
        </p>
      )}
    </div>
  );
}