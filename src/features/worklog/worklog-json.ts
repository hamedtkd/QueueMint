import type { JiraLiveIssue, WorklogDraftEntry } from "@/types"
const ISSUE_KEY = /^[A-Z][A-Z0-9_]*-\d+$/i

export function buildWorklogAiPackage(
  issues: JiraLiveIssue[],
  dailyTargetMinutes: number,
  alreadyLoggedMinutes: number,
  requestedDraftMinutes: number,
  note: string,
  loggedMinutesByIssue: Record<string, number>,
  selectedDate = new Date(),
) {
  const date = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
  return {
    schema: "queuemint-worklog-v1",
    date,
    goal: "Suggest Jira worklogs only for work actually performed. Do not invent completed work.",
    dailyTargetMinutes,
    alreadyLoggedMinutes,
    remainingDailyMinutes: Math.max(0, dailyTargetMinutes - alreadyLoggedMinutes),
    requestedDraftMinutes,
    userNote: note.trim(),
    issues: issues.map((issue) => ({
      issueKey: issue.key,
      summary: issue.summary,
      status: issue.status,
      statusCategory: issue.statusCategory,
      sprint: issue.sprintName ?? (issue.placement === "backlog" ? "Backlog" : undefined),
      assignee: issue.assignee,
      estimateMinutes: Math.round((issue.originalEstimateSeconds ?? issue.remainingEstimateSeconds ?? 0) / 60) || undefined,
      storyPoints: issue.storyPoints,
      alreadyLoggedTodayMinutes: loggedMinutesByIssue[issue.key] ?? 0,
    })),
    output: {
      instruction: "Return JSON only. Use positive whole minutes. Use only issue keys from the supplied issues.",
      example: { worklogs: [{ issueKey: issues[0]?.key ?? "ABC-123", minutes: 60, comment: "Short factual worklog comment" }] },
    },
  }
}

function durationTextMinutes(value: string) {
  const input = value.trim().toLowerCase()
  if (/^\d+$/.test(input)) return Number(input)
  const hours = /(?:^|\s)(\d+(?:\.\d+)?)\s*h\b/.exec(input)
  const minutes = /(?:^|\s)(\d+)\s*m\b/.exec(input)
  if (!hours && !minutes) return null
  const total = Math.round((hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0))
  return Number.isFinite(total) && total > 0 ? total : null
}

function minutesFrom(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value)
  if (typeof value === "string") return durationTextMinutes(value)
  return null
}

export function parseWorklogJson(text: string, issues: JiraLiveIssue[]): WorklogDraftEntry[] {
  const parsed = JSON.parse(text) as unknown
  const root = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}
  const rows = Array.isArray(parsed) ? parsed : Array.isArray(root.worklogs) ? root.worklogs : Array.isArray(root.assignments) ? root.assignments : null
  if (!rows) throw new Error("Expected an array, worklogs[], or assignments[].")
  const issueMap = new Map(issues.map((issue) => [issue.key.toUpperCase(), issue]))
  const merged = new Map<string, WorklogDraftEntry>()
  for (const raw of rows) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue
    const item = raw as Record<string, unknown>
    const issueKey = String(item.issueKey ?? item.key ?? "").trim().toUpperCase()
    if (!ISSUE_KEY.test(issueKey)) continue
    const minutes = minutesFrom(item.minutes ?? item.timeMinutes ?? item.timeSpentMinutes ?? item.timeSpent)
    if (!minutes || minutes <= 0 || minutes > 1440) continue
    const issue = issueMap.get(issueKey)
    const comment = String(item.comment ?? "").trim().slice(0, 4000)
    const existing = merged.get(issueKey)
    merged.set(issueKey, existing
      ? { ...existing, minutes: existing.minutes + minutes, comment: [existing.comment, comment].filter(Boolean).join(" | ").slice(0, 4000) }
      : { issueKey, summary: issue?.summary ?? String(item.summary ?? issueKey), minutes, comment })
  }
  const result = Array.from(merged.values()).filter((item) => item.minutes > 0 && item.minutes <= 1440)
  if (!result.length) throw new Error("No valid Jira worklog rows were found in the JSON.")
  return result
}
