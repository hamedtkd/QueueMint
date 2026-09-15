import type { FieldMap } from "./bulk"

export interface JiraProject {
  id: string
  key: string
  name: string
  issueTypes?: Array<{
    id: string
    name: string
    subtask?: boolean
  }>
  components?: Array<{ id: string; name: string }>
  versions?: Array<{ id: string; name: string; released?: boolean; archived?: boolean }>
}

export interface JiraField {
  id: string
  name: string
  custom?: boolean
  schema?: {
    type?: string
    items?: string
    system?: string
    custom?: string
    customId?: number
  }
}

export type JiraEditAllowedValue = string | number | boolean | null | Record<string, unknown>

export interface JiraEditableField {
  id: string
  name: string
  required: boolean
  schema?: JiraField["schema"]
  operations: string[]
  allowedValues: JiraEditAllowedValue[]
  availableOn: number
  representativeCount: number
}

export interface JiraIssueFieldSnapshot {
  key: string
  fields: Record<string, unknown>
}

export interface JiraUser {
  accountId?: string
  name?: string
  key?: string
  displayName?: string
  emailAddress?: string
  active?: boolean
  avatarUrls?: Record<string, string>
}

export interface JiraServerInfo {
  version?: string
  deploymentType?: string
  serverTitle?: string
  baseUrl?: string
}

export interface JiraPriority {
  id: string
  name: string
  iconUrl?: string
  statusColor?: string
}

export interface JiraBoard {
  id: number
  name: string
  type: string
  self?: string
}

export interface JiraBoardColumn {
  id: string
  name: string
  statusIds: string[]
}

export interface JiraEpic {
  id: number
  key: string
  name?: string
  summary?: string
  done?: boolean
  color?: { key?: string }
  self?: string
}

export interface JiraSprint {
  id: number
  name: string
  state: "active" | "future" | "closed" | string
  originBoardId?: number
  startDate?: string
  endDate?: string
  goal?: string
}

export interface JiraRequestResponse<T = unknown> {
  ok: boolean
  status?: number
  data?: T
  error?: {
    code: string
    message: string
  }
}

export interface JiraEstimationCapabilities {
  storyPointsFieldId?: string
  storyPointsFieldName?: string
  timeTracking: boolean
}

export interface JiraMetadata {
  connected: boolean
  user?: JiraUser
  server?: JiraServerInfo
  projects: JiraProject[]
  fields: JiraField[]
  priorities: JiraPriority[]
  detectedFieldMap: FieldMap
  estimation: JiraEstimationCapabilities
}

export interface JiraPage<T> {
  values: T[]
  startAt?: number
  maxResults?: number
  total?: number
  isLast?: boolean
}
