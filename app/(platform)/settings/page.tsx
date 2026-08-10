import { AppShell } from "@/components/platform/app-shell"
import { MEDICAL_STATUSES, TRAINING_STATUSES, DEFAULT_FLAGS } from "@/lib/hspec"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function SettingsPage() {
  return (
    <AppShell title="Settings">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Hub registries, roles, billing limits and audit — seeded with HSpec defaults.
          </p>
        </div>

        <Tabs defaultValue="registries">
          <TabsList>
            <TabsTrigger value="registries">Registries</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="registries" className="mt-4 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Medical status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {MEDICAL_STATUSES.map((s) => (
                  <Badge key={s.slug} variant="outline">
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
                {TRAINING_STATUSES.map((s) => (
                  <Badge key={s.slug} variant="outline">
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
                {DEFAULT_FLAGS.map((f) => (
                  <Badge key={f.slug} variant="secondary">
                    {f.label}
                    <span className="ml-1 text-[10px] opacity-70">{f.sourceApp}</span>
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="mt-4">
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Permission matrix (org role + role per team + app manifests) lands in Phase 5.
                Defaults: Owner, Admin, Head Coach, Coach, Medical Staff, Analyst, Viewer.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="mt-4">
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Org-size plans (active athletes / staff). Archived records do not count.
                Downgrade never deletes — limit-exceeded state until archive or upgrade.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Audit log viewer (actor, source app, resource, old/new) after migration.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
