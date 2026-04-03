import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import DateRangePicker from '../components/DateRangePicker';

interface AttendanceEntry {
  id: number;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
}

interface SummaryResponse {
  data: AttendanceEntry[];
  meta: {
    from: string;
    to: string;
    totalDays: number;
    totalPresent: number;
  };
}

function formatTime(isoString: string | null): string {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getDefaultFromDate(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

function getDefaultToDate(): string {
  return new Date().toISOString().split('T')[0];
}

export default function AttendanceSummaryPage() {
  const [from, setFrom] = useState(getDefaultFromDate());
  const [to, setTo] = useState(getDefaultToDate());
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/attendance/summary', { params: { from, to } });
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [from, to]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Attendance Summary</h2>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <DateRangePicker from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
      </div>

      {summary?.meta && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-sm text-gray-500">Total Days</p>
            <p className="text-2xl font-bold text-gray-800">{summary.meta.totalDays}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-sm text-gray-500">Present</p>
            <p className="text-2xl font-bold text-green-600">{summary.meta.totalPresent}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-400">Loading...</div>
        ) : !summary?.data.length ? (
          <div className="p-6 text-center text-gray-400">No records found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Masuk</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pulang</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {summary.data.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-800">{formatDate(entry.date)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatTime(entry.clock_in)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatTime(entry.clock_out)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        entry.status === 'pulang'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      {entry.status === 'pulang' ? 'Pulang' : 'Masuk'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
