import type { JiraLiveIssue, WorklogDraftEntry } from "@/types"

export function formatWorklogMinutes(totalMinutes: number) {
  const safe = Math.max(0, Math.round(totalMinutes))
  const hours = Math.floor(safe / 60)
  const minutes = safe % 60
  if (!hours) return `${minutes}m`
  if (!minutes) return `${hours}h`
  return `${hours}h ${minutes}m`
}

export function parseWorklogDuration(value: string) {
  const input = value.trim().toLowerCase()
  if (!input) return null
  if (/^\d+$/.test(input)) return Number(input)
  const hours = /(?:^|\s)(\d+(?:\.\d+)?)\s*h\b/.exec(input)
  const minutes = /(?:^|\s)(\d+)\s*m\b/.exec(input)
  if (!hours && !minutes) return null
  const total = Math.round((hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0))
  return Number.isFinite(total) && total > 0 ? total : null
}

function distributeInteger(total: number, weights: number[]) {
  const safeTotal = Math.max(0, Math.round(total))
  if (!weights.length || !safeTotal) return weights.map(() => 0)
  const sum = weights.reduce((acc, value) => acc + Math.max(0, value), 0)
  const normalized = sum > 0 ? weights.map((value) => Math.max(0, value) / sum) : weights.map(() => 1 / weights.length)
  const raw = normalized.map((weight) => weight * safeTotal)
  const base = raw.map(Math.floor)
  let remaining = safeTotal - base.reduce((acc, value) => acc + value, 0)
  const order = raw.map((value, index) => ({ index, fraction: value - base[index] })).sort((a, b) => b.fraction - a.fraction)
  for (let index = 0; index < remaining; index += 1) base[order[index % order.length].index] += 1
  return base
}


export function worklogStartedAtForDate(date: Date, now = new Date()) {
  const started = new Date(date)
  const sameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
  if (sameDay) started.setHours(now.getHours(), now.getMinutes(), Math.min(now.getSeconds(), 59), 0)
  else started.setHours(12, 0, 0, 0)
  return started
}

export function buildManualWorklogDraft(issues: JiraLiveIssue[], current: WorklogDraftEntry[] = []) {
  const existing = new Map(current.map((entry) => [entry.issueKey, entry]))
  return issues.map((issue) => existing.get(issue.key) ?? { issueKey: issue.key, summary: issue.summary, minutes: 0, comment: "" })
}

export function buildWorklogDraft(issues: JiraLiveIssue[], totalMinutes: number, strategy: "equal" | "estimate"): WorklogDraftEntry[] {
  const weights = strategy === "estimate"
    ? issues.map((issue) => Math.max(0, issue.originalEstimateSeconds ?? issue.remainingEstimateSeconds ?? 0))
    : issues.map(() => 1)
  const minutes = distributeInteger(totalMinutes, weights)
  return issues.map((issue, index) => ({ issueKey: issue.key, summary: issue.summary, minutes: minutes[index], comment: "" })).filter((entry) => entry.minutes > 0)
}

export function normalizeWorklogDraft(entries: WorklogDraftEntry[], targetMinutes: number) {
  const allowed = entries.filter((entry) => entry.minutes > 0)
  if (!allowed.length) return []
  const total = allowed.reduce((acc, entry) => acc + entry.minutes, 0)
  if (total === targetMinutes) return allowed
  const minutes = distributeInteger(targetMinutes, allowed.map((entry) => entry.minutes))
  return allowed.map((entry, index) => ({ ...entry, minutes: minutes[index] })).filter((entry) => entry.minutes > 0)
}
