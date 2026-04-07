import StatusPill from '../../components/ui/StatusPill'

type PayStatus = 'PAID' | 'DUE' | 'LATE'

const payments: {
  id: string
  tenant: string
  unit: string
  amount: number
  dueDate: string
  paidDate: string | null
  status: PayStatus
  month: string
}[] = [
  // April 2025
  { id: 'p1', tenant: 'Priya Sharma', unit: 'The Elmwood · 1A', amount: 1850, dueDate: 'Apr 1, 2025', paidDate: 'Apr 1, 2025', status: 'PAID', month: 'April 2025' },
  { id: 'p2', tenant: 'James Okafor', unit: 'The Elmwood · 1B', amount: 2400, dueDate: 'Apr 1, 2025', paidDate: null, status: 'DUE', month: 'April 2025' },
  { id: 'p3', tenant: 'Elena Vasquez', unit: 'The Elmwood · 2A', amount: 1900, dueDate: 'Apr 1, 2025', paidDate: null, status: 'LATE', month: 'April 2025' },
  { id: 'p4', tenant: 'Tom Nguyen', unit: 'The Elmwood · 2B', amount: 2650, dueDate: 'Apr 1, 2025', paidDate: 'Apr 1, 2025', status: 'PAID', month: 'April 2025' },
  { id: 'p5', tenant: 'Sarah Chen', unit: 'The Elmwood · 3B', amount: 3100, dueDate: 'Apr 1, 2025', paidDate: null, status: 'LATE', month: 'April 2025' },
  { id: 'p6', tenant: 'David Kim', unit: 'Riverside · 101', amount: 2800, dueDate: 'Apr 1, 2025', paidDate: 'Apr 2, 2025', status: 'PAID', month: 'April 2025' },
  { id: 'p7', tenant: 'Maya Patel', unit: 'Riverside · 102', amount: 2800, dueDate: 'Apr 1, 2025', paidDate: null, status: 'DUE', month: 'April 2025' },
  { id: 'p8', tenant: 'Carlos Reyes', unit: 'Riverside · 201', amount: 3400, dueDate: 'Apr 1, 2025', paidDate: null, status: 'DUE', month: 'April 2025' },
  { id: 'p9', tenant: 'Lisa Park', unit: 'Harbor View · A', amount: 2200, dueDate: 'Apr 1, 2025', paidDate: 'Apr 1, 2025', status: 'PAID', month: 'April 2025' },
  { id: 'p10', tenant: 'Mike Torres', unit: 'Harbor View · B', amount: 2250, dueDate: 'Apr 1, 2025', paidDate: 'Apr 3, 2025', status: 'PAID', month: 'April 2025' },
  // March 2025
  { id: 'p11', tenant: 'Priya Sharma', unit: 'The Elmwood · 1A', amount: 1850, dueDate: 'Mar 1, 2025', paidDate: 'Mar 1, 2025', status: 'PAID', month: 'March 2025' },
  { id: 'p12', tenant: 'James Okafor', unit: 'The Elmwood · 1B', amount: 2400, dueDate: 'Mar 1, 2025', paidDate: 'Mar 2, 2025', status: 'PAID', month: 'March 2025' },
  { id: 'p13', tenant: 'Elena Vasquez', unit: 'The Elmwood · 2A', amount: 1900, dueDate: 'Mar 1, 2025', paidDate: 'Mar 18, 2025', status: 'LATE', month: 'March 2025' },
]

const totalCollected = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)
const totalOutstanding = payments.filter(p => p.status !== 'PAID').reduce((s, p) => s + p.amount, 0)

export default function PaymentsPage() {
  const months = [...new Set(payments.map(p => p.month))]

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Payment ledger · all properties</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-400">Collected (Apr)</div>
            <div className="text-sm font-semibold text-green-600">${totalCollected.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Outstanding</div>
            <div className="text-sm font-semibold text-red-600">${totalOutstanding.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {months.map(month => {
          const monthPayments = payments.filter(p => p.month === month)
          return (
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
                  {monthPayments.map(payment => (
                    <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-xs font-medium text-gray-900">{payment.tenant}</td>
                      <td className="px-3 py-3 text-xs text-gray-500">{payment.unit}</td>
                      <td className="px-3 py-3 text-xs font-medium text-gray-900 text-right">${payment.amount.toLocaleString()}</td>
                      <td className="px-3 py-3 text-xs text-gray-500">{payment.dueDate}</td>
                      <td className="px-3 py-3 text-xs text-gray-500">{payment.paidDate ?? '—'}</td>
                      <td className="px-5 py-3">
                        <StatusPill status={payment.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </div>
  )
}
