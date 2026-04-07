import { Router } from 'express'
import { prisma } from '../lib/prisma'

export const paymentsRouter = Router()

// GET /api/payments
paymentsRouter.get('/', async (req, res) => {
  try {
    const { tenantId, leaseId, status } = req.query
    const payments = await prisma.payment.findMany({
      where: {
        ...(tenantId ? { tenantId: String(tenantId) } : {}),
        ...(leaseId ? { leaseId: String(leaseId) } : {}),
        ...(status ? { status: String(status) as any } : {}),
      },
      include: {
        tenant: { select: { id: true, firstName: true, lastName: true } },
        lease: {
          include: {
            unit: {
              select: {
                unitNumber: true,
                property: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'desc' },
    })
    res.json(payments)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' })
  }
})

// GET /api/payments/:id
paymentsRouter.get('/:id', async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        tenant: true,
        lease: { include: { unit: { include: { property: true } } } },
      },
    })
    if (!payment) return res.status(404).json({ error: 'Payment not found' })
    res.json(payment)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment' })
  }
})

// POST /api/payments
paymentsRouter.post('/', async (req, res) => {
  try {
    const { leaseId, tenantId, amount, dueDate, status } = req.body
    const payment = await prisma.payment.create({
      data: {
        leaseId,
        tenantId,
        amount,
        dueDate: new Date(dueDate),
        status,
        paidDate: status === 'PAID' ? new Date() : null,
      },
    })
    res.status(201).json(payment)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create payment' })
  }
})

// PATCH /api/payments/:id — mark payment as paid
paymentsRouter.patch('/:id', async (req, res) => {
  try {
    const { status, paidDate, stripePaymentId } = req.body
    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(paidDate ? { paidDate: new Date(paidDate) } : {}),
        ...(stripePaymentId ? { stripePaymentId } : {}),
      },
    })
    res.json(payment)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payment' })
  }
})

// GET /api/payments/summary — dashboard metrics
paymentsRouter.get('/meta/summary', async (_req, res) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalUnits, occupiedUnits, rentCollected, outstanding] = await Promise.all([
      prisma.unit.count(),
      prisma.unit.count({ where: { status: 'OCCUPIED' } }),
      prisma.payment.aggregate({
        where: { status: 'PAID', paidDate: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: { in: ['DUE', 'LATE'] } },
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
