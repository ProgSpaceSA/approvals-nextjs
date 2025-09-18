import { beforeAll, afterAll, afterEach } from 'vitest'
import { db } from '@/lib/db'

beforeAll(async () => {
  // Setup test database
  console.log('Setting up test database...')
})

afterEach(async () => {
  // Clean up data after each test
  await db.auditLog.deleteMany()
  await db.suggestion.deleteMany()
  await db.request.deleteMany()
  await db.user.deleteMany()
})

afterAll(async () => {
  // Cleanup
  await db.$disconnect()
})
