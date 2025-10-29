import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'

async function main() {
  const prisma = new PrismaClient()
  // Fixed credentials as requested
  const users: Array<{ email: string; name: string; role: Role; password: string }> = [
    { email: 'ceo@inhaj.com', name: 'CEO', role: Role.CEO, password: '8YwqZp1A' },
    { email: 'ali@inhaj.com', name: 'Ali', role: Role.EXECUTIVE, password: 't7KcN3qQ' },
    { email: 'khabbab@inhaj.com', name: 'Khabbab', role: Role.EXECUTIVE, password: 'Rm9aV2hf' },
    { email: 'mohsenand@inhaj.com', name: 'Mohsenand', role: Role.EXECUTIVE, password: 'J4sLq8UZ' },
    { email: 'majid@inhaj.com', name: 'Majid', role: Role.EXECUTIVE, password: 'Q2wErT3y' },
  ]

  const created: { email: string; password: string }[] = []
  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 12)
    await prisma.user.upsert({
      where: { email: u.email },
      update: { hashedPassword, name: u.name, role: u.role },
      create: { email: u.email, name: u.name, role: u.role, hashedPassword },
    })
    created.push({ email: u.email, password: u.password })
  }

  const lines = created.map((c) => `${c.email} ${c.password}`).join('\n')
  fs.writeFileSync('created_users.txt', lines)
  console.log(lines)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


