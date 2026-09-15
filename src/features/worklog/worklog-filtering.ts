import type { JiraLiveIssue, JiraUser } from "@/types"
import { issueBelongsToUser, isSameLocalDay, worklogStatusCategory } from "./worklog-issues"

export type WorklogActivityFilter = "all" | "suggested" | "active" | "updated-today" | "done-today" | "logged-today" | "unlogged-today"
export type WorklogEstimateFilter = "all" | "estimated" | "unestimated"

export type WorklogFilters = {
  search: string
  status: string
  type: string
  assignee: string
  activity: WorklogActivityFilter
  estimate: WorklogEstimateFilter
}

export const EMPTY_WORKLOG_FILTERS: WorklogFilters = {
  search: "", status: "all", type: "all", assignee: "all", activity: "all", estimate: "all",
}

function estimateMinutes(issue: JiraLiveIssue) {
  return Math.round((issue.originalEstimateSeconds ?? issue.remainingEstimateSeconds ?? 0) / 60)
}

function matchesActivity(issue: JiraLiveIssue, filter: WorklogActivityFilter, suggestedKeys: Set<string>, loggedMinutesByIssue: Record<string, number>, date = new Date()) {
  const category = worklogStatusCategory(issue)
  if (filter === "all") return true
  if (filter === "suggested") return suggestedKeys.has(issue.key)
  if (filter === "active") return category === "indeterminate"
  if (filter === "updated-today") return isSameLocalDay(issue.updated, date)
  if (filter === "done-today") return category === "done" && isSameLocalDay(issue.resolutionDate ?? issue.updated, date)
  if (filter === "logged-today") return (loggedMinutesByIssue[issue.key] ?? 0) > 0
  if (filter === "unlogged-today") return !(loggedMinutesByIssue[issue.key] > 0)
  return true
}

export function filterWorklogIssues(source: JiraLiveIssue[], filters: WorklogFilters, currentUser: JiraUser | undefined, suggestedKeys: Set<string>, loggedMinutesByIssue: Record<string, number>, date = new Date()) {
  const q = filters.search.trim().toLowerCase()
  return source.filter((issue) => {
    if (q && ![issue.key, issue.summary, issue.assignee, issue.status, issue.type, ...issue.labels].some((value) => String(value ?? "").toLowerCase().includes(q))) return false
    if (filters.status !== "all" && issue.status !== filters.status) return false
    if (filters.type !== "all" && issue.type !== filters.type) return false
    if (filters.assignee === "__me__" && !issueBelongsToUser(issue, currentUser)) return false
    if (filters.assignee === "__unassigned__" && (issue.assignee || issue.assigneeId)) return false
    if (!filters.assignee.startsWith("__") && filters.assignee !== "all" && issue.assignee !== filters.assignee) return false
    if (filters.estimate === "estimated" && estimateMinutes(issue) <= 0) return false
    if (filters.estimate === "unestimated" && estimateMinutes(issue) > 0) return false
    return matchesActivity(issue, filters.activity, suggestedKeys, loggedMinutesByIssue, date)
  })
}

export function worklogFilterCount(filters: WorklogFilters) {
  return Number(Boolean(filters.search.trim())) + Number(filters.status !== "all") + Number(filters.type !== "all") + Number(filters.assignee !== "all") + Number(filters.activity !== "all") + Number(filters.estimate !== "all")
}
