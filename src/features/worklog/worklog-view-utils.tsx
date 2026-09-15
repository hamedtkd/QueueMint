import { BookOpen, Bug, CheckSquare2, CircleDot, Shapes } from "lucide-react"

import { cn } from "@/lib/utils"
import type { JiraLiveIssue } from "@/types"
import { worklogStatusCategory } from "./worklog-issues"

export function issueTypeIcon(type?: string) {
  const value = String(type ?? "").toLowerCase()
  if (value.includes("bug")) return Bug
  if (value.includes("story")) return BookOpen
  if (value.includes("task")) return CheckSquare2
  return Shapes
}

export function statusTone(issue: JiraLiveIssue) {
  const category = worklogStatusCategory(issue)
  if (category === "done") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-300"
  if (category === "indeterminate") return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/35 dark:text-blue-300"
  if (category === "new") return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300"
  return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/35 dark:text-violet-300"
}

export function StatusDot({ issue, className }: { issue: JiraLiveIssue; className?: string }) {
  const category = worklogStatusCategory(issue)
  return <CircleDot className={cn("size-3.5", category === "done" ? "text-emerald-600" : category === "indeterminate" ? "text-blue-600" : category === "new" ? "text-slate-500" : "text-violet-600", className)} />
}

export function formatWorklogUpdated(value?: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  const now = new Date()
  const sameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
  return sameDay ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : date.toLocaleDateString([], { month: "short", day: "numeric" })
}
