interface AttendanceEntry {
  id: number;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  employee: {
    id: number;
    name: string;
    position: string;
  };
}

interface AttendanceTableProps {
  entries: AttendanceEntry[];
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

export default function AttendanceTable({ entries }: AttendanceTableProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-400">
        No attendance records found
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-gray-800">{entry.employee.name}</p>
                <p className="text-xs text-gray-500">{entry.employee.position}</p>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{formatDate(entry.date)}</td>
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
    </div>
  );
}
