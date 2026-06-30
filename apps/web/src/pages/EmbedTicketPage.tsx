import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { getBrowserSupabase } from '@/lib/supabase';
import { cn, formatTime } from '@/lib/utils';

export default function EmbedTicketPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const refresh = () => {
      api.getTicket(id).then((d) => setTicket(d.ticket)).catch((err) => setError(err.message));
    };
    refresh();
    const sb = getBrowserSupabase();
    const channel = sb.channel(`embed-ticket-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'QueueTicket', filter: `id=eq.${id}` }, refresh)
      .subscribe();
    const fallback = window.setInterval(refresh, 15000);
    return () => {
      window.clearInterval(fallback);
      sb.removeChannel(channel);
    };
  }, [id]);

  if (error) return <div className="p-6 text-red-700 text-[14px]">{error}</div>;
  if (!ticket) return <div className="p-6 text-[12px] text-ink-3">Loading ticket...</div>;

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="rounded-xl border border-line bg-surface p-5 text-center">
        <Bell size={20} className="text-accent mx-auto" />
        <div className="t-eyebrow text-[10px] mt-2">Ticket</div>
        <div className="t-mono text-4xl font-semibold mt-1">{ticket.ticketNumber}</div>
        <span className={cn(
          'mt-2 inline-block text-[11px]',
          ticket.status === 'SERVING' ? 'chip-serve' :
          ticket.status === 'CALLED' ? 'chip-call' :
          ticket.status === 'SERVED' ? 'chip-done' :
          ticket.status === 'CANCELLED' ? 'chip-done' :
          'chip-wait',
        )}>{ticket.status}</span>
        <div className="mt-4 grid grid-cols-2 gap-2 text-[12px] text-ink-2">
          <div>
            <div className="t-eyebrow text-[9px]">People ahead</div>
            <div className="t-mono text-[16px] text-ink font-semibold">{ticket.peopleAhead}</div>
          </div>
          <div>
            <div className="t-eyebrow text-[9px]">Wait</div>
            <div className="t-mono text-[16px] text-ink font-semibold">~{ticket.estimatedWaitMinutes}m</div>
          </div>
          <div>
            <div className="t-eyebrow text-[9px]">Counter</div>
            <div className="t-mono text-[16px] text-ink font-semibold">{ticket.counter ?? '—'}</div>
          </div>
          <div>
            <div className="t-eyebrow text-[9px]">Joined</div>
            <div className="t-mono text-[16px] text-ink font-semibold">{formatTime(ticket.joinedAt)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
