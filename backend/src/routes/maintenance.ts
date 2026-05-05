import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import { getLandlordSettings } from '../lib/settingsHelper'
import { sendMaintenanceStatusUpdate } from '../lib/email'

export const maintenanceRouter = Router()

// GET /api/maintenance — all maintenance requests across landlord's properties
maintenanceRouter.get('/', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const user = await prisma.user.findUnique({ where: { clerkId: authReq.auth.userId }, select: { id: true } })
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const requests = await prisma.maintenanceRequest.findMany({
      where: { unit: { property: { landlordId: user.id } } },
      include: {
        unit: { include: { property: { select: { name: true } } } },
        tenant: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(requests)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch maintenance requests' })
  }
})

// PATCH /api/maintenance/:id — update status
maintenanceRouter.patch('/:id', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const user = await prisma.user.findUnique({ where: { clerkId: authReq.auth.userId }, select: { id: true } })
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const request = await prisma.maintenanceRequest.findFirst({
      where: { id: req.params.id, unit: { property: { landlordId: user.id } } },
    })
    if (!request) return res.status(404).json({ error: 'Not found' })

    const { status } = req.body
    const updated = await prisma.maintenanceRequest.update({
      where: { id: req.params.id },
      data: {
        status,
        resolvedAt: status === 'RESOLVED' || status === 'CLOSED' ? new Date() : undefined,
      },
      include: {
        unit: { include: { property: { select: { name: true } } } },
        tenant: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

    // Notify tenant if landlord has that setting on
    const settings = await getLandlordSettings(user.id).catch(() => null)
    if (settings?.notifyMaintenanceUpdated && updated.tenant?.email) {
      sendMaintenanceStatusUpdate({
        toEmail: updated.tenant.email,
        tenantName: `${updated.tenant.firstName} ${updated.tenant.lastName}`.trim(),
        title: updated.title,
        status,
      }).catch(console.error)
    }

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update request' })
  }
})
