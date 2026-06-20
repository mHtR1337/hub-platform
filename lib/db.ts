import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

import { config } from "@/lib/config"
import { PrismaClient } from "@/lib/generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: pg.Pool | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = config.databaseUrl

  const pool =
    globalForPrisma.pool ??
    new pg.Pool({
      connectionString,
      ssl:
        connectionString.includes("supabase.com") ||
        connectionString.includes("supabase.co")
          ? { rejectUnauthorized: false }
          : undefined,
    })

  globalForPrisma.pool = pool

  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log:
      config.nodeEnv === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient()
    const value = Reflect.get(client, prop, client) as unknown
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value
  },
})
