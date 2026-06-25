import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Check, Code2, ImagePlus, Palette, Plus, UserPlus } from 'lucide-react';
import type { Branch, Company, Service } from '@inline/shared';
import { api } from '@/lib/api';

type DashboardPayload = {
  company: Company;
  branches: Branch[];
  services: Service[];
};

export default function BusinessSettings() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [form, setForm] = useState<Partial<Company>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');

  const load = async () => {
    const payload = await api.dashboard();
    setData(payload);
    setForm(payload.company);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const company = data?.company;
  const publicUrl = company ? `/c/${company.slug}` : '/businesses';
  const logoPreview = form.logoUrl || company?.logoUrl;
  const heroPreview = form.heroImageUrl || company?.heroImageUrl;

  const update = (key: keyof Company, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = await api.businessProfile({
        name: form.name,
        industry: form.industry,
        tagline: form.tagline,
        websiteUrl: form.websiteUrl,
        publicDescription: form.publicDescription,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        logoText: form.logoText,
      });
      setData((current) => current ? { ...current, company: payload.company } : current);
      setForm(payload.company);
      setNotice('Business profile updated.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadAsset = async (file: File | undefined, type: 'logo' | 'hero') => {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const payload = await api.businessUploadAsset(file, type);
      setData((current) => current ? { ...current, company: payload.company } : current);
      setForm(payload.company);
      setNotice(`${type === 'logo' ? 'Logo' : 'Hero image'} uploaded.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addBranch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!branchName.trim()) return;
    const payload = await api.createBranch({ name: branchName.trim(), city: 'Windhoek', openingHours: '08:00 - 16:30' });
    setData((current) => current ? { ...current, branches: [...current.branches, payload.branch] } : current);
    setBranchName('');
    setNotice('Branch added.');
  };

  const addService = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!serviceName.trim()) return;
    const payload = await api.createService({ name: serviceName.trim(), averageServiceMinutes: 8 });
    setData((current) => current ? { ...current, services: [...current.services, payload.service] } : current);
    setServiceName('');
    setNotice('Service added.');
  };

  const inviteStaff = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!staffEmail.trim()) return;
    await api.inviteStaff({ name: staffEmail.split('@')[0], email: staffEmail, role: 'OPERATOR', counter: 'Counter' });
    setStaffEmail('');
    setNotice('Staff invite is ready to send.');
  };

  const previewStyle = useMemo(() => ({
    '--accent': form.primaryColor || company?.primaryColor || '#2563EB',
    '--accent-soft': `${form.primaryColor || company?.primaryColor || '#2563EB'}18`,
  }) as React.CSSProperties, [company?.primaryColor, form.primaryColor]);

  if (error) return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>;
  if (!data || !company) return <div className="card h-96 animate-pulse" />;

  return (
    <div className="space-y-5 max-w-7xl" style={previewStyle}>
      {notice && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700 flex items-center gap-2">
          <Check size={14} /> {notice}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_380px] gap-5 items-start">
        <form onSubmit={saveProfile} className="card p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="t-eyebrow mb-1">Brand profile</div>
              <h2 className="text-[20px] font-semibold text-ink">Customize the customer-facing company page.</h2>
              <p className="text-[13px] text-ink-2 mt-1">These values power search results, QR pages, reservation pages, and the website widget.</p>
            </div>
            <Palette size={18} className="text-accent" />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Company name" value={form.name ?? ''} onChange={(value) => update('name', value)} />
            <Field label="Industry" value={form.industry ?? ''} onChange={(value) => update('industry', value)} />
            <Field label="Tagline" value={form.tagline ?? ''} onChange={(value) => update('tagline', value)} />
            <Field label="Website URL" value={form.websiteUrl ?? ''} onChange={(value) => update('websiteUrl', value)} />
            <Field label="Logo initials" value={form.logoText ?? ''} onChange={(value) => update('logoText', value)} />
            <div className="grid grid-cols-2 gap-3">
              <ColorField label="Primary" value={form.primaryColor ?? '#2563EB'} onChange={(value) => update('primaryColor', value)} />
              <ColorField label="Secondary" value={form.secondaryColor ?? '#10B981'} onChange={(value) => update('secondaryColor', value)} />
            </div>
          </div>

          <label className="block">
            <span className="label">Public description</span>
            <textarea
              className="input min-h-24 py-2 resize-y"
              value={form.publicDescription ?? ''}
              onChange={(event) => update('publicDescription', event.target.value)}
            />
          </label>

          <div className="grid md:grid-cols-2 gap-3">
            <UploadBox title="Logo" image={logoPreview} onFile={(file) => uploadAsset(file, 'logo')} />
            <UploadBox title="Hero image" image={heroPreview} onFile={(file) => uploadAsset(file, 'hero')} />
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary btn-md">
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>

        <aside className="space-y-4">
          <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
            <div className="text-[13px] font-semibold text-ink mb-3">Live customer preview</div>
            <div className="overflow-hidden rounded-lg border border-line">
              <div className="h-32 bg-surface-2 relative">
                {heroPreview && <img src={heroPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                <div className="absolute left-3 bottom-3 flex items-center gap-2 text-white">
                  {logoPreview ? (
                    <img src={logoPreview} alt="" className="h-9 w-9 rounded-lg bg-white object-cover" />
                  ) : (
                    <div className="h-9 w-9 rounded-lg grid place-items-center text-[12px] font-semibold" style={{ background: form.primaryColor }}>{form.logoText}</div>
                  )}
                  <div>
                    <div className="text-[14px] font-semibold">{form.name}</div>
                    <div className="text-[11px] text-white/75">{form.tagline}</div>
                  </div>
                </div>
              </div>
              <div className="p-3 grid grid-cols-2 gap-px bg-line">
                <div className="bg-surface p-3"><div className="t-eyebrow text-[9px]">Branches</div><div className="t-mono text-lg">{data.branches.length}</div></div>
                <div className="bg-surface p-3"><div className="t-eyebrow text-[9px]">Services</div><div className="t-mono text-lg">{data.services.length}</div></div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Link to={publicUrl} className="btn btn-primary btn-sm flex-1">Open page</Link>
              <Link to="/embed" className="btn btn-outline btn-sm flex-1"><Code2 size={13} /> Widget</Link>
            </div>
          </div>

          <QuickCreate icon={Building2} title="Add branch" value={branchName} setValue={setBranchName} placeholder="New branch name" onSubmit={addBranch} />
          <QuickCreate icon={Plus} title="Add service" value={serviceName} setValue={setServiceName} placeholder="New service name" onSubmit={addService} />
          <QuickCreate icon={UserPlus} title="Invite staff" value={staffEmail} setValue={setStaffEmail} placeholder="operator@company.com" onSubmit={inviteStaff} />
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="input" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-11 rounded-md border border-line bg-surface p-1" />
        <input className="input font-mono text-[12px]" value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </label>
  );
}

function UploadBox({ title, image, onFile }: { title: string; image?: string; onFile: (file?: File) => void }) {
  return (
    <label className="block rounded-lg border border-dashed border-line bg-surface-2 p-4 cursor-pointer hover:bg-surface">
      <span className="flex items-center gap-2 text-[13px] font-semibold text-ink"><ImagePlus size={14} /> {title}</span>
      <div className="mt-3 h-24 rounded-md border border-line bg-surface overflow-hidden grid place-items-center">
        {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <span className="text-[12px] text-ink-3">Upload image</span>}
      </div>
      <input type="file" accept="image/*" className="sr-only" onChange={(event) => onFile(event.target.files?.[0])} />
    </label>
  );
}

function QuickCreate({
  icon: Icon,
  title,
  value,
  setValue,
  placeholder,
  onSubmit,
}: {
  icon: typeof Plus;
  title: string;
  value: string;
  setValue: (value: string) => void;
  placeholder: string;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
        <Icon size={14} className="text-accent" /> {title}
      </div>
      <div className="mt-3 flex gap-2">
        <input className="input h-9 text-[12px]" value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} />
        <button type="submit" className="btn btn-primary btn-sm">Add</button>
      </div>
    </form>
  );
}
