import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { createLinkToken, getIncomeVerification } from '../lib/plaid'

export const plaidRouter = Router()

/**
 * POST /api/plaid/create-link-token
 *
 * Creates a Plaid Link token to initialize the income verification widget.
 * The frontend receives this token and passes it to the Plaid Link component.
 *
 * Body: { applicationId: string }
 */
plaidRouter.post('/create-link-token', async (req, res) => {
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

    // Use applicationId as the Plaid user ID — no real user account needed
    const linkToken = await createLinkToken(applicationId)

    res.json({ linkToken: linkToken.link_token, expiration: linkToken.expiration })
  } catch (err) {
    console.error('Plaid create-link-token error:', err)
    res.status(500).json({ error: 'Failed to create Plaid link token' })
  }
})

/**
 * POST /api/plaid/exchange-token
 *
 * Called after the tenant completes the Plaid Link flow.
 * Exchanges the public_token for an access_token, fetches income data,
 * then discards the access_token. Only non-PII derived facts are stored.
 *
 * Body: { applicationId: string, publicToken: string }
 */
plaidRouter.post('/exchange-token', async (req, res) => {
  try {
    const { applicationId, publicToken } = req.body
    if (!applicationId || !publicToken) {
      return res.status(400).json({ error: 'applicationId and publicToken are required' })
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    })
    if (!application) {
      return res.status(404).json({ error: 'Application not found' })
    }

    // Fetch income data — access_token is used and discarded inside this function
    const incomeData = await getIncomeVerification(publicToken)

    // Store only the derived, non-PII facts
    const [updatedApplication] = await prisma.$transaction([
      prisma.application.update({
        where: { id: applicationId },
        data: {
          plaidVerified: incomeData.verified,
          verifiedMonthlyIncome: incomeData.estimatedMonthlyIncome,
          verifiedEmployer: incomeData.employerName,
          incomeVerifiedAt: new Date(),
        },
      }),
      prisma.verificationSession.create({
        data: {
          applicationId,
          provider: 'PLAID',
          externalId: incomeData.itemId,
          status: incomeData.verified ? 'VERIFIED' : 'FAILED',
          resultSummary: {
            employerName: incomeData.employerName,
            estimatedMonthlyIncome: incomeData.estimatedMonthlyIncome,
            paystubCount: incomeData.paystubCount,
            // No bank account numbers, no SSN, no raw transaction data
          },
        },
      }),
    ])

    res.json({
      verified: incomeData.verified,
      employerName: incomeData.employerName,
      estimatedMonthlyIncome: incomeData.estimatedMonthlyIncome,
    })
  } catch (err) {
    console.error('Plaid exchange-token error:', err)
    res.status(500).json({ error: 'Failed to verify income' })
  }
})
