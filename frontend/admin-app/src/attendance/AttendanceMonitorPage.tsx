import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import AttendanceTable from './AttendanceTable';

interface AttendanceEntry {
  id: number;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  employee: { id: number; name: string; position: string };
}

interface ListResponse {
  data: AttendanceEntry[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

function getDefaultFromDate(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

function getDefaultToDate(): string {
  return new Date().toISOString().split('T')[0];
}

export default function AttendanceMonitorPage() {
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [from, setFrom] = useState(getDefaultFromDate());
  const [to, setTo] = useState(getDefaultToDate());
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<ListResponse>('/attendance/all', {
        params: { page, limit: 20, from, to },
      });
      setEntries(data.data);
      setMeta({ total: data.meta.total, totalPages: data.meta.totalPages });
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, from, to]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Attendance Monitor</h2>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : (
        <>
          <AttendanceTable entries={entries} />

          {meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">
                Page {page} of {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
