import StatusPill from '../../components/ui/StatusPill'

type PayStatus = 'PAID' | 'DUE' | 'LATE'

const tenant = {
  name: 'Priya Sharma',
  unit: 'Unit 1A',
  property: 'The Elmwood',
  address: '142 Elmwood Ave, Portland, OR 97201',
  bedrooms: 1,
  bathrooms: 1,
  squareFeet: 680,
  floor: 1,
  rentAmount: 1850,
  rentDue: 1850,
  rentDueDate: 'April 1, 2025',
  leaseStart: 'February 1, 2024',
  leaseEnd: 'January 31, 2025',
  daysUntilExpiry: 24,
}

const paymentHistory: {
  id: string
  month: string
  amount: number
  dueDate: string
  paidDate: string | null
  status: PayStatus
}[] = [
  { id: '1', month: 'April 2025', amount: 1850, dueDate: 'Apr 1, 2025', paidDate: 'Apr 1, 2025', status: 'PAID' },
  { id: '2', month: 'March 2025', amount: 1850, dueDate: 'Mar 1, 2025', paidDate: 'Mar 2, 2025', status: 'PAID' },
  { id: '3', month: 'February 2025', amount: 1850, dueDate: 'Feb 1, 2025', paidDate: 'Feb 1, 2025', status: 'PAID' },
  { id: '4', month: 'January 2025', amount: 1850, dueDate: 'Jan 1, 2025', paidDate: 'Jan 3, 2025', status: 'PAID' },
  { id: '5', month: 'December 2024', amount: 1850, dueDate: 'Dec 1, 2024', paidDate: 'Dec 1, 2024', status: 'PAID' },
  { id: '6', month: 'November 2024', amount: 1850, dueDate: 'Nov 1, 2024', paidDate: 'Nov 4, 2024', status: 'PAID' },
]

const documents = [
  { id: '1', name: 'Lease Agreement — Unit 1A', date: 'Feb 1, 2024', type: 'PDF', url: '#' },
  { id: '2', name: 'Move-In Inspection Report', date: 'Feb 1, 2024', type: 'PDF', url: '#' },
  { id: '3', name: 'Building Rules & Regulations', date: 'Feb 1, 2024', type: 'PDF', url: '#' },
  { id: '4', name: "Renter's Insurance Requirement", date: 'Feb 1, 2024', type: 'PDF', url: '#' },
]

export default function PortalPage() {
  const isExpiringSoon = tenant.daysUntilExpiry <= 60

  return (
    <div className="space-y-5">
      {/* Lease expiry banner */}
      {isExpiringSoon && (
        <div className="flex items-center gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <svg className="w-4.5 h-4.5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <span className="text-sm font-medium text-amber-800">Your lease expires in {tenant.daysUntilExpiry} days</span>
            <span className="text-sm text-amber-700"> — {tenant.leaseEnd}. Contact your landlord to discuss renewal.</span>
          </div>
          <button className="text-xs font-medium text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors">
            Contact Landlord
          </button>
        </div>
      )}

      {/* Rent due card */}
      <div className="card p-6 flex items-center justify-between border-l-4 border-l-indigo-600">
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Rent Due</div>
          <div className="text-3xl font-bold text-gray-900">${tenant.rentDue.toLocaleString()}</div>
          <div className="text-sm text-gray-500 mt-1">Due on {tenant.rentDueDate}</div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          {/* Placeholder — wire to Stripe in production */}
          <button className="btn-primary text-sm px-6 py-2.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Pay Now
          </button>
          <span className="text-[10px] text-gray-400">Secure payment via Stripe</span>
        </div>
      </div>

      {/* Two-col grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Unit details */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Unit Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-xs text-gray-500">Property</span>
              <span className="text-xs font-medium text-gray-900">{tenant.property}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-xs text-gray-500">Unit</span>
              <span className="text-xs font-medium text-gray-900">{tenant.unit}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-xs text-gray-500">Address</span>
              <span className="text-xs font-medium text-gray-900 text-right max-w-[180px]">{tenant.address}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-xs text-gray-500">Bedrooms / Baths</span>
              <span className="text-xs font-medium text-gray-900">{tenant.bedrooms}bd / {tenant.bathrooms}ba</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-xs text-gray-500">Square Feet</span>
              <span className="text-xs font-medium text-gray-900">{tenant.squareFeet.toLocaleString()} sqft</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-xs text-gray-500">Floor</span>
              <span className="text-xs font-medium text-gray-900">{tenant.floor}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-xs text-gray-500">Lease Start</span>
              <span className="text-xs font-medium text-gray-900">{tenant.leaseStart}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs text-gray-500">Lease End</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-900">{tenant.leaseEnd}</span>
                {isExpiringSoon && (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                    {tenant.daysUntilExpiry}d
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Documents</h3>
          <div className="space-y-2">
            {documents.map(doc => (
              <a
                key={doc.id}
                href={doc.url}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-900">{doc.name}</div>
                    <div className="text-[10px] text-gray-400">{doc.type} · {doc.date}</div>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="text-sm font-semibold text-gray-900">Payment History</h3>
          <p className="text-xs text-gray-500 mt-0.5">Last 6 months</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-50">
              <th className="text-left text-xs font-medium text-gray-400 px-5 py-2.5">Month</th>
              <th className="text-right text-xs font-medium text-gray-400 px-3 py-2.5">Amount</th>
              <th className="text-left text-xs font-medium text-gray-400 px-3 py-2.5">Due Date</th>
              <th className="text-left text-xs font-medium text-gray-400 px-3 py-2.5">Paid Date</th>
              <th className="text-left text-xs font-medium text-gray-400 px-5 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paymentHistory.map(payment => (
              <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3 text-xs font-medium text-gray-900">{payment.month}</td>
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

      {/* Maintenance */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Maintenance</h3>
          <button className="btn-secondary text-xs">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Submit Request
          </button>
        </div>
        <p className="text-xs text-gray-500">No open maintenance requests. Submit a request if something needs attention.</p>
      </div>
    </div>
  )
}
