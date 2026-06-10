import { AppShell } from "@/components/app-shell"
import { BundleBanner } from "@/components/bundle-banner"
import { AppCatalog } from "@/components/app-catalog"

export default function AppsPage() {
  return (
    <AppShell title="My apps" searchPlaceholder="Search the catalog...">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-pretty text-2xl font-semibold tracking-tight">
            App catalog
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse every app on the platform and unlock the ones you need.
          </p>
        </div>

        <BundleBanner />
        <AppCatalog />
      </div>
    </AppShell>
  )
}
