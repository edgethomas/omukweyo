import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function StatusBar() {
  const [health, setHealth] = useState<{ tickets: number; notifications: number; ok: boolean } | null>(null);
  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      try {
        const h = await api.health();
        if (mounted) setHealth({ tickets: h.tickets, notifications: h.notifications, ok: h.ok });
      } catch {}
    };
    tick();
    const id = setInterval(tick, 8000);
    return () => { mounted = false; clearInterval(id); };
  }, []);
  return (
    <div className="fixed bottom-4 right-4 z-40 hidden sm:flex justify-end pointer-events-none">
      <div className="px-3 py-1.5 border border-ink/30 bg-paper/90 backdrop-blur font-mono text-[10px] text-ink-2 pointer-events-auto">
        <span className="text-accent">●</span> live · {health?.tickets ?? '–'} tickets · {health?.notifications ?? '–'} SMS logged
      </div>
    </div>
  );
}
