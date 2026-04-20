import { useEffect, useState } from 'react'
import StatusPill from '../../components/ui/StatusPill'
import { useApi } from '../../lib/api'

interface Unit {
  id: string
  unitNumber: string
  bedrooms: number
  bathrooms: number
  rentAmount: number
  status: 'OCCUPIED' | 'VACANT' | 'MAINTENANCE'
}

interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
  units: Unit[]
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[] | null>(null)
  const { apiFetch } = useApi()

  useEffect(() => {
    apiFetch('/api/properties').then(r => r.json()).then(setProperties)
  }, [])

  const totalUnits = properties?.reduce((s, p) => s + p.units.length, 0) ?? 0

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Properties</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {properties === null ? 'Loading…' : `${properties.length} properties · ${totalUnits} units`}
          </p>
        </div>
        <button className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Property
        </button>
      </div>

      {properties === null ? (
        <div className="card p-10 text-center text-sm text-gray-400">Loading…</div>
      ) : properties.length === 0 ? (
        <div className="card p-10 text-center text-sm text-gray-400">No properties yet.</div>
      ) : (
        <div className="space-y-5">
          {properties.map(property => {
            const occupied = property.units.filter(u => u.status === 'OCCUPIED').length
            const totalRent = property.units.filter(u => u.status === 'OCCUPIED').reduce((s, u) => s + u.rentAmount, 0)
            return (
              <div key={property.id} className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">{property.name}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{property.address}, {property.city}, {property.state}</p>
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
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-50">
                        <th className="text-left font-medium text-gray-400 px-5 py-2.5">Unit</th>
                        <th className="text-left font-medium text-gray-400 px-3 py-2.5">Beds / Baths</th>
                        <th className="text-right font-medium text-gray-400 px-3 py-2.5">Rent</th>
                        <th className="text-left font-medium text-gray-400 px-3 py-2.5 pr-5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {property.units.map(unit => (
                        <tr key={unit.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-gray-900">Unit {unit.unitNumber}</td>
                          <td className="px-3 py-3 text-gray-500">{unit.bedrooms}bd / {unit.bathrooms}ba</td>
                          <td className="px-3 py-3 text-right font-medium text-gray-900">${unit.rentAmount.toLocaleString()}</td>
                          <td className="px-3 py-3 pr-5"><StatusPill status={unit.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
