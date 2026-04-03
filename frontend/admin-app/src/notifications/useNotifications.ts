import { useState, useEffect, useRef, useCallback } from 'react';

export interface AppNotification {
  id: string;
  type: string;
  entity?: string;
  entityId?: number | string;
  employeeId?: number | string;
  employeeName?: string;
  changes?: Record<string, unknown>;
  timestamp: string;
  read: boolean;
  severity?: 'high' | 'medium' | 'low';
  clockTime?: string;
  count?: number;
  employees?: { id: number; name: string }[];
  date?: string;
}

const MAX_NOTIFICATIONS = 50;
const RECONNECT_DELAY_MS = 3000;

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const url = `${baseUrl}/notifications/stream?token=${encodeURIComponent(accessToken)}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const notification: AppNotification = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          type: data.type || 'notification',
          entity: data.entity,
          entityId: data.entityId,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          changes: data.changes,
          timestamp: data.timestamp || new Date().toISOString(),
          read: false,
          severity: data.severity,
          clockTime: data.clockTime,
          count: data.count,
          employees: data.employees,
          date: data.date,
        };

        setNotifications((prev) =>
          [notification, ...prev].slice(0, MAX_NOTIFICATIONS),
        );
        setUnreadCount((prev) => prev + 1);
      } catch {
        // Ignore malformed messages
      }
    };

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
      reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return { notifications, unreadCount, clearUnread };
}
