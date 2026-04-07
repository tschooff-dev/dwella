import { Router } from 'express'
import { prisma } from '../lib/prisma'

export const applicationsRouter = Router()

// GET /api/applications
applicationsRouter.get('/', async (req, res) => {
  try {
    const { status, unitId } = req.query
    const applications = await prisma.application.findMany({
      where: {
        ...(status ? { status: String(status) as any } : {}),
        ...(unitId ? { unitId: String(unitId) } : {}),
      },
      include: {
        unit: {
          include: { property: { select: { id: true, name: true } } },
        },
      },
      orderBy: { submittedAt: 'desc' },
    })
    res.json(applications)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch applications' })
  }
})

// GET /api/applications/:id
applicationsRouter.get('/:id', async (req, res) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        unit: { include: { property: true } },
        applicant: true,
      },
    })
    if (!application) return res.status(404).json({ error: 'Application not found' })
    res.json(application)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch application' })
  }
})

// POST /api/applications
applicationsRouter.post('/', async (req, res) => {
  try {
    const { unitId, applicantName, applicantEmail, applicantPhone, monthlyIncome, creditScore } = req.body

    // Placeholder AI scoring logic
    // In production: call OpenAI or your AI service here
    const aiScore = computeAiScore(monthlyIncome, creditScore)
    const aiSummary = generateAiSummary(applicantName, monthlyIncome, creditScore, aiScore)

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
        status: 'PENDING',
      },
    })
    res.status(201).json(application)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create application' })
  }
})

// PATCH /api/applications/:id — approve or reject
applicationsRouter.patch('/:id', async (req, res) => {
  try {
    const { status, notes } = req.body
    const application = await prisma.application.update({
      where: { id: req.params.id },
      data: {
        status,
        notes,
        reviewedAt: new Date(),
      },
    })
    res.json(application)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update application' })
  }
})

// Placeholder AI scoring — replace with real AI call
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
