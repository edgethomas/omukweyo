import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Palette, Save, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import DashboardLayout from './DashboardLayout';

type Company = {
  id: string;
  slug: string;
  name: string;
  industry: string;
  primaryColor: string;
  secondaryColor: string;
  logoText: string;
  logoUrl?: string;
  heroImageUrl?: string;
  tagline?: string;
  websiteUrl?: string;
  publicDescription?: string;
};

export default function BrandingPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<Company | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [uploading, setUploading] = useState<null | 'logo' | 'hero'>(null);

  useEffect(() => {
    api.companyProfile().then((d: any) => {
      const c = d.company as Company;
      setCompany(c);
      setForm(c);
    });
  }, []);

  const onUpload = async (type: 'logo' | 'hero', file: File) => {
    setUploading(type);
    setNotice(null);
    try {
      const { company: updated } = await api.businessUploadAsset(file, type);
      setCompany(updated);
      setForm((f) => f ? { ...f, logoUrl: updated.logoUrl ?? f.logoUrl, heroImageUrl: updated.heroImageUrl ?? f.heroImageUrl } : f);
      setNotice({ kind: 'ok', text: `${type === 'logo' ? 'Logo' : 'Hero image'} updated.` });
    } catch (err: any) {
      setNotice({ kind: 'err', text: err.message });
    } finally {
      setUploading(null);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setPending(true);
    setNotice(null);
    try {
      const { company: updated } = await api.businessProfile({
        name: form.name,
        industry: form.industry,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        logoText: form.logoText,
        tagline: form.tagline,
        websiteUrl: form.websiteUrl,
        publicDescription: form.publicDescription,
      });
      setCompany(updated);
      setForm(updated);
      setNotice({ kind: 'ok', text: 'Store page saved.' });
    } catch (err: any) {
      setNotice({ kind: 'err', text: err.message });
    } finally {
      setPending(false);
    }
  };

  if (!form || !company) return <DashboardLayout><StorePageSkeleton /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Store page</h2>
            <p className="text-[12px] text-ink-3 mt-0.5">Edit what customers see on your public booking page</p>
          </div>
          <Link to={`/c/${company.slug}`} className="btn btn-outline btn-sm">
            <ExternalLink size={13} /> View page
          </Link>
        </div>

        {notice && (
          <div className={cn('rounded-md px-3 py-2 text-[12px]', notice.kind === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700')}>
            {notice.text}
          </div>
        )}

        <section className="card p-5">
          <h3 className="text-[14px] font-semibold text-ink">Page media</h3>
          <div className="mt-3 grid md:grid-cols-2 gap-4">
            <UploadSlot
              label="Logo"
              type="logo"
              src={company.logoUrl}
              fallback={company.logoText}
              color={company.primaryColor}
              uploading={uploading === 'logo'}
              onFile={(file) => onUpload('logo', file)}
            />
            <UploadSlot
              label="Hero image"
              type="hero"
              src={company.heroImageUrl}
              fallback="Store hero"
              color={company.primaryColor}
              uploading={uploading === 'hero'}
              onFile={(file) => onUpload('hero', file)}
            />
          </div>
        </section>

        <form onSubmit={save} className="card p-6 space-y-4">
          <h3 className="text-[14px] font-semibold text-ink">Public page details</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="label">Company name</span>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">Industry</span>
              <input className="input" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">Logo text (initials)</span>
              <input className="input" value={form.logoText} onChange={(e) => setForm({ ...form, logoText: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">Website URL</span>
              <input className="input" value={form.websiteUrl ?? ''} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">Primary color</span>
              <input type="color" className="input h-10 p-1" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">Secondary color</span>
              <input type="color" className="input h-10 p-1" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} />
            </label>
            <label className="block sm:col-span-2">
              <span className="label">Tagline</span>
              <input className="input" value={form.tagline ?? ''} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
            </label>
            <label className="block sm:col-span-2">
              <span className="label">Public description</span>
              <textarea className="input min-h-24" value={form.publicDescription ?? ''} onChange={(e) => setForm({ ...form, publicDescription: e.target.value })} />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(company)}><RefreshCw size={13} /> Reset</button>
            <button type="submit" className="btn btn-primary btn-md" disabled={pending}><Palette size={13} /> {pending ? 'Saving...' : 'Save store page'}</button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

function StorePageSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading store page editor">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-5 w-28 rounded bg-surface-2 animate-pulse" />
          <div className="h-3 w-64 max-w-[70vw] rounded bg-surface-2 animate-pulse" />
        </div>
        <div className="h-8 w-24 rounded-md bg-surface-2 animate-pulse" />
      </div>
      <div className="card p-5">
        <div className="h-4 w-24 rounded bg-surface-2 animate-pulse" />
        <div className="mt-3 grid md:grid-cols-2 gap-4">
          <div className="h-32 rounded-lg bg-surface-2 animate-pulse" />
          <div className="h-32 rounded-lg bg-surface-2 animate-pulse" />
        </div>
      </div>
      <div className="card p-6 space-y-4">
        <div className="h-4 w-32 rounded bg-surface-2 animate-pulse" />
        <div className="grid sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 rounded-md bg-surface-2 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

function UploadSlot({ label, type, src, fallback, color, uploading, onFile }: { label: string; type: 'logo' | 'hero'; src?: string; fallback: string; color: string; uploading: boolean; onFile: (file: File) => void }) {
  return (
    <div>
      <div className="t-eyebrow text-[10px] mb-1.5">{label}</div>
      <div className={cn('rounded-lg border border-line overflow-hidden bg-surface-2', type === 'hero' ? 'aspect-[16/7]' : 'aspect-square w-32')}>
        {src ? (
          <img src={src} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center font-semibold text-white" style={{ background: color }}>
            {fallback}
          </div>
        )}
      </div>
      <label className="mt-2 inline-flex items-center gap-2 cursor-pointer text-[12px] text-ink-2 hover:text-ink">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.currentTarget.value = '';
          }}
        />
        <Save size={12} /> {uploading ? 'Uploading...' : `Upload ${label.toLowerCase()}`}
      </label>
    </div>
  );
}
