import type { JiraUser } from "./jira-core"

export interface JiraLiveIssue {
  id: string
  key: string
  summary: string
  type: string
  priority?: string
  status?: string
  statusId?: string
  statusCategory?: string
  updated?: string
  resolutionDate?: string
  assignee?: string
  assigneeId?: string
  avatarUrl?: string
  labels: string[]
  sprintId?: number
  sprintName?: string
  placement: "sprint" | "backlog"
  originalEstimateSeconds?: number
  remainingEstimateSeconds?: number
  storyPoints?: number
}

export interface JiraIssueComment {
  id: string
  body?: string
  created?: string
  updated?: string
  author?: JiraUser
}

export interface JiraIssueAttachment {
  id: string
  filename: string
  size?: number
  mimeType?: string
  content?: string
  thumbnail?: string
  author?: JiraUser
}

export interface JiraIssueSearchResult {
  id: string
  key: string
  summary: string
  type?: string
  priority?: string
  status?: string
  assignee?: string
  assigneeId?: string
  avatarUrl?: string
  labels: string[]
}

export interface JiraIssueDetails {
  id: string
  key: string
  summary: string
  description?: string
  type?: string
  priority?: string
  status?: string
  assignee?: JiraUser | null
  reporter?: JiraUser | null
  labels: string[]
  components: Array<{ id?: string; name: string }>
  fixVersions: Array<{ id?: string; name: string }>
  created?: string
  updated?: string
  dueDate?: string
  parent?: { key?: string; fields?: { summary?: string } } | null
  comments: JiraIssueComment[]
  attachments: JiraIssueAttachment[]
  originalEstimateSeconds?: number
  remainingEstimateSeconds?: number
  storyPoints?: number
}

export interface CloneIssueOptions {
  targetProjectKey: string
  issueType: string
  summary: string
}

export interface JiraBulkEditPatch {
  priority?: string
  assignee?: string | null
  issueType?: string
  epicLink?: { fieldId: string; value: string | null }
  labels?: string[]
  originalEstimate?: string
  remainingEstimate?: string
  storyPoints?: { fieldId: string; value: number | null }
  dynamicFields?: Record<string, unknown>
}

export interface JiraAttachmentUpload {
  name: string
  type: string
  base64: string
}
