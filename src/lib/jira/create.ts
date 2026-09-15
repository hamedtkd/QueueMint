import type { BulkIssue, BulkPayload, CreateResultItem, CreateRunResult, FieldMap } from "@/types"
import { applyOriginalEstimate } from "./estimation"
import { addJiraWorklog } from "./worklogs"
import { sendJiraRequest } from "./request"

function mergeArrays<T>(a?: T[], b?: T[]) { return Array.from(new Set([...(a ?? []), ...(b ?? [])])) }
function effectiveSprint(payload: BulkPayload, issue: BulkIssue): number | null | undefined { return issue.sprint !== undefined ? issue.sprint : payload.defaults?.sprint }
function effectiveEstimate(payload: BulkPayload, issue: BulkIssue): string | undefined {
  const estimate = issue.estimate ?? payload.defaults?.estimate
  return typeof estimate === "string" && estimate.trim() ? estimate.trim() : undefined
}

function buildIssueFields(payload: BulkPayload, issue: BulkIssue, fieldMap: FieldMap, epicKeys: Map<string, string>) {
  const defaults = payload.defaults ?? {}
  const fields: Record<string, unknown> = { project: { key: payload.project }, issuetype: { name: issue.type }, summary: issue.summary }
  if (issue.description) fields.description = issue.description
  const priority = issue.priority ?? defaults.priority
  if (priority) fields.priority = { name: priority }
  const labels = mergeArrays(defaults.labels, issue.labels); if (labels.length) fields.labels = labels
  const components = mergeArrays(defaults.components, issue.components); if (components.length) fields.components = components.map((name) => ({ name }))
  const fixVersions = mergeArrays(defaults.fixVersions, issue.fixVersions); if (fixVersions.length) fields.fixVersions = fixVersions.map((name) => ({ name }))
  const assignee = issue.assignee ?? defaults.assignee; if (assignee) fields.assignee = { name: assignee }
  if (issue.type.toLowerCase() === "epic" && fieldMap.epicName) fields[fieldMap.epicName] = issue.epicName ?? issue.summary
  if (issue.epic) {
    const directEpicKey = /^[A-Z][A-Z0-9_]*-\d+$/i.test(issue.epic) ? issue.epic.toUpperCase() : undefined
    const epicKey = epicKeys.get(issue.epic) ?? directEpicKey
    if (!epicKey) throw new Error(`Epic reference '${issue.epic}' has not been created and is not a Jira issue key.`)
    if (!fieldMap.epicLink) throw new Error("Epic Link field could not be detected. Configure fieldMap.epicLink with the Jira custom field id.")
    fields[fieldMap.epicLink] = epicKey
  }
  for (const [fieldId, value] of Object.entries(issue.fields ?? {})) {
    if (!/^(customfield_\d+|[a-zA-Z][a-zA-Z0-9_]*)$/.test(fieldId) || ["__proto__", "prototype", "constructor"].includes(fieldId)) continue
    fields[fieldId] = value
  }
  return fields
}

async function createOneIssue(fields: Record<string, unknown>) {
  return sendJiraRequest<{ id: string; key: string; self: string }>("/rest/api/2/issue", "POST", { fields })
}

export async function assignIssueKeysToSprint(sprintId: number, issueKeys: string[]) {
  if (!Number.isInteger(sprintId) || sprintId <= 0) throw new Error("Invalid sprint id.")
  for (let offset = 0; offset < issueKeys.length; offset += 50) await sendJiraRequest<unknown>(`/rest/agile/1.0/sprint/${encodeURIComponent(String(sprintId))}/issue`, "POST", { issues: issueKeys.slice(offset, offset + 50) })
}

export async function createIssues(payload: BulkPayload, detectedFieldMap: FieldMap, onProgress?: (completed: number, total: number, result?: CreateResultItem) => void, existingEpicKeys: Record<string, string> = {}, boardId?: number | null): Promise<CreateRunResult> {
  const startedAt = new Date().toISOString()
  const fieldMap = { ...detectedFieldMap, ...(payload.fieldMap ?? {}) }
  const epicKeys = new Map<string, string>(Object.entries(existingEpicKeys))
  const results: CreateResultItem[] = []
  const indexed = payload.issues.map((issue, index) => ({ issue, index }))
  const ordered = [...indexed.filter(({ issue }) => issue.type.toLowerCase() === "epic"), ...indexed.filter(({ issue }) => issue.type.toLowerCase() !== "epic")]
  for (const { issue, index } of ordered) {
    let result: CreateResultItem
    try {
      const created = await createOneIssue(buildIssueFields(payload, issue, fieldMap, epicKeys))
      if (issue.ref) epicKeys.set(issue.ref, created.key)
      result = { index, ref: issue.ref, summary: issue.summary, type: issue.type, ok: true, key: created.key, id: created.id, self: created.self, sprintId: issue.type.toLowerCase() === "epic" ? undefined : effectiveSprint(payload, issue) }
    } catch (error) {
      result = { index, ref: issue.ref, summary: issue.summary, type: issue.type, ok: false, error: error instanceof Error ? error.message : "Unknown Jira error" }
    }
    results.push(result); onProgress?.(results.length, ordered.length, result)
  }
  const estimateTargets = results.filter((result) => {
    if (!result.ok || !result.key) return false
    const issue = payload.issues[result.index]
    return Boolean(issue && issue.type.toLowerCase() !== "epic" && effectiveEstimate(payload, issue))
  })
  for (let offset = 0; offset < estimateTargets.length; offset += 6) {
    await Promise.all(estimateTargets.slice(offset, offset + 6).map(async (result) => {
      const issue = payload.issues[result.index]; const estimate = issue ? effectiveEstimate(payload, issue) : undefined
      if (!result.key || !estimate) return
      try { await applyOriginalEstimate(result.key, estimate, boardId); result.estimateAssigned = true }
      catch (error) { result.estimateAssigned = false; result.estimateError = error instanceof Error ? error.message : "Estimate update failed." }
    }))
  }
  const bySprint = new Map<number, CreateResultItem[]>()
  for (const result of results) {
    if (!result.ok || !result.key || typeof result.sprintId !== "number") continue
    const group = bySprint.get(result.sprintId) ?? []; group.push(result); bySprint.set(result.sprintId, group)
  }
  for (const [sprintId, group] of bySprint) {
    try { await assignIssueKeysToSprint(sprintId, group.map((item) => item.key as string)); group.forEach((item) => { item.sprintAssigned = true }) }
    catch (error) { const message = error instanceof Error ? error.message : "Sprint assignment failed."; group.forEach((item) => { item.sprintAssigned = false; item.sprintError = message }) }
  }
  const worklogTargets = results.filter((result) => result.ok && result.key && payload.issues[result.index]?.worklog)
  for (let offset = 0; offset < worklogTargets.length; offset += 4) {
    await Promise.all(worklogTargets.slice(offset, offset + 4).map(async (result) => {
      const config = payload.issues[result.index]?.worklog
      if (!result.key || !config) return
      result.worklogMinutes = config.minutes
      result.worklogComment = config.comment
      result.worklogStarted = config.started
      try {
        const started = config.started ? new Date(config.started) : new Date()
        await addJiraWorklog(result.key, config.minutes, config.comment ?? "", Number.isNaN(started.getTime()) ? new Date() : started)
        result.worklogAssigned = true
      } catch (error) { result.worklogAssigned = false; result.worklogError = error instanceof Error ? error.message : "Worklog failed." }
    }))
  }
  results.sort((a, b) => a.index - b.index)
  return { startedAt, finishedAt: new Date().toISOString(), project: payload.project, results }
}
