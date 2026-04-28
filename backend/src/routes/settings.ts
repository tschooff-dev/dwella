import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'

export const settingsRouter = Router()

const DEFAULTS = {
  // Notifications
  notifyNewApplication: true,
  notifyPaymentReceived: true,
  notifyPaymentOverdue: true,
  notifyPaymentOverdueDays: 3,
  notifyMaintenanceSubmitted: true,
  notifyMaintenanceUpdated: true,
  notifyUrgentMaintenanceOnly: false,
  emailDigestFrequency: 'immediate',
  smsNotificationsEnabled: false,
  smsPhone: '',

  // Rent & Late Fees
  defaultGracePeriodDays: 5,
  lateFeeEnabled: false,
  lateFeeType: 'flat',
  lateFeeAmount: 50,
  defaultLeaseDurationMonths: 12,
  rentReminderEnabled: true,
  rentReminderDaysBefore: 3,
  autoLateNoticeEnabled: false,

  // Applications & Screening
  aiScoreWarningThreshold: 55,
  requirePlaidIncome: false,
  requireStripeIdentity: false,
  autoDeclineEnabled: false,
  autoDeclineThreshold: 40,

  // Maintenance
  defaultMaintenancePriority: 'MEDIUM',
  maintenanceNoteTemplate: '',

  // Tenant Portal
  tenantMessagingEnabled: true,
  tenantMaintenanceEnabled: true,
  tenantPaymentHistoryVisible: true,

  // Payments
  achEnabled: true,
  achFeeFlat: 500,
  cardEnabled: true,
  cardFeePercent: 2.9,

  // Account
  companyName: '',
  timezone: 'America/New_York',
  language: 'en',
}

async function getLandlordId(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  return user?.id ?? null
}

// GET /api/settings — returns merged settings (defaults + stored overrides)
settingsRouter.get('/', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const row = await prisma.landlordSettings.findUnique({ where: { landlordId } })
    const stored = (row?.settings ?? {}) as Record<string, unknown>
    res.json({ ...DEFAULTS, ...stored })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

// PUT /api/settings — upsert the full settings object
settingsRouter.put('/', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const incoming = req.body as Record<string, unknown>
    // Only allow known keys through
    const safe: Record<string, unknown> = {}
    for (const key of Object.keys(DEFAULTS)) {
      if (key in incoming) safe[key] = incoming[key]
    }

    const row = await prisma.landlordSettings.upsert({
      where: { landlordId },
      create: { landlordId, settings: safe as any },
      update: { settings: safe as any },
    })
    const stored = row.settings as Record<string, unknown>
    res.json({ ...DEFAULTS, ...stored })
  } catch (err) {
    res.status(500).json({ error: 'Failed to save settings' })
  }
})
