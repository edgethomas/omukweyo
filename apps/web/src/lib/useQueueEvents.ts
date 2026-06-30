import { useEffect, useState } from 'react';
import type { DashboardMetrics, QueueTicket } from '@inline/shared';
import { api } from './api';
import { getBrowserSupabase } from './supabase';

type QueueEventsOptions = {
  branchId?: string | null;
  enabled?: boolean;
  tickets?: boolean;
  metrics?: boolean;
  notifications?: boolean;
  refreshOnMount?: boolean;
  pollMs?: number;
};

export function useQueueEvents(initial: QueueTicket[] = [], options: QueueEventsOptions = {}): {
  tickets: QueueTicket[];
  metrics: DashboardMetrics | null;
  latestNotification: any | null;
} {
  const {
    branchId,
    enabled = true,
    tickets: watchTickets = true,
    metrics: watchMetrics = false,
    notifications: watchNotifications = false,
    refreshOnMount = true,
    pollMs = 15000,
  } = options;
  const [tickets, setTickets] = useState<QueueTicket[]>(initial);
  const [ticketsRefreshed, setTicketsRefreshed] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [latestNotification, setLatestNotification] = useState<any | null>(null);

  useEffect(() => {
    setTickets((current) => {
      const same = current.length === initial.length && current.every((ticket, index) => {
        const next = initial[index];
        return next && ticket.id === next.id && ticket.status === next.status && ticket.position === next.position;
      });
      return same ? current : initial;
    });
  }, [initial]);

  useEffect(() => {
    setTicketsRefreshed(false);
  }, [branchId]);

  useEffect(() => {
    if (!enabled || (!watchTickets && !watchMetrics && !watchNotifications)) return undefined;
    let mounted = true;

    const refreshTickets = () => {
      api.liveQueue(branchId ?? undefined)
        .then(({ tickets: live }) => {
          if (mounted) {
            setTickets(live);
            setTicketsRefreshed(true);
          }
        })
        .catch(() => undefined);
    };
    const refreshMetrics = () => {
      api.dashboardMetrics()
        .then((nextMetrics) => { if (mounted) setMetrics(nextMetrics); })
        .catch(() => undefined);
    };
    const refreshNotifications = () => {
      api.notifications()
        .then(({ notifications }) => { if (mounted) setLatestNotification(notifications[0] ?? null); })
        .catch(() => undefined);
    };

    if (refreshOnMount) {
      if (watchTickets) refreshTickets();
      if (watchMetrics) refreshMetrics();
      if (watchNotifications) refreshNotifications();
    }

    const sb = getBrowserSupabase();
    const channel = sb.channel('omukweyo-live-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'QueueTicket' }, () => {
        if (watchTickets) refreshTickets();
        if (watchMetrics) refreshMetrics();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Notification' }, () => {
        if (watchNotifications) refreshNotifications();
      })
      .subscribe();

    const fallback = window.setInterval(() => {
      if (watchTickets) refreshTickets();
      if (watchMetrics) refreshMetrics();
      if (watchNotifications) refreshNotifications();
    }, pollMs);

    return () => {
      mounted = false;
      window.clearInterval(fallback);
      sb.removeChannel(channel);
    };
  }, [branchId, enabled, pollMs, refreshOnMount, watchMetrics, watchNotifications, watchTickets]);

  return { tickets: ticketsRefreshed || initial.length === 0 ? tickets : initial, metrics, latestNotification };
}
