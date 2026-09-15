export type IssueTypeName = string
export interface BulkDefaults {
  priority?: string
  sprint?: number | null
  labels?: string[]
  components?: string[]
  fixVersions?: string[]
  assignee?: string
  estimate?: string
}

export interface BulkIssue {
  ref?: string
  type: IssueTypeName
  summary: string
  description?: string
  priority?: string
  sprint?: number | null
  labels?: string[]
  components?: string[]
  fixVersions?: string[]
  assignee?: string
  epic?: string
  epicName?: string
  estimate?: string
  worklog?: { minutes: number; comment?: string; started?: string }
  fields?: Record<string, unknown>
}

export interface FieldMap {
  epicLink?: string
  epicName?: string
}

export interface BulkPayload {
  project: string
  defaults?: BulkDefaults
  fieldMap?: FieldMap
  issues: BulkIssue[]
}

export interface ValidationIssue {
  level: "error" | "warning"
  message: string
  issueIndex?: number
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
}

export interface CreateResultItem {
  index: number
  ref?: string
  summary: string
  type: string
  ok: boolean
  key?: string
  id?: string
  self?: string
  error?: string
  sprintId?: number | null
  sprintAssigned?: boolean
  sprintError?: string
  attachmentCount?: number
  attachmentError?: string
  estimateAssigned?: boolean
  estimateError?: string
  worklogAssigned?: boolean
  worklogError?: string
  worklogMinutes?: number
  worklogComment?: string
  worklogStarted?: string
}

export interface CreateRunResult {
  startedAt: string
  finishedAt: string
  project: string
  results: CreateResultItem[]
}
