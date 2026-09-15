import type { JiraLiveIssue, JiraUser } from "@/types"

export type WorklogStatusCategory = "new" | "indeterminate" | "done" | "other"

function identityValues(user?: JiraUser) {
  return [user?.accountId, user?.name, user?.key, user?.displayName, user?.emailAddress]
    .filter(Boolean).map((value) => String(value).trim().toLowerCase())
}

export function issueBelongsToUser(issue: JiraLiveIssue, user?: JiraUser) {
  if (!user) return true
  const identities = identityValues(user)
  const issueValues = [issue.assigneeId, issue.assignee].filter(Boolean).map((value) => String(value).trim().toLowerCase())
  return identities.some((value) => issueValues.includes(value))
}

export function worklogStatusCategory(issue: JiraLiveIssue): WorklogStatusCategory {
  const raw = String(issue.statusCategory ?? "").trim().toLowerCase()
  if (raw === "done" || raw.includes("complete")) return "done"
  if (raw === "indeterminate" || raw.includes("progress")) return "indeterminate"
  if (raw === "new" || raw.includes("todo") || raw.includes("to do")) return "new"
  const status = String(issue.status ?? "").trim().toLowerCase()
  if (/done|closed|resolved|complete/.test(status)) return "done"
  if (/progress|doing|develop|review|qa|test/.test(status)) return "indeterminate"
  if (/to do|todo|open|backlog|new/.test(status)) return "new"
  return "other"
}

export function isSameLocalDay(value: string | undefined, date = new Date()) {
  if (!value) return false
  const direct = /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1]
  const expected = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  if (direct) return direct === expected
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return false
  return parsed.getFullYear() === date.getFullYear() && parsed.getMonth() === date.getMonth() && parsed.getDate() === date.getDate()
}

function candidateScore(issue: JiraLiveIssue, logged: number, date: Date) {
  const category = worklogStatusCategory(issue)
  const updatedToday = isSameLocalDay(issue.updated, date)
  const doneToday = category === "done" && isSameLocalDay(issue.resolutionDate ?? issue.updated, date)
  const hasTodaySignal = logged > 0 || updatedToday || doneToday
  if (!hasTodaySignal) return -1
  if (category === "new" && !logged && !updatedToday) return -1
  let score = 0
  if (logged > 0) score += 120
  if (doneToday) score += 85
  if (updatedToday) score += 60
  if (category === "indeterminate" && updatedToday) score += 30
  if (category === "other" && updatedToday) score += 15
  if ((issue.originalEstimateSeconds ?? issue.remainingEstimateSeconds ?? 0) > 0) score += 3
  return score
}

export function buildDailyCandidateIssues(issues: JiraLiveIssue[], user?: JiraUser, loggedMinutesByIssue: Record<string, number> = {}, date = new Date(), limit = 8) {
  return issues
    .filter((issue) => issueBelongsToUser(issue, user))
    .map((issue) => ({ issue, score: candidateScore(issue, loggedMinutesByIssue[issue.key] ?? 0, date) }))
    .filter((item) => item.score >= 40)
    .sort((a, b) => b.score - a.score || String(b.issue.updated ?? "").localeCompare(String(a.issue.updated ?? "")) || a.issue.key.localeCompare(b.issue.key))
    .slice(0, Math.max(1, limit))
    .map((item) => item.issue)
}

export function sortWorklogIssues(issues: JiraLiveIssue[]) {
  const rank: Record<WorklogStatusCategory, number> = { indeterminate: 0, done: 1, other: 2, new: 3 }
  return [...issues].sort((a, b) => {
    const category = rank[worklogStatusCategory(a)] - rank[worklogStatusCategory(b)]
    if (category) return category
    const updated = String(b.updated ?? "").localeCompare(String(a.updated ?? ""))
    return updated || a.key.localeCompare(b.key)
  })
}
