import { useEffect, useState, useCallback } from 'react'
import { useApi } from '../../lib/api'
import { useSearchParams } from 'react-router-dom'

type Settings = {
  // Notifications
  notifyNewApplication: boolean
  notifyPaymentReceived: boolean
  notifyPaymentOverdue: boolean
  notifyPaymentOverdueDays: number
  notifyMaintenanceSubmitted: boolean
  notifyMaintenanceUpdated: boolean
  notifyUrgentMaintenanceOnly: boolean
  emailDigestFrequency: 'immediate' | 'daily' | 'weekly' | 'off'
  smsNotificationsEnabled: boolean
  smsPhone: string
  // Rent & Fees
  defaultGracePeriodDays: number
  lateFeeEnabled: boolean
  lateFeeType: 'flat' | 'percent'
  lateFeeAmount: number
  defaultLeaseDurationMonths: number
  rentReminderEnabled: boolean
  rentReminderDaysBefore: number
  autoLateNoticeEnabled: boolean
  // Applications
  aiScoreWarningThreshold: number
  requirePlaidIncome: boolean
  requireStripeIdentity: boolean
  autoDeclineEnabled: boolean
  autoDeclineThreshold: number
  // Maintenance
  defaultMaintenancePriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  maintenanceNoteTemplate: string
  // Tenant Portal
  tenantMessagingEnabled: boolean
  tenantMaintenanceEnabled: boolean
  tenantPaymentHistoryVisible: boolean
  // Payments
  achEnabled: boolean
  achFeeFlat: number
  cardEnabled: boolean
  cardFeePercent: number
  // Account
  companyName: string
  timezone: string
  language: string
}

type Tab = 'notifications' | 'rent' | 'applications' | 'maintenance' | 'portal' | 'payments' | 'account'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'notifications', label: 'Notifications',
    icon: <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  },
  {
    key: 'rent', label: 'Rent & Fees',
    icon: <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    key: 'applications', label: 'Applications',
    icon: <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  },
  {
    key: 'maintenance', label: 'Maintenance',
    icon: <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    key: 'portal', label: 'Tenant Portal',
    icon: <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    key: 'payments', label: 'Payments',
    icon: <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  },
  {
    key: 'account', label: 'Account',
    icon: <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  },
]

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata',
  'Australia/Sydney', 'Pacific/Auckland',
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
        background: checked ? '#4f46e5' : '#d1d5db',
        position: 'relative', flexShrink: 0, transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: checked ? 20 : 3,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, paddingBottom: 18, borderBottom: '1px solid #f4f4f8' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0d0f18' }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2, lineHeight: 1.4 }}>{hint}</div>}
      </div>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {children}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{title}</div>
      <div className="card" style={{ padding: '6px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 12 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function PayoutsSection() {
  const { apiFetch } = useApi()
  const [status, setStatus] = useState<{ connected: boolean; ready: boolean; email?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    apiFetch('/api/connect/status').then(r => r.json()).then(setStatus)
  }, [])

  // Refresh status after returning from Stripe onboarding
  useEffect(() => {
    if (searchParams.get('connect')) {
      apiFetch('/api/connect/status').then(r => r.json()).then(setStatus)
    }
  }, [searchParams])

  async function handleOnboard() {
    setLoading(true)
    try {
      const res = await apiFetch('/api/connect/onboard', { method: 'POST' })
      const { url } = await res.json()
      window.location.href = url
    } finally {
      setLoading(false)
    }
  }

  async function handleDashboard() {
    setLoading(true)
    try {
      const res = await apiFetch('/api/connect/dashboard', { method: 'POST' })
      const { url } = await res.json()
      window.open(url, '_blank')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Payouts</div>
      <div className="card" style={{ padding: '20px' }}>
        {!status ? (
          <div style={{ fontSize: 13, color: '#9ca3af' }}>Loading…</div>
        ) : status.ready ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" fill="none" stroke="#059669" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0d0f18' }}>Bank account connected</div>
                {status.email && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{status.email}</div>}
              </div>
            </div>
            <button
              onClick={handleDashboard}
              disabled={loading}
              style={{ fontSize: 12, fontWeight: 600, color: '#4f46e5', background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}
            >
              View Stripe dashboard
            </button>
          </div>
        ) : status.connected ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0d0f18' }}>Setup in progress</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Finish connecting your bank account to receive rent payments.</div>
            </div>
            <button
              onClick={handleOnboard}
              disabled={loading}
              style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: '#4f46e5', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {loading ? 'Loading…' : 'Continue setup'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0d0f18' }}>Connect your bank account</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1, lineHeight: 1.5 }}>
                Link your bank account via Stripe to receive rent payments directly. A 1% platform fee applies per transaction.
              </div>
            </div>
            <button
              onClick={handleOnboard}
              disabled={loading}
              style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: '#4f46e5', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {loading ? 'Loading…' : 'Connect bank account'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { apiFetch } = useApi()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams.get('tab')
    return (t && ['notifications','rent','applications','maintenance','portal','payments','account'].includes(t) ? t : 'notifications') as Tab
  })
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    apiFetch('/api/settings').then(r => r.json()).then((s: Settings) => {
      setSettings(s)
    })
  }, [])

  const set = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : prev)
    setDirty(true)
    setSaved(false)
  }, [])

  async function save() {
    if (!settings) return
    setSaving(true)
    try {
      await apiFetch('/api/settings', { method: 'PUT', body: JSON.stringify(settings) })
      setSaved(true)
      setDirty(false)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (!settings) {
    return (
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '36px 40px' }}>
        <div style={{ height: 24, background: '#f3f4f6', borderRadius: 6, width: 140, marginBottom: 8 }} />
        <div style={{ height: 14, background: '#f3f4f6', borderRadius: 4, width: 220 }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '36px 40px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Settings</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Customize how Zenant works for your portfolio</p>
        </div>
        <button
          onClick={save}
          disabled={saving || !dirty}
          style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: dirty ? 'pointer' : 'default',
            background: saved ? '#10b981' : dirty ? '#4f46e5' : '#e5e7eb',
            color: dirty || saved ? '#fff' : '#9ca3af',
            fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
          }}
        >
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Sidebar tabs */}
        <div style={{ width: 168, flexShrink: 0 }}>
          <div className="card" style={{ padding: '6px 6px' }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: tab === t.key ? '#f5f3ff' : 'transparent',
                  color: tab === t.key ? '#4f46e5' : '#6b7280',
                  fontSize: 13, fontWeight: tab === t.key ? 600 : 500,
                  transition: 'all 0.1s', textAlign: 'left',
                }}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ── NOTIFICATIONS ── */}
          {tab === 'notifications' && (
            <>
              <Section title="Email Alerts">
                <Field label="New application submitted" hint="Get notified when a prospective tenant submits an application.">
                  <Toggle checked={settings.notifyNewApplication} onChange={v => set('notifyNewApplication', v)} />
                </Field>
                <Field label="Rent payment received" hint="Confirm when a tenant successfully pays rent.">
                  <Toggle checked={settings.notifyPaymentReceived} onChange={v => set('notifyPaymentReceived', v)} />
                </Field>
                <Field label="Rent payment overdue" hint="Alert when rent is past due.">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {settings.notifyPaymentOverdue && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>after</span>
                        <input
                          type="number" min={1} max={30} value={settings.notifyPaymentOverdueDays}
                          onChange={e => set('notifyPaymentOverdueDays', Number(e.target.value))}
                          className="input" style={{ width: 56, textAlign: 'center', padding: '4px 8px', fontSize: 13 }}
                        />
                        <span style={{ fontSize: 12, color: '#6b7280' }}>days</span>
                      </div>
                    )}
                    <Toggle checked={settings.notifyPaymentOverdue} onChange={v => set('notifyPaymentOverdue', v)} />
                  </div>
                </Field>
                <Field label="Maintenance request submitted" hint="Get notified when a tenant opens a new maintenance request.">
                  <Toggle checked={settings.notifyMaintenanceSubmitted} onChange={v => set('notifyMaintenanceSubmitted', v)} />
                </Field>
                <Field label="Maintenance status updated" hint="Get notified when a request status changes.">
                  <Toggle checked={settings.notifyMaintenanceUpdated} onChange={v => set('notifyMaintenanceUpdated', v)} />
                </Field>
                <Field label="Urgent maintenance only" hint="Skip notifications for Low and Medium priority requests.">
                  <Toggle checked={settings.notifyUrgentMaintenanceOnly} onChange={v => set('notifyUrgentMaintenanceOnly', v)} />
                </Field>
              </Section>

              <Section title="Digest & Delivery">
                <Field label="Email digest frequency" hint="How often to bundle activity into a summary email.">
                  <select
                    value={settings.emailDigestFrequency}
                    onChange={e => set('emailDigestFrequency', e.target.value as Settings['emailDigestFrequency'])}
                    className="input" style={{ fontSize: 13, padding: '6px 10px' }}
                  >
                    <option value="immediate">Immediate</option>
                    <option value="daily">Daily digest</option>
                    <option value="weekly">Weekly digest</option>
                    <option value="off">Off</option>
                  </select>
                </Field>
              </Section>

              <Section title="SMS Notifications">
                <Field label="Enable SMS alerts" hint="Receive critical alerts via text message. Standard rates apply.">
                  <Toggle checked={settings.smsNotificationsEnabled} onChange={v => set('smsNotificationsEnabled', v)} />
                </Field>
                {settings.smsNotificationsEnabled && (
                  <Field label="Mobile number">
                    <input
                      type="tel" value={settings.smsPhone}
                      onChange={e => set('smsPhone', e.target.value)}
                      placeholder="555-000-0000"
                      className="input" style={{ width: 160, fontSize: 13, padding: '6px 10px' }}
                    />
                  </Field>
                )}
              </Section>
            </>
          )}

          {/* ── RENT & FEES ── */}
          {tab === 'rent' && (
            <>
              <Section title="Grace Period & Late Fees">
                <Field label="Default grace period" hint="Days after the due date before a payment is considered late.">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="number" min={0} max={30} value={settings.defaultGracePeriodDays}
                      onChange={e => set('defaultGracePeriodDays', Number(e.target.value))}
                      className="input" style={{ width: 64, textAlign: 'center', padding: '6px 8px', fontSize: 13 }}
                    />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>days</span>
                  </div>
                </Field>
                <Field label="Charge late fees" hint="Automatically apply a fee when rent is overdue.">
                  <Toggle checked={settings.lateFeeEnabled} onChange={v => set('lateFeeEnabled', v)} />
                </Field>
                {settings.lateFeeEnabled && (
                  <>
                    <Field label="Late fee type">
                      <div style={{ display: 'flex', gap: 8 }}>
                        {(['flat', 'percent'] as const).map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => set('lateFeeType', t)}
                            style={{
                              padding: '5px 14px', borderRadius: 6, border: '1.5px solid',
                              borderColor: settings.lateFeeType === t ? '#4f46e5' : '#e5e7eb',
                              background: settings.lateFeeType === t ? '#f5f3ff' : '#fff',
                              color: settings.lateFeeType === t ? '#4f46e5' : '#6b7280',
                              fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            }}
                          >
                            {t === 'flat' ? 'Flat $' : '% of Rent'}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label={settings.lateFeeType === 'flat' ? 'Late fee amount' : 'Late fee percentage'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {settings.lateFeeType === 'flat' && <span style={{ fontSize: 13, color: '#6b7280' }}>$</span>}
                        <input
                          type="number" min={0} value={settings.lateFeeAmount}
                          onChange={e => set('lateFeeAmount', Number(e.target.value))}
                          className="input" style={{ width: 80, textAlign: 'right', padding: '6px 8px', fontSize: 13 }}
                        />
                        {settings.lateFeeType === 'percent' && <span style={{ fontSize: 13, color: '#6b7280' }}>%</span>}
                      </div>
                    </Field>
                  </>
                )}
              </Section>

              <Section title="Lease Defaults">
                <Field label="Default lease duration" hint="Pre-filled when creating a new lease.">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="number" min={1} max={60} value={settings.defaultLeaseDurationMonths}
                      onChange={e => set('defaultLeaseDurationMonths', Number(e.target.value))}
                      className="input" style={{ width: 64, textAlign: 'center', padding: '6px 8px', fontSize: 13 }}
                    />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>months</span>
                  </div>
                </Field>
              </Section>

              <Section title="Reminders & Notices">
                <Field label="Rent reminder emails" hint="Automatically send tenants a reminder before rent is due.">
                  <Toggle checked={settings.rentReminderEnabled} onChange={v => set('rentReminderEnabled', v)} />
                </Field>
                {settings.rentReminderEnabled && (
                  <Field label="Days before due date">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="number" min={1} max={14} value={settings.rentReminderDaysBefore}
                        onChange={e => set('rentReminderDaysBefore', Number(e.target.value))}
                        className="input" style={{ width: 64, textAlign: 'center', padding: '6px 8px', fontSize: 13 }}
                      />
                      <span style={{ fontSize: 12, color: '#6b7280' }}>days</span>
                    </div>
                  </Field>
                )}
                <Field label="Auto send late notices" hint="Email tenants automatically when their payment is overdue.">
                  <Toggle checked={settings.autoLateNoticeEnabled} onChange={v => set('autoLateNoticeEnabled', v)} />
                </Field>
              </Section>
            </>
          )}

          {/* ── APPLICATIONS ── */}
          {tab === 'applications' && (
            <>
              <Section title="AI Screening">
                <Field label="Warning threshold" hint="Applications below this AI score will be flagged as higher risk.">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="range" min={0} max={100} value={settings.aiScoreWarningThreshold}
                      onChange={e => set('aiScoreWarningThreshold', Number(e.target.value))}
                      style={{ width: 120 }}
                    />
                    <span style={{
                      minWidth: 36, textAlign: 'center', fontSize: 13, fontWeight: 700,
                      color: settings.aiScoreWarningThreshold >= 70 ? '#10b981' : settings.aiScoreWarningThreshold >= 50 ? '#f59e0b' : '#ef4444',
                    }}>
                      {settings.aiScoreWarningThreshold}
                    </span>
                  </div>
                </Field>
                <Field label="Auto-decline below threshold" hint="Automatically reject applications that fall below a score.">
                  <Toggle checked={settings.autoDeclineEnabled} onChange={v => set('autoDeclineEnabled', v)} />
                </Field>
                {settings.autoDeclineEnabled && (
                  <Field label="Auto-decline score">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="range" min={0} max={100} value={settings.autoDeclineThreshold}
                        onChange={e => set('autoDeclineThreshold', Number(e.target.value))}
                        style={{ width: 120 }}
                      />
                      <span style={{ minWidth: 36, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#ef4444' }}>
                        {settings.autoDeclineThreshold}
                      </span>
                    </div>
                  </Field>
                )}
              </Section>

              <Section title="Required Verifications">
                <Field label="Require Plaid income verification" hint="Applications without verified income will be marked incomplete.">
                  <Toggle checked={settings.requirePlaidIncome} onChange={v => set('requirePlaidIncome', v)} />
                </Field>
                <Field label="Require Stripe identity verification" hint="Applications without an ID check will be marked incomplete.">
                  <Toggle checked={settings.requireStripeIdentity} onChange={v => set('requireStripeIdentity', v)} />
                </Field>
              </Section>
            </>
          )}

          {/* ── MAINTENANCE ── */}
          {tab === 'maintenance' && (
            <>
              <Section title="Defaults">
                <Field label="Default priority" hint="Pre-selected priority level when a tenant submits a new request.">
                  <select
                    value={settings.defaultMaintenancePriority}
                    onChange={e => set('defaultMaintenancePriority', e.target.value as Settings['defaultMaintenancePriority'])}
                    className="input" style={{ fontSize: 13, padding: '6px 10px' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </Field>
              </Section>

              <Section title="Note Template">
                <div style={{ paddingBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0d0f18', marginBottom: 4 }}>Landlord notes template</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Pre-populated text for your internal notes on new maintenance requests.</div>
                  <textarea
                    value={settings.maintenanceNoteTemplate}
                    onChange={e => set('maintenanceNoteTemplate', e.target.value)}
                    placeholder="e.g. Scheduled for inspection. Contact tenant 24h prior."
                    className="input"
                    style={{ width: '100%', minHeight: 96, resize: 'vertical', fontSize: 13, lineHeight: 1.5 }}
                  />
                </div>
              </Section>
            </>
          )}

          {/* ── TENANT PORTAL ── */}
          {tab === 'portal' && (
            <>
              <Section title="Features">
                <Field label="Tenant messaging" hint="Allow tenants to send you messages through the portal.">
                  <Toggle checked={settings.tenantMessagingEnabled} onChange={v => set('tenantMessagingEnabled', v)} />
                </Field>
                <Field label="Maintenance requests" hint="Allow tenants to submit maintenance requests from the portal.">
                  <Toggle checked={settings.tenantMaintenanceEnabled} onChange={v => set('tenantMaintenanceEnabled', v)} />
                </Field>
                <Field label="Payment history visible" hint="Show tenants their full payment history and receipts.">
                  <Toggle checked={settings.tenantPaymentHistoryVisible} onChange={v => set('tenantPaymentHistoryVisible', v)} />
                </Field>
              </Section>
            </>
          )}

          {/* ── PAYMENTS ── */}
          {tab === 'payments' && (
            <>
              <PayoutsSection />
              <Section title="ACH (Bank Transfer)">
                <Field label="Accept ACH payments" hint="Allow tenants to pay rent via bank transfer.">
                  <Toggle checked={settings.achEnabled} onChange={v => set('achEnabled', v)} />
                </Field>
                {settings.achEnabled && (
                  <Field label="ACH flat fee" hint="Fee charged to the tenant per ACH transaction.">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>$</span>
                      <input
                        type="number" min={0} step={0.01} value={(settings.achFeeFlat / 100).toFixed(2)}
                        onChange={e => set('achFeeFlat', Math.round(Number(e.target.value) * 100))}
                        className="input" style={{ width: 80, textAlign: 'right', padding: '6px 8px', fontSize: 13 }}
                      />
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>per transaction</span>
                    </div>
                  </Field>
                )}
              </Section>

              <Section title="Card Payments">
                <Field label="Accept card payments" hint="Allow tenants to pay rent via credit or debit card.">
                  <Toggle checked={settings.cardEnabled} onChange={v => set('cardEnabled', v)} />
                </Field>
                {settings.cardEnabled && (
                  <Field label="Card processing fee" hint="Percentage passed to the tenant to cover processing costs.">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="number" min={0} max={10} step={0.1} value={settings.cardFeePercent}
                        onChange={e => set('cardFeePercent', Number(e.target.value))}
                        className="input" style={{ width: 72, textAlign: 'right', padding: '6px 8px', fontSize: 13 }}
                      />
                      <span style={{ fontSize: 13, color: '#6b7280' }}>%</span>
                    </div>
                  </Field>
                )}
              </Section>
            </>
          )}

          {/* ── ACCOUNT ── */}
          {tab === 'account' && (
            <>
              <Section title="Branding">
                <Field label="Company / business name" hint="Shown on emails and tenant-facing pages. Leave blank to use your full name.">
                  <input
                    type="text" value={settings.companyName}
                    onChange={e => set('companyName', e.target.value)}
                    placeholder="Acme Properties LLC"
                    className="input" style={{ width: 200, fontSize: 13, padding: '6px 10px' }}
                  />
                </Field>
              </Section>

              <Section title="Regional">
                <Field label="Timezone" hint="Used for scheduling reminders and displaying dates.">
                  <select
                    value={settings.timezone}
                    onChange={e => set('timezone', e.target.value)}
                    className="input" style={{ fontSize: 13, padding: '6px 10px' }}
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Language" hint="Interface and outgoing email language.">
                  <select
                    value={settings.language}
                    onChange={e => set('language', e.target.value)}
                    className="input" style={{ fontSize: 13, padding: '6px 10px' }}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="pt">Portuguese</option>
                  </select>
                </Field>
              </Section>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
