import type { BulkIssue, BulkPayload, JiraUser } from "@/types"

export function effectivePriority(issue: BulkIssue, payload?: BulkPayload) {
  return issue.priority ?? payload?.defaults?.priority
}

export function effectiveEstimate(issue: BulkIssue, payload?: BulkPayload) {
  return issue.estimate ?? payload?.defaults?.estimate
}

export function effectiveSprint(issue: BulkIssue, payload?: BulkPayload) {
  return issue.sprint !== undefined ? issue.sprint : payload?.defaults?.sprint
}

export function effectiveAssignee(issue: BulkIssue, payload?: BulkPayload) {
  return issue.assignee ?? payload?.defaults?.assignee
}

export function effectiveLabels(issue: BulkIssue, payload?: BulkPayload) {
  return Array.from(new Set([...(payload?.defaults?.labels ?? []), ...(issue.labels ?? [])].map((label) => label.trim()).filter(Boolean)))
}

function identities(user: JiraUser) {
  return [user.name, user.key, user.accountId, user.displayName, user.emailAddress]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim().toLowerCase())
}

export function findAssigneeUser(users: JiraUser[], identity?: string) {
  const normalized = identity?.trim().toLowerCase()
  if (!normalized) return undefined
  return users.find((user) => identities(user).includes(normalized))
}

export function assigneePresentation(issue: BulkIssue, payload: BulkPayload | undefined, users: JiraUser[]) {
  const identity = effectiveAssignee(issue, payload)
  const user = findAssigneeUser(users, identity)
  const inherited = issue.assignee === undefined && Boolean(payload?.defaults?.assignee)
  return {
    identity,
    inherited,
    user,
    label: user?.displayName || identity,
    avatarUrl: user?.avatarUrls?.["32x32"] ?? user?.avatarUrls?.["24x24"] ?? user?.avatarUrls?.["48x48"],
  }
}
