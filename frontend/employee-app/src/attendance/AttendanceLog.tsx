interface LogEntry {
  time: string;
  type: 'clock_in' | 'clock_out';
  label: string;
}

interface AttendanceLogProps {
  entries: LogEntry[];
}

export default function AttendanceLog({ entries }: AttendanceLogProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-400">
        No attendance log for today
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Today's Log</h3>
      <div className="space-y-3">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                entry.type === 'clock_in' ? 'bg-green-500' : 'bg-orange-500'
              }`}
            />
            <span className="text-sm font-medium text-gray-800 w-16">{entry.time}</span>
            <span className="text-sm text-gray-600">{entry.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
