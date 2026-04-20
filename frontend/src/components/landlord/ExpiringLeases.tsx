import { useEffect, useState } from 'react'
import { useApi } from '../../lib/api'

interface Lease {
  id: string
  endDate: string
  rentAmount: number
  tenant: { firstName: string; lastName: string }
  unit: { unitNumber: string; property: { name: string } }
}

function daysLeft(endDate: string) {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000)
}

function urgencyColor(days: number) {
  if (days <= 14) return 'text-red-600 bg-red-50 border-red-200'
  if (days <= 30) return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-gray-600 bg-gray-50 border-gray-200'
}

export default function ExpiringLeases() {
  const [leases, setLeases] = useState<Lease[] | null>(null)
  const { apiFetch } = useApi()

  useEffect(() => {
    apiFetch('/api/leases?status=ACTIVE').then(r => r.json()).then((data: Lease[]) => {
      const soon = data
        .filter(l => daysLeft(l.endDate) <= 90)
        .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
      setLeases(soon)
    })
  }, [])

  if (leases === null) return <div className="py-4 text-center text-sm text-gray-400">Loading…</div>
  if (leases.length === 0) return <div className="py-4 text-center text-sm text-gray-400">No leases expiring soon.</div>

  return (
    <div className="space-y-2">
      {leases.map(lease => {
        const days = daysLeft(lease.endDate)
        return (
          <div key={lease.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-gray-600">
                  {lease.tenant.firstName[0]}{lease.tenant.lastName[0]}
                </span>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-900">{lease.tenant.firstName} {lease.tenant.lastName}</div>
                <div className="text-[10px] text-gray-500">{lease.unit.property.name} · {lease.unit.unitNumber} · ${lease.rentAmount.toLocaleString()}/mo</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${urgencyColor(days)}`}>
                {days}d left
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {new Date(lease.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
