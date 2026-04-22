import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams, useOutletContext, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useApi } from '../../lib/api'
import { avatarColor } from '../../components/ui/Avatar'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '')

interface TenantInfo {
  user: { id: string; firstName: string; lastName: string; email: string }
  lease: {
    id: string
    startDate: string
    endDate: string
    rentAmount: number
    depositPaid: number | null
    unit: {
      unitNumber: string
      property: {
        name: string
        address: string
        city: string
        state: string
        zip: string
        landlord: { firstName: string; lastName: string; email: string }
      }
    }
  } | null
}

interface Payment {
  id: string
  amount: number
  status: 'PAID' | 'DUE' | 'LATE' | 'PARTIAL'
  dueDate: string
  paidDate: string | null
  method: string | null
}

interface SavedPaymentMethod {
  id: string
  type: 'card' | 'us_bank_account'
  brand?: string
  last4?: string
  expMonth?: number
  expYear?: number
  funding?: string
  bankName?: string
  accountType?: string
  mandate?: string | null
}

interface MaintenanceRequest {
  id: string
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  createdAt: string
  unit: { unitNumber: string; property: { name: string } }
}

interface Message {
  id: string
  body: string
  createdAt: string
  sender: { id: string; firstName: string; lastName: string; role: string }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAY_STYLE = {
  PAID:    { bg: '#dcfce7', color: '#166534', heroBg: 'linear-gradient(135deg,#059669,#10b981)', heroLabel: 'All Caught Up', heroSub: 'No outstanding balance' },
  DUE:     { bg: '#eff6ff', color: '#1d4ed8', heroBg: 'linear-gradient(135deg,#4f46e5,#7c3aed)', heroLabel: 'Rent Due',      heroSub: '' },
  LATE:    { bg: '#fef2f2', color: '#991b1b', heroBg: 'linear-gradient(135deg,#dc2626,#ef4444)', heroLabel: 'Overdue',       heroSub: 'Payment past due' },
  PARTIAL: { bg: '#fffbeb', color: '#92400e', heroBg: 'linear-gradient(135deg,#d97706,#f59e0b)', heroLabel: 'Partial',       heroSub: 'Balance remaining' },
}

const PRI_STYLE: Record<string, [string, string]> = {
  LOW:    ['#f1f5f9', '#475569'],
  MEDIUM: ['#fffbeb', '#b45309'],
  HIGH:   ['#fff7ed', '#c2410c'],
  URGENT: ['#fef2f2', '#991b1b'],
}
const STA_STYLE: Record<string, [string, string]> = {
  OPEN:        ['#eff6ff', '#1e40af'],
  IN_PROGRESS: ['#fffbeb', '#b45309'],
  RESOLVED:    ['#dcfce7', '#166534'],
  CLOSED:      ['#f1f5f9', '#475569'],
}

function PayBadge({ status }: { status: string }) {
  const s = PAY_STYLE[status as keyof typeof PAY_STYLE] ?? PAY_STYLE.DUE
  return <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, whiteSpace: 'nowrap' }}>{status}</span>
}

function PriBadge({ label }: { label: string }) {
  const [bg, color] = PRI_STYLE[label] ?? ['#f1f5f9', '#475569']
  return <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, whiteSpace: 'nowrap' }}>{label}</span>
}

function StaBadge({ label }: { label: string }) {
  const [bg, color] = STA_STYLE[label] ?? ['#f1f5f9', '#475569']
  return <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, whiteSpace: 'nowrap' }}>{label.replace('_', ' ')}</span>
}

function InitialsAvatar({ name, size = 36, color }: { name: string; size?: number; color?: string }) {
  const bg = color ?? avatarColor(name)
  const parts = name.trim().split(' ')
  const initials = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg + '22', color: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.34, fontWeight: 700, flexShrink: 0 }}>
      {initials.toUpperCase()}
    </div>
  )
}

function feeInfo(pm: SavedPaymentMethod): { text: string; flatFee?: number; rate?: number } {
  if (pm.type === 'us_bank_account') return { text: '$5.00 flat fee', flatFee: 5 }
  if (pm.funding === 'debit') return { text: '1.5% fee', rate: 0.015 }
  return { text: '3.0% fee', rate: 0.03 }
}

function calcFee(pm: SavedPaymentMethod, amount: number): number {
  const info = feeInfo(pm)
  if (info.flatFee !== undefined) return info.flatFee
  return Math.round(amount * (info.rate ?? 0) * 100) / 100
}

// ─── Add Payment Method ───────────────────────────────────────────────────────

function SetupForm({ setupIntentId, onClose, onAdded }: { setupIntentId: string; onClose: () => void; onAdded: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const { apiFetch } = useApi()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setSaving(true)
    setError('')
    const result = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: `${window.location.origin}/tenant/portal?tab=payments&setup_intent=${setupIntentId}` },
      redirect: 'if_required',
    })
    if (result.error) {
      setError(result.error.message ?? 'Setup failed. Please try again.')
      setSaving(false)
    } else {
      const siId = (result as any).setupIntent?.id ?? setupIntentId
      await apiFetch('/api/tenant/payment-methods/confirm', { method: 'POST', body: JSON.stringify({ setupIntentId: siId }) }).catch(() => {})
      onAdded()
      onClose()
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PaymentElement options={{ layout: 'tabs', wallets: { applePay: 'never', googlePay: 'never' } }} />
      {error && <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose} className="btn-ghost" style={{ fontSize: 13 }}>Cancel</button>
        <button type="submit" disabled={!stripe || saving} className="btn-primary" style={{ fontSize: 13, opacity: !stripe || saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save Payment Method'}
        </button>
      </div>
    </form>
  )
}

function AddPaymentMethodModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { apiFetch } = useApi()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [setupIntentId, setSetupIntentId] = useState('')
  const [initError, setInitError] = useState('')

  useEffect(() => {
    apiFetch('/api/tenant/payment-methods/setup', { method: 'POST' })
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setClientSecret(d.clientSecret); setSetupIntentId(d.setupIntentId) })
      .catch((err: any) => setInitError(err.message ?? 'Failed to initialize'))
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,15,24,0.45)', backdropFilter: 'blur(3px)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', margin: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0d0f18', margin: 0 }}>Add Payment Method</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', background: '#f4f4f8', borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
          <strong style={{ color: '#0d0f18' }}>Fees:</strong>&nbsp; ACH bank transfer — $5.00 flat &nbsp;·&nbsp; Debit card — 1.5% &nbsp;·&nbsp; Credit card — 3.0%
        </div>
        {initError && <p style={{ color: '#dc2626', fontSize: 13 }}>{initError}</p>}
        {!clientSecret && !initError && <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: 13 }}>Loading…</div>}
        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#4f46e5', colorText: '#0d0f18', colorDanger: '#dc2626', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', borderRadius: '8px' } } }}>
            <SetupForm setupIntentId={setupIntentId} onClose={onClose} onAdded={onAdded} />
          </Elements>
        )}
      </div>
    </div>
  )
}

// ─── Pay With Saved Method Modal ──────────────────────────────────────────────

function PayWithSavedModal({ payment, methods, onClose, onPaid }: { payment: Payment; methods: SavedPaymentMethod[]; onClose: () => void; onPaid: () => void }) {
  const { apiFetch } = useApi()
  const [selected, setSelected] = useState(methods[0]?.id ?? '')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  const pm = methods.find(m => m.id === selected)
  const fee = pm ? calcFee(pm, payment.amount) : 0
  const total = payment.amount + fee
  const feeRate = pm ? (feeInfo(pm).rate ?? 0) : 0

  async function handlePay() {
    setPaying(true)
    setError('')
    try {
      const res = await apiFetch(`/api/tenant/payments/${payment.id}/pay-saved`, { method: 'POST', body: JSON.stringify({ paymentMethodId: selected }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Payment failed')
      if (data.requiresAction) window.location.href = `/tenant/portal?tab=payments&paid=${payment.id}`
      else onPaid()
    } catch (err: any) {
      setError(err.message ?? 'Payment failed')
      setPaying(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,15,24,0.45)', backdropFilter: 'blur(3px)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', margin: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0d0f18', margin: 0 }}>Pay Rent</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Choose payment method</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {methods.map(m => {
            const { text, rate: r } = feeInfo(m)
            const isSel = selected === m.id
            return (
              <button key={m.id} onClick={() => setSelected(m.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${isSel ? '#4f46e5' : '#e6e6ef'}`, background: isSel ? 'rgba(79,70,229,0.04)' : '#fff', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{m.type === 'us_bank_account' ? '🏦' : '💳'}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0d0f18', margin: 0 }}>
                      {m.type === 'us_bank_account' ? `${m.bankName} ···${m.last4}` : `${(m.brand ?? 'Card').charAt(0).toUpperCase() + (m.brand ?? 'Card').slice(1)} ···${m.last4}`}
                    </p>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>
                      {m.type === 'us_bank_account' ? m.accountType : `${m.funding === 'debit' ? 'Debit' : 'Credit'} · Exp ${m.expMonth}/${m.expYear}`}
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: r === 0 ? '#059669' : '#6b7280' }}>{text}</span>
              </button>
            )
          })}
        </div>
        <div style={{ background: '#f4f4f8', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginBottom: fee > 0 ? 4 : 0 }}>
            <span>Rent</span><span>${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          {fee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
              <span>{feeRate > 0 ? `Convenience fee (${(feeRate * 100).toFixed(1)}%)` : 'ACH processing fee'}</span>
              <span>${fee.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#0d0f18', borderTop: '1px solid #e6e6ef', paddingTop: 8, marginTop: 8 }}>
            <span>Total</span><span>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        {error && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
          <button onClick={handlePay} disabled={!selected || paying} className="btn-primary" style={{ flex: 2, justifyContent: 'center', opacity: paying ? 0.7 : 1 }}>
            {paying ? 'Processing…' : `Pay $${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Payment Methods Section ──────────────────────────────────────────────────

function PaymentMethodsSection({ methods, loading, onAdd, onRemove }: { methods: SavedPaymentMethod[]; loading: boolean; onAdd: () => void; onRemove: (id: string) => void }) {
  const { apiFetch } = useApi()
  const [removing, setRemoving] = useState<string | null>(null)

  async function handleRemove(id: string) {
    setRemoving(id)
    await apiFetch(`/api/tenant/payment-methods/${id}`, { method: 'DELETE' }).catch(() => {})
    onRemove(id)
    setRemoving(null)
  }

  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#0d0f18', margin: 0 }}>Payment Methods</p>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '3px 0 0' }}>ACH — $5.00 flat · Debit — 1.5% · Credit — 3.0%</p>
        </div>
        <button onClick={onAdd} className="btn-ghost" style={{ fontSize: 12, padding: '7px 14px' }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Method
        </button>
      </div>
      {loading && <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '8px 0' }}>Loading…</p>}
      {!loading && methods.length === 0 && (
        <div style={{ textAlign: 'center', padding: '12px 0', color: '#9ca3af', fontSize: 13 }}>No payment methods saved. Add one to pay rent directly.</div>
      )}
      {!loading && methods.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {methods.map(m => {
            const { text } = feeInfo(m)
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1.5px solid #e6e6ef', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{m.type === 'us_bank_account' ? '🏦' : '💳'}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0d0f18', margin: 0 }}>
                      {m.type === 'us_bank_account' ? `${m.bankName} ···${m.last4}` : `${(m.brand ?? 'Card').charAt(0).toUpperCase() + (m.brand ?? 'Card').slice(1)} ···${m.last4}`}
                    </p>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>
                      {m.type === 'us_bank_account'
                        ? `${(m.accountType ?? 'checking').charAt(0).toUpperCase() + (m.accountType ?? 'checking').slice(1)} · ${text}`
                        : `${m.funding === 'debit' ? 'Debit' : 'Credit'} · Exp ${m.expMonth}/${String(m.expYear).slice(-2)} · ${text}`}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleRemove(m.id)} disabled={removing === m.id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c4c4d0', padding: 6 }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#dc2626'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#c4c4d0'}>
                  {removing === m.id ? '…' : <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ me, payments, onPay, paying, onNavigateToMessages }: { me: TenantInfo; payments: Payment[]; onPay: (id: string) => void; paying: string | null; onNavigateToMessages: () => void }) {
  const lease = me.lease
  const next = payments.find(p => p.status === 'DUE' || p.status === 'LATE')
  const hs = PAY_STYLE[next?.status ?? 'PAID'] ?? PAY_STYLE.PAID
  const recent = payments.slice(0, 4)

  const leaseEnd = lease ? new Date(lease.endDate) : null
  const daysLeft = leaseEnd ? Math.ceil((leaseEnd.getTime() - Date.now()) / 86400000) : null

  const paidCount = payments.filter(p => p.status === 'PAID').length
  const pct = payments.length > 0 ? Math.round((paidCount / payments.length) * 100) : 100

  const landlordName = lease ? `${lease.unit.property.landlord.firstName} ${lease.unit.property.landlord.lastName}` : ''

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = me.user.firstName

  if (!lease) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0d0f18' }}>{greeting}, {firstName} 👋</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>No active lease found. Contact your landlord.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Greeting */}
      <div style={{ marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0d0f18' }}>{greeting}, {firstName} 👋</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          {lease.unit.property.name} · Unit {lease.unit.unitNumber} · {lease.unit.property.address}, {lease.unit.property.city}
        </p>
      </div>
      {/* Hero */}
      <div style={{ background: next ? hs.heroBg : PAY_STYLE.PAID.heroBg, borderRadius: 16, padding: '28px 28px 24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.08, fontSize: 120, fontWeight: 900, lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>$</div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8, marginBottom: 8 }}>
          {next ? hs.heroLabel : 'All Caught Up'}
        </div>
        <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, marginBottom: 6 }}>
          {next ? `$${next.amount.toLocaleString()}` : '$0'}
        </div>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: next ? 20 : 0 }}>
          {next
            ? next.status === 'DUE'
              ? `Due ${new Date(next.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
              : hs.heroSub
            : 'No outstanding balance'}
        </div>
        {next && (
          <button
            onClick={() => onPay(next.id)}
            disabled={paying === next.id}
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 8, padding: '11px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: paying === next.id ? 0.6 : 1 }}
          >
            {paying === next.id ? 'Loading…' : 'Pay Now →'}
          </button>
        )}
      </div>

      {/* 2-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Your Home */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Your Home</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {[
              ['Property', lease.unit.property.name],
              ['Unit', `Unit ${lease.unit.unitNumber}`],
              ['Address', `${lease.unit.property.address}, ${lease.unit.property.city}, ${lease.unit.property.state} ${lease.unit.property.zip}`],
              ['Monthly Rent', `$${lease.rentAmount.toLocaleString()}/mo`],
              ['Lease Ends', new Date(lease.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, fontSize: 13 }}>
                <span style={{ color: '#9ca3af', flexShrink: 0 }}>{k}</span>
                <span style={{ fontWeight: 600, textAlign: 'right', color: k === 'Lease Ends' && daysLeft !== null && daysLeft < 90 ? '#d97706' : '#0d0f18' }}>
                  {v}
                  {k === 'Lease Ends' && daysLeft !== null && daysLeft < 90 && daysLeft > 0 && (
                    <span style={{ color: '#f59e0b', marginLeft: 6, fontWeight: 700 }}>{daysLeft}d</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Property Manager */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Property Manager</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <InitialsAvatar name={landlordName} size={44} color="#7c3aed" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0d0f18' }}>{landlordName}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{lease.unit.property.landlord.email}</div>
              </div>
            </div>
            <button onClick={onNavigateToMessages} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              Send Message
            </button>
          </div>

          {/* Payment Record */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Payment Record</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#059669' }}>{pct}%</span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{paidCount}/{payments.length} on time</span>
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: 8, overflow: 'hidden', height: 6 }}>
              <div style={{ background: '#059669', height: '100%', width: `${pct}%`, borderRadius: 8, transition: 'width 0.6s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      {recent.length > 0 && (
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Recent Payments</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recent.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < recent.length - 1 ? '1px solid #f4f4f8' : 'none' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0d0f18' }}>
                    {new Date(p.dueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  {p.paidDate && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Paid {new Date(p.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0d0f18' }}>${p.amount.toLocaleString()}</span>
                  <PayBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────

function PaymentsTab({
  payments, methods, methodsLoading, onPay, paying, paidId,
  onAddMethod, onRemoveMethod, onRefreshPayments,
}: {
  payments: Payment[]
  methods: SavedPaymentMethod[]
  methodsLoading: boolean
  onPay: (id: string) => void
  paying: string | null
  paidId: string | null
  onAddMethod: () => void
  onRemoveMethod: (id: string) => void
  onRefreshPayments: () => void
}) {
  const [filter, setFilter] = useState('ALL')
  const [payingWithSaved, setPayingWithSaved] = useState<Payment | null>(null)

  const shown = filter === 'ALL' ? payments : payments.filter(p => p.status === filter)

  function handlePayClick(payment: Payment) {
    if (methods.length > 0) setPayingWithSaved(payment)
    else onPay(payment.id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {paidId && (
        <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="15" height="15" fill="none" stroke="#059669" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>Payment successful — your balance has been updated.</span>
        </div>
      )}

      <PaymentMethodsSection methods={methods} loading={methodsLoading} onAdd={onAddMethod} onRemove={onRemoveMethod} />

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6 }}>
        {['ALL', 'PAID', 'DUE', 'LATE'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 16px', borderRadius: 20, border: '1.5px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: filter === f ? '#4f46e5' : 'transparent', borderColor: filter === f ? '#4f46e5' : '#e6e6ef', color: filter === f ? '#fff' : '#6b7280' }}>{f}</button>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f5' }}>
              {['Period', 'Amount', 'Due Date', 'Paid On', 'Status', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', padding: '12px 18px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f4f4f8', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafafa'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <td style={{ padding: '13px 18px', fontSize: 13, fontWeight: 600, color: '#0d0f18' }}>
                  {new Date(p.dueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </td>
                <td style={{ padding: '13px 18px', fontSize: 13, fontWeight: 700, color: '#0d0f18' }}>${p.amount.toLocaleString()}</td>
                <td style={{ padding: '13px 18px', fontSize: 12, color: '#6b7280' }}>
                  {new Date(p.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </td>
                <td style={{ padding: '13px 18px', fontSize: 12, fontWeight: 500, color: p.paidDate ? '#059669' : '#dc2626' }}>
                  {p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                </td>
                <td style={{ padding: '13px 18px' }}><PayBadge status={p.status} /></td>
                <td style={{ padding: '13px 18px', textAlign: 'right' }}>
                  {(p.status === 'DUE' || p.status === 'LATE' || p.status === 'PARTIAL') && (
                    <button onClick={() => handlePayClick(p)} disabled={paying === p.id} className="btn-primary" style={{ fontSize: 12, padding: '6px 14px', opacity: paying === p.id ? 0.6 : 1 }}>
                      {paying === p.id ? '…' : 'Pay Now'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <div style={{ textAlign: 'center', padding: 40, fontSize: 13, color: '#9ca3af' }}>No payments found.</div>}
      </div>

      {payingWithSaved && (
        <PayWithSavedModal
          payment={payingWithSaved}
          methods={methods}
          onClose={() => setPayingWithSaved(null)}
          onPaid={() => { setPayingWithSaved(null); onRefreshPayments() }}
        />
      )}
    </div>
  )
}

// ─── Maintenance Tab ──────────────────────────────────────────────────────────

function MaintenanceTab({ requests, onSubmitted }: { requests: MaintenanceRequest[]; onSubmitted: (r: MaintenanceRequest) => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { apiFetch } = useApi()

  const openCount = requests.filter(r => r.status !== 'RESOLVED' && r.status !== 'CLOSED').length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setError('')
    setSaving(true)
    try {
      const res = await apiFetch('/api/tenant/maintenance', { method: 'POST', body: JSON.stringify(form) })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      const r = await res.json()
      onSubmitted(r)
      setShowForm(false)
      setForm({ title: '', description: '', priority: 'MEDIUM' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#6b7280' }}>{openCount} open request{openCount !== 1 ? 's' : ''}</span>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Submit Request
        </button>
      </div>

      {requests.length === 0 && (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No maintenance requests yet.</div>
      )}

      {requests.map(m => (
        <div key={m.id} className="card" style={{ padding: '20px 22px', transition: 'box-shadow 0.15s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0d0f18' }}>{m.title}</span>
                <PriBadge label={m.priority} />
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, marginBottom: 8 }}>{m.description}</p>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>
                {m.unit.property.name} · Unit {m.unit.unitNumber} · Submitted {new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <StaBadge label={m.status} />
          </div>
        </div>
      ))}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }} onClick={() => setShowForm(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
          <div style={{ position: 'relative', marginLeft: 'auto', width: '100%', maxWidth: 440, background: '#fff', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 0 60px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '22px 24px', borderBottom: '1px solid #f0f0f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0d0f18', margin: 0 }}>Submit Maintenance Request</h2>
              <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }} onClick={() => setShowForm(false)}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Issue Title *</label>
                <input className="input" placeholder="e.g. Leaky faucet in bathroom" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Description *</label>
                <textarea className="input" rows={4} placeholder="Describe the issue in detail…" style={{ resize: 'none' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="LOW">Low — Not urgent</option>
                  <option value="MEDIUM">Medium — Normal priority</option>
                  <option value="HIGH">High — Needs attention soon</option>
                  <option value="URGENT">Urgent — Safety or emergency</option>
                </select>
              </div>
              {error && <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Messages Tab ─────────────────────────────────────────────────────────────

function MessagesTab({ userId, setUnread, landlord, propertyName }: { userId: string; setUnread: (n: number) => void; landlord: { firstName: string; lastName: string; email: string } | null; propertyName: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [hasLease, setHasLease] = useState(true)
  const { apiFetch } = useApi()
  const scrollRef = useRef<HTMLDivElement>(null)

  const landlordName = landlord ? `${landlord.firstName} ${landlord.lastName}` : 'Property Manager'

  const fetchMessages = useCallback(async () => {
    try {
      const res = await apiFetch('/api/tenant/messages')
      if (res.status === 400) { setHasLease(false); return }
      const data = await res.json()
      if (Array.isArray(data)) { setMessages(data); setUnread(0) }
    } catch {}
  }, [])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    try {
      const res = await apiFetch('/api/tenant/messages', { method: 'POST', body: JSON.stringify({ body: body.trim() }) })
      if (res.ok) { const msg = await res.json(); setMessages(prev => [...prev, msg]); setBody('') }
    } finally { setSending(false) }
  }

  if (!hasLease) {
    return <div className="card" style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>You need an active lease to message your landlord.</div>
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 220px)', minHeight: 400, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f5', display: 'flex', alignItems: 'center', gap: 12, background: '#fafafa' }}>
        <InitialsAvatar name={landlordName} size={36} color="#7c3aed" />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0d0f18' }}>{landlordName}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Property Manager{propertyName ? ` · ${propertyName}` : ''}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 13 }}>No messages yet. Send a message below.</div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender.id === userId
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 4 }}>
              {!isMe && <span style={{ fontSize: 10, color: '#9ca3af', paddingLeft: 4 }}>{msg.sender.firstName}</span>}
              <div style={{
                maxWidth: '75%', padding: '11px 15px', borderRadius: 16, fontSize: 13, lineHeight: 1.55,
                background: isMe ? '#4f46e5' : '#f4f4f8',
                color: isMe ? '#fff' : '#0d0f18',
                borderBottomRightRadius: isMe ? 4 : 16,
                borderBottomLeftRadius: isMe ? 16 : 4,
              }}>
                {msg.body}
              </div>
              <span style={{ fontSize: 10, color: '#c4c4d0', paddingLeft: 4 }}>
                {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          )
        })}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f5', display: 'flex', gap: 10, alignItems: 'center' }}>
        <input value={body} onChange={e => setBody(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend(e as any))}
          placeholder={`Message ${landlordName}…`} className="input" style={{ flex: 1 }} disabled={sending} />
        <button type="submit" disabled={!body.trim() || sending} className="btn-primary" style={{ padding: '10px 16px', flexShrink: 0, opacity: !body.trim() || sending ? 0.5 : 1 }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
        </button>
      </form>
    </div>
  )
}

// ─── Main Portal ──────────────────────────────────────────────────────────────

export default function PortalPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const tab = searchParams.get('tab') ?? 'overview'
  const paidId = searchParams.get('paid')
  const setupIntentParam = searchParams.get('setup_intent')
  const { setUnread } = useOutletContext<{ setUnread: (n: number) => void }>()
  const { apiFetch } = useApi()

  const [me, setMe] = useState<TenantInfo | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([])
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([])
  const [methodsLoading, setMethodsLoading] = useState(true)
  const [paying, setPaying] = useState<string | null>(null)
  const [showAddMethod, setShowAddMethod] = useState(false)

  function fetchMethods() {
    setMethodsLoading(true)
    apiFetch('/api/tenant/payment-methods')
      .then(r => r.json())
      .then(d => setMethods(Array.isArray(d) ? d : []))
      .catch(() => setMethods([]))
      .finally(() => setMethodsLoading(false))
  }

  function fetchPayments() {
    apiFetch('/api/tenant/payments').then(r => r.json()).then(d => Array.isArray(d) ? setPayments(d) : null)
  }

  useEffect(() => {
    apiFetch('/api/tenant/me').then(r => r.json()).then(setMe)
    fetchPayments()
    apiFetch('/api/tenant/maintenance').then(r => r.json()).then(d => Array.isArray(d) ? setMaintenance(d) : null)
    fetchMethods()
  }, [])

  useEffect(() => {
    if (!setupIntentParam) return
    apiFetch('/api/tenant/payment-methods/confirm', { method: 'POST', body: JSON.stringify({ setupIntentId: setupIntentParam }) })
      .then(() => fetchMethods())
      .catch(() => {})
    setSearchParams(prev => { prev.delete('setup_intent'); return prev })
  }, [setupIntentParam])

  async function handlePay(id: string) {
    setPaying(id)
    try {
      const res = await apiFetch(`/api/tenant/payments/${id}/checkout`, { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setPaying(null)
    } catch { setPaying(null) }
  }

  if (!me) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#9ca3af', fontSize: 13 }}>Loading…</div>
  }

  const landlord = me.lease?.unit.property.landlord ?? null
  const propertyName = me.lease?.unit.property.name ?? ''

  return (
    <div>
      {tab === 'overview' && (
        <OverviewTab
          me={me}
          payments={payments}
          onPay={handlePay}
          paying={paying}
          onNavigateToMessages={() => navigate('/tenant/portal?tab=messages')}
        />
      )}
      {tab === 'payments' && (
        <PaymentsTab
          payments={payments}
          methods={methods}
          methodsLoading={methodsLoading}
          onPay={handlePay}
          paying={paying}
          paidId={paidId}
          onAddMethod={() => setShowAddMethod(true)}
          onRemoveMethod={id => setMethods(prev => prev.filter(m => m.id !== id))}
          onRefreshPayments={fetchPayments}
        />
      )}
      {tab === 'maintenance' && (
        <MaintenanceTab requests={maintenance} onSubmitted={r => setMaintenance(prev => [r, ...prev])} />
      )}
      {tab === 'messages' && (
        <MessagesTab userId={me.user.id} setUnread={setUnread} landlord={landlord} propertyName={propertyName} />
      )}

      {showAddMethod && (
        <AddPaymentMethodModal onClose={() => setShowAddMethod(false)} onAdded={() => { fetchMethods(); setShowAddMethod(false) }} />
      )}
    </div>
  )
}
