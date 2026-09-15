import type { BulkPayload, JiraMetadata, JiraProject, JiraSprint, ValidationIssue, ValidationResult } from "@/types"

const FIELD_ID_PATTERN = /^(customfield_\d+|[a-zA-Z][a-zA-Z0-9_]*)$/
const JIRA_ISSUE_KEY_PATTERN = /^[A-Z][A-Z0-9_]*-\d+$/i

export function parseBulkJson(text: string): { payload?: BulkPayload; error?: string } {
  try {
    const value = JSON.parse(text) as unknown
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { error: "Top-level JSON must be an object." }
    }
    return { payload: value as BulkPayload }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid JSON." }
  }
}


export function isValidJiraEstimate(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  const tokens = trimmed.match(/\d+\s*[wdhm]/gi)
  if (!tokens?.length || !tokens.some((token) => Number.parseInt(token, 10) > 0)) return false
  return tokens.join("").replace(/\s+/g, "").toLowerCase() === trimmed.replace(/\s+/g, "").toLowerCase()
}

function validSprintValue(value: unknown) {
  return value === undefined || value === null || (typeof value === "number" && Number.isInteger(value) && value > 0)
}

export function validatePayload(
  payload: BulkPayload,
  metadata?: JiraMetadata,
  project?: JiraProject,
  sprints?: JiraSprint[],
): ValidationResult {
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []

  if (!payload.project || typeof payload.project !== "string") errors.push({ level: "error", message: "project is required." })

  if (!Array.isArray(payload.issues) || payload.issues.length === 0) {
    errors.push({ level: "error", message: "issues must be a non-empty array." })
    return { valid: false, errors, warnings }
  }

  if (!validSprintValue(payload.defaults?.sprint)) {
    errors.push({ level: "error", message: "defaults.sprint must be a positive sprint id or null." })
  }

  if (payload.defaults?.priority && metadata?.priorities?.length) {
    const priorities = new Set(metadata.priorities.map((item) => item.name.toLowerCase()))
    if (!priorities.has(payload.defaults.priority.toLowerCase())) {
      errors.push({ level: "error", message: `Unknown default priority '${payload.defaults.priority}'.` })
    }
  }

  if (payload.defaults?.estimate !== undefined && (typeof payload.defaults.estimate !== "string" || !isValidJiraEstimate(payload.defaults.estimate))) {
    errors.push({ level: "error", message: "defaults.estimate must use Jira duration format such as 3h, 2d, 30m, or 1d 4h." })
  }

  if (payload.defaults?.assignee !== undefined && typeof payload.defaults.assignee !== "string") {
    errors.push({ level: "error", message: "defaults.assignee must be a Jira username/key string." })
  }
  if (payload.defaults?.labels !== undefined && (!Array.isArray(payload.defaults.labels) || payload.defaults.labels.some((label) => typeof label !== "string"))) {
    errors.push({ level: "error", message: "defaults.labels must be an array of strings." })
  }
  if (payload.defaults?.components !== undefined && (!Array.isArray(payload.defaults.components) || payload.defaults.components.some((value) => typeof value !== "string"))) {
    errors.push({ level: "error", message: "defaults.components must be an array of strings." })
  }
  if (payload.defaults?.fixVersions !== undefined && (!Array.isArray(payload.defaults.fixVersions) || payload.defaults.fixVersions.some((value) => typeof value !== "string"))) {
    errors.push({ level: "error", message: "defaults.fixVersions must be an array of strings." })
  }

  const estimatesRequested = Boolean(payload.defaults?.estimate) || payload.issues.some((issue) => Boolean(issue && typeof issue === "object" && !Array.isArray(issue) && issue.estimate))
  if (estimatesRequested && metadata && !metadata.estimation.timeTracking) {
    errors.push({ level: "error", message: "This Jira connection did not expose time tracking, so time estimates cannot be applied." })
  }

  const refs = new Set<string>()
  const epicRefs = new Set<string>()

  payload.issues.forEach((issue, index) => {
    if (!issue || typeof issue !== "object") {
      errors.push({ level: "error", message: "Issue must be an object.", issueIndex: index })
      return
    }

    if (typeof issue.type !== "string" || !issue.type.trim()) errors.push({ level: "error", message: "type must be a non-empty string.", issueIndex: index })
    if (typeof issue.summary !== "string" || !issue.summary.trim()) errors.push({ level: "error", message: "summary must be a non-empty string.", issueIndex: index })
    if (typeof issue.summary === "string" && issue.summary.length > 255) errors.push({ level: "error", message: "summary must be 255 characters or fewer.", issueIndex: index })

    if (issue.description !== undefined && typeof issue.description !== "string") errors.push({ level: "error", message: "description must be a string.", issueIndex: index })
    if (issue.assignee !== undefined && typeof issue.assignee !== "string") errors.push({ level: "error", message: "assignee must be a Jira username/key string.", issueIndex: index })
    if (issue.estimate !== undefined && (typeof issue.estimate !== "string" || !isValidJiraEstimate(issue.estimate))) errors.push({ level: "error", message: "estimate must use Jira duration format such as 3h, 2d, 30m, or 1d 4h.", issueIndex: index })
    if (issue.worklog !== undefined) {
      if (!issue.worklog || typeof issue.worklog !== "object" || Array.isArray(issue.worklog)) errors.push({ level: "error", message: "worklog must be an object.", issueIndex: index })
      else {
        if (!Number.isInteger(issue.worklog.minutes) || issue.worklog.minutes <= 0 || issue.worklog.minutes > 1440) errors.push({ level: "error", message: "worklog.minutes must be an integer between 1 and 1440.", issueIndex: index })
        if (issue.worklog.comment !== undefined && typeof issue.worklog.comment !== "string") errors.push({ level: "error", message: "worklog.comment must be a string.", issueIndex: index })
        if (issue.worklog.started !== undefined && (typeof issue.worklog.started !== "string" || Number.isNaN(new Date(issue.worklog.started).getTime()))) errors.push({ level: "error", message: "worklog.started must be a valid date/time string.", issueIndex: index })
      }
    }
    if (issue.labels !== undefined && (!Array.isArray(issue.labels) || issue.labels.some((label) => typeof label !== "string"))) errors.push({ level: "error", message: "labels must be an array of strings.", issueIndex: index })
    if (issue.components !== undefined && (!Array.isArray(issue.components) || issue.components.some((value) => typeof value !== "string"))) errors.push({ level: "error", message: "components must be an array of strings.", issueIndex: index })
    if (issue.fixVersions !== undefined && (!Array.isArray(issue.fixVersions) || issue.fixVersions.some((value) => typeof value !== "string"))) errors.push({ level: "error", message: "fixVersions must be an array of strings.", issueIndex: index })

    if (!validSprintValue(issue.sprint)) errors.push({ level: "error", message: "sprint must be a positive sprint id, null, or omitted.", issueIndex: index })
    if (issue.type?.toLowerCase() === "epic" && issue.sprint !== undefined) {
      warnings.push({ level: "warning", message: "Sprint is ignored for Epic issues.", issueIndex: index })
    }

    if (issue.priority && metadata?.priorities?.length) {
      const priorities = new Set(metadata.priorities.map((item) => item.name.toLowerCase()))
      if (!priorities.has(issue.priority.toLowerCase())) errors.push({ level: "error", message: `Unknown priority '${issue.priority}'.`, issueIndex: index })
    }

    if (issue.ref) {
      if (refs.has(issue.ref)) errors.push({ level: "error", message: `Duplicate ref '${issue.ref}'.`, issueIndex: index })
      refs.add(issue.ref)
      if (typeof issue.type === "string" && issue.type.toLowerCase() === "epic") epicRefs.add(issue.ref)
    }

    if (issue.fields && (typeof issue.fields !== "object" || Array.isArray(issue.fields))) {
      errors.push({ level: "error", message: "fields must be an object of Jira field ids to values.", issueIndex: index })
    } else if (issue.fields) {
      for (const fieldId of Object.keys(issue.fields)) {
        if (!FIELD_ID_PATTERN.test(fieldId) || ["__proto__", "prototype", "constructor"].includes(fieldId)) {
          errors.push({ level: "error", message: `Invalid custom field key '${fieldId}'.`, issueIndex: index })
        }
      }
    }
  })

  payload.issues.forEach((issue, index) => {
    if (!issue || typeof issue !== "object" || Array.isArray(issue)) return
    if (typeof issue.epic === "string" && issue.epic && !epicRefs.has(issue.epic) && !JIRA_ISSUE_KEY_PATTERN.test(issue.epic)) {
      errors.push({ level: "error", message: `Unknown epic ref '${issue.epic}'. Use a batch Epic ref or an existing Jira Epic key.`, issueIndex: index })
    } else if (issue.epic !== undefined && typeof issue.epic !== "string") {
      errors.push({ level: "error", message: "epic must be a string ref.", issueIndex: index })
    }
  })

  const safePayloadFieldMap = payload.fieldMap && typeof payload.fieldMap === "object" && !Array.isArray(payload.fieldMap) ? payload.fieldMap : {}
  const fieldMap = { ...(metadata?.detectedFieldMap ?? {}), ...safePayloadFieldMap }
  for (const [name, value] of Object.entries(fieldMap)) {
    if (value !== undefined && (typeof value !== "string" || !FIELD_ID_PATTERN.test(value))) {
      errors.push({ level: "error", message: `fieldMap.${name} has an invalid Jira field id.` })
    }
  }

  if (payload.issues.some((issue) => Boolean(issue && typeof issue === "object" && !Array.isArray(issue) && issue.epic)) && !fieldMap.epicLink) {
    errors.push({ level: "error", message: "At least one issue references an epic, but the Jira Epic Link field was not detected. Add fieldMap.epicLink." })
  }

  if (metadata && payload.project && !metadata.projects.some((candidate) => candidate.key === payload.project)) {
    errors.push({ level: "error", message: `Project '${payload.project}' was not returned by Jira for the current user.` })
  }

  if (project?.issueTypes?.length) {
    const allowed = new Set(project.issueTypes.filter((type) => !type.subtask).map((type) => type.name.toLowerCase()))
    payload.issues.forEach((issue, index) => {
      if (typeof issue.type === "string" && issue.type && !allowed.has(issue.type.toLowerCase())) {
        errors.push({ level: "error", message: `Issue type '${issue.type}' is not available in project ${project.key}.`, issueIndex: index })
      }
    })
  }

  const requestedSprintIds = new Set<number>()
  if (typeof payload.defaults?.sprint === "number") requestedSprintIds.add(payload.defaults.sprint)
  payload.issues.forEach((issue) => {
    if (typeof issue?.sprint === "number") requestedSprintIds.add(issue.sprint)
  })

  if (requestedSprintIds.size) {
    if (sprints) {
      const allowedSprints = new Set(sprints.map((item) => item.id))
      for (const id of requestedSprintIds) {
        if (!allowedSprints.has(id)) errors.push({ level: "error", message: `Sprint ${id} is not an active/future sprint on the selected board.` })
      }
    } else {
      warnings.push({ level: "warning", message: "Sprint membership could not be pre-validated because board sprint metadata is unavailable." })
    }
  }

  if (payload.issues.length > 100) warnings.push({ level: "warning", message: "This batch has more than 100 issues. Consider smaller batches for easier recovery." })

  return { valid: errors.length === 0, errors, warnings }
}
