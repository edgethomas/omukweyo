import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Code2, Copy, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';

export default function Embed() {
  const [widget, setWidget] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.businessWidget().then(setWidget).catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>;
  }

  if (!widget) {
    return <div className="card h-96 animate-pulse" />;
  }

  const codes = [
    { label: 'Iframe', code: widget.iframe },
    { label: 'JS loader', code: widget.loader },
    { label: 'Public join URL', code: widget.publicUrl },
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="grid lg:grid-cols-[1fr_380px] gap-5 items-start">
        <div className="card p-5">
          <div className="t-eyebrow mb-2">Website widget</div>
          <h2 className="t-h2">Copy, paste, and your queue appears.</h2>
          <p className="t-body mt-2 max-w-2xl">
            These snippets are generated from {widget.company.name}. The same services, logo, theme colors, and live join flow appear on the business website.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={widget.widgetUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
              Open widget <ExternalLink size={13} />
            </a>
            <Link to={`/c/${widget.company.slug}`} className="btn btn-primary btn-sm">
              Open public queue <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
          <div className="text-[13px] font-semibold text-ink">Widget preview</div>
          <div className="mt-3 rounded-lg border border-line overflow-hidden bg-white">
            <iframe title="Omukweyo queue widget preview" src={`/widget/${widget.company.slug}`} className="w-full h-[390px] border-0" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-3">
        {codes.map((item) => (
          <CodeCard key={item.label} label={item.label} code={item.code} testId={`copy-${item.label.toLowerCase().replace(/\s+/g, '-')}`} />
        ))}
      </div>

      <div className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-ink">Install checklist</h3>
          <p className="text-[12px] text-ink-2 mt-1">Copy the JS loader for most websites, or the iframe if the site blocks external scripts.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/settings" className="btn btn-outline btn-sm">Brand settings</Link>
          <Link to="/dashboard" className="btn btn-primary btn-sm">Open dashboard</Link>
        </div>
      </div>
    </div>
  );
}

function CodeCard({ label, code, testId }: { label: string; code: string; testId: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(code);
    } catch {
      const input = document.createElement('textarea');
      input.value = code;
      input.setAttribute('readonly', 'true');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    window.localStorage.setItem('omukweyo_last_copied_code', code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-4 flex flex-col shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Code2 size={14} className="text-accent" />
          <span className="text-[13px] font-semibold text-ink">{label}</span>
        </div>
        <button type="button" data-testid={testId} onClick={copy} className="btn btn-outline btn-sm">
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="mt-3 border border-line bg-surface-2 p-3 text-[11px] font-mono text-ink-2 overflow-auto flex-1 whitespace-pre-wrap rounded-md">{code}</pre>
    </div>
  );
}
