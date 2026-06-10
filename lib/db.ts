// TODO (Phase 0): Uncomment after running `pnpm add prisma @prisma/client` and `pnpm db:migrate dev`.
// import { PrismaClient } from '@prisma/client'
//
// const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
//
// export const db =
//   globalForPrisma.prisma ??
//   new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'] })
//
// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export const db = null as never // placeholder — replace with Prisma client above
