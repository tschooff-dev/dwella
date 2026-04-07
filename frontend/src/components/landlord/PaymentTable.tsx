import StatusPill from '../ui/StatusPill'
import { Payment } from '../../types'

const mockPayments: (Payment & { tenantName: string; unitLabel: string })[] = [
  { id: '1', leaseId: 'l1', tenantId: 't1', tenantName: 'Priya Sharma', unitLabel: 'The Elmwood · 1A', amount: 1850, dueDate: '2025-04-01', status: 'PAID', paidDate: '2025-04-01', createdAt: '', updatedAt: '' },
  { id: '2', leaseId: 'l2', tenantId: 't2', tenantName: 'James Okafor', unitLabel: 'The Elmwood · 1B', amount: 2400, dueDate: '2025-04-01', status: 'DUE', createdAt: '', updatedAt: '' },
  { id: '3', leaseId: 'l3', tenantId: 't3', tenantName: 'Elena Vasquez', unitLabel: 'The Elmwood · 2A', amount: 1900, dueDate: '2025-04-01', status: 'LATE', createdAt: '', updatedAt: '' },
  { id: '4', leaseId: 'l4', tenantId: 't4', tenantName: 'Tom Nguyen', unitLabel: 'The Elmwood · 2B', amount: 2650, dueDate: '2025-04-01', status: 'PAID', paidDate: '2025-04-01', createdAt: '', updatedAt: '' },
  { id: '5', leaseId: 'l5', tenantId: 't5', tenantName: 'Sarah Chen', unitLabel: 'The Elmwood · 3B', amount: 3100, dueDate: '2025-04-01', status: 'LATE', createdAt: '', updatedAt: '' },
  { id: '6', leaseId: 'l6', tenantId: 't6', tenantName: 'David Kim', unitLabel: 'Riverside · 101', amount: 2800, dueDate: '2025-04-01', status: 'PAID', paidDate: '2025-04-02', createdAt: '', updatedAt: '' },
  { id: '7', leaseId: 'l7', tenantId: 't7', tenantName: 'Maya Patel', unitLabel: 'Riverside · 102', amount: 2800, dueDate: '2025-04-01', status: 'DUE', createdAt: '', updatedAt: '' },
  { id: '8', leaseId: 'l8', tenantId: 't8', tenantName: 'Carlos Reyes', unitLabel: 'Riverside · 201', amount: 3400, dueDate: '2025-04-01', status: 'DUE', createdAt: '', updatedAt: '' },
  { id: '9', leaseId: 'l9', tenantId: 't9', tenantName: 'Lisa Park', unitLabel: 'Harbor View · A', amount: 2200, dueDate: '2025-04-01', status: 'PAID', paidDate: '2025-04-01', createdAt: '', updatedAt: '' },
  { id: '10', leaseId: 'l10', tenantId: 't10', tenantName: 'Mike Torres', unitLabel: 'Harbor View · B', amount: 2250, dueDate: '2025-04-01', status: 'PAID', paidDate: '2025-04-03', createdAt: '', updatedAt: '' },
]

export default function PaymentTable() {
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
          {mockPayments.map(payment => (
            <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-semibold text-gray-600">
                      {payment.tenantName.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900 text-xs">{payment.tenantName}</span>
                </div>
              </td>
              <td className="py-3 pr-4 text-xs text-gray-500">{payment.unitLabel}</td>
              <td className="py-3 pr-4 text-xs font-medium text-gray-900 text-right">
                ${payment.amount.toLocaleString()}
              </td>
              <td className="py-3 pr-4 text-xs text-gray-500">
                {new Date(payment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </td>
              <td className="py-3">
                <StatusPill status={payment.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
