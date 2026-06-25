import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Copy, QrCode } from 'lucide-react';

function absoluteUrl(path: string) {
  const origin = typeof window === 'undefined' ? 'https://omukweyo.app' : window.location.origin;
  return new URL(path, origin).toString();
}

export default function BusinessQr({
  title,
  subtitle,
  path,
  color = '#2563EB',
  compact,
}: {
  title: string;
  subtitle: string;
  path: string;
  color?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const value = absoluteUrl(path);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
  };

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-start gap-4">
        <div className="rounded-md border border-line bg-white p-2 shrink-0">
          <QRCodeSVG value={value} size={compact ? 92 : 120} level="M" fgColor="#0F172A" bgColor="#FFFFFF" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 t-eyebrow text-[9px]">
            <QrCode size={11} />
            QR code
          </div>
          <h3 className="text-[14px] font-semibold text-ink mt-1">{title}</h3>
          <p className="text-[12px] text-ink-2 mt-1 leading-relaxed">{subtitle}</p>
          <div className="font-mono text-[10px] text-ink-3 truncate mt-2">{value}</div>
          <button
            type="button"
            onClick={copy}
            className="btn btn-outline btn-sm mt-3"
            style={{ borderColor: copied ? '#10B981' : undefined, color: copied ? '#047857' : undefined }}
          >
            {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </div>
      {!compact && <div className="mt-4 h-1 rounded-full" style={{ background: color }} />}
    </div>
  );
}
