import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { hasEntitlement } from "@/lib/entitlements"

export default async function SubAppPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { userId } = await auth()

  if (!userId) {
    redirect("/login")
  }

  const entitled = await hasEntitlement(userId, slug)
  if (!entitled) {
    redirect("/apps?locked=true")
  }

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{slug}</h1>
      <p className="text-sm text-muted-foreground">
        Sub-app content for {slug} will render here.
      </p>
    </div>
  )
}
