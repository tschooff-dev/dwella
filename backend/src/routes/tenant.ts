import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { stripe } from '../lib/stripe'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'

export const tenantRouter = Router()

async function getTenantUser(clerkId: string) {
  return prisma.user.findUnique({ where: { clerkId }, select: { id: true, firstName: true, lastName: true, email: true, role: true } })
}

async function getActiveLease(tenantId: string) {
  return prisma.lease.findFirst({
    where: { tenantId, status: 'ACTIVE' },
    include: {
      unit: {
        include: {
          property: {
            include: { landlord: { select: { id: true, firstName: true, lastName: true, email: true } } },
          },
        },
      },
      payments: { orderBy: { dueDate: 'desc' }, take: 12 },
    },
    orderBy: { startDate: 'desc' },
  })
}

// GET /api/tenant/me — tenant's active lease, unit, property, landlord
tenantRouter.get('/me', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const user = await getTenantUser(authReq.auth.userId)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const lease = await getActiveLease(user.id)
    res.json({ user, lease })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tenant info' })
  }
})

// GET /api/tenant/payments — all payments for tenant's lease
tenantRouter.get('/payments', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const user = await getTenantUser(authReq.auth.userId)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const payments = await prisma.payment.findMany({
      where: { tenantId: user.id },
      orderBy: { dueDate: 'desc' },
    })
    res.json(payments)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' })
  }
})

// POST /api/tenant/payments/:id/checkout — create Stripe Checkout Session
tenantRouter.post('/payments/:id/checkout', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const user = await getTenantUser(authReq.auth.userId)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const payment = await prisma.payment.findFirst({
      where: { id: req.params.id, tenantId: user.id },
      include: { lease: { include: { unit: { include: { property: true } } } } },
    })
    if (!payment) return res.status(404).json({ error: 'Payment not found' })
    if (payment.status === 'PAID') return res.status(400).json({ error: 'Payment already paid' })

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(payment.amount * 100),
          product_data: {
            name: `Rent — ${payment.lease.unit.property.name} Unit ${payment.lease.unit.unitNumber}`,
            description: `Due ${new Date(payment.dueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          },
        },
        quantity: 1,
      }],
      metadata: { paymentId: payment.id, tenantId: user.id },
      success_url: `${frontendUrl}/tenant/portal?tab=payments&paid=${payment.id}`,
      cancel_url: `${frontendUrl}/tenant/portal?tab=payments`,
      customer_email: user.email,
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
})

// GET /api/tenant/maintenance — list tenant's maintenance requests
tenantRouter.get('/maintenance', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const user = await getTenantUser(authReq.auth.userId)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const requests = await prisma.maintenanceRequest.findMany({
      where: { tenantId: user.id },
      include: { unit: { include: { property: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(requests)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch maintenance requests' })
  }
})

// POST /api/tenant/maintenance — submit new maintenance request
tenantRouter.post('/maintenance', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const user = await getTenantUser(authReq.auth.userId)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const lease = await getActiveLease(user.id)
    if (!lease) return res.status(400).json({ error: 'No active lease found' })

    const { title, description, priority } = req.body
    if (!title || !description) return res.status(400).json({ error: 'title and description are required' })

    const request = await prisma.maintenanceRequest.create({
      data: {
        unitId: lease.unitId,
        tenantId: user.id,
        title,
        description,
        priority: priority ?? 'MEDIUM',
        status: 'OPEN',
      },
      include: { unit: { include: { property: { select: { name: true } } } } },
    })
    res.status(201).json(request)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create maintenance request' })
  }
})

// GET /api/tenant/messages — get messages for tenant's active lease
tenantRouter.get('/messages', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const user = await getTenantUser(authReq.auth.userId)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const lease = await prisma.lease.findFirst({
      where: { tenantId: user.id, status: 'ACTIVE' },
      select: { id: true },
    })
    if (!lease) return res.json([])

    const messages = await prisma.message.findMany({
      where: { leaseId: lease.id },
      include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    })

    // Mark landlord messages as read
    await prisma.message.updateMany({
      where: { leaseId: lease.id, senderId: { not: user.id }, readAt: null },
      data: { readAt: new Date() },
    })

    res.json(messages)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// POST /api/tenant/messages — send a message to landlord
tenantRouter.post('/messages', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const user = await getTenantUser(authReq.auth.userId)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const lease = await prisma.lease.findFirst({
      where: { tenantId: user.id, status: 'ACTIVE' },
      select: { id: true },
    })
    if (!lease) return res.status(400).json({ error: 'No active lease' })

    const { body } = req.body
    if (!body?.trim()) return res.status(400).json({ error: 'body is required' })

    const message = await prisma.message.create({
      data: { leaseId: lease.id, senderId: user.id, body: body.trim() },
      include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
    })
    res.status(201).json(message)
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' })
  }
})

// GET /api/tenant/messages/unread-count
tenantRouter.get('/messages/unread-count', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const user = await getTenantUser(authReq.auth.userId)
    if (!user) return res.json({ count: 0 })

    const lease = await prisma.lease.findFirst({
      where: { tenantId: user.id, status: 'ACTIVE' },
      select: { id: true },
    })
    if (!lease) return res.json({ count: 0 })

    const count = await prisma.message.count({
      where: { leaseId: lease.id, senderId: { not: user.id }, readAt: null },
    })
    res.json({ count })
  } catch (err) {
    res.json({ count: 0 })
  }
})
