import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'schoofft@gmail.com'

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error(`No user found with email ${email}`)

  const lease = await prisma.lease.findFirst({
    where: { tenantId: user.id, status: 'ACTIVE' },
    orderBy: { startDate: 'desc' },
  })
  if (!lease) throw new Error(`No active lease found for ${email}`)

  const payment = await prisma.payment.create({
    data: {
      leaseId: lease.id,
      tenantId: user.id,
      amount: 1.00,
      dueDate: new Date(),
      status: 'DUE',
      notes: 'Test payment',
    },
  })

  console.log(`Created payment ${payment.id} — $1.00 DUE for ${email} on lease ${lease.id}`)
}

main().catch(err => { console.error(err); process.exit(1) }).finally(() => prisma.$disconnect())
