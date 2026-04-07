interface ExpiringLease {
  id: string
  tenantName: string
  unitLabel: string
  expiresOn: string
  daysRemaining: number
  rentAmount: number
}

const expiringLeases: ExpiringLease[] = [
  { id: '1', tenantName: 'Priya Sharma', unitLabel: 'The Elmwood · 1A', expiresOn: 'Jan 31, 2025', daysRemaining: 24, rentAmount: 1850 },
  { id: '2', tenantName: 'Elena Vasquez', unitLabel: 'The Elmwood · 2A', expiresOn: 'Mar 15, 2025', daysRemaining: 67, rentAmount: 1900 },
  { id: '3', tenantName: 'Sarah Chen', unitLabel: 'The Elmwood · 3B', expiresOn: 'Feb 28, 2025', daysRemaining: 51, rentAmount: 3100 },
  { id: '4', tenantName: 'Carlos Reyes', unitLabel: 'Riverside · 201', expiresOn: 'Jan 14, 2025', daysRemaining: 7, rentAmount: 3400 },
]

function urgencyColor(days: number): string {
  if (days <= 14) return 'text-red-600 bg-red-50 border-red-200'
  if (days <= 30) return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-gray-600 bg-gray-50 border-gray-200'
}

export default function ExpiringLeases() {
  return (
    <div className="space-y-2">
      {expiringLeases.map(lease => (
        <div key={lease.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-gray-600">
                {lease.tenantName.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-900">{lease.tenantName}</div>
              <div className="text-[10px] text-gray-500">{lease.unitLabel} · ${lease.rentAmount.toLocaleString()}/mo</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${urgencyColor(lease.daysRemaining)}`}>
              {lease.daysRemaining}d left
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">{lease.expiresOn}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
