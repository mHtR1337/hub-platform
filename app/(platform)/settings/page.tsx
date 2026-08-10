import { AppShell } from "@/components/platform/app-shell"
import { getOrgContext } from "@/lib/athletes"
import { db } from "@/lib/db"
import { listOrgMembers } from "@/lib/organization"
import { getOrganizationSeatLimits } from "@/lib/seats"
import { requireDbUser } from "@/lib/users"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function SettingsPage() {
  const user = await requireDbUser()
  const ctx = await getOrgContext(user.id)

  const [audit, statuses, flags, seats, members, archivedCount] = ctx
    ? await Promise.all([
        db.auditLog.findMany({
          where: { organizationId: ctx.organization.id },
          orderBy: { createdAt: "desc" },
          take: 30,
          include: { actor: { select: { email: true } } },
        }),
        db.statusOption.findMany({
          where: { organizationId: ctx.organization.id, active: true },
          orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
        }),
        db.flagDefinition.findMany({
          where: { organizationId: ctx.organization.id, enabled: true },
          orderBy: { slug: "asc" },
        }),
        getOrganizationSeatLimits(ctx.organization.id),
        listOrgMembers(ctx.organization.id),
        db.athlete.count({
          where: { organizationId: ctx.organization.id, archived: true },
        }),
      ])
    : [[], [], [], null, [], 0]

  const medical = statuses.filter((s) => s.kind === "medical")
  const training = statuses.filter((s) => s.kind === "training")
  const planName =
    ctx?.organization.plan?.plan?.name ??
    ctx?.organization.plan?.planSlug ??
    "—"

  return (
    <AppShell title="Settings">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Org registries, seat limits, staff roles, and audit trail.
          </p>
        </div>

        <Tabs defaultValue="registries">
          <TabsList>
            <TabsTrigger value="registries">Registries</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="registries" className="mt-4 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Medical status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {medical.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No statuses yet — open the board once to seed defaults.
                  </p>
                )}
                {medical.map((s) => (
                  <Badge key={s.id} variant="outline">
                    <span
                      className="mr-1.5 inline-block size-2 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.label}
                  </Badge>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Training status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {training.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No statuses yet — open the board once to seed defaults.
                  </p>
                )}
                {training.map((s) => (
                  <Badge key={s.id} variant="outline">
                    <span
                      className="mr-1.5 inline-block size-2 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.label}
                  </Badge>
                ))}
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Flag registry</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {flags.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No flags seeded for this org yet.
                  </p>
                )}
                {flags.map((f) => (
                  <Badge key={f.id} variant="secondary">
                    {f.label}
                    <span className="ml-1 text-[10px] opacity-70">
                      {f.sourceApp}
                    </span>
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Plan:{" "}
                  <strong className="text-foreground">{planName}</strong>
                  {ctx?.organization.plan?.status
                    ? ` · ${ctx.organization.plan.status}`
                    : ""}
                </p>
                {seats ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border px-3 py-2">
                      <div className="text-xs text-muted-foreground">
                        Active athletes
                      </div>
                      <div className="text-lg font-semibold tabular-nums">
                        {seats.usedAthletes}
                        <span className="text-sm font-normal text-muted-foreground">
                          {" "}
                          / {seats.maxAthletes}
                        </span>
                      </div>
                      {archivedCount > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {archivedCount} archived (not counted)
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg border px-3 py-2">
                      <div className="text-xs text-muted-foreground">
                        Staff seats
                      </div>
                      <div className="text-lg font-semibold tabular-nums">
                        {seats.usedCoaches}
                        <span className="text-sm font-normal text-muted-foreground">
                          {" "}
                          / {seats.maxCoaches}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No organization yet.</p>
                )}
                <p className="text-muted-foreground">
                  Downgrade never deletes — archive athletes until within limit.
                  Payments stay out of MVP; limits are plan-template driven.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Organization members</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {members.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No staff members yet.
                  </p>
                )}
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">{m.user.email}</div>
                      <div className="text-xs text-muted-foreground">
                        Joined {m.joinedAt.toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="outline">{m.role}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent audit log</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {audit.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No audited actions yet. Move an athlete on the board or create
                    an event.
                  </p>
                )}
                {audit.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">{row.action}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.resourceType}
                        {row.resourceId
                          ? ` · ${row.resourceId.slice(0, 8)}…`
                          : ""}
                        {row.actor?.email ? ` · ${row.actor.email}` : ""}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {row.createdAt.toLocaleString()}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
