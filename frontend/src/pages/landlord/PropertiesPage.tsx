import { useEffect, useMemo, useRef, useState } from 'react'
import StatusPill from '../../components/ui/StatusPill'
import { useApi } from '../../lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

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
  zip: string
  portfolioId: string | null
  units: Unit[]
}

interface Portfolio {
  id: string
  name: string
  color: string
}

interface UnitDraft {
  unitNumber: string
  bedrooms: string
  bathrooms: string
  rentAmount: string
  depositAmount: string
  squareFeet: string
}

// ── Color palette ─────────────────────────────────────────────────────────────

const COLORS = ['indigo', 'emerald', 'amber', 'rose', 'violet', 'sky'] as const
type Color = typeof COLORS[number]

const C: Record<Color, { dot: string; border: string; hdr: string; text: string; ring: string }> = {
  indigo:  { dot: 'bg-indigo-500',  border: 'border-l-indigo-400',  hdr: 'bg-indigo-50',  text: 'text-indigo-700',  ring: 'ring-indigo-200'  },
  emerald: { dot: 'bg-emerald-500', border: 'border-l-emerald-400', hdr: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  amber:   { dot: 'bg-amber-500',   border: 'border-l-amber-400',   hdr: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-200'   },
  rose:    { dot: 'bg-rose-500',    border: 'border-l-rose-400',    hdr: 'bg-rose-50',    text: 'text-rose-700',    ring: 'ring-rose-200'    },
  violet:  { dot: 'bg-violet-500',  border: 'border-l-violet-400',  hdr: 'bg-violet-50',  text: 'text-violet-700',  ring: 'ring-violet-200'  },
  sky:     { dot: 'bg-sky-500',     border: 'border-l-sky-400',     hdr: 'bg-sky-50',     text: 'text-sky-700',     ring: 'ring-sky-200'     },
}

function colorStyle(color: string) {
  return C[color as Color] ?? C.indigo
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function portfolioStats(props: Property[]) {
  const units = props.reduce((s, p) => s + p.units.length, 0)
  const occupied = props.reduce((s, p) => s + p.units.filter(u => u.status === 'OCCUPIED').length, 0)
  const rent = props.reduce((s, p) => s + p.units.filter(u => u.status === 'OCCUPIED').reduce((r, u) => r + u.rentAmount, 0), 0)
  const pct = units > 0 ? Math.round((occupied / units) * 100) : 0
  return { units, occupied, pct, rent }
}

function emptyUnit(): UnitDraft {
  return { unitNumber: '', bedrooms: '1', bathrooms: '1', rentAmount: '', depositAmount: '', squareFeet: '' }
}

// ── New Portfolio Modal ───────────────────────────────────────────────────────

function NewPortfolioModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Portfolio) => void }) {
  const { apiFetch } = useApi()
  const [name, setName] = useState('')
  const [color, setColor] = useState<Color>('indigo')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const res = await apiFetch('/api/portfolios', { method: 'POST', body: JSON.stringify({ name: name.trim(), color }) })
    if (res.ok) { onCreated(await res.json()); onClose() }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">New Portfolio</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
            <input
              autoFocus
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Long-term Rentals"
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full ${C[c].dot} transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ' + C[c].ring : 'hover:scale-110'}`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary text-sm flex-1">Cancel</button>
            <button type="submit" disabled={saving || !name.trim()} className="btn-primary text-sm flex-1 disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Portfolio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Edit Portfolio Modal ──────────────────────────────────────────────────────

function EditPortfolioModal({ portfolio, onClose, onSaved }: { portfolio: Portfolio; onClose: () => void; onSaved: (p: Portfolio) => void }) {
  const { apiFetch } = useApi()
  const [name, setName] = useState(portfolio.name)
  const [color, setColor] = useState<Color>((portfolio.color as Color) ?? 'indigo')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await apiFetch(`/api/portfolios/${portfolio.id}`, { method: 'PATCH', body: JSON.stringify({ name: name.trim(), color }) })
    if (res.ok) { onSaved({ ...portfolio, name: name.trim(), color }); onClose() }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Edit Portfolio</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
            <input autoFocus required value={name} onChange={e => setName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full ${C[c].dot} transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ' + C[c].ring : 'hover:scale-110'}`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary text-sm flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm flex-1 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Move Property Popover ─────────────────────────────────────────────────────

function MovePopover({
  property,
  portfolios,
  onMove,
  onClose,
}: {
  property: Property
  portfolios: Portfolio[]
  onMove: (portfolioId: string | null) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div ref={ref} className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 w-48 text-xs">
      <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Move to portfolio</p>
      {portfolios.map(p => {
        const cs = colorStyle(p.color)
        const isCurrent = property.portfolioId === p.id
        return (
          <button
            key={p.id}
            onClick={() => onMove(isCurrent ? null : p.id)}
            className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors ${isCurrent ? 'text-gray-900 font-medium' : 'text-gray-700'}`}
          >
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cs.dot}`} />
            {p.name}
            {isCurrent && <span className="ml-auto text-[10px] text-gray-400">current</span>}
          </button>
        )
      })}
      {property.portfolioId && (
        <>
          <div className="border-t border-gray-50 my-1" />
          <button
            onClick={() => onMove(null)}
            className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-gray-50 text-gray-500"
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-gray-300" />
            Uncategorized
          </button>
        </>
      )}
    </div>
  )
}

// ── Property Card ─────────────────────────────────────────────────────────────

function PropertyCard({
  property,
  portfolios,
  onAddUnit,
  onMove,
}: {
  property: Property
  portfolios: Portfolio[]
  onAddUnit: () => void
  onMove: (portfolioId: string | null) => void
}) {
  const [showMove, setShowMove] = useState(false)
  const occupied = property.units.filter(u => u.status === 'OCCUPIED').length
  const totalRent = property.units.filter(u => u.status === 'OCCUPIED').reduce((s, u) => s + u.rentAmount, 0)

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{property.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{property.address}, {property.city}, {property.state}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-400">Occupancy</div>
            <div className="text-sm font-semibold text-gray-900">{occupied}/{property.units.length}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Monthly Rent</div>
            <div className="text-sm font-semibold text-indigo-600">${totalRent.toLocaleString()}</div>
          </div>
          <button className="btn-secondary text-xs" onClick={onAddUnit}>+ Add Unit</button>
          {portfolios.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowMove(v => !v)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Move to portfolio"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </button>
              {showMove && (
                <MovePopover
                  property={property}
                  portfolios={portfolios}
                  onMove={id => { onMove(id); setShowMove(false) }}
                  onClose={() => setShowMove(false)}
                />
              )}
            </div>
          )}
        </div>
      </div>
      {property.units.length === 0 ? (
        <div className="px-5 py-4 text-xs text-gray-400">
          No units yet.{' '}
          <button className="text-indigo-600 hover:underline" onClick={onAddUnit}>Add a unit</button>
        </div>
      ) : (
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
      )}
    </div>
  )
}

// ── Portfolio Section ─────────────────────────────────────────────────────────

function PortfolioSection({
  portfolio,
  properties,
  allPortfolios,
  collapsed,
  onToggle,
  onEdit,
  onDelete,
  onAddUnit,
  onMoveProperty,
}: {
  portfolio: Portfolio
  properties: Property[]
  allPortfolios: Portfolio[]
  collapsed: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onAddUnit: (p: Property) => void
  onMoveProperty: (p: Property, portfolioId: string | null) => void
}) {
  const cs = colorStyle(portfolio.color)
  const stats = portfolioStats(properties)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className={`rounded-xl border border-gray-100 overflow-hidden border-l-4 ${cs.border}`}>
      {/* Section header */}
      <div className={`px-4 py-3 flex items-center gap-3 ${cs.hdr}`}>
        <button onClick={onToggle} className="text-gray-500 hover:text-gray-700 shrink-0">
          <svg className={`w-4 h-4 transition-transform ${collapsed ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cs.dot}`} />

        <span className={`text-sm font-semibold ${cs.text}`}>{portfolio.name}</span>

        <div className="ml-1 flex items-center gap-3 text-xs text-gray-500">
          <span>{properties.length} {properties.length === 1 ? 'property' : 'properties'}</span>
          {stats.units > 0 && (
            <>
              <span className="text-gray-300">·</span>
              <span>{stats.units} units</span>
              <span className="text-gray-300">·</span>
              <span>{stats.pct}% occupied</span>
              <span className="text-gray-300">·</span>
              <span className="font-medium text-gray-700">${stats.rent.toLocaleString()}/mo</span>
            </>
          )}
        </div>

        <div className="ml-auto relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(v => !v)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-black/5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-7 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 w-36 text-xs">
              <button onClick={() => { onEdit(); setShowMenu(false) }} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700">
                Rename / Recolor
              </button>
              <button onClick={() => { onDelete(); setShowMenu(false) }} className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600">
                Delete Portfolio
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Properties */}
      {!collapsed && (
        <div className="p-3 space-y-3 bg-gray-50/50">
          {properties.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No properties in this portfolio yet.</p>
          ) : (
            properties.map(p => (
              <PropertyCard
                key={p.id}
                property={p}
                portfolios={allPortfolios}
                onAddUnit={() => onAddUnit(p)}
                onMove={id => onMoveProperty(p, id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Add Property Drawer ───────────────────────────────────────────────────────

function AddPropertyDrawer({
  onClose,
  onCreated,
  landlordId,
  portfolios,
}: {
  onClose: () => void
  onCreated: (p: Property) => void
  landlordId: string
  portfolios: Portfolio[]
}) {
  const { apiFetch } = useApi()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [description, setDescription] = useState('')
  const [portfolioId, setPortfolioId] = useState('')
  const [units, setUnits] = useState<UnitDraft[]>([emptyUnit()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function updateUnit(i: number, field: keyof UnitDraft, value: string) {
    setUnits(prev => prev.map((u, idx) => idx === i ? { ...u, [field]: value } : u))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const propRes = await apiFetch('/api/properties', {
        method: 'POST',
        body: JSON.stringify({ name, address, city, state, zip, description: description || undefined, landlordId, portfolioId: portfolioId || null }),
      })
      if (!propRes.ok) throw new Error('Failed to create property')
      const property = await propRes.json()

      const filledUnits = units.filter(u => u.unitNumber.trim())
      await Promise.all(filledUnits.map(u =>
        apiFetch('/api/units', {
          method: 'POST',
          body: JSON.stringify({
            propertyId: property.id,
            unitNumber: u.unitNumber.trim(),
            bedrooms: Number(u.bedrooms),
            bathrooms: Number(u.bathrooms),
            rentAmount: Number(u.rentAmount),
            depositAmount: u.depositAmount ? Number(u.depositAmount) : undefined,
            squareFeet: u.squareFeet ? Number(u.squareFeet) : undefined,
          }),
        })
      ))

      const refreshed = await apiFetch(`/api/properties/${property.id}`).then(r => r.json())
      onCreated(refreshed)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg bg-white h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Add Property</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Property Details</div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Property Name *</label>
              <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Riverside Commons" className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Street Address *</label>
              <input required value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" className="input" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                <input required value={city} onChange={e => setCity(e.target.value)} placeholder="Chicago" className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">State *</label>
                <input required value={state} onChange={e => setState(e.target.value)} placeholder="IL" maxLength={2} className="input uppercase" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ZIP *</label>
                <input required value={zip} onChange={e => setZip(e.target.value)} placeholder="60601" className="input" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Brief description" className="input resize-none" />
            </div>
            {portfolios.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Portfolio <span className="text-gray-400 font-normal">(optional)</span></label>
                <select value={portfolioId} onChange={e => setPortfolioId(e.target.value)} className="input">
                  <option value="">No portfolio (Uncategorized)</option>
                  {portfolios.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Units</div>
              <button type="button" onClick={() => setUnits(prev => [...prev, emptyUnit()])} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ Add unit</button>
            </div>
            {units.map((unit, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3.5 space-y-2.5 relative">
                {units.length > 1 && (
                  <button type="button" onClick={() => setUnits(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-3 right-3 text-gray-300 hover:text-gray-500">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Unit {i + 1}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unit # *</label>
                    <input required value={unit.unitNumber} onChange={e => updateUnit(i, 'unitNumber', e.target.value)} placeholder="1A" className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Rent / mo *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                      <input required type="number" min={0} value={unit.rentAmount} onChange={e => updateUnit(i, 'rentAmount', e.target.value)} placeholder="1500" className="input pl-6" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Beds *</label>
                    <select value={unit.bedrooms} onChange={e => updateUnit(i, 'bedrooms', e.target.value)} className="input">
                      {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n === 0 ? 'Studio' : n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Baths *</label>
                    <select value={unit.bathrooms} onChange={e => updateUnit(i, 'bathrooms', e.target.value)} className="input">
                      {[1,1.5,2,2.5,3].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sq ft</label>
                    <input type="number" min={0} value={unit.squareFeet} onChange={e => updateUnit(i, 'squareFeet', e.target.value)} placeholder="750" className="input" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Security Deposit</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                    <input type="number" min={0} value={unit.depositAmount} onChange={e => updateUnit(i, 'depositAmount', e.target.value)} placeholder="1500" className="input pl-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button type="button" onClick={() => formRef.current?.requestSubmit()} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
            {saving ? 'Saving…' : 'Create Property'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add Unit Drawer ───────────────────────────────────────────────────────────

function AddUnitDrawer({ property, onClose, onAdded }: { property: Property; onClose: () => void; onAdded: (unit: Unit) => void }) {
  const { apiFetch } = useApi()
  const [unit, setUnit] = useState<UnitDraft>(emptyUnit())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await apiFetch('/api/units', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: property.id,
          unitNumber: unit.unitNumber.trim(),
          bedrooms: Number(unit.bedrooms),
          bathrooms: Number(unit.bathrooms),
          rentAmount: Number(unit.rentAmount),
          depositAmount: unit.depositAmount ? Number(unit.depositAmount) : undefined,
          squareFeet: unit.squareFeet ? Number(unit.squareFeet) : undefined,
        }),
      })
      if (!res.ok) throw new Error()
      onAdded(await res.json())
    } catch {
      setError('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-sm bg-white h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Add Unit</h2>
            <p className="text-xs text-gray-400">{property.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Unit # *</label>
              <input required value={unit.unitNumber} onChange={e => setUnit(u => ({ ...u, unitNumber: e.target.value }))} placeholder="1A" className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rent / mo *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                <input required type="number" min={0} value={unit.rentAmount} onChange={e => setUnit(u => ({ ...u, rentAmount: e.target.value }))} placeholder="1500" className="input pl-6" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Beds *</label>
              <select value={unit.bedrooms} onChange={e => setUnit(u => ({ ...u, bedrooms: e.target.value }))} className="input">
                {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n === 0 ? 'Studio' : n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Baths *</label>
              <select value={unit.bathrooms} onChange={e => setUnit(u => ({ ...u, bathrooms: e.target.value }))} className="input">
                {[1,1.5,2,2.5,3].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sq ft</label>
              <input type="number" min={0} value={unit.squareFeet} onChange={e => setUnit(u => ({ ...u, squareFeet: e.target.value }))} placeholder="750" className="input" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Security Deposit</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
              <input type="number" min={0} value={unit.depositAmount} onChange={e => setUnit(u => ({ ...u, depositAmount: e.target.value }))} placeholder="1500" className="input pl-6" />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary text-sm flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm flex-1 disabled:opacity-50">{saving ? 'Saving…' : 'Add Unit'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PropertiesPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [properties, setProperties] = useState<Property[] | null>(null)
  const [landlordId, setLandlordId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [showNewPortfolio, setShowNewPortfolio] = useState(false)
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null)
  const [showAddProperty, setShowAddProperty] = useState(false)
  const [addUnitFor, setAddUnitFor] = useState<Property | null>(null)
  const { apiFetch } = useApi()

  useEffect(() => {
    apiFetch('/api/users/me').then(r => r.json()).then(u => setLandlordId(u?.id ?? null))
    apiFetch('/api/properties').then(r => r.json()).then(setProperties)
    apiFetch('/api/portfolios').then(r => r.json()).then(setPortfolios)
  }, [])

  const grouped = useMemo(() => {
    const map: Record<string, Property[]> = {}
    portfolios.forEach(p => { map[p.id] = [] })
    properties?.forEach(p => {
      const key = p.portfolioId && map[p.portfolioId] !== undefined ? p.portfolioId : '__none__'
      if (!map[key]) map[key] = []
      map[key].push(p)
    })
    return map
  }, [portfolios, properties])

  const uncategorized = grouped['__none__'] ?? []
  const totalProperties = properties?.length ?? 0
  const totalUnits = properties?.reduce((s, p) => s + p.units.length, 0) ?? 0

  function toggleCollapse(key: string) {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleMoveProperty(property: Property, portfolioId: string | null) {
    await apiFetch(`/api/properties/${property.id}`, { method: 'PATCH', body: JSON.stringify({ portfolioId }) })
    setProperties(prev => prev?.map(p => p.id === property.id ? { ...p, portfolioId } : p) ?? null)
  }

  async function handleDeletePortfolio(id: string) {
    if (!confirm('Delete this portfolio? Properties inside will become uncategorized.')) return
    await apiFetch(`/api/portfolios/${id}`, { method: 'DELETE' })
    setPortfolios(prev => prev.filter(p => p.id !== id))
    setProperties(prev => prev?.map(p => p.portfolioId === id ? { ...p, portfolioId: null } : p) ?? null)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 40px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Properties</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            {properties === null
              ? 'Loading…'
              : `${totalProperties} ${totalProperties === 1 ? 'property' : 'properties'} · ${totalUnits} units${portfolios.length > 0 ? ` · ${portfolios.length} portfolios` : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={() => setShowNewPortfolio(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            New Portfolio
          </button>
          <button className="btn-primary" onClick={() => setShowAddProperty(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Property
          </button>
        </div>
      </div>

      {/* Content */}
      {properties === null ? (
        <div className="card p-10 text-center text-sm text-gray-400">Loading…</div>
      ) : properties.length === 0 && portfolios.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-gray-400 mb-3">No properties yet.</p>
          <button className="btn-primary text-sm" onClick={() => setShowAddProperty(true)}>Add your first property</button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Portfolio sections */}
          {portfolios.map(portfolio => (
            <PortfolioSection
              key={portfolio.id}
              portfolio={portfolio}
              properties={grouped[portfolio.id] ?? []}
              allPortfolios={portfolios}
              collapsed={!!collapsed[portfolio.id]}
              onToggle={() => toggleCollapse(portfolio.id)}
              onEdit={() => setEditingPortfolio(portfolio)}
              onDelete={() => handleDeletePortfolio(portfolio.id)}
              onAddUnit={p => setAddUnitFor(p)}
              onMoveProperty={handleMoveProperty}
            />
          ))}

          {/* Uncategorized */}
          {uncategorized.length > 0 && (
            <div className="rounded-xl border border-gray-100 overflow-hidden border-l-4 border-l-gray-200">
              <button
                onClick={() => toggleCollapse('__none__')}
                className="w-full px-4 py-3 flex items-center gap-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${collapsed['__none__'] ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300 shrink-0" />
                <span className="text-sm font-medium text-gray-500">Uncategorized</span>
                <span className="text-xs text-gray-400">{uncategorized.length} {uncategorized.length === 1 ? 'property' : 'properties'}</span>
              </button>
              {!collapsed['__none__'] && (
                <div className="p-3 space-y-3 bg-gray-50/30">
                  {uncategorized.map(p => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      portfolios={portfolios}
                      onAddUnit={() => setAddUnitFor(p)}
                      onMove={id => handleMoveProperty(p, id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No properties but portfolios exist */}
          {properties.length === 0 && portfolios.length > 0 && (
            <div className="card p-8 text-center">
              <p className="text-sm text-gray-400 mb-3">No properties yet.</p>
              <button className="btn-primary text-sm" onClick={() => setShowAddProperty(true)}>Add your first property</button>
            </div>
          )}
        </div>
      )}

      {showNewPortfolio && (
        <NewPortfolioModal
          onClose={() => setShowNewPortfolio(false)}
          onCreated={p => setPortfolios(prev => [...prev, p])}
        />
      )}

      {editingPortfolio && (
        <EditPortfolioModal
          portfolio={editingPortfolio}
          onClose={() => setEditingPortfolio(null)}
          onSaved={updated => {
            setPortfolios(prev => prev.map(p => p.id === updated.id ? updated : p))
            setEditingPortfolio(null)
          }}
        />
      )}

      {showAddProperty && landlordId && (
        <AddPropertyDrawer
          landlordId={landlordId}
          portfolios={portfolios}
          onClose={() => setShowAddProperty(false)}
          onCreated={p => { setProperties(prev => prev ? [p, ...prev] : [p]); setShowAddProperty(false) }}
        />
      )}

      {addUnitFor && (
        <AddUnitDrawer
          property={addUnitFor}
          onClose={() => setAddUnitFor(null)}
          onAdded={unit => {
            setProperties(prev => prev?.map(p => p.id === addUnitFor.id ? { ...p, units: [...p.units, unit] } : p) ?? null)
            setAddUnitFor(null)
          }}
        />
      )}
    </div>
  )
}
