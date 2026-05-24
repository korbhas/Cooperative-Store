import { PrismaClient } from './generated/prisma/default.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { DATABASE_URL } from './env.js'

const globalForPrisma = globalThis

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
