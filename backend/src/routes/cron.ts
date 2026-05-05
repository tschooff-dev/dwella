import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { getLandlordSettings } from '../lib/settingsHelper'
import { sendRentReminder, sendOverdueAlert } from '../lib/email'

export const cronRouter = Router()

// GET /api/cron/daily
// Called by Railway cron or any scheduler. Protect with CRON_SECRET env var.
// In Railway: set up a cron service that runs: curl -H "Authorization: Bearer $CRON_SECRET" https://your-api.railway.app/api/cron/daily
cronRouter.get('/daily', async (req: Request, res: Response) => {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.authorization
    if (auth !== `Bearer ${secret}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let reminders = 0, overdueMarked = 0, overdueAlerts = 0

  try {
    // 1. Rent reminders — group active leases by landlord first
    const activeLeases = await prisma.lease.findMany({
      where: { status: 'ACTIVE' },
      include: {
        unit: {
          include: {
            property: {
              include: { landlord: { select: { id: true } } },
            },
          },
        },
        tenant: { select: { email: true, firstName: true, lastName: true } },
        payments: {
          where: { status: 'DUE' },
          orderBy: { dueDate: 'asc' },
          take: 1,
        },
      },
    })

    for (const lease of activeLeases) {
      const nextPayment = lease.payments[0]
      if (!nextPayment) continue

      const landlordId = lease.unit.property.landlord.id
      const settings = await getLandlordSettings(landlordId)

      if (settings.rentReminderEnabled) {
        const dueDate = new Date(nextPayment.dueDate)
        dueDate.setHours(0, 0, 0, 0)
        const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / 86_400_000)

        if (daysUntilDue === settings.rentReminderDaysBefore && lease.tenant?.email) {
          const dueDateStr = dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          await sendRentReminder({
            toEmail: lease.tenant.email,
            tenantName: `${lease.tenant.firstName} ${lease.tenant.lastName}`.trim(),
            amount: nextPayment.amount,
            dueDateStr,
            propertyName: lease.unit.property.name,
            unitNumber: lease.unit.unitNumber,
          }).catch(console.error)
          reminders++
        }
      }
    }

    // 2. Mark overdue and alert landlords
    const duePayments = await prisma.payment.findMany({
      where: { status: 'DUE' },
      include: {
        tenant: { select: { firstName: true, lastName: true } },
        lease: {
          include: {
            unit: {
              include: {
                property: {
                  include: { landlord: { select: { id: true, email: true, firstName: true, lastName: true } } },
                },
              },
            },
          },
        },
      },
    })

    for (const payment of duePayments) {
      const dueDate = new Date(payment.dueDate)
      dueDate.setHours(0, 0, 0, 0)
      const daysOverdue = Math.round((today.getTime() - dueDate.getTime()) / 86_400_000)
      if (daysOverdue <= 0) continue

      const landlord = payment.lease.unit.property.landlord
      const settings = await getLandlordSettings(landlord.id)
      const graceDays = settings.defaultGracePeriodDays

      if (daysOverdue > graceDays) {
        // Mark as late
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'LATE' } })
        overdueMarked++

        if (settings.autoLateNoticeEnabled && settings.emailDigestFrequency === 'immediate') {
          await sendOverdueAlert({
            toEmail: landlord.email,
            landlordName: `${landlord.firstName} ${landlord.lastName}`.trim(),
            tenantName: `${payment.tenant?.firstName ?? ''} ${payment.tenant?.lastName ?? ''}`.trim(),
            amount: payment.amount,
            daysOverdue,
            propertyName: payment.lease.unit.property.name,
            unitNumber: payment.lease.unit.unitNumber,
          }).catch(console.error)
          overdueAlerts++
        }
      }
    }

    res.json({ ok: true, reminders, overdueMarked, overdueAlerts })
  } catch (err) {
    console.error('Cron error:', err)
    res.status(500).json({ error: 'Cron job failed' })
  }
})
