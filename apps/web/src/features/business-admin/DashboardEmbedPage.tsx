import { useEffect, useState } from 'react';
import { Code2, Copy, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import DashboardLayout from './DashboardLayout';

type WidgetConfig = {
  company: { name: string; slug: string };
  widgetUrl: string;
  iframe: string;
  loader: string;
  publicUrl: string;
};

export default function DashboardEmbedPage() {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    api.businessWidget()
      .then(setConfig)
      .catch((err) => setError(err.message));
  }, []);

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  if (error) return <DashboardLayout><div className="card p-6 text-red-700">{error}</div></DashboardLayout>;
  if (!config) return <DashboardLayout><div className="card p-6 h-64 animate-pulse" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Embed widget</h2>
            <p className="text-[12px] text-ink-3 mt-0.5">Drop the queue on your own website - iframe or JS loader</p>
          </div>
        </div>

        <section className="card p-5">
          <h3 className="text-[14px] font-semibold text-ink">Iframe snippet</h3>
          <p className="text-[12px] text-ink-3 mt-1">Easiest to drop in - works in any HTML page.</p>
          <pre className="mt-3 rounded-md border border-line bg-surface-2 p-3 text-[12px] overflow-x-auto whitespace-pre-wrap">{config.iframe}</pre>
          <button type="button" className="btn btn-outline btn-sm mt-2" onClick={() => copy('iframe', config.iframe)}>
            <Copy size={12} /> {copied === 'iframe' ? 'Copied' : 'Copy iframe'}
          </button>
        </section>

        <section className="card p-5">
          <h3 className="text-[14px] font-semibold text-ink">JS loader</h3>
          <p className="text-[12px] text-ink-3 mt-1">Add a div with a data attribute and the loader script picks it up.</p>
          <pre className="mt-3 rounded-md border border-line bg-surface-2 p-3 text-[12px] overflow-x-auto whitespace-pre-wrap">{config.loader}</pre>
          <button type="button" className="btn btn-outline btn-sm mt-2" onClick={() => copy('loader', config.loader)}>
            <Copy size={12} /> {copied === 'loader' ? 'Copied' : 'Copy loader'}
          </button>
        </section>

        <section className="card p-5">
          <h3 className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><Code2 size={14} /> Preview</h3>
          <p className="text-[12px] text-ink-3 mt-1">The widget on its own page for testing.</p>
          <a className="btn btn-outline btn-sm mt-3 w-fit" href={config.widgetUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={13} /> Open widget
          </a>
        </section>
      </div>
    </DashboardLayout>
  );
}
