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
  onChange: (values: CustomerProfileFormValues) => void;
};

export default function CustomerProfileForm({ values, disabled = false, onChange }: CustomerProfileFormProps) {
  const update = <Key extends keyof CustomerProfileFormValues>(key: Key, value: CustomerProfileFormValues[Key]) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <span className="label">Full name</span>
        <input
          className="input"
          value={values.name}
          onChange={(event) => update('name', event.target.value)}
          placeholder="Martha Customer"
          disabled={disabled}
          required
        />
      </label>

      <label className="block">
        <span className="label">Phone</span>
        <input
          className="input"
          value={values.phone}
          onChange={(event) => update('phone', event.target.value)}
          placeholder="+264 81 555 1212"
          type="tel"
          disabled={disabled}
          required
        />
      </label>

      <label className="block">
        <span className="label">Email</span>
        <input
          className="input"
          value={values.email}
          onChange={(event) => update('email', event.target.value)}
          placeholder="you@example.com"
          type="email"
          disabled={disabled}
        />
      </label>

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

      <label className="block">
        <span className="label">Receipt preference</span>
        <select
          className="select"
          value={values.receiptPreference}
          onChange={(event) => update('receiptPreference', event.target.value as ReceiptPreference)}
          disabled={disabled}
        >
          <option value="email">Email</option>
          <option value="sms">SMS</option>
        </select>
      </label>
    </div>
  );
}
