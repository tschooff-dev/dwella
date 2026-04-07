import StatusPill from '../../components/ui/StatusPill'

const tenants = [
  { id: '1', name: 'Priya Sharma', email: 'priya.sharma@email.com', phone: '555-201-0001', unit: 'The Elmwood · 1A', rent: 1850, leaseEnd: 'Jan 31, 2025', paymentStatus: 'PAID' as const },
  { id: '2', name: 'James Okafor', email: 'james.okafor@email.com', phone: '555-201-0002', unit: 'The Elmwood · 1B', rent: 2400, leaseEnd: 'May 31, 2025', paymentStatus: 'DUE' as const },
  { id: '3', name: 'Elena Vasquez', email: 'elena.vasquez@email.com', phone: '555-201-0003', unit: 'The Elmwood · 2A', rent: 1900, leaseEnd: 'Mar 15, 2025', paymentStatus: 'LATE' as const },
  { id: '4', name: 'Tom Nguyen', email: 'tom.nguyen@email.com', phone: '555-201-0004', unit: 'The Elmwood · 2B', rent: 2650, leaseEnd: 'Dec 31, 2025', paymentStatus: 'PAID' as const },
  { id: '5', name: 'Sarah Chen', email: 'sarah.chen@email.com', phone: '555-201-0005', unit: 'The Elmwood · 3B', rent: 3100, leaseEnd: 'Feb 28, 2025', paymentStatus: 'LATE' as const },
  { id: '6', name: 'David Kim', email: 'david.kim@email.com', phone: '555-201-0006', unit: 'Riverside · 101', rent: 2800, leaseEnd: 'Jun 30, 2025', paymentStatus: 'PAID' as const },
  { id: '7', name: 'Maya Patel', email: 'maya.patel@email.com', phone: '555-201-0007', unit: 'Riverside · 102', rent: 2800, leaseEnd: 'Jul 31, 2025', paymentStatus: 'DUE' as const },
  { id: '8', name: 'Carlos Reyes', email: 'carlos.reyes@email.com', phone: '555-201-0008', unit: 'Riverside · 201', rent: 3400, leaseEnd: 'Jan 14, 2025', paymentStatus: 'DUE' as const },
  { id: '9', name: 'Lisa Park', email: 'lisa.park@email.com', phone: '555-201-0009', unit: 'Harbor View · A', rent: 2200, leaseEnd: 'Apr 30, 2025', paymentStatus: 'PAID' as const },
  { id: '10', name: 'Mike Torres', email: 'mike.torres@email.com', phone: '555-201-0010', unit: 'Harbor View · B', rent: 2250, leaseEnd: 'Aug 31, 2025', paymentStatus: 'PAID' as const },
]

export default function TenantsPage() {
  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-500 mt-0.5">10 active tenants</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search tenants..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Tenant</th>
              <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Unit</th>
              <th className="text-right text-xs font-medium text-gray-400 px-3 py-3">Rent</th>
              <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Lease Ends</th>
              <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Payment</th>
              <th className="text-right text-xs font-medium text-gray-400 px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tenants.map(tenant => (
              <tr key={tenant.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-indigo-600">
                        {tenant.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-900">{tenant.name}</div>
                      <div className="text-[10px] text-gray-400">{tenant.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5 text-xs text-gray-500">{tenant.unit}</td>
                <td className="px-3 py-3.5 text-xs font-medium text-gray-900 text-right">${tenant.rent.toLocaleString()}</td>
                <td className="px-3 py-3.5 text-xs text-gray-500">{tenant.leaseEnd}</td>
                <td className="px-3 py-3.5">
                  <StatusPill status={tenant.paymentStatus} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
