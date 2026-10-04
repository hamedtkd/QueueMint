import type { JiraLiveIssue } from "@/types"

export type ManageSort = "updated-desc" | "updated-asc" | "key-asc" | "key-desc"

function updatedMillis(issue: JiraLiveIssue) {
  const value = issue.updated ? Date.parse(issue.updated) : Number.NaN
  return Number.isFinite(value) ? value : 0
}

export function issueKeyNumber(key: string) {
  const match = /^(.*?)-(\d+)$/.exec(key.trim())
  return match ? { prefix: match[1].toUpperCase(), number: Number(match[2]) } : null
}

function compareIssueKeys(a: JiraLiveIssue, b: JiraLiveIssue) {
  const aKey = issueKeyNumber(a.key)
  const bKey = issueKeyNumber(b.key)
  if (aKey && bKey) {
    const prefix = aKey.prefix.localeCompare(bKey.prefix)
    if (prefix) return prefix
    const numeric = aKey.number - bKey.number
    if (numeric) return numeric
  } else if (aKey || bKey) {
    return aKey ? -1 : 1
  }
  return a.key.localeCompare(b.key, undefined, { numeric: true, sensitivity: "base" })
}

export function sortManageIssues(source: JiraLiveIssue[], sort: ManageSort) {
  return [...source].sort((a, b) => {
    if (sort === "key-asc") return compareIssueKeys(a, b)
    if (sort === "key-desc") return compareIssueKeys(b, a)
    const updated = updatedMillis(a) - updatedMillis(b)
    if (updated) return sort === "updated-asc" ? updated : -updated
    return compareIssueKeys(a, b)
  })
}
