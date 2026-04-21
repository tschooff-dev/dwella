import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'

export const paymentsRouter = Router()

async function getLandlordId(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  return user?.id ?? null
}

// GET /api/payments — scoped to landlord, optional ?year=&month= filter
paymentsRouter.get('/', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const { year, month } = req.query
    let dateFilter = {}
    if (year && month) {
      const y = Number(year), m = Number(month) - 1
      dateFilter = { dueDate: { gte: new Date(y, m, 1), lt: new Date(y, m + 1, 1) } }
    }

    const payments = await prisma.payment.findMany({
      where: {
        lease: { unit: { property: { landlordId } } },
        ...dateFilter,
      },
      include: {
        tenant: { select: { id: true, firstName: true, lastName: true } },
        lease: {
          include: {
            unit: { select: { unitNumber: true, property: { select: { name: true } } } },
          },
        },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'desc' }],
    })
    res.json(payments)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' })
  }
})

// POST /api/payments/generate — create DUE records for all active leases for a month
paymentsRouter.post('/generate', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const { year, month } = req.body
    const y = Number(year), m = Number(month) - 1
    const monthStart = new Date(y, m, 1)
    const monthEnd = new Date(y, m + 1, 1)
    const dueDate = new Date(y, m, 1)

    const activeLeases = await prisma.lease.findMany({
      where: {
        status: 'ACTIVE',
        unit: { property: { landlordId } },
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
      },
    })

    const created: any[] = []
    for (const lease of activeLeases) {
      const existing = await prisma.payment.findFirst({
        where: { leaseId: lease.id, dueDate: { gte: monthStart, lt: monthEnd } },
      })
      if (!existing) {
        const p = await prisma.payment.create({
          data: { leaseId: lease.id, tenantId: lease.tenantId, amount: lease.rentAmount, dueDate, status: 'DUE' },
        })
        created.push(p)
      }
    }
    res.json({ created: created.length, payments: created })
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate payments' })
  }
})

// PATCH /api/payments/:id — record payment or update status
paymentsRouter.patch('/:id', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const existing = await prisma.payment.findFirst({
      where: { id: req.params.id, lease: { unit: { property: { landlordId } } } },
    })
    if (!existing) return res.status(404).json({ error: 'Payment not found' })

    const { status, paidDate, amount, method, notes } = req.body
    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        ...(status ? { status } : {}),
        ...(amount != null ? { amount: Number(amount) } : {}),
        ...(method ? { method } : {}),
        ...(notes != null ? { notes } : {}),
        paidDate: status === 'PAID' ? (paidDate ? new Date(paidDate) : new Date()) : (paidDate ? new Date(paidDate) : undefined),
      },
      include: {
        tenant: { select: { id: true, firstName: true, lastName: true } },
        lease: { include: { unit: { select: { unitNumber: true, property: { select: { name: true } } } } } },
      },
    })
    res.json(payment)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payment' })
  }
})

// GET /api/payments/meta/summary — landlord-scoped dashboard metrics
paymentsRouter.get('/meta/summary', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const [totalUnits, occupiedUnits, rentCollected, outstanding] = await Promise.all([
      prisma.unit.count({ where: { property: { landlordId } } }),
      prisma.unit.count({ where: { property: { landlordId }, status: 'OCCUPIED' } }),
      prisma.payment.aggregate({
        where: { status: 'PAID', paidDate: { gte: startOfMonth }, lease: { unit: { property: { landlordId } } } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: { in: ['DUE', 'LATE'] }, lease: { unit: { property: { landlordId } } } },
        _sum: { amount: true },
      }),
    ])

    res.json({
      totalUnits,
      occupiedUnits,
      occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
      rentCollected: rentCollected._sum.amount ?? 0,
      outstandingBalance: outstanding._sum.amount ?? 0,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary' })
  }
})
