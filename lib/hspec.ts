/**
 * HSpec Hub default registries — opinionated defaults from Mladen's product
 * brief (2026-07-18). Organizations get these seeded on creation and can
 * rename/hide/extend them in Settings → Registries.
 */

export type StatusSeed = {
  slug: string
  label: string
  color: string
  sortOrder: number
}

/** Medical Status (brief §5.1) — single-select, health state only. */
export const MEDICAL_STATUSES: StatusSeed[] = [
  { slug: "available-no-issues", label: "Available - no issues", color: "green", sortOrder: 1 },
  { slug: "available-asymptomatic", label: "Available - asymptomatic issues", color: "blue", sortOrder: 2 },
  { slug: "available-symptomatic", label: "Available - symptomatic issues", color: "amber", sortOrder: 3 },
  { slug: "modified-symptomatic", label: "Modified - symptomatic issues", color: "amber", sortOrder: 4 },
  { slug: "unavailable", label: "Unavailable", color: "red", sortOrder: 5 },
  { slug: "other", label: "Other", color: "gray", sortOrder: 6 },
]

/** Training Status (brief §5.2) — single-select, default Visual Board columns. */
export const TRAINING_STATUSES: StatusSeed[] = [
  { slug: "full-training-competition", label: "Full Training / Competition", color: "green", sortOrder: 1 },
  { slug: "full-training-reserve", label: "Full Training / Reserve", color: "green", sortOrder: 2 },
  { slug: "full-training-no-competition", label: "Full Training / No Competition", color: "blue", sortOrder: 3 },
  { slug: "modified-full-training", label: "Modified Full Training", color: "amber", sortOrder: 4 },
  { slug: "special-program", label: "Special Program", color: "purple", sortOrder: 5 },
  { slug: "unavailable", label: "Unavailable", color: "red", sortOrder: 6 },
  { slug: "away-holiday", label: "Away - Holiday", color: "gray", sortOrder: 7 },
  { slug: "away-national-team", label: "Away - National Team", color: "gray", sortOrder: 8 },
  { slug: "other", label: "Other", color: "gray", sortOrder: 9 },
]

/** Attendance values (brief §5.4). */
export const ATTENDANCE_OPTIONS = [
  { slug: "full", label: "Full" },
  { slug: "partial", label: "Partial" },
  { slug: "modified", label: "Modified" },
  { slug: "missed", label: "Missed" },
  { slug: "other", label: "Other" },
] as const

export type AttendanceStatus = (typeof ATTENDANCE_OPTIONS)[number]["slug"]

export type FlagSeed = {
  slug: string
  label: string
  sourceApp: string
  severity: "info" | "warning" | "critical"
}

/** Default flag registry (brief §5.6) — apps publish these to the Hub. */
export const DEFAULT_FLAGS: FlagSeed[] = [
  { slug: "smft-down", label: "SMFT down", sourceApp: "smft", severity: "warning" },
  { slug: "smft-up", label: "SMFT up", sourceApp: "smft", severity: "info" },
  { slug: "wellness-low", label: "Wellness low", sourceApp: "survey-tool", severity: "warning" },
  { slug: "questionnaire-overdue", label: "Questionnaire overdue", sourceApp: "survey-tool", severity: "warning" },
  { slug: "srpe-missing", label: "sRPE missing", sourceApp: "survey-tool", severity: "warning" },
  { slug: "asp-load-high", label: "ASP load high", sourceApp: "agile-strength-planner", severity: "warning" },
  { slug: "hiit-ready", label: "HIIT ready", sourceApp: "hiit-builder", severity: "info" },
  { slug: "diary-note", label: "Diary note", sourceApp: "training-diary", severity: "info" },
  { slug: "attendance-low", label: "Attendance low", sourceApp: "session-tool", severity: "warning" },
  { slug: "modified-too-long", label: "Modified too long", sourceApp: "hub", severity: "warning" },
  { slug: "data-quality-issue", label: "Data quality issue", sourceApp: "hub", severity: "warning" },
  { slug: "recalculation-needed", label: "Recalculation needed", sourceApp: "analysis-tool", severity: "info" },
]

/** Calendar event types (brief §8.2). */
export const EVENT_TYPES = [
  { slug: "training", label: "Training session", color: "green" },
  { slug: "gym", label: "Gym session", color: "purple" },
  { slug: "hiit", label: "HIIT session", color: "red" },
  { slug: "match", label: "Match", color: "red" },
  { slug: "testing", label: "Testing session", color: "blue" },
  { slug: "smft", label: "SMFT test", color: "blue" },
  { slug: "survey", label: "Survey window", color: "blue" },
  { slug: "wellness", label: "Morning wellness", color: "blue" },
  { slug: "recovery", label: "Recovery protocol", color: "amber" },
  { slug: "video-review", label: "Video review", color: "amber" },
  { slug: "task", label: "Task", color: "gray" },
  { slug: "travel", label: "Travel", color: "gray" },
  { slug: "medical", label: "Medical appointment", color: "red" },
  { slug: "meeting", label: "Meeting", color: "gray" },
  { slug: "individual", label: "Individual session", color: "teal" },
  { slug: "other", label: "Other", color: "gray" },
] as const

export type EventType = (typeof EVENT_TYPES)[number]["slug"]

/** Session descriptors / activity tags (brief §5.5). */
export const SESSION_DESCRIPTORS = [
  "Field training",
  "Gym",
  "Speed",
  "Strength",
  "HIIT",
  "Tactical",
  "Technical",
  "Recovery",
  "Rehab",
  "Return to Play",
  "Testing",
  "Match",
  "Travel",
  "Meeting",
  "Video review",
  "Individual session",
  "Team session",
] as const

/** Default group examples (brief §4.5) — seeded per team on request, not forced. */
export const DEFAULT_GROUP_EXAMPLES = [
  "Starters",
  "Reserves",
  "Return to Play",
  "Injured",
  "Modified training",
  "Speed group",
  "Strength group",
] as const

/** Flag lifecycle states. */
export const FLAG_STATUSES = ["active", "acknowledged", "resolved", "snoozed"] as const
export type FlagStatus = (typeof FLAG_STATUSES)[number]

export function eventTypeColor(type: string): string {
  return EVENT_TYPES.find((t) => t.slug === type)?.color ?? "gray"
}

export function statusColor(options: StatusSeed[], slug: string): string {
  return options.find((s) => s.slug === slug)?.color ?? "gray"
}
