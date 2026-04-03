import { useState, useRef, useEffect } from 'react';
import { useNotifications } from './useNotifications';
import type { AppNotification } from './useNotifications';

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

interface NotificationDisplay {
  label: string;
  icon: string;
  severity: 'high' | 'medium' | 'low';
}

function getNotificationDisplay(n: AppNotification): NotificationDisplay {
  const name = n.employeeName || 'Employee';

  switch (n.type) {
    case 'late_clock_in':
      return {
        label: `⚠️ ${name} terlambat clock-in (${n.clockTime || '-'})`,
        icon: '🔴',
        severity: 'high',
      };
    case 'early_leave':
      return {
        label: `⚠️ ${name} pulang lebih awal (${n.clockTime || '-'})`,
        icon: '🟡',
        severity: 'high',
      };
    case 'absent_alert': {
      const names = n.employees?.map((e) => e.name).slice(0, 3).join(', ') || '';
      const extra = (n.count || 0) > 3 ? ` +${(n.count || 0) - 3} lainnya` : '';
      return {
        label: `🚨 ${n.count || 0} karyawan belum clock-in: ${names}${extra}`,
        icon: '🔴',
        severity: 'high',
      };
    }
    case 'forgot_clock_out': {
      const names = n.employees?.map((e) => e.name).slice(0, 3).join(', ') || '';
      const extra = (n.count || 0) > 3 ? ` +${(n.count || 0) - 3} lainnya` : '';
      return {
        label: `⏰ ${n.count || 0} karyawan lupa clock-out: ${names}${extra}`,
        icon: '🟠',
        severity: 'high',
      };
    }
    case 'profile_updated':
    case 'profile-updated':
      return {
        label: `${name} memperbarui profil`,
        icon: '📝',
        severity: 'medium',
      };
    default:
      return {
        label: `${name}: ${n.type}`,
        icon: 'ℹ️',
        severity: 'low',
      };
  }
}

const severityStyles: Record<string, string> = {
  high: 'border-l-4 border-l-red-400',
  medium: 'border-l-4 border-l-yellow-400',
  low: '',
};

export default function NotificationBell() {
  const { notifications, unreadCount, clearUnread } = useNotifications();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Show toast for new notifications
  useEffect(() => {
    if (notifications.length > 0 && notifications.length > prevCountRef.current) {
      setToast(notifications[0]);
      const timer = setTimeout(() => setToast(null), 4000);
      prevCountRef.current = notifications.length;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = notifications.length;
  }, [notifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = () => {
    setOpen((prev) => !prev);
    if (!open) clearUnread();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggle}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              No notifications yet
            </div>
          ) : (
            <ul>
              {notifications.map((n) => {
                const display = getNotificationDisplay(n);
                return (
                  <li
                    key={n.id}
                    className={`px-4 py-3 border-b border-gray-100 last:border-b-0 ${
                      !n.read ? 'bg-brand-50' : ''
                    } ${severityStyles[display.severity] || ''}`}
                  >
                    <p className="text-sm text-gray-800">{display.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatTime(n.timestamp)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 bg-white border border-gray-200 shadow-lg rounded-lg px-4 py-3 z-[100] max-w-sm animate-fade-in ${
          severityStyles[getNotificationDisplay(toast).severity] || ''
        }`}>
          <p className="text-sm text-gray-800">{getNotificationDisplay(toast).label}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatTime(toast.timestamp)}
          </p>
        </div>
      )}
    </div>
  );
}
