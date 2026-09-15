import type { JiraUser, JiraWorklog, WorklogApplyResult, WorklogDaySummary, WorklogDraftEntry } from "@/types"
import { sendJiraRequest } from "./request"

const ISSUE_KEY = /^[A-Z][A-Z0-9_]*-\d+$/i

type RawWorklog = {
  id?: string | number
  started?: string
  startDate?: string
  timeSpentSeconds?: number
  comment?: unknown
  author?: JiraUser
  worker?: string
  workerKey?: string
  issueKey?: string
  taskKey?: string
  originTaskId?: string
  issue?: { key?: string; id?: string | number }
}

type RawWorklogPage = { worklogs?: RawWorklog[]; total?: number; startAt?: number; maxResults?: number }
type SearchIssue = { key?: string; fields?: { worklog?: RawWorklogPage } }
type SearchPage = { issues?: SearchIssue[]; total?: number }

function safeIssueKey(value: string) {
  if (!ISSUE_KEY.test(value)) throw new Error(`Invalid Jira issue key: ${value}`)
  return value.toUpperCase()
}

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function worklogDateKey(value: string | undefined) {
  if (!value) return ""
  const direct = /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1]
  if (direct) return direct
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "" : localDateKey(parsed)
}

function jiraStarted(date: Date) {
  const pad = (value: number, size = 2) => String(Math.abs(value)).padStart(size, "0")
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? "+" : "-"
  const offsetHours = Math.floor(Math.abs(offset) / 60)
  const offsetMinutes = Math.abs(offset) % 60
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}${sign}${pad(offsetHours)}${pad(offsetMinutes)}`
}

function commentText(value: unknown) {
  if (typeof value === "string") return value
  if (!value || typeof value !== "object") return undefined
  const root = value as { content?: Array<{ content?: Array<{ text?: string }> }> }
  const text = (root.content ?? []).flatMap((block) => block.content ?? []).map((item) => item.text ?? "").join(" ").trim()
  return text || undefined
}

function normalizeIdentity(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase().replace(/\s+/g, " ")
}

function userIdentities(user?: JiraUser) {
  return [user?.accountId, user?.key, user?.name, user?.emailAddress, user?.displayName].map(normalizeIdentity).filter(Boolean)
}

function sameUser(author: JiraUser | undefined, current: JiraUser | undefined, worker?: string) {
  if (!current) return true
  const expected = userIdentities(current)
  const actual = [...userIdentities(author), normalizeIdentity(worker)].filter(Boolean)
  return expected.some((value) => actual.includes(value))
}

function normalizeRawWorklog(item: RawWorklog, issueKey: string, date: Date, currentUser?: JiraUser, trustWorker = false): JiraWorklog | null {
  const started = item.started ?? item.startDate
  if (item.id === undefined || !started || typeof item.timeSpentSeconds !== "number") return null
  if (worklogDateKey(started) !== localDateKey(date)) return null
  const worker = item.workerKey ?? item.worker
  if (!trustWorker && !sameUser(item.author, currentUser, worker)) return null
  return {
    id: String(item.id), issueKey, started, timeSpentSeconds: item.timeSpentSeconds,
    comment: commentText(item.comment), author: item.author ?? (worker ? { key: worker, name: worker } : undefined),
  }
}

function mergeWorklogs(...groups: JiraWorklog[][]) {
  const map = new Map<string, JiraWorklog>()
  for (const item of groups.flat()) map.set(`${item.issueKey}:${item.id}`, item)
  return Array.from(map.values()).sort((a, b) => a.started.localeCompare(b.started))
}

function summarize(worklogs: JiraWorklog[], source: WorklogDaySummary["source"]): WorklogDaySummary {
  const totalSeconds = worklogs.reduce((sum, item) => sum + Math.max(0, item.timeSpentSeconds), 0)
  return { totalMinutes: Math.round(totalSeconds / 60), worklogs, source }
}

async function loadIssueWorklogPage(issueKey: string) {
  const worklogs: RawWorklog[] = []
  for (let startAt = 0; startAt < 5000; startAt += 100) {
    const params = new URLSearchParams({ startAt: String(startAt), maxResults: "100" })
    const page = await sendJiraRequest<RawWorklogPage>(`/rest/api/2/issue/${encodeURIComponent(issueKey)}/worklog?${params.toString()}`)
    const batch = Array.isArray(page.worklogs) ? page.worklogs : []
    worklogs.push(...batch)
    if (!batch.length || worklogs.length >= (page.total ?? worklogs.length) || batch.length < 100) break
  }
  return worklogs
}

export async function getIssueWorklogs(issueKey: string, date = new Date(), currentUser?: JiraUser) {
  const key = safeIssueKey(issueKey)
  const rows = await loadIssueWorklogPage(key)
  return rows.flatMap((item) => {
    const normalized = normalizeRawWorklog(item, key, date, currentUser)
    return normalized ? [normalized] : []
  })
}

function quoteJqlUser(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
}

async function searchJiraWorklogsByJql(jql: string, currentUser: JiraUser | undefined, date: Date, issueLimit = 5000) {
  const found: JiraWorklog[] = []
  let inspected = 0
  for (let startAt = 0; startAt < issueLimit; startAt += 100) {
    const params = new URLSearchParams({ jql, startAt: String(startAt), maxResults: "100", fields: "worklog" })
    const page = await sendJiraRequest<SearchPage>(`/rest/api/2/search?${params.toString()}`)
    const issues = Array.isArray(page.issues) ? page.issues : []
    for (const issue of issues) {
      if (inspected >= issueLimit) break
      inspected += 1
      if (!issue.key || !ISSUE_KEY.test(issue.key)) continue
      const key = issue.key.toUpperCase()
      const embedded = issue.fields?.worklog
      const rows = embedded?.worklogs ?? []
      const fullRows = (embedded?.total ?? rows.length) > rows.length ? await loadIssueWorklogPage(key) : rows
      for (const row of fullRows) {
        const normalized = normalizeRawWorklog(row, key, date, currentUser)
        if (normalized) found.push(normalized)
      }
    }
    if (inspected >= issueLimit || !issues.length || startAt + issues.length >= (page.total ?? startAt + issues.length) || issues.length < 100) break
  }
  return mergeWorklogs(found)
}

async function searchJiraCurrentUserWorklogs(currentUser?: JiraUser, date = new Date()) {
  const day = localDateKey(date)
  const dayQuery = `worklogDate = "${day}" AND worklogAuthor = currentUser()`
  const primary = await searchJiraWorklogsByJql(dayQuery, currentUser, date)
  if (primary.length) return primary

  const identities = Array.from(new Set([currentUser?.key, currentUser?.name, currentUser?.accountId, currentUser?.emailAddress, currentUser?.displayName].filter((value): value is string => Boolean(value?.trim()))))
  for (const identity of identities) {
    try {
      const explicit = await searchJiraWorklogsByJql(`worklogDate = "${day}" AND worklogAuthor = ${quoteJqlUser(identity)}`, currentUser, date)
      if (explicit.length) return explicit
    } catch { /* older Jira instances can reject some identity forms */ }
  }

  // Last-resort Data Center fallback: avoid worklogDate index/time-zone edge cases,
  // then filter the returned worklogs by their actual started date in QueueMint.
  const recent = await searchJiraWorklogsByJql("worklogAuthor = currentUser() ORDER BY updated DESC", currentUser, date, 250)
  if (recent.length) return recent
  for (const identity of identities.slice(0, 3)) {
    try {
      const explicitRecent = await searchJiraWorklogsByJql(`worklogAuthor = ${quoteJqlUser(identity)} ORDER BY updated DESC`, currentUser, date, 250)
      if (explicitRecent.length) return explicitRecent
    } catch { /* keep trying stable Jira identities */ }
  }
  return []
}

function tempoRows(value: unknown): RawWorklog[] {
  if (Array.isArray(value)) return value.filter((item): item is RawWorklog => Boolean(item && typeof item === "object"))
  if (!value || typeof value !== "object") return []
  const root = value as Record<string, unknown>
  for (const key of ["worklogs", "results", "values"]) {
    const nested = tempoRows(root[key])
    if (nested.length) return nested
  }
  return []
}

function tempoIssueKey(row: RawWorklog) {
  const value = row.issue?.key ?? row.issueKey ?? row.taskKey ?? row.originTaskId
  return typeof value === "string" && ISSUE_KEY.test(value) ? value.toUpperCase() : `TEMPO-${String(row.issue?.id ?? row.id ?? "WORKLOG")}`
}

async function searchTempoCurrentUserWorklogs(currentUser?: JiraUser, date = new Date()) {
  const workerKeys = [currentUser?.key, currentUser?.name].filter((value): value is string => Boolean(value))
  if (!workerKeys.length) return []
  const day = localDateKey(date)
  const bodies = [{ from: day, to: day, workerKeys }, ...workerKeys.map((worker) => ({ from: day, to: day, worker }))]
  let lastError: unknown
  for (const body of bodies) {
    try {
      const response = await sendJiraRequest<unknown>("/rest/tempo-timesheets/4/worklogs/search", "POST", body)
      const rows = tempoRows(response)
      return mergeWorklogs(rows.flatMap((row) => {
        const normalized = normalizeRawWorklog(row, tempoIssueKey(row), date, currentUser, true)
        return normalized ? [normalized] : []
      }))
    } catch (error) { lastError = error }
  }
  throw lastError instanceof Error ? lastError : new Error("Tempo worklog search is unavailable.")
}

export async function getCurrentUserDayWorklogs(currentUser?: JiraUser, date = new Date()): Promise<WorklogDaySummary> {
  let jiraRows: JiraWorklog[] = []
  let tempoRowsResult: JiraWorklog[] = []
  let jiraOk = false
  let tempoOk = false
  try { jiraRows = await searchJiraCurrentUserWorklogs(currentUser, date); jiraOk = true } catch { jiraOk = false }
  try { tempoRowsResult = await searchTempoCurrentUserWorklogs(currentUser, date); tempoOk = true } catch { tempoOk = false }
  const merged = mergeWorklogs(jiraRows, tempoRowsResult)
  if (merged.length) return summarize(merged, jiraRows.length && tempoRowsResult.length ? "mixed" : tempoRowsResult.length ? "tempo" : "jira")
  if (jiraOk || tempoOk) return summarize([], jiraOk ? "jira" : "tempo")
  throw new Error("Could not read today's worklogs from Jira or Tempo.")
}

export async function getDayWorklogs(issueKeys: string[], currentUser?: JiraUser, date = new Date()): Promise<WorklogDaySummary> {
  const keys = Array.from(new Set(issueKeys.filter((key) => ISSUE_KEY.test(key)).map((key) => key.toUpperCase())))
  const results: JiraWorklog[] = []
  for (let offset = 0; offset < keys.length; offset += 6) {
    const pages = await Promise.all(keys.slice(offset, offset + 6).map((key) => getIssueWorklogs(key, date, currentUser).catch(() => [])))
    for (const page of pages) results.push(...page)
  }
  return summarize(mergeWorklogs(results), "jira")
}

export async function addJiraWorklog(issueKey: string, minutes: number, comment: string, startedAt = new Date()) {
  const key = safeIssueKey(issueKey)
  const safeMinutes = Math.round(minutes)
  if (!Number.isFinite(safeMinutes) || safeMinutes <= 0 || safeMinutes > 1440) throw new Error("Worklog duration must be between 1 minute and 24 hours.")
  const body: Record<string, unknown> = { timeSpentSeconds: safeMinutes * 60, started: jiraStarted(startedAt) }
  if (comment.trim()) body.comment = comment.trim().slice(0, 4000)
  const result = await sendJiraRequest<RawWorklog>(`/rest/api/2/issue/${encodeURIComponent(key)}/worklog?adjustEstimate=leave`, "POST", body)
  return { id: String(result.id ?? ""), issueKey: key, started: result.started ?? body.started as string, timeSpentSeconds: result.timeSpentSeconds ?? safeMinutes * 60, comment: commentText(result.comment) ?? comment.trim() } satisfies JiraWorklog
}

export async function applyWorklogDraft(entries: WorklogDraftEntry[], startedAt = new Date()): Promise<WorklogApplyResult[]> {
  const results: WorklogApplyResult[] = []
  for (const entry of entries) {
    try {
      const created = await addJiraWorklog(entry.issueKey, entry.minutes, entry.comment, startedAt)
      results.push({ issueKey: entry.issueKey, ok: true, worklogId: created.id })
    } catch (error) {
      results.push({ issueKey: entry.issueKey, ok: false, error: error instanceof Error ? error.message : "Worklog failed." })
    }
  }
  return results
}
