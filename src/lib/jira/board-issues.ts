import type { JiraLiveIssue, JiraIssueSearchResult, JiraSprint } from "@/types"
import { sendJiraRequest } from "./request"

type AgileIssueBean = {
  id?: string
  key?: string
  fields?: {
    summary?: string
    issuetype?: { name?: string }
    priority?: { name?: string }
    status?: { id?: string; name?: string; statusCategory?: { key?: string; name?: string } }
    assignee?: { name?: string; key?: string; displayName?: string; avatarUrls?: Record<string, string> }
    labels?: string[]
    timeoriginalestimate?: number
    timeestimate?: number
    updated?: string
    resolutiondate?: string
    [key: string]: unknown
  }
}

function mapLiveIssue(issue: AgileIssueBean, placement: "sprint" | "backlog", sprint?: JiraSprint, storyPointsFieldId?: string): JiraLiveIssue | null {
  if (!issue.key || !issue.id) return null
  const rawStoryPoints = storyPointsFieldId ? issue.fields?.[storyPointsFieldId] : undefined
  const storyPoints = typeof rawStoryPoints === "number" && Number.isFinite(rawStoryPoints) ? rawStoryPoints : undefined
  return {
    id: issue.id,
    key: issue.key,
    summary: issue.fields?.summary ?? issue.key,
    type: issue.fields?.issuetype?.name ?? "Task",
    priority: issue.fields?.priority?.name,
    status: issue.fields?.status?.name,
    statusId: issue.fields?.status?.id,
    statusCategory: issue.fields?.status?.statusCategory?.key ?? issue.fields?.status?.statusCategory?.name,
    updated: issue.fields?.updated,
    resolutionDate: issue.fields?.resolutiondate,
    assignee: issue.fields?.assignee?.displayName ?? issue.fields?.assignee?.name ?? issue.fields?.assignee?.key,
    assigneeId: issue.fields?.assignee?.name ?? issue.fields?.assignee?.key,
    avatarUrl: issue.fields?.assignee?.avatarUrls?.["32x32"] ?? issue.fields?.assignee?.avatarUrls?.["24x24"] ?? issue.fields?.assignee?.avatarUrls?.["48x48"],
    labels: Array.isArray(issue.fields?.labels) ? issue.fields.labels.filter((label): label is string => typeof label === "string") : [],
    sprintId: sprint?.id,
    sprintName: sprint?.name,
    placement,
    originalEstimateSeconds: typeof issue.fields?.timeoriginalestimate === "number" ? issue.fields.timeoriginalestimate : undefined,
    remainingEstimateSeconds: typeof issue.fields?.timeestimate === "number" ? issue.fields.timeestimate : undefined,
    storyPoints,
  }
}

async function getAgileIssuePage(path: string, storyPointsFieldId?: string) {
  const issues: AgileIssueBean[] = []
  let startAt = 0
  const maxResults = 50
  while (true) {
    const separator = path.includes("?") ? "&" : "?"
    const fields = ["summary", "issuetype", "priority", "status", "assignee", "labels", "timeoriginalestimate", "timeestimate", "updated", "resolutiondate", ...(storyPointsFieldId ? [storyPointsFieldId] : [])]
    const page = await sendJiraRequest<{ issues?: AgileIssueBean[]; total?: number }>(`${path}${separator}startAt=${startAt}&maxResults=${maxResults}&fields=${encodeURIComponent(fields.join(","))}`)
    const batch = Array.isArray(page?.issues) ? page.issues : []
    issues.push(...batch)
    if (!batch.length || issues.length >= (page?.total ?? issues.length) || batch.length < maxResults) break
    startAt += batch.length
    if (startAt >= 500) break
  }
  return issues
}

export async function getLiveBoardIssues(boardId: number, sprints: JiraSprint[], storyPointsFieldId?: string) {
  if (!Number.isInteger(boardId) || boardId <= 0) return []
  const liveSprints = sprints.filter((sprint) => sprint.state === "active" || sprint.state === "future")
  const groups = await Promise.all([
    (async () => {
      const issues = await getAgileIssuePage(`/rest/agile/1.0/board/${encodeURIComponent(String(boardId))}/backlog`, storyPointsFieldId)
      return issues.map((issue) => mapLiveIssue(issue, "backlog", undefined, storyPointsFieldId)).filter((item): item is JiraLiveIssue => Boolean(item))
    })(),
    ...liveSprints.map(async (sprint) => {
      const issues = await getAgileIssuePage(`/rest/agile/1.0/sprint/${encodeURIComponent(String(sprint.id))}/issue`, storyPointsFieldId)
      return issues.map((issue) => mapLiveIssue(issue, "sprint", sprint, storyPointsFieldId)).filter((item): item is JiraLiveIssue => Boolean(item))
    }),
  ])
  const byKey = new Map<string, JiraLiveIssue>()
  for (const issue of groups.flat()) byKey.set(issue.key, issue)
  return Array.from(byKey.values())
}

export async function searchRecentProjectIssues(projectKey: string, maxResults = 100): Promise<JiraIssueSearchResult[]> {
  const safeLimit = Math.max(1, Math.min(200, Math.trunc(maxResults)))
  const safeProject = projectKey.replace(/[^A-Za-z0-9_-]/g, "")
  if (!safeProject) return []
  const jql = `project = "${safeProject}" ORDER BY updated DESC`
  const fields = ["summary", "issuetype", "priority", "status", "assignee", "labels"].join(",")
  const page = await sendJiraRequest<{ issues?: AgileIssueBean[] }>(`/rest/api/2/search?jql=${encodeURIComponent(jql)}&startAt=0&maxResults=${safeLimit}&fields=${encodeURIComponent(fields)}`)
  const issues = Array.isArray(page?.issues) ? page.issues : []
  return issues.flatMap((issue): JiraIssueSearchResult[] => {
    if (!issue.id || !issue.key) return []
    return [{
      id: issue.id, key: issue.key, summary: issue.fields?.summary ?? issue.key,
      type: issue.fields?.issuetype?.name, priority: issue.fields?.priority?.name, status: issue.fields?.status?.name,
      assignee: issue.fields?.assignee?.displayName ?? issue.fields?.assignee?.name ?? issue.fields?.assignee?.key,
      assigneeId: issue.fields?.assignee?.name ?? issue.fields?.assignee?.key,
      avatarUrl: issue.fields?.assignee?.avatarUrls?.["32x32"] ?? issue.fields?.assignee?.avatarUrls?.["24x24"] ?? issue.fields?.assignee?.avatarUrls?.["48x48"],
      labels: Array.isArray(issue.fields?.labels) ? issue.fields.labels.filter((label): label is string => typeof label === "string") : [],
    }]
  })
}
