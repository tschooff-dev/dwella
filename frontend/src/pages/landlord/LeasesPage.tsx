import StatusPill from '../../components/ui/StatusPill'

const leases = [
  { id: '1', tenant: 'Priya Sharma', unit: 'The Elmwood · 1A', rent: 1850, start: 'Feb 1, 2024', end: 'Jan 31, 2025', status: 'ACTIVE' as const, daysLeft: 24 },
  { id: '2', tenant: 'James Okafor', unit: 'The Elmwood · 1B', rent: 2400, start: 'Jun 1, 2024', end: 'May 31, 2025', status: 'ACTIVE' as const, daysLeft: 144 },
  { id: '3', tenant: 'Elena Vasquez', unit: 'The Elmwood · 2A', rent: 1900, start: 'Sep 1, 2023', end: 'Mar 15, 2025', status: 'ACTIVE' as const, daysLeft: 67 },
  { id: '4', tenant: 'Tom Nguyen', unit: 'The Elmwood · 2B', rent: 2650, start: 'Jan 1, 2024', end: 'Dec 31, 2025', status: 'ACTIVE' as const, daysLeft: 358 },
  { id: '5', tenant: 'Sarah Chen', unit: 'The Elmwood · 3B', rent: 3100, start: 'Mar 1, 2024', end: 'Feb 28, 2025', status: 'ACTIVE' as const, daysLeft: 51 },
  { id: '6', tenant: 'David Kim', unit: 'Riverside · 101', rent: 2800, start: 'Jul 1, 2024', end: 'Jun 30, 2025', status: 'ACTIVE' as const, daysLeft: 174 },
  { id: '7', tenant: 'Maya Patel', unit: 'Riverside · 102', rent: 2800, start: 'Aug 1, 2024', end: 'Jul 31, 2025', status: 'ACTIVE' as const, daysLeft: 205 },
  { id: '8', tenant: 'Carlos Reyes', unit: 'Riverside · 201', rent: 3400, start: 'Jan 15, 2024', end: 'Jan 14, 2025', status: 'ACTIVE' as const, daysLeft: 7 },
  { id: '9', tenant: 'Lisa Park', unit: 'Harbor View · A', rent: 2200, start: 'May 1, 2024', end: 'Apr 30, 2025', status: 'ACTIVE' as const, daysLeft: 113 },
  { id: '10', tenant: 'Mike Torres', unit: 'Harbor View · B', rent: 2250, start: 'Sep 1, 2024', end: 'Aug 31, 2025', status: 'ACTIVE' as const, daysLeft: 236 },
]

function daysLeftBadge(days: number) {
  if (days <= 14) return <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">{days}d left</span>
  if (days <= 60) return <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">{days}d left</span>
  return <span className="text-[10px] text-gray-400">{days}d left</span>
}

export default function LeasesPage() {
  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Leases</h1>
          <p className="text-sm text-gray-500 mt-0.5">10 active · 4 expiring within 90 days</p>
        </div>
        <button className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Lease
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Tenant</th>
              <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Unit</th>
              <th className="text-right text-xs font-medium text-gray-400 px-3 py-3">Rent</th>
              <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Start</th>
              <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">End</th>
              <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Status</th>
              <th className="text-right text-xs font-medium text-gray-400 px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leases.map(lease => (
              <tr key={lease.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <span className="text-xs font-medium text-gray-900">{lease.tenant}</span>
                </td>
                <td className="px-3 py-3.5 text-xs text-gray-500">{lease.unit}</td>
                <td className="px-3 py-3.5 text-xs font-medium text-gray-900 text-right">${lease.rent.toLocaleString()}</td>
                <td className="px-3 py-3.5 text-xs text-gray-500">{lease.start}</td>
                <td className="px-3 py-3.5 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    {lease.end}
                    {daysLeftBadge(lease.daysLeft)}
                  </div>
                </td>
                <td className="px-3 py-3.5">
                  <StatusPill status={lease.status} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="text-xs text-gray-500 hover:text-gray-700">View</button>
                    <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Renew</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
