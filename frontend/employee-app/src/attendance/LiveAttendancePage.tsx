import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useToast } from '../components/Toast';
import ClockCard from './ClockCard';
import AttendanceLog from './AttendanceLog';

interface AttendanceRecord {
  id: number;
  employee_id: number;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
}

function formatTime(isoString: string | null): string | null {
  if (!isoString) return null;
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function LiveAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { showToast } = useToast();

  useEffect(() => {
    fetchToday();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchToday = async () => {
    try {
      const { data } = await apiClient.get('/attendance/today');
      const arr = Array.isArray(data) ? data : data ? [data] : [];
      setRecords(arr);
    } catch (err) {
      console.error('Failed to fetch today attendance', err);
    }
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      await apiClient.post('/attendance/clock-in');
      await fetchToday();
      showToast('Clocked in successfully');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Clock in failed';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      await apiClient.post('/attendance/clock-out');
      await fetchToday();
      showToast('Clocked out successfully');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Clock out failed';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const lastRecord = records.length > 0 ? records[records.length - 1] : null;
  const hasActiveClockIn = !!lastRecord?.clock_in && !lastRecord?.clock_out;

  const logEntries = records.flatMap((r) => {
    const entries = [];
    if (r.clock_in) {
      entries.push({
        time: formatTime(r.clock_in) || '',
        type: 'clock_in' as const,
        label: 'Clock In',
      });
    }
    if (r.clock_out) {
      entries.push({
        time: formatTime(r.clock_out) || '',
        type: 'clock_out' as const,
        label: 'Clock Out',
      });
    }
    return entries;
  });

  const dateStr = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeStr = currentTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header with live clock */}
      <div className="bg-brand-600 text-white rounded-xl p-6 text-center">
        <p className="text-sm opacity-90 mb-1">{dateStr}</p>
        <p className="text-4xl font-bold tracking-wider">{timeStr}</p>
      </div>

      <ClockCard
        hasActiveClockIn={hasActiveClockIn}
        clockInTime={formatTime(lastRecord?.clock_in ?? null)}
        clockOutTime={formatTime(lastRecord?.clock_out ?? null)}
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
        loading={loading}
      />

      <AttendanceLog entries={logEntries} />
    </div>
  );
}
