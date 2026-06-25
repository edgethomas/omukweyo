import { useEffect, useState } from 'react';
import { Search, Users, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, relativeTime } from '@/lib/utils';

type NotifRow = { id: string; to: string; template: string; status: string; message: string; at: string };

export default function AdminSupportPage() {
  const [notifications, setNotifications] = useState<NotifRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.notifications()
      .then((d: { notifications: NotifRow[] }) => setNotifications(d.notifications))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = notifications.filter((n) => !search.trim() || `${n.to} ${n.template} ${n.message}`.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-[18px] font-semibold text-ink">Support</h2>
          <p className="text-[12px] text-ink-3 mt-0.5">Read-only support view of the SMS log</p>
        </div>
        <div className="relative">
          <Search size={13} className="text-ink-3 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input className="input h-9 pl-8 text-[12px] w-64" placeholder="Search by phone or template" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <section className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-line flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><Users size={14} /> All messages</h3>
          <span className="t-eyebrow text-[10px]">{filtered.length} matches</span>
        </div>
        {loading ? (
          <div className="p-5 text-[12px] text-ink-3">Loading messages...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-ink-3">No messages match.</div>
        ) : (
          <div className="divide-y divide-line max-h-[36rem] overflow-auto">
            {filtered.slice(0, 100).map((n) => (
              <div key={n.id} className="px-5 py-2.5 text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="t-eyebrow text-[9px] text-accent">{n.template}</span>
                  <span className={cn('text-[9px]', n.status === 'SENT' ? 'chip-done' : n.status === 'FAILED' ? 'chip-miss' : 'chip-wait')}>{n.status}</span>
                  <span className="font-mono text-[10px] text-ink-3 ml-auto">{relativeTime(n.at)}</span>
                </div>
                <p className="text-ink-2 mt-1.5 leading-relaxed">{n.message}</p>
                <p className="font-mono text-ink-3 text-[10px] mt-0.5">to {n.to}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card p-5 text-[12px] text-ink-2 inline-flex items-center gap-2">
        <ShieldAlert size={14} className="text-accent" />
        Impersonation, suspend, and override tools ship in Phase 5 with a strict audit trail.
      </section>
    </div>
  );
}
