import StatusPill from '../../components/ui/StatusPill'

const properties = [
  {
    id: '1',
    name: 'The Elmwood',
    address: '142 Elmwood Ave, Portland, OR 97201',
    units: [
      { number: '1A', beds: 1, baths: 1, sqft: 680, rent: 1850, status: 'OCCUPIED' as const },
      { number: '1B', beds: 2, baths: 1, sqft: 920, rent: 2400, status: 'OCCUPIED' as const },
      { number: '2A', beds: 1, baths: 1, sqft: 680, rent: 1900, status: 'OCCUPIED' as const },
      { number: '2B', beds: 2, baths: 2, sqft: 1050, rent: 2650, status: 'OCCUPIED' as const },
      { number: '3A', beds: 1, baths: 1, sqft: 680, rent: 1950, status: 'VACANT' as const },
      { number: '3B', beds: 3, baths: 2, sqft: 1300, rent: 3100, status: 'OCCUPIED' as const },
    ],
  },
  {
    id: '2',
    name: 'Riverside Commons',
    address: '890 River Rd, Portland, OR 97209',
    units: [
      { number: '101', beds: 2, baths: 2, sqft: 1100, rent: 2800, status: 'OCCUPIED' as const },
      { number: '102', beds: 2, baths: 2, sqft: 1100, rent: 2800, status: 'OCCUPIED' as const },
      { number: '201', beds: 3, baths: 2, sqft: 1400, rent: 3400, status: 'OCCUPIED' as const },
      { number: '202', beds: 3, baths: 2, sqft: 1400, rent: 3400, status: 'VACANT' as const },
    ],
  },
  {
    id: '3',
    name: 'Harbor View',
    address: '33 Harbor Blvd, Portland, OR 97217',
    units: [
      { number: 'A', beds: 2, baths: 1, sqft: 950, rent: 2200, status: 'OCCUPIED' as const },
      { number: 'B', beds: 2, baths: 1, sqft: 950, rent: 2250, status: 'OCCUPIED' as const },
    ],
  },
]

export default function PropertiesPage() {
  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Properties</h1>
          <p className="text-sm text-gray-500 mt-0.5">3 properties · 12 units</p>
        </div>
        <button className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Property
        </button>
      </div>

      <div className="space-y-5">
        {properties.map(property => {
          const occupied = property.units.filter(u => u.status === 'OCCUPIED').length
          const totalRent = property.units.filter(u => u.status === 'OCCUPIED').reduce((s, u) => s + u.rent, 0)

          return (
            <div key={property.id} className="card overflow-hidden">
              {/* Property header */}
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">{property.name}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{property.address}</p>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="text-xs text-gray-500">Occupancy</div>
                    <div className="text-sm font-semibold text-gray-900">{occupied}/{property.units.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Monthly Rent</div>
                    <div className="text-sm font-semibold text-indigo-600">${totalRent.toLocaleString()}</div>
                  </div>
                  <button className="btn-secondary text-xs">Manage</button>
                </div>
              </div>

              {/* Units table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-50">
                      <th className="text-left font-medium text-gray-400 px-5 py-2.5">Unit</th>
                      <th className="text-left font-medium text-gray-400 px-3 py-2.5">Beds / Baths</th>
                      <th className="text-left font-medium text-gray-400 px-3 py-2.5">Sq Ft</th>
                      <th className="text-right font-medium text-gray-400 px-3 py-2.5">Rent</th>
                      <th className="text-left font-medium text-gray-400 px-3 py-2.5 pr-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {property.units.map(unit => (
                      <tr key={unit.number} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900">Unit {unit.number}</td>
                        <td className="px-3 py-3 text-gray-500">{unit.beds}bd / {unit.baths}ba</td>
                        <td className="px-3 py-3 text-gray-500">{unit.sqft.toLocaleString()} sqft</td>
                        <td className="px-3 py-3 text-right font-medium text-gray-900">${unit.rent.toLocaleString()}</td>
                        <td className="px-3 py-3 pr-5">
                          <StatusPill status={unit.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
