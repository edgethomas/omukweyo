import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useLocation } from 'react-router-dom';

/** Tiny live health indicator that sits in the app header. */
export default function StatusPill() {
  const loc = useLocation();
  const hidden = loc.pathname.startsWith('/dashboard') || loc.pathname.startsWith('/staff');
  const [data, setData] = useState<{ tickets?: number; notifications?: number; ok?: boolean } | null>(null);

  useEffect(() => {
    if (hidden) {
      setData(null);
      return undefined;
    }
    let mounted = true;
    const tick = async () => {
      try { const h = await api.health(); if (mounted) setData(h); } catch {}
    };
    tick();
    const id = setInterval(tick, 8000);
    return () => { mounted = false; clearInterval(id); };
  }, [hidden]);

  if (hidden) return null;

  return (
    <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium text-ink-2 bg-surface-2 border border-line rounded-full">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      API live · {data?.tickets ?? '–'} tickets
    </div>
  );
}
