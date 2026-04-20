import { Router } from 'express'
import { prisma } from '../lib/prisma'

export const leasesRouter = Router()

// GET /api/leases
leasesRouter.get('/', async (req, res) => {
  try {
    const { status } = req.query
    const leases = await prisma.lease.findMany({
      where: status ? { status: String(status) as any } : undefined,
      include: {
        tenant: { select: { id: true, firstName: true, lastName: true, email: true } },
        unit: { include: { property: { select: { id: true, name: true } } } },
      },
      orderBy: { endDate: 'asc' },
    })
    res.json(leases)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leases' })
  }
})

// POST /api/leases
leasesRouter.post('/', async (req, res) => {
  try {
    const { unitId, tenantId, startDate, endDate, rentAmount, depositPaid } = req.body
    const lease = await prisma.lease.create({
      data: {
        unitId,
        tenantId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rentAmount,
        depositPaid,
        status: 'ACTIVE',
      },
    })
    await prisma.unit.update({ where: { id: unitId }, data: { status: 'OCCUPIED' } })
    res.status(201).json(lease)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create lease' })
  }
})
