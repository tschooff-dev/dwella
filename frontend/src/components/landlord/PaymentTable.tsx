import { useEffect, useState } from 'react'
import StatusPill from '../ui/StatusPill'
import { useApi } from '../../lib/api'

interface Payment {
  id: string
  amount: number
  dueDate: string
  status: 'PAID' | 'DUE' | 'LATE' | 'PARTIAL'
  tenant: { firstName: string; lastName: string }
  lease: { unit: { unitNumber: string; property: { name: string } } }
}

export default function PaymentTable() {
  const [payments, setPayments] = useState<Payment[] | null>(null)
  const { apiFetch } = useApi()

  useEffect(() => {
    apiFetch('/api/payments').then(r => r.json()).then((data: Payment[]) => setPayments(data.slice(0, 10)))
  }, [])

  if (payments === null) return <div className="py-6 text-center text-sm text-gray-400">Loading…</div>
  if (payments.length === 0) return <div className="py-6 text-center text-sm text-gray-400">No payments yet.</div>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">Tenant</th>
            <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">Unit</th>
            <th className="text-right text-xs font-medium text-gray-500 pb-3 pr-4">Amount</th>
            <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">Due Date</th>
            <th className="text-left text-xs font-medium text-gray-500 pb-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {payments.map(p => (
            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-semibold text-gray-600">
                      {p.tenant.firstName[0]}{p.tenant.lastName[0]}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900 text-xs">{p.tenant.firstName} {p.tenant.lastName}</span>
                </div>
              </td>
              <td className="py-3 pr-4 text-xs text-gray-500">{p.lease.unit.property.name} · {p.lease.unit.unitNumber}</td>
              <td className="py-3 pr-4 text-xs font-medium text-gray-900 text-right">${p.amount.toLocaleString()}</td>
              <td className="py-3 pr-4 text-xs text-gray-500">
                {new Date(p.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </td>
              <td className="py-3"><StatusPill status={p.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
