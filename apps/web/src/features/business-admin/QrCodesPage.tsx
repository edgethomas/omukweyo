import { useEffect, useState } from 'react';
import { Download, QrCode, Share2 } from 'lucide-react';
import { api } from '@/lib/api';
import BusinessQr from '@/components/BusinessQr';
import DashboardLayout from './DashboardLayout';

type Company = { id: string; slug: string; name: string; primaryColor: string; tagline?: string };

export default function QrCodesPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [branches, setBranches] = useState<{ id: string; slug: string; name: string }[]>([]);

  useEffect(() => {
    api.businessWorkspace().then((d: any) => {
      setCompany(d.company);
      setBranches(d.branches ?? []);
    });
  }, []);

  if (!company) return <DashboardLayout><div className="card p-6 h-64 animate-pulse" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">QR codes & posters</h2>
            <p className="text-[12px] text-ink-3 mt-0.5">Print these and put them at the door, counter, or receipt desk</p>
          </div>
        </div>

        <section className="card p-5">
          <h3 className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><QrCode size={14} /> Company QR</h3>
          <p className="text-[12px] text-ink-3 mt-1">Points to your public company page so customers can pick a branch and join.</p>
          <div className="mt-3 max-w-xs">
            <BusinessQr title="Public company page" subtitle="Open the company and pick a service." path={`/c/${company.slug}`} color={company.primaryColor} />
          </div>
        </section>

        <section className="card p-5">
          <h3 className="text-[14px] font-semibold text-ink">Per-branch QR codes</h3>
          <p className="text-[12px] text-ink-3 mt-1">A specific QR for each branch if you want shorter paths on posters.</p>
          <div className="mt-3 grid sm:grid-cols-2 gap-4">
            {branches.map((branch) => (
              <div key={branch.id} className="rounded-md border border-line bg-surface-2 p-3">
                <div className="text-[12px] font-semibold text-ink">{branch.name}</div>
                <p className="text-[11px] text-ink-3 mt-0.5">/c/{company.slug}/{branch.slug}</p>
                <div className="mt-3 flex justify-center">
                  <BusinessQr title="Join" subtitle={`At ${branch.name}`} path={`/c/${company.slug}/${branch.slug}`} color={company.primaryColor} compact />
                </div>
              </div>
            ))}
            {branches.length === 0 && <div className="text-[12px] text-ink-3">No branches to generate for.</div>}
          </div>
        </section>

        <section className="card p-5">
          <h3 className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><Share2 size={14} /> Quick share</h3>
          <p className="text-[12px] text-ink-3 mt-1">Copy or download a branded share card for WhatsApp and email.</p>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <a className="btn btn-outline btn-sm w-fit" href={`/c/${company.slug}`} target="_blank" rel="noreferrer">Open public page</a>
            <button type="button" className="btn btn-primary btn-sm w-fit" onClick={() => downloadHtml(company)}>
              <Download size={13} /> Download share card
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function downloadHtml(company: Company) {
  const html = `<!doctype html><html><head><meta charset="utf-8" /><title>${company.name}</title></head><body style="font-family:system-ui;background:${company.primaryColor};color:#fff;padding:24px"><h1>${company.name}</h1><p>${company.tagline ?? 'Join the queue, reserve a spot, get SMS updates.'}</p><p><a href="/c/${company.slug}" style="color:#fff;text-decoration:underline">Open queue</a></p></body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${company.slug}-share.html`;
  link.click();
  URL.revokeObjectURL(url);
}
