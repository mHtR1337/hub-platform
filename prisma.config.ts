import path from 'node:path'
import { defineConfig } from 'prisma/config'
import type { PrismaPg } from '@prisma/adapter-pg'

// prisma.config.ts is used by the Prisma CLI only (migrate, studio, seed).
// At runtime, the adapter is constructed in lib/db.ts instead.
//
// Two connection strings are needed for Supabase:
//   DIRECT_URL  — direct connection (port 5432), used by migrations
//   DATABASE_URL — pooled via pgBouncer (port 6543), used at runtime
//
// See .env.example for the exact format of each.

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  migrate: {
    async adapter(env) {
      const { PrismaPg } = await import('@prisma/adapter-pg')
      // Migrations always use the direct connection — pgBouncer doesn't
      // support the DDL transactions Prisma's migration engine needs.
      const url = env.DIRECT_URL ?? env.DATABASE_URL
      if (!url) throw new Error('DIRECT_URL (or DATABASE_URL) is required for migrations')
      return new PrismaPg({ connectionString: url }) as PrismaPg
    },
  },
})
