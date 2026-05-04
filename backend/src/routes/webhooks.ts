import { Router, Request, Response } from 'express'
import { Webhook } from 'svix'
import { prisma } from '../lib/prisma'
import { stripe } from '../lib/stripe'

export const webhooksRouter = Router()

/**
 * POST /api/webhooks/stripe
 *
 * Handles two event types:
 * 1. identity.verification_session.verified — update application identity status
 * 2. payment_intent.succeeded — mark a rent payment as paid
 *
 * Raw body is required for signature verification — do NOT use express.json()
 * middleware on this route.
 */
webhooksRouter.post(
  '/stripe',
  // express.raw() is applied in index.ts for this route specifically
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature']
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!sig || !webhookSecret) {
      return res.status(400).json({ error: 'Missing stripe signature or webhook secret' })
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err)
      return res.status(400).json({ error: 'Invalid signature' })
    }

    try {
      switch (event.type) {
        case 'identity.verification_session.verified': {
          const session = event.data.object as any
          const applicationId = session.metadata?.applicationId

          if (!applicationId) break

          await prisma.$transaction([
            prisma.verificationSession.updateMany({
              where: { externalId: session.id },
              data: {
                status: 'VERIFIED',
                resultSummary: {
                  // Store only the outcome, not the raw ID data
                  verifiedAt: new Date().toISOString(),
                  type: session.type,
                  // Stripe stores the actual document images — we don't
                },
              },
            }),
            prisma.application.update({
              where: { id: applicationId },
              data: {
                identityVerified: true,
                identityVerifiedAt: new Date(),
              },
            }),
          ])
          break
        }

        case 'identity.verification_session.requires_input': {
          const session = event.data.object as any
          await prisma.verificationSession.updateMany({
            where: { externalId: session.id },
            data: { status: 'REQUIRES_INPUT' },
          })
          break
        }

        case 'identity.verification_session.canceled': {
          const session = event.data.object as any
          await prisma.verificationSession.updateMany({
            where: { externalId: session.id },
            data: { status: 'FAILED' },
          })
          break
        }

        case 'checkout.session.completed': {
          const session = event.data.object as any
          const paymentId = session.metadata?.paymentId
          if (!paymentId) break
          await prisma.payment.update({
            where: { id: paymentId },
            data: { status: 'PAID', paidDate: new Date(), stripePaymentId: session.payment_intent ?? session.id },
          })
          break
        }

        case 'account.updated': {
          const account = event.data.object as any
          if (account.details_submitted && account.charges_enabled) {
            await prisma.user.updateMany({
              where: { stripeAccountId: account.id },
              data: { stripeAccountReady: true },
            })
          }
          break
        }

        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as any
          const paymentId = paymentIntent.metadata?.paymentId

          if (!paymentId) break

          await prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: 'PAID',
              paidDate: new Date(),
              stripePaymentId: paymentIntent.id,
            },
          })
          break
        }

        default:
          // Ignore unhandled event types
          break
      }

      res.json({ received: true })
    } catch (err) {
      console.error('Webhook handler error:', err)
      res.status(500).json({ error: 'Webhook handler failed' })
    }
  }
)

/**
 * POST /api/webhooks/clerk
 *
 * Syncs Clerk user creation/updates to our database.
 * Called when a new user signs up via Clerk.
 */
webhooksRouter.post('/clerk', async (req: Request, res: Response) => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) return res.status(400).json({ error: 'Webhook secret not configured' })

  const svixId = req.headers['svix-id'] as string
  const svixTimestamp = req.headers['svix-timestamp'] as string
  const svixSignature = req.headers['svix-signature'] as string

  if (!svixId || !svixTimestamp || !svixSignature) {
    return res.status(400).json({ error: 'Missing svix headers' })
  }

  let payload: { type: string; data: any }
  try {
    const wh = new Webhook(webhookSecret)
    payload = wh.verify(req.body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as any
  } catch (err) {
    return res.status(400).json({ error: 'Invalid webhook signature' })
  }

  const { type, data } = payload

  try {
    if (type === 'user.created' || type === 'user.updated') {
      const { id, email_addresses, first_name, last_name, public_metadata } = data
      const email = email_addresses?.[0]?.email_address

      if (!email) return res.status(400).json({ error: 'No email' })

      // If a landlord pre-created this user (no clerkId yet), link the real account
      const existingByEmail = await prisma.user.findUnique({ where: { email } })
      if (existingByEmail && !existingByEmail.clerkId) {
        await prisma.user.update({
          where: { email },
          data: {
            clerkId: id,
            firstName: first_name ?? existingByEmail.firstName,
            lastName: last_name ?? existingByEmail.lastName,
          },
        })
      } else {
        await prisma.user.upsert({
          where: { clerkId: id },
          update: {
            email,
            firstName: first_name ?? '',
            lastName: last_name ?? '',
          },
          create: {
            clerkId: id,
            email,
            firstName: first_name ?? '',
            lastName: last_name ?? '',
            role: (public_metadata?.role as any) ?? 'TENANT',
          },
        })
      }
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Clerk webhook error:', err)
    res.status(500).json({ error: 'Clerk webhook handler failed' })
  }
})
