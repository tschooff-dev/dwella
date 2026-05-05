import { prisma } from './prisma'

const DEFAULTS = {
  notifyNewApplication: true,
  notifyPaymentReceived: true,
  notifyPaymentOverdue: true,
  notifyPaymentOverdueDays: 3,
  notifyMaintenanceSubmitted: true,
  notifyMaintenanceUpdated: true,
  notifyUrgentMaintenanceOnly: false,
  emailDigestFrequency: 'immediate' as const,
  smsNotificationsEnabled: false,
  smsPhone: '',
  defaultGracePeriodDays: 5,
  lateFeeEnabled: false,
  lateFeeType: 'flat' as const,
  lateFeeAmount: 50,
  defaultLeaseDurationMonths: 12,
  rentReminderEnabled: true,
  rentReminderDaysBefore: 3,
  autoLateNoticeEnabled: false,
  aiScoreWarningThreshold: 55,
  requirePlaidIncome: false,
  requireStripeIdentity: false,
  autoDeclineEnabled: false,
  autoDeclineThreshold: 40,
  defaultMaintenancePriority: 'MEDIUM' as const,
  maintenanceNoteTemplate: '',
  tenantMessagingEnabled: true,
  tenantMaintenanceEnabled: true,
  tenantPaymentHistoryVisible: true,
  achEnabled: true,
  achFeeFlat: 500,
  cardEnabled: true,
  cardFeePercent: 2.9,
  companyName: '',
  timezone: 'America/New_York',
  language: 'en',
}

export type LandlordSettings = typeof DEFAULTS

export async function getLandlordSettings(landlordId: string): Promise<LandlordSettings> {
  const row = await prisma.landlordSettings.findUnique({ where: { landlordId } })
  return { ...DEFAULTS, ...(row?.settings as any ?? {}) }
}
