import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data in correct order
  await prisma.auditLog.deleteMany()
  await prisma.suggestion.deleteMany()
  await prisma.request.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const hashedPassword = await bcrypt.hash('Passw0rd!', 12)

  const ceo = await prisma.user.create({
    data: {
      email: 'ceo@example.com',
      name: 'CEO User',
      role: Role.CEO,
      hashedPassword,
    },
  })

  const executive = await prisma.user.create({
    data: {
      email: 'exec@example.com',
      name: 'Executive User',
      role: Role.EXECUTIVE,
      hashedPassword,
    },
  })

  console.log('✅ Created users:')
  console.log('  📧 ceo@example.com / Passw0rd!')
  console.log('  📧 exec@example.com / Passw0rd!')

  // Create sample requests with suggestions
  const request1 = await prisma.request.create({
    data: {
      title: 'New Marketing Campaign Budget',
      description: 'We need to allocate budget for our Q4 marketing campaign. The marketing team has prepared several options based on different strategic approaches.',
      createdById: executive.id,
      suggestions: {
        create: [
          {
            label: 'Conservative Approach - $50K',
            details: 'Focus on proven channels like Google Ads and social media with guaranteed ROI. Lower risk but moderate reach.',
          },
          {
            label: 'Aggressive Growth - $150K',
            details: 'Expand into new channels including influencer partnerships, podcast sponsorships, and premium content creation.',
          },
          {
            label: 'Balanced Strategy - $100K',
            details: 'Mix of proven and experimental channels. Includes A/B testing budget for new approaches while maintaining core campaigns.',
          },
        ],
      },
    },
  })

  const request2 = await prisma.request.create({
    data: {
      title: 'Remote Work Policy Update',
      description: 'Our current remote work policy needs updating to reflect post-pandemic workplace preferences and maintain team productivity.',
      createdById: executive.id,
      suggestions: {
        create: [
          {
            label: 'Hybrid Model - 3 days office',
            details: 'Mandatory office presence Monday, Wednesday, Friday. Remote Tuesday and Thursday. Maintains collaboration while offering flexibility.',
          },
          {
            label: 'Flexible Remote-First',
            details: 'Employees choose their schedule with minimum 1 day per week in office for team meetings. Results-focused approach.',
          },
          {
            label: 'Full Return to Office',
            details: 'All employees return to full-time office work with exceptions only for special circumstances. Traditional approach.',
          },
          {
            label: 'Department-Based Policy',
            details: 'Different policies for different departments based on collaboration needs. Engineering more remote, Sales more in-person.',
          },
        ],
      },
    },
  })

  // Create audit logs for the requests
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: executive.id,
        requestId: request1.id,
        action: 'REQUEST_CREATED',
        metadata: {
          title: request1.title,
          suggestionsCount: 3,
        },
      },
      {
        actorId: executive.id,
        requestId: request2.id,
        action: 'REQUEST_CREATED',
        metadata: {
          title: request2.title,
          suggestionsCount: 4,
        },
      },
    ],
  })

  console.log('✅ Created sample requests with suggestions and audit logs')
  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
