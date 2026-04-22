import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'

export const invitesRouter = Router()

// POST /api/invites — landlord creates an invite link for an existing tenant
invitesRouter.post('/', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlord = await prisma.user.findUnique({
      where: { clerkId: authReq.auth.userId },
      select: { id: true },
    })
    if (!landlord) return res.status(401).json({ error: 'Unauthorized' })

    const { tenantId } = req.body
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' })

    const tenant = await prisma.user.findFirst({
      where: {
        id: tenantId,
        role: 'TENANT',
        leases: { some: { unit: { property: { landlordId: landlord.id } } } },
      },
      select: {
        id: true,
        email: true,
        leases: {
          where: { status: 'ACTIVE' },
          select: { id: true },
          take: 1,
        },
      },
    })
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' })

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invite = await prisma.tenantInvite.create({
      data: {
        email: tenant.email,
        leaseId: tenant.leases[0]?.id ?? null,
        landlordId: landlord.id,
        expiresAt,
      },
    })

    res.json({ token: invite.token, email: tenant.email })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create invite' })
  }
})

// GET /api/invites/:token — public, returns invite details
invitesRouter.get('/:token', async (req, res: Response) => {
  try {
    const invite = await prisma.tenantInvite.findUnique({ where: { token: req.params.token } })
    if (!invite) return res.status(404).json({ error: 'Invite not found' })
    if (invite.expiresAt < new Date()) return res.status(410).json({ error: 'Invite expired' })

    const landlord = await prisma.user.findUnique({
      where: { id: invite.landlordId },
      select: { firstName: true, lastName: true },
    })

    let unitInfo = null
    if (invite.leaseId) {
      const lease = await prisma.lease.findUnique({
        where: { id: invite.leaseId },
        include: { unit: { include: { property: { select: { name: true, address: true, city: true, state: true } } } } },
      })
      if (lease) {
        unitInfo = {
          property: lease.unit.property.name,
          address: `${lease.unit.property.address}, ${lease.unit.property.city}, ${lease.unit.property.state}`,
          unit: lease.unit.unitNumber,
          rent: lease.rentAmount,
        }
      }
    }

    res.json({
      email: invite.email,
      landlord: landlord ? `${landlord.firstName} ${landlord.lastName}` : 'Your landlord',
      unit: unitInfo,
      acceptedAt: invite.acceptedAt,
      expiresAt: invite.expiresAt,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invite' })
  }
})

// POST /api/invites/:token/accept — signed-in user confirms they are the intended recipient
invitesRouter.post('/:token/accept', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const invite = await prisma.tenantInvite.findUnique({ where: { token: req.params.token } })
    if (!invite) return res.status(404).json({ error: 'Invite not found' })
    if (invite.acceptedAt) return res.json({ ok: true }) // idempotent
    if (invite.expiresAt < new Date()) return res.status(410).json({ error: 'Invite expired' })

    const user = await prisma.user.findUnique({ where: { clerkId: authReq.auth.userId } })
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return res.status(403).json({ error: 'This invite was sent to a different email address' })
    }

    await prisma.tenantInvite.update({
      where: { token: req.params.token },
      data: { acceptedAt: new Date() },
    })

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept invite' })
  }
})
