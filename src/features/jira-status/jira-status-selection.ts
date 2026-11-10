import type { JiraBoardColumn, JiraLiveIssue } from "@/types"

export function eligibleStatusMoveKeys(issues: JiraLiveIssue[], keys: readonly string[], target: Pick<JiraBoardColumn, "name" | "statusIds">) {
  const indexed = new Map(issues.map((issue) => [issue.key, issue]))
  return Array.from(new Set(keys)).filter((key) => {
    const issue = indexed.get(key)
    if (!issue) return false
    return target.statusIds.length
      ? !issue.statusId || !target.statusIds.includes(issue.statusId)
      : issue.status?.trim().toLowerCase() !== target.name.trim().toLowerCase()
  })
}

export function dragSelection(visibleIssues: JiraLiveIssue[], selected: Set<string>, draggedKey: string) {
  if (!selected.has(draggedKey)) return [draggedKey]
  const keys = visibleIssues.map((issue) => issue.key).filter((key) => selected.has(key))
  return keys.length ? keys : [draggedKey]
}

export function selectBoardIssue(order: readonly string[], current: Set<string>, issueKey: string, anchor: string | null, shift: boolean) {
  const next = new Set(current)
  const start = anchor ? order.indexOf(anchor) : -1
  const end = order.indexOf(issueKey)
  if (shift && start >= 0 && end >= 0) {
    for (let index = Math.min(start, end); index <= Math.max(start, end); index++) next.add(order[index])
  } else if (next.has(issueKey)) next.delete(issueKey)
  else next.add(issueKey)
  return next
}
