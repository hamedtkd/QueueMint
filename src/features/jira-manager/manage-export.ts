import type { JiraLiveIssue } from "@/types"

export function buildManageJiraAiPackage(issues: JiraLiveIssue[], projectKey?: string, boardId?: number | null) {
  return {
    schema: "queuemint-jira-issues-v1",
    exportedAt: new Date().toISOString(),
    projectKey,
    boardId,
    issues: issues.map((issue) => ({
      issueKey: issue.key,
      summary: issue.summary,
      type: issue.type,
      priority: issue.priority,
      status: issue.status,
      assignee: issue.assignee,
      labels: issue.labels,
      sprint: issue.sprintName ?? (issue.placement === "backlog" ? "Backlog" : undefined),
      originalEstimateSeconds: issue.originalEstimateSeconds,
      remainingEstimateSeconds: issue.remainingEstimateSeconds,
      storyPoints: issue.storyPoints,
      updated: issue.updated,
    })),
  }
}
