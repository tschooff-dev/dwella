import { useEffect, useState } from 'react'
import StatusPill from '../../components/ui/StatusPill'
import { useApi } from '../../lib/api'

interface Payment {
  id: string
  amount: number
  dueDate: string
  paidDate: string | null
  status: 'PAID' | 'DUE' | 'LATE' | 'PARTIAL'
  tenant: { firstName: string; lastName: string }
  lease: { unit: { unitNumber: string; property: { name: string } } }
}

function monthLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function fmt(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[] | null>(null)
  const { apiFetch } = useApi()

  useEffect(() => {
    apiFetch('/api/payments').then(r => r.json()).then(setPayments)
  }, [])

  const collected = payments?.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0) ?? 0
  const outstanding = payments?.filter(p => p.status !== 'PAID').reduce((s, p) => s + p.amount, 0) ?? 0

  const grouped = payments?.reduce<Record<string, Payment[]>>((acc, p) => {
    const label = monthLabel(p.dueDate)
    ;(acc[label] ??= []).push(p)
    return acc
  }, {}) ?? {}

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Payment ledger · all properties</p>
        </div>
        {payments && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-400">Collected</div>
              <div className="text-sm font-semibold text-green-600">${collected.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Outstanding</div>
              <div className="text-sm font-semibold text-red-600">${outstanding.toLocaleString()}</div>
            </div>
          </div>
        )}
      </div>

      {payments === null ? (
        <div className="card p-10 text-center text-sm text-gray-400">Loading…</div>
      ) : payments.length === 0 ? (
        <div className="card p-10 text-center text-sm text-gray-400">No payments yet.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, monthPayments]) => (
            <div key={month} className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-50 bg-gray-50/50">
                <h3 className="text-xs font-semibold text-gray-600">{month}</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left text-xs font-medium text-gray-400 px-5 py-2.5">Tenant</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-3 py-2.5">Unit</th>
                    <th className="text-right text-xs font-medium text-gray-400 px-3 py-2.5">Amount</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-3 py-2.5">Due</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-3 py-2.5">Paid</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {monthPayments.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-xs font-medium text-gray-900">{p.tenant.firstName} {p.tenant.lastName}</td>
                      <td className="px-3 py-3 text-xs text-gray-500">{p.lease.unit.property.name} · {p.lease.unit.unitNumber}</td>
                      <td className="px-3 py-3 text-xs font-medium text-gray-900 text-right">${p.amount.toLocaleString()}</td>
                      <td className="px-3 py-3 text-xs text-gray-500">{fmt(p.dueDate)}</td>
                      <td className="px-3 py-3 text-xs text-gray-500">{fmt(p.paidDate)}</td>
                      <td className="px-5 py-3"><StatusPill status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
