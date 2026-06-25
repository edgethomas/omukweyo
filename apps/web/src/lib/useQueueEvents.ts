import { useEffect, useState } from 'react';
import { getSocket } from './socket';
import type { ServerEvent, QueueTicket, DashboardMetrics } from '@inline/shared';

export function useQueueEvents(initial: QueueTicket[] = []): {
  tickets: QueueTicket[];
  metrics: DashboardMetrics | null;
  latestNotification: any | null;
} {
  const [tickets, setTickets] = useState<QueueTicket[]>(initial);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [latestNotification, setLatestNotification] = useState<any | null>(null);

  useEffect(() => {
    const s = getSocket();
    const onEvent = (raw: any) => {
      const ev = raw as ServerEvent;
      switch (ev.type) {
        case 'ticket:list':
          setTickets(ev.tickets);
          break;
        case 'ticket:created':
          setTickets((prev) => [...prev, ev.ticket]);
          break;
        case 'ticket:updated':
          setTickets((prev) => {
            const idx = prev.findIndex((t) => t.id === ev.ticket.id);
            if (idx === -1) return [...prev, ev.ticket];
            const next = [...prev];
            // recompute positions for the affected branch
            next[idx] = ev.ticket;
            return next.filter(t => ['WAITING','CALLED','SERVING','ON_HOLD'].includes(t.status))
                       .sort((a,b) => a.position - b.position);
          });
          break;
        case 'metrics:updated':
          setMetrics(ev.metrics);
          break;
        case 'notification:logged':
          setLatestNotification(ev.notification);
          break;
      }
    };
    s.on('omukweyo:event', onEvent);
    return () => {
      s.off('omukweyo:event', onEvent);
    };
  }, []);

  return { tickets, metrics, latestNotification };
}
