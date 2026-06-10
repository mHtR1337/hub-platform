"use client"

import * as React from "react"
import { Search } from "lucide-react"

import { apps, type AppState } from "@/lib/apps"
import { AppCard } from "@/components/catalog/app-card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Filter = "all" | AppState

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unlocked", label: "Active" },
  { value: "locked", label: "Locked" },
]

export function AppCatalog() {
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<Filter>("all")

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return apps.filter((app) => {
      const matchesFilter = filter === "all" || app.state === filter
      const matchesQuery =
        q === "" ||
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q)
      return matchesFilter && matchesQuery
    })
  }, [query, filter])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the catalog..."
            aria-label="Search the catalog"
            className="pl-9"
          />
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            {filters.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          No apps match your search.
        </div>
      )}
    </div>
  )
}
