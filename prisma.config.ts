import path from "node:path"
import { defineConfig } from "prisma/config"

import { config } from "./lib/config"

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: config.directUrl,
  },
})
