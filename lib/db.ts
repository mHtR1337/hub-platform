import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

import { PrismaClient } from "@/lib/generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: pg.Pool | undefined
}

function createPrismaClient(): PrismaClient {
  const pool =
    globalForPrisma.pool ??
    new pg.Pool({ connectionString: process.env.DATABASE_URL })

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool
  }

  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}
