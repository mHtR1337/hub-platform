import { db } from "@/lib/db"
import { seedOrgRegistries } from "@/lib/organization"

export type SmftDirection = "up" | "down" | "stable" | "none"

export type SmftPayload = {
  app: "smft"
  metric: string
  value: number
  unit: string
  direction: SmftDirection
  testedAt: string
}

function parsePayload(body: string): SmftPayload | null {
  try {
    const parsed = JSON.parse(body) as Partial<SmftPayload>
    if (parsed.app !== "smft" || typeof parsed.value !== "number") return null
    return {
      app: "smft",
      metric: String(parsed.metric ?? "MAS"),
      value: parsed.value,
      unit: String(parsed.unit ?? "m/s"),
      direction: (parsed.direction as SmftDirection) ?? "none",
      testedAt: String(parsed.testedAt ?? new Date().toISOString()),
    }
  } catch {
    return null
  }
}

export async function listSmftResults(organizationId: string, take = 40) {
  const notes = await db.athleteNote.findMany({
    where: {
      kind: "performance",
      athlete: { organizationId },
      body: { contains: '"app":"smft"' },
    },
    include: {
      athlete: { select: { id: true, name: true } },
      author: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  })

  return notes
    .map((n) => {
      const payload = parsePayload(n.body)
      if (!payload) return null
      return {
        id: n.id,
        createdAt: n.createdAt,
        athlete: n.athlete,
        authorEmail: n.author?.email ?? null,
        ...payload,
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
}

async function ensureFlagDef(organizationId: string, slug: "smft-up" | "smft-down") {
  await seedOrgRegistries(organizationId)
  const def = await db.flagDefinition.findUnique({
    where: { organizationId_slug: { organizationId, slug } },
  })
  if (!def) throw new Error(`Flag definition ${slug} missing for org.`)
  return def
}

/** Resolve active flags of the opposite / same family before raising a new one. */
async function resolveActiveSmftFlags(
  organizationId: string,
  athleteId: string,
  actorId?: string,
) {
  const defs = await db.flagDefinition.findMany({
    where: {
      organizationId,
      slug: { in: ["smft-up", "smft-down"] },
    },
  })
  if (defs.length === 0) return

  await db.flag.updateMany({
    where: {
      organizationId,
      athleteId,
      status: "active",
      flagDefinitionId: { in: defs.map((d) => d.id) },
    },
    data: {
      status: "resolved",
      resolvedAt: new Date(),
      resolvedById: actorId ?? null,
    },
  })
}

export async function createSmftResult(input: {
  organizationId: string
  athleteId: string
  metric: string
  value: number
  unit?: string
  direction: SmftDirection
  testedAt?: Date
  actorId?: string
}) {
  const athlete = await db.athlete.findFirst({
    where: { id: input.athleteId, organizationId: input.organizationId },
  })
  if (!athlete) throw new Error("Athlete not found.")
  if (!Number.isFinite(input.value)) throw new Error("Result value is required.")

  const testedAt = input.testedAt ?? new Date()
  const metric = input.metric.trim() || "MAS"
  const unit = input.unit?.trim() || "m/s"
  const payload: SmftPayload = {
    app: "smft",
    metric,
    value: input.value,
    unit,
    direction: input.direction,
    testedAt: testedAt.toISOString(),
  }

  const note = await db.athleteNote.create({
    data: {
      athleteId: athlete.id,
      authorId: input.actorId ?? null,
      kind: "performance",
      body: JSON.stringify(payload),
    },
  })

  await resolveActiveSmftFlags(
    input.organizationId,
    athlete.id,
    input.actorId,
  )

  if (input.direction === "up" || input.direction === "down") {
    const slug = input.direction === "up" ? "smft-up" : "smft-down"
    const def = await ensureFlagDef(input.organizationId, slug)
    await db.flag.create({
      data: {
        organizationId: input.organizationId,
        flagDefinitionId: def.id,
        athleteId: athlete.id,
        status: "active",
        sourceApp: "smft",
        message: `${metric} ${input.value} ${unit} (${input.direction})`,
      },
    })
  }

  await db.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorId: input.actorId ?? null,
      sourceApp: "smft",
      action: "smft.result.create",
      resourceType: "athlete_note",
      resourceId: note.id,
      newValue: payload,
    },
  })

  return note
}
