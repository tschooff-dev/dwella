import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { stripe } from '../lib/stripe'

export const identityRouter = Router()

/**
 * POST /api/identity/create-session
 *
 * Creates a Stripe Identity verification session.
 * The frontend uses the returned clientSecret to launch the Stripe Identity widget.
 *
 * This verifies government-issued ID + selfie match.
 * Stripe handles all PII — we only receive the verification outcome.
 *
 * Body: { applicationId: string }
 */
identityRouter.post('/create-session', async (req, res) => {
  try {
    const { applicationId } = req.body
    if (!applicationId) {
      return res.status(400).json({ error: 'applicationId is required' })
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    })
    if (!application) {
      return res.status(404).json({ error: 'Application not found' })
    }

    // Create Stripe Identity session
    // Stripe stores the ID document images and PII — we never see or store them
    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        applicationId,
        applicantEmail: application.applicantEmail,
      },
      options: {
        document: {
          // Accept driver's license, passport, or ID card
          allowed_types: ['driving_license', 'passport', 'id_card'],
          require_id_number: false, // don't ask for SSN
          require_live_capture: true,
          require_matching_selfie: true,
        },
      },
      return_url: `${process.env.FRONTEND_URL}/apply/${applicationId}?identity_verified=true`,
    })

    // Record the session in our DB (ID only, no PII)
    await prisma.verificationSession.create({
      data: {
        applicationId,
        provider: 'STRIPE_IDENTITY',
        externalId: session.id,
        status: 'PENDING',
      },
    })

    res.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
    })
  } catch (err) {
    console.error('Identity create-session error:', err)
    res.status(500).json({ error: 'Failed to create identity verification session' })
  }
})

/**
 * GET /api/identity/status/:applicationId
 *
 * Check the current identity verification status for an application.
 */
identityRouter.get('/status/:applicationId', async (req, res) => {
  try {
    const session = await prisma.verificationSession.findFirst({
      where: {
        applicationId: req.params.applicationId,
        provider: 'STRIPE_IDENTITY',
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!session) {
      return res.json({ status: 'not_started' })
    }

    res.json({ status: session.status, sessionId: session.externalId })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch identity status' })
  }
})
