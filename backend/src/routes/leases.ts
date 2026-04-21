import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'

export const leasesRouter = Router()

async function getLandlordId(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  return user?.id ?? null
}

// GET /api/leases — scoped to landlord's properties
leasesRouter.get('/', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const { status } = req.query
    const leases = await prisma.lease.findMany({
      where: {
        unit: { property: { landlordId } },
        ...(status ? { status: String(status) as any } : {}),
      },
      include: {
        tenant: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        unit: { include: { property: { select: { id: true, name: true } } } },
      },
      orderBy: { endDate: 'asc' },
    })
    res.json(leases)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leases' })
  }
})

// POST /api/leases — new lease for existing tenant
leasesRouter.post('/', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const { unitId, tenantId, startDate, endDate, rentAmount, depositPaid } = req.body

    const unit = await prisma.unit.findFirst({ where: { id: unitId, property: { landlordId } } })
    if (!unit) return res.status(403).json({ error: 'Unit not found or not owned by you' })

    const lease = await prisma.lease.create({
      data: {
        unitId,
        tenantId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rentAmount: Number(rentAmount),
        depositPaid: depositPaid ? Number(depositPaid) : null,
        status: 'ACTIVE',
      },
      include: {
        tenant: { select: { id: true, firstName: true, lastName: true, email: true } },
        unit: { include: { property: { select: { id: true, name: true } } } },
      },
    })
    await prisma.unit.update({ where: { id: unitId }, data: { status: 'OCCUPIED' } })
    res.status(201).json(lease)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create lease' })
  }
})

// PATCH /api/leases/:id — renew or end a lease
leasesRouter.patch('/:id', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const existing = await prisma.lease.findFirst({
      where: { id: req.params.id, unit: { property: { landlordId } } },
      include: { unit: true },
    })
    if (!existing) return res.status(404).json({ error: 'Lease not found' })

    const { action, endDate, rentAmount, status } = req.body

    if (action === 'end') {
      const [lease] = await Promise.all([
        prisma.lease.update({ where: { id: req.params.id }, data: { status: 'EXPIRED' } }),
        prisma.unit.update({ where: { id: existing.unitId }, data: { status: 'VACANT' } }),
      ])
      return res.json(lease)
    }

    if (action === 'renew') {
      const lease = await prisma.lease.update({
        where: { id: req.params.id },
        data: {
          endDate: endDate ? new Date(endDate) : undefined,
          rentAmount: rentAmount ? Number(rentAmount) : undefined,
          status: 'ACTIVE',
        },
        include: {
          tenant: { select: { id: true, firstName: true, lastName: true, email: true } },
          unit: { include: { property: { select: { id: true, name: true } } } },
        },
      })
      return res.json(lease)
    }

    // Generic update
    const lease = await prisma.lease.update({
      where: { id: req.params.id },
      data: { ...(status ? { status } : {}), ...(endDate ? { endDate: new Date(endDate) } : {}), ...(rentAmount ? { rentAmount: Number(rentAmount) } : {}) },
    })
    res.json(lease)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update lease' })
  }
})
