interface ClockCardProps {
  hasActiveClockIn: boolean;
  clockInTime: string | null;
  clockOutTime: string | null;
  onClockIn: () => void;
  onClockOut: () => void;
  loading: boolean;
}

export default function ClockCard({
  hasActiveClockIn,
  clockInTime,
  clockOutTime,
  onClockIn,
  onClockOut,
  loading,
}: ClockCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Schedule</h3>
          <p className="text-gray-800 font-semibold">Office 09:00 - 18:00</p>
        </div>
        <span className="px-3 py-1 bg-accent-50 text-accent-700 text-xs font-medium rounded-full">
          WFH
        </span>
      </div>

      <div className="bg-accent-50 rounded-lg p-3 mb-6 text-sm text-accent-700">
        Selfie photo is required to Clock In/Out
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Clock In</p>
          <p className="text-lg font-semibold text-gray-800">
            {clockInTime || '--:--'}
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Clock Out</p>
          <p className="text-lg font-semibold text-gray-800">
            {clockOutTime || '--:--'}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClockIn}
          disabled={loading}
          className="flex-1 py-3 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? '...' : 'Clock In'}
        </button>
        <button
          onClick={onClockOut}
          disabled={!hasActiveClockIn || loading}
          className="flex-1 py-3 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? '...' : 'Clock Out'}
        </button>
      </div>
    </div>
  );
}
