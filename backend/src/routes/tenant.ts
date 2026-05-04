import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { stripe } from '../lib/stripe'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'

export const tenantRouter = Router()

async function getTenantUser(clerkId: string) {
  return prisma.user.findUnique({ where: { clerkId }, select: { id: true, firstName: true, lastName: true, email: true, role: true } })
}

async function getTenantUserFull(clerkId: string) {
  return prisma.user.findUnique({ where: { clerkId }, select: { id: true, firstName: true, lastName: true, email: true, role: true, stripeId: true } })
}

async function ensureStripeCustomer(userId: string, email: string, stripeId: string | null): Promise<string> {
  if (stripeId) {
    // Verify the customer still exists in Stripe (may have been deleted or belong to a different account)
    try {
      const existing = await stripe.customers.retrieve(stripeId)
      if (!existing.deleted) return stripeId
    } catch {}
    // Customer not found — fall through to create a new one
  }
  const customer = await stripe.customers.create({ email, metadata: { tenantId: userId } })
  await prisma.user.update({ where: { id: userId }, data: { stripeId: customer.id } })
  return customer.id
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
      include: {
        lease: {
          include: {
            unit: {
              include: {
                property: {
                  include: { landlord: { select: { stripeAccountId: true, stripeAccountReady: true } } },
                },
              },
            },
          },
        },
      },
    })
    if (!payment) return res.status(404).json({ error: 'Payment not found' })
    if (payment.status === 'PAID') return res.status(400).json({ error: 'Payment already paid' })

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
    const amountCents = Math.round(payment.amount * 100)
    const landlord = payment.lease.unit.property.landlord
    const feePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT ?? '1') / 100
    const feeAmount = Math.round(amountCents * feePercent)

    const paymentIntentData: Record<string, any> =
      landlord.stripeAccountId && landlord.stripeAccountReady
        ? {
            application_fee_amount: feeAmount,
            transfer_data: { destination: landlord.stripeAccountId },
          }
        : {}

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: `Rent — ${payment.lease.unit.property.name} Unit ${payment.lease.unit.unitNumber}`,
            description: `Due ${new Date(payment.dueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          },
        },
        quantity: 1,
      }],
      payment_intent_data: Object.keys(paymentIntentData).length ? paymentIntentData : undefined,
      metadata: { paymentId: payment.id, tenantId: user.id },
      success_url: `${frontendUrl}/tenant/portal?tab=payments&paid=${payment.id}&session_id={CHECKOUT_SESSION_ID}`,
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

// GET /api/tenant/payment-methods — list saved Stripe payment methods
tenantRouter.get('/payment-methods', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const user = await getTenantUserFull(authReq.auth.userId)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    if (!user.stripeId) return res.json([])

    const [cards, banks] = await Promise.all([
      stripe.paymentMethods.list({ customer: user.stripeId, type: 'card' }),
      stripe.paymentMethods.list({ customer: user.stripeId, type: 'us_bank_account' }),
    ])

    const methods = [
      ...cards.data.map(pm => ({
        id: pm.id,
        type: 'card' as const,
        brand: pm.card?.brand ?? 'card',
        last4: pm.card?.last4 ?? '????',
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
        funding: pm.card?.funding ?? 'unknown',
      })),
      ...banks.data.map(pm => ({
        id: pm.id,
        type: 'us_bank_account' as const,
        bankName: pm.us_bank_account?.bank_name ?? 'Bank',
        last4: pm.us_bank_account?.last4 ?? '????',
        accountType: pm.us_bank_account?.account_type ?? 'checking',
        mandate: pm.metadata?.mandate_id ?? null,
      })),
    ]

    res.json(methods)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment methods' })
  }
})

// POST /api/tenant/payment-methods/setup — create a SetupIntent for saving a payment method
tenantRouter.post('/payment-methods/setup', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const user = await getTenantUserFull(authReq.auth.userId)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const customerId = await ensureStripeCustomer(user.id, user.email, user.stripeId)

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card', 'us_bank_account'],
      usage: 'off_session',
    })

    res.json({ clientSecret: setupIntent.client_secret, setupIntentId: setupIntent.id })
  } catch (err) {
    console.error('Setup intent error:', err)
    res.status(500).json({ error: 'Failed to create setup intent' })
  }
})

// POST /api/tenant/payment-methods/confirm — retrieve confirmed SetupIntent and store mandate for ACH
tenantRouter.post('/payment-methods/confirm', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const user = await getTenantUserFull(authReq.auth.userId)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const { setupIntentId } = req.body
    if (!setupIntentId) return res.status(400).json({ error: 'setupIntentId required' })

    const si = await stripe.setupIntents.retrieve(setupIntentId)
    if (si.customer !== user.stripeId) return res.status(403).json({ error: 'Forbidden' })
    if (si.status !== 'succeeded') return res.json({ pending: true })

    // For ACH bank accounts, store mandate ID in PM metadata for future off-session charges
    if (si.payment_method && si.mandate) {
      const pmId = typeof si.payment_method === 'string' ? si.payment_method : si.payment_method.id
      const mandateId = typeof si.mandate === 'string' ? si.mandate : si.mandate.id
      await stripe.paymentMethods.update(pmId, { metadata: { mandate_id: mandateId } })
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Confirm setup error:', err)
    res.status(500).json({ error: 'Failed to confirm setup' })
  }
})

// DELETE /api/tenant/payment-methods/:pmId — detach a saved payment method
tenantRouter.delete('/payment-methods/:pmId', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const user = await getTenantUserFull(authReq.auth.userId)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    if (!user.stripeId) return res.status(404).json({ error: 'No payment methods' })

    const pm = await stripe.paymentMethods.retrieve(req.params.pmId)
    const pmCustomer = typeof pm.customer === 'string' ? pm.customer : pm.customer?.id
    if (pmCustomer !== user.stripeId) return res.status(403).json({ error: 'Forbidden' })

    await stripe.paymentMethods.detach(req.params.pmId)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove payment method' })
  }
})

// POST /api/tenant/payments/:id/verify-checkout — confirm a Stripe Checkout session and mark paid
tenantRouter.post('/payments/:id/verify-checkout', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const user = await getTenantUser(authReq.auth.userId)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const { sessionId } = req.body
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' })

    const payment = await prisma.payment.findFirst({
      where: { id: req.params.id, tenantId: user.id },
    })
    if (!payment) return res.status(404).json({ error: 'Payment not found' })
    if (payment.status === 'PAID') return res.json({ success: true })

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.metadata?.paymentId !== payment.id) {
      return res.status(403).json({ error: 'Session does not match payment' })
    }
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' })
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        stripePaymentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.id,
        method: 'Card',
      },
    })
    res.json({ success: true })
  } catch (err) {
    console.error('Verify checkout error:', err)
    res.status(500).json({ error: 'Failed to verify checkout' })
  }
})

// POST /api/tenant/payments/:id/pay-saved — charge with a saved payment method
tenantRouter.post('/payments/:id/pay-saved', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const user = await getTenantUserFull(authReq.auth.userId)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const { paymentMethodId } = req.body
    if (!paymentMethodId) return res.status(400).json({ error: 'paymentMethodId is required' })
    if (!user.stripeId) return res.status(400).json({ error: 'No payment methods on file' })

    const payment = await prisma.payment.findFirst({
      where: { id: req.params.id, tenantId: user.id },
      include: { lease: { include: { unit: { include: { property: true } } } } },
    })
    if (!payment) return res.status(404).json({ error: 'Payment not found' })
    if (payment.status === 'PAID') return res.status(400).json({ error: 'Already paid' })

    const pm = await stripe.paymentMethods.retrieve(paymentMethodId)
    const pmCustomer = typeof pm.customer === 'string' ? pm.customer : pm.customer?.id
    if (pmCustomer !== user.stripeId) return res.status(403).json({ error: 'Forbidden' })

    // Fee calculation:
    // ACH: $0 fee (Stripe 0.8% capped at $5 absorbed by platform)
    // Debit card: 1.5% convenience fee
    // Credit card: 3.0% convenience fee
    const baseAmountCents = Math.round(payment.amount * 100)
    let feeAmountCents = 0
    let methodLabel = 'Payment'

    if (pm.type === 'us_bank_account') {
      feeAmountCents = 500 // $5 flat ACH fee
      methodLabel = `ACH · ${pm.us_bank_account?.bank_name ?? 'Bank'} ···${pm.us_bank_account?.last4}`
    } else if (pm.type === 'card') {
      const funding = pm.card?.funding
      const feeRate = funding === 'debit' ? 0.015 : 0.03
      feeAmountCents = Math.round(baseAmountCents * feeRate)
      const brand = (pm.card?.brand ?? 'card').toUpperCase()
      methodLabel = `${brand} ···${pm.card?.last4}`
    }

    const totalAmountCents = baseAmountCents + feeAmountCents

    const intentParams: any = {
      amount: totalAmountCents,
      currency: 'usd',
      customer: user.stripeId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      metadata: { paymentId: payment.id, tenantId: user.id, feeAmountCents: feeAmountCents.toString() },
    }

    if (pm.type === 'us_bank_account') {
      intentParams.payment_method_types = ['us_bank_account']
      const mandateId = pm.metadata?.mandate_id
      if (mandateId) intentParams.mandate = mandateId
    } else {
      intentParams.payment_method_types = ['card']
    }

    const intent = await stripe.paymentIntents.create(intentParams)

    const finalStatus = intent.status

    if (finalStatus === 'succeeded' || finalStatus === 'processing') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidDate: new Date(),
          stripePaymentId: intent.id,
          method: methodLabel,
        },
      })
      res.json({ success: true })
    } else if (finalStatus === 'requires_action') {
      res.json({ requiresAction: true, clientSecret: intent.client_secret })
    } else {
      res.status(400).json({ error: `Payment not completed (status: ${finalStatus})` })
    }
  } catch (err: any) {
    console.error('Pay-saved error:', err)
    const msg = err?.raw?.message ?? err?.message ?? 'Failed to process payment'
    res.status(500).json({ error: msg })
  }
})
