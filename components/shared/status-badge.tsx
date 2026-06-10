import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type Status = "active" | "trialing" | "past_due" | "canceled"

const config: Record<Status, { label: string; className: string; dot: string }> = {
  active: {
    label: "Active",
    className: "border-primary/20 bg-accent text-accent-foreground",
    dot: "bg-primary",
  },
  trialing: {
    label: "Trialing",
    className: "border-border bg-muted text-foreground",
    dot: "bg-muted-foreground",
  },
  past_due: {
    label: "Past due",
    className: "border-destructive/20 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  canceled: {
    label: "Canceled",
    className: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
}

export function StatusBadge({ status }: { status: Status }) {
  const { label, className, dot } = config[status]
  return (
    <Badge variant="secondary" className={cn("gap-1.5", className)}>
      <span className={cn("size-1.5 rounded-full", dot)} aria-hidden="true" />
      {label}
    </Badge>
  )
}
