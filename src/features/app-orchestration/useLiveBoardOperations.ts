import { toast } from "sonner"

import type { AppCopy } from "@/features/app-shell/app-copy"
import {
  assignIssueKeysToSprint,
  bulkEditIssues,
  getJiraIssueDetails,
  getLiveBoardIssues,
  getProjectPermissions,
  jiraErrorMessage,
  moveIssueKeysToBacklog,
  searchRecentProjectIssues,
  summarizeBatchFailures,
  transitionIssueToBoardColumn,
} from "@/lib/jira"
import { findPotentialDuplicates } from "@/lib/intelligence"
import { executeStatusTransitions } from "@/features/jira-status/jira-status-batch"
import type { ActivityEntry } from "@/lib/storage"
import type {
  AppLocale,
  BulkIssue,
  BulkPayload,
  JiraIssueDetails,
  JiraBulkStatusResult,
  JiraBoardColumn,
  JiraIssueSearchResult,
  JiraLiveIssue,
  JiraMetadata,
  JiraSprint,
} from "@/types"
import type { StateSetter } from "./types"

type LiveBoardOptions = {
  selectedBoardId: number | null
  sprints: JiraSprint[]
  metadata: JiraMetadata | null
  payload: BulkPayload | undefined
  t: AppCopy
  locale: AppLocale
  selectedProjectKey: string | undefined
  quickIssue: BulkIssue
  liveIssues: JiraLiveIssue[]
  liveSelectedKeys: Set<string>
  setLiveIssues: StateSetter<JiraLiveIssue[]>
  setLiveSelectedKeys: StateSetter<Set<string>>
  setLoadingLive: StateSetter<boolean>
  setLiveActionMessage: StateSetter<string | null>
  setActivityLog: StateSetter<ActivityEntry[]>
  setDuplicateProjectIssues: StateSetter<JiraIssueSearchResult[]>
  setDuplicateLoading: StateSetter<boolean>
  setDuplicateCheckedSummary: StateSetter<string>
  setIssueDetailKey: StateSetter<string | null>
  setIssueDetailOpen: StateSetter<boolean>
  setIssueDetails: StateSetter<JiraIssueDetails | null>
  setIssueDetailError: StateSetter<string | null>
  setIssueDetailLoading: StateSetter<boolean>
}

export function useLiveBoardOperations(options: LiveBoardOptions) {
  const {
    selectedBoardId, sprints, metadata, payload, t, locale, selectedProjectKey,
    quickIssue, liveIssues, liveSelectedKeys, setLiveIssues, setLiveSelectedKeys, setLoadingLive,
    setLiveActionMessage, setActivityLog, setDuplicateProjectIssues, setDuplicateLoading,
    setDuplicateCheckedSummary, setIssueDetailKey, setIssueDetailOpen, setIssueDetails,
    setIssueDetailError, setIssueDetailLoading,
  } = options

  async function loadLiveBoard() {
    if (!selectedBoardId) {
      setLiveIssues([])
      return
    }
    setLoadingLive(true)
    try {
      const next = await getLiveBoardIssues(selectedBoardId, sprints, metadata?.estimation.storyPointsFieldId)
      setLiveIssues(next)
      setLiveSelectedKeys((current) => {
        const available = new Set(next.map((item) => item.key))
        return new Set(Array.from(current).filter((key) => available.has(key)))
      })
    } catch (error) {
      setLiveIssues([])
      setLiveActionMessage(jiraErrorMessage(error, "Unable to load Jira board."))
    } finally {
      setLoadingLive(false)
    }
  }

  function recordActivity(input: Omit<ActivityEntry, "id" | "createdAt" | "projectKey" | "boardId">) {
    const entry: ActivityEntry = {
      ...input,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      projectKey: payload?.project,
      boardId: selectedBoardId,
    }
    setActivityLog((current) => [entry, ...current].slice(0, 120))
  }

  async function checkQuickDuplicates() {
    if (!selectedProjectKey || !quickIssue.summary.trim()) return
    setDuplicateLoading(true)
    try {
      const results = await searchRecentProjectIssues(selectedProjectKey, 120)
      setDuplicateProjectIssues(results)
      setDuplicateCheckedSummary(quickIssue.summary.trim())
      const matches = findPotentialDuplicates(quickIssue.summary, results, 4)
      if (matches.length) toast.warning(locale === "fa" ? "تسک مشابه پیدا شد" : "Potential duplicates found", { description: `${matches.length} ${t.issues}` })
      else toast.success(locale === "fa" ? "مورد مشابهی پیدا نشد" : "No close duplicates found")
    } catch (error) {
      toast.error(locale === "fa" ? "بررسی موارد مشابه ناموفق بود" : "Duplicate check failed", { description: jiraErrorMessage(error, "Duplicate check failed") })
    } finally {
      setDuplicateLoading(false)
    }
  }

  async function moveLiveIssues(issueKeys: string[], targetSprint: number | null) {
    if (!selectedBoardId || !issueKeys.length) return
    setLiveActionMessage(null)
    try {
      if (typeof targetSprint === "number") await assignIssueKeysToSprint(targetSprint, issueKeys)
      else await moveIssueKeysToBacklog(selectedBoardId, issueKeys)
      await loadLiveBoard()
      recordActivity({ kind: "move", outcome: "success", title: targetSprint ? "Moved issues to sprint" : "Moved issues to backlog", detail: `${issueKeys.length} ${t.issues}`, issueKeys })
      toast.success(t.updateSucceeded, { description: `${issueKeys.length} ${t.issues}` })
    } catch (error) {
      const message = jiraErrorMessage(error, "Unable to move Jira issues.")
      setLiveActionMessage(message)
      toast.error(t.updatePartial, { description: message })
    }
  }

  async function transitionLiveIssue(issueKey: string, target: Pick<JiraBoardColumn, "name" | "statusIds">) {
    const issue = liveIssues.find((item) => item.key === issueKey)
    if (!issue || (issue.statusId && target.statusIds.includes(issue.statusId))) return true
    setLiveActionMessage(null)
    try {
      await transitionIssueToBoardColumn(issueKey, target.statusIds, target.name)
      await loadLiveBoard()
      recordActivity({ kind: "move", outcome: "success", title: `Moved issue to ${target.name}`, detail: issueKey, issueKeys: [issueKey] })
      toast.success(locale === "fa" ? "وضعیت Jira آپدیت شد" : "Jira status updated", { description: `${issueKey} → ${target.name}` })
      return true
    } catch (error) {
      const message = jiraErrorMessage(error, "Unable to update Jira status.")
      setLiveActionMessage(message)
      toast.error(locale === "fa" ? "جابجایی تسک در Jira ناموفق بود" : "Could not move Jira issue", { description: message })
      return false
    }
  }

  async function transitionLiveIssues(keys: string[], target: Pick<JiraBoardColumn, "name" | "statusIds">): Promise<JiraBulkStatusResult> {
    // Resolve selection against current board. Jira is authoritative: never move cards optimistically.
    const indexed = new Map(liveIssues.map((issue) => [issue.key, issue]))
    const unique = Array.from(new Set(keys)).filter((key) => indexed.has(key))
    const skip = unique.filter((key) => {
      const issue = indexed.get(key)!
      return target.statusIds.length
        ? Boolean(issue.statusId && target.statusIds.includes(issue.statusId))
        : issue.status?.trim().toLowerCase() === target.name.trim().toLowerCase()
    })
    const movable = unique.filter((key) => !skip.includes(key))
    const { moved, failed } = await executeStatusTransitions(
      movable,
      (key) => transitionIssueToBoardColumn(key, target.statusIds, target.name),
      (error) => jiraErrorMessage(error, "Jira rejected the status transition."),
    )
    if (moved.length) {
      await loadLiveBoard()
      recordActivity({ kind: "move", outcome: failed.length ? "warning" : "success", title: "Moved issues to " + target.name, detail: moved.length + " moved, " + failed.length + " failed", issueKeys: moved })
    }
    const summary = moved.length + " " + (locale === "fa" ? "منتقل شد" : "moved") + (failed.length ? " · " + failed.length + " " + (locale === "fa" ? "ناموفق" : "failed") : "")
    setLiveActionMessage(summary)
    if (failed.length) toast.warning(locale === "fa" ? "برخی تسک‌ها جابه‌جا نشدند" : "Some Jira transitions failed", { description: summary + " · " + failed.slice(0, 2).map((item) => item.key + ": " + item.error).join("; ") })
    else if (moved.length) toast.success(locale === "fa" ? "انتقال گروهی انجام شد" : "Jira issues moved", { description: summary + " → " + target.name })
    return { attempted: movable.length, moved, skipped: skip, failed }
  }

  async function assignLiveSelectionToMe() {
    const identity = metadata?.user?.name || metadata?.user?.key
    const keys = Array.from(liveSelectedKeys)
    if (!identity || !keys.length || !payload?.project) return
    setLiveActionMessage(null)
    try {
      const permissions = await getProjectPermissions(payload.project)
      if (!permissions.assign) throw new Error(t.permissionsDenied)
      const results = await bulkEditIssues(keys, { assignee: identity })
      await loadLiveBoard()
      const complete = results.every((item) => item.ok)
      const failureDetail = summarizeBatchFailures(results, keys.length, t.updatePartial)
      setLiveActionMessage(complete ? t.updateComplete : `${t.updatePartial}${failureDetail ? ` · ${failureDetail}` : ""}`)
      recordActivity({ kind: "assign", outcome: complete ? "success" : "warning", title: "Assigned issues to current user", detail: `${keys.length} ${t.issues}`, issueKeys: keys })
      if (complete) toast.success(t.updateSucceeded, { description: `${keys.length} ${t.issues}` })
      else toast.warning(t.updatePartial, { description: failureDetail || undefined })
    } catch (error) {
      const message = jiraErrorMessage(error, t.updatePartial)
      setLiveActionMessage(message); toast.error(t.updatePartial, { description: message })
    }
  }

  async function openIssueDetails(issueKey: string) {
    setIssueDetailKey(issueKey)
    setIssueDetailOpen(true)
    setIssueDetails(null)
    setIssueDetailError(null)
    setIssueDetailLoading(true)
    try {
      setIssueDetails(await getJiraIssueDetails(issueKey, metadata?.estimation.storyPointsFieldId))
    } catch (error) {
      setIssueDetailError(jiraErrorMessage(error, locale === "fa" ? "بارگذاری تسک ناموفق بود." : "Could not load the issue."))
    } finally {
      setIssueDetailLoading(false)
    }
  }

  return { loadLiveBoard, recordActivity, checkQuickDuplicates, moveLiveIssues, transitionLiveIssue, transitionLiveIssues, assignLiveSelectionToMe, openIssueDetails }
}
