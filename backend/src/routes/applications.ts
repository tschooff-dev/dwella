import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import { getLandlordSettings } from '../lib/settingsHelper'
import { sendNewApplicationAlert } from '../lib/email'

export const applicationsRouter = Router()

async function getLandlordId(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  return user?.id ?? null
}

// GET /api/applications — scoped to landlord's units, optional ?status=
applicationsRouter.get('/', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const { status, unitId } = req.query
    const applications = await prisma.application.findMany({
      where: {
        unit: { property: { landlordId } },
        ...(status ? { status: String(status) as any } : {}),
        ...(unitId ? { unitId: String(unitId) } : {}),
      },
      include: {
        unit: { include: { property: { select: { id: true, name: true } } } },
      },
      orderBy: { submittedAt: 'desc' },
    })
    res.json(applications)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch applications' })
  }
})

// GET /api/applications/:id
applicationsRouter.get('/:id', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const application = await prisma.application.findFirst({
      where: { id: req.params.id, unit: { property: { landlordId } } },
      include: {
        unit: { include: { property: true } },
      },
    })
    if (!application) return res.status(404).json({ error: 'Application not found' })
    res.json(application)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch application' })
  }
})

// GET /api/applications/unit/:unitId — public, returns unit info for apply page
applicationsRouter.get('/unit/:unitId', async (req, res) => {
  try {
    const unit = await prisma.unit.findUnique({
      where: { id: req.params.unitId },
      select: {
        id: true,
        unitNumber: true,
        bedrooms: true,
        bathrooms: true,
        squareFeet: true,
        rentAmount: true,
        depositAmount: true,
        status: true,
        property: { select: { id: true, name: true, address: true, city: true, state: true } },
      },
    })
    if (!unit) return res.status(404).json({ error: 'Unit not found' })
    res.json(unit)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unit' })
  }
})

// GET /api/applications/token/:token — public, returns unit info for one-time apply link
applicationsRouter.get('/token/:token', async (req, res) => {
  try {
    const unit = await prisma.unit.findUnique({
      where: { applyToken: req.params.token },
      select: {
        id: true,
        unitNumber: true,
        bedrooms: true,
        bathrooms: true,
        squareFeet: true,
        rentAmount: true,
        depositAmount: true,
        status: true,
        property: { select: { id: true, name: true, address: true, city: true, state: true } },
      },
    })
    if (!unit) return res.status(410).json({ error: 'This application link has already been used or is no longer valid.' })
    res.json(unit)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unit' })
  }
})

// PATCH /api/applications/:id/applicant-update — public, applicant updates their own application
applicationsRouter.patch('/:id/applicant-update', async (req, res) => {
  try {
    const { previousLandlordName, previousLandlordPhone, ssnLastFour, backgroundCheckConsent } = req.body
    const application = await prisma.application.update({
      where: { id: req.params.id },
      data: {
        ...(previousLandlordName != null ? { previousLandlordName } : {}),
        ...(previousLandlordPhone != null ? { previousLandlordPhone } : {}),
        ...(ssnLastFour != null ? { ssnLastFour } : {}),
        ...(backgroundCheckConsent != null ? {
          backgroundCheckConsent,
          consentAt: backgroundCheckConsent ? new Date() : null,
        } : {}),
      },
    })
    res.json({ id: application.id, status: application.status })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update application' })
  }
})

// POST /api/applications — public endpoint, no auth (applicants submit their own)
applicationsRouter.post('/', async (req, res) => {
  try {
    const { token, unitId: rawUnitId, applicantName, applicantEmail, applicantPhone, monthlyIncome, creditScore } = req.body

    let unitId = rawUnitId

    if (token) {
      const unit = await prisma.unit.findUnique({ where: { applyToken: token }, select: { id: true } })
      if (!unit) return res.status(410).json({ error: 'This application link has already been used or is no longer valid.' })
      unitId = unit.id
      // Consume the token immediately so no one else can use this link
      await prisma.unit.update({ where: { id: unit.id }, data: { applyToken: null } })
    }

    if (!unitId) return res.status(400).json({ error: 'unitId or token is required' })

    const aiScore = computeAiScore(monthlyIncome, creditScore)
    const aiSummary = generateAiSummary(applicantName, monthlyIncome, creditScore, aiScore)

    // Look up landlord for settings + notification
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: { property: { include: { landlord: { select: { id: true, email: true, firstName: true, lastName: true } } } } },
    })
    const landlord = unit?.property?.landlord
    const settings = landlord ? await getLandlordSettings(landlord.id) : null

    // Auto-decline if enabled and score is too low
    const autoDecline = settings?.autoDeclineEnabled && aiScore < (settings?.autoDeclineThreshold ?? 40)

    const application = await prisma.application.create({
      data: {
        unitId,
        applicantName,
        applicantEmail,
        applicantPhone,
        monthlyIncome,
        creditScore,
        aiScore,
        aiSummary,
        status: autoDecline ? 'REJECTED' : 'PENDING',
      },
    })

    // Notify landlord
    if (landlord && settings?.notifyNewApplication && settings.emailDigestFrequency === 'immediate') {
      sendNewApplicationAlert({
        toEmail: landlord.email,
        landlordName: `${landlord.firstName} ${landlord.lastName}`.trim(),
        applicantName,
        propertyName: unit!.property.name,
        unitNumber: unit!.unitNumber,
        aiScore,
      }).catch(console.error)
    }

    res.status(201).json(application)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create application' })
  }
})

// PATCH /api/applications/:id — approve or reject
applicationsRouter.patch('/:id', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const existing = await prisma.application.findFirst({
      where: { id: req.params.id, unit: { property: { landlordId } } },
    })
    if (!existing) return res.status(404).json({ error: 'Application not found' })

    const { status, notes } = req.body
    const application = await prisma.application.update({
      where: { id: req.params.id },
      data: { status, notes, reviewedAt: new Date() },
      include: {
        unit: { include: { property: { select: { id: true, name: true } } } },
      },
    })
    res.json(application)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update application' })
  }
})

function computeAiScore(monthlyIncome: number | null, creditScore: number | null): number {
  let score = 50
  if (monthlyIncome) {
    if (monthlyIncome >= 8000) score += 25
    else if (monthlyIncome >= 5000) score += 15
    else if (monthlyIncome >= 3500) score += 5
  }
  if (creditScore) {
    if (creditScore >= 750) score += 25
    else if (creditScore >= 700) score += 15
    else if (creditScore >= 650) score += 5
    else score -= 10
  }
  return Math.min(100, Math.max(0, score))
}

function generateAiSummary(name: string, income: number | null, credit: number | null, score: number): string {
  const incomeStr = income ? `$${income.toLocaleString()}/mo` : 'not provided'
  const creditStr = credit ? String(credit) : 'not provided'
  const verdict = score >= 75 ? 'Strong applicant.' : score >= 55 ? 'Moderate applicant.' : 'Higher-risk applicant.'
  return `${name} reports income of ${incomeStr} and a credit score of ${creditStr}. ${verdict} AI screening score: ${score}/100.`
}
