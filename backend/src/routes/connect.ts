import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { stripe } from '../lib/stripe'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'

export const connectRouter = Router()

// POST /api/connect/onboard — create or resume Connect Express onboarding
connectRouter.post('/onboard', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: authReq.auth.userId },
      select: { id: true, email: true, stripeAccountId: true },
    })
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    let accountId = user.stripeAccountId
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })
      accountId = account.id
      await prisma.user.update({ where: { id: user.id }, data: { stripeAccountId: accountId } })
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
    const link = await stripe.accountLinks.create({
      account: accountId,
      return_url: `${frontendUrl}/landlord/settings?tab=payments&connect=success`,
      refresh_url: `${frontendUrl}/landlord/settings?tab=payments&connect=refresh`,
      type: 'account_onboarding',
    })

    res.json({ url: link.url })
  } catch (err) {
    console.error('Connect onboard error:', err)
    res.status(500).json({ error: 'Failed to create onboarding link' })
  }
})

// GET /api/connect/status — check landlord's Connect account status
connectRouter.get('/status', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: authReq.auth.userId },
      select: { id: true, stripeAccountId: true, stripeAccountReady: true },
    })
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    if (!user.stripeAccountId) {
      return res.json({ connected: false, ready: false })
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId)
    const ready = !!(account.details_submitted && account.charges_enabled)

    if (ready && !user.stripeAccountReady) {
      await prisma.user.update({ where: { id: user.id }, data: { stripeAccountReady: true } })
    }

    res.json({ connected: true, ready, email: account.email })
  } catch (err) {
    res.status(500).json({ error: 'Failed to check connect status' })
  }
})

// POST /api/connect/dashboard — generate Stripe Express dashboard link
connectRouter.post('/dashboard', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: authReq.auth.userId },
      select: { stripeAccountId: true },
    })
    if (!user?.stripeAccountId) return res.status(400).json({ error: 'No connected account' })

    const link = await stripe.accounts.createLoginLink(user.stripeAccountId)
    res.json({ url: link.url })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create dashboard link' })
  }
})
