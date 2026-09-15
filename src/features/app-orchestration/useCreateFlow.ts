import { toast } from "sonner"

import type { LocalAttachment } from "@/components/attachment-picker"
import type { AppCopy } from "@/features/app-shell/app-copy"
import type { Mode, Placement } from "@/features/bulk/bulk-utils"
import { addJiraWorklog, assignIssueKeysToSprint, createIssues, uploadIssueAttachments } from "@/lib/jira"
import type { ActivityEntry } from "@/lib/storage"
import { validatePayload } from "@/lib/validation"
import type {
  BulkIssue, BulkPayload, CreateRunResult, JiraAttachmentUpload, JiraIssueSearchResult,
  JiraMetadata, JiraProject, JiraSprint, ValidationResult,
} from "@/types"
import type { ProgressState, StateSetter } from "./types"

type CreateFlowOptions = {
  payload: BulkPayload | undefined; metadata: JiraMetadata | null; selectedBoardId: number | null
  attachmentsByIndex: Record<number, LocalAttachment[]>; runResult: CreateRunResult | null; quickIssue: BulkIssue
  selectedProjectKey: string | undefined; quickPlacement: Placement; quickSprintId: number | null | undefined
  project: JiraProject | null; sprints: JiraSprint[]; quickAttachments: LocalAttachment[]; t: AppCopy
  includedIndicesForCreation: () => number[]; clearDraftBatch: (payload: BulkPayload) => void
  recordActivity: (input: Omit<ActivityEntry, "id" | "createdAt" | "projectKey" | "boardId">) => void
  setCreateDialogOpen: StateSetter<boolean>; setCreating: StateSetter<boolean>; setRunResult: StateSetter<CreateRunResult | null>
  setProgress: StateSetter<ProgressState>; setLastCreatedKeys: StateSetter<string[]>; setLiveSelectedKeys: StateSetter<Set<string>>
  setLiveScope: StateSetter<"created" | "board">; setLiveActionMessage: StateSetter<string | null>; setMode: StateSetter<Mode>
  setQuickCreating: StateSetter<boolean>; setQuickResult: StateSetter<CreateRunResult | null>; setQuickIssue: StateSetter<BulkIssue>
  setDuplicateProjectIssues: StateSetter<JiraIssueSearchResult[]>; setDuplicateCheckedSummary: StateSetter<string>; setQuickAttachments: StateSetter<LocalAttachment[]>
  setValidation: StateSetter<ValidationResult>
}

export function useCreateFlow(options: CreateFlowOptions) {
  const {
    payload, metadata, selectedBoardId, attachmentsByIndex, runResult, quickIssue, selectedProjectKey,
    quickPlacement, quickSprintId, project, sprints, quickAttachments, t, includedIndicesForCreation,
    clearDraftBatch, recordActivity, setCreateDialogOpen, setCreating, setRunResult, setProgress,
    setLastCreatedKeys, setLiveSelectedKeys, setLiveScope, setLiveActionMessage, setMode,
    setQuickCreating, setQuickResult, setQuickIssue, setDuplicateProjectIssues,
    setDuplicateCheckedSummary, setQuickAttachments, setValidation,
  } = options

  async function fileToUpload(file: File): Promise<JiraAttachmentUpload> {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result.split(",")[1] ?? "") : reject(new Error(`Unable to read ${file.name}.`))
      reader.onerror = () => reject(reader.error ?? new Error(`Unable to read ${file.name}.`))
      reader.readAsDataURL(file)
    })
    return { name: file.name, type: file.type || "application/octet-stream", base64 }
  }

  async function uploadAttachmentsForResults(result: CreateRunResult, attachmentMap: Record<number, LocalAttachment[]>) {
    const nextResults = await Promise.all(result.results.map(async (item) => {
      const localFiles = attachmentMap[item.index] ?? []
      if (!item.ok || !item.key || !localFiles.length) return item
      try {
        const uploads = await Promise.all(localFiles.map((entry) => fileToUpload(entry.file)))
        await uploadIssueAttachments(item.key, uploads)
        return { ...item, attachmentCount: uploads.length, attachmentError: undefined }
      } catch (error) {
        return { ...item, attachmentCount: localFiles.length, attachmentError: error instanceof Error ? error.message : "Attachment upload failed." }
      }
    }))
    return { ...result, finishedAt: new Date().toISOString(), results: nextResults }
  }

  async function executeCreateBatch() {
    if (!payload || !metadata) return
    setCreateDialogOpen(false)
    const originalIndices = includedIndicesForCreation()
    if (!originalIndices.length) return
    const createPayload: BulkPayload = { ...payload, issues: originalIndices.map((index) => payload.issues[index]) }
    setCreating(true); setRunResult(null); setProgress({ done: 0, total: createPayload.issues.length })
    try {
      const raw = await createIssues(createPayload, metadata.detectedFieldMap, (done, total) => setProgress({ done, total }), {}, selectedBoardId)
      const remapped: CreateRunResult = { ...raw, results: raw.results.map((item) => ({ ...item, index: originalIndices[item.index] })) }
      const withAttachments = await uploadAttachmentsForResults(remapped, attachmentsByIndex)
      setRunResult(withAttachments)
      const createdKeys = withAttachments.results.filter((item) => item.ok && item.key).map((item) => item.key as string)
      if (createdKeys.length) { setLastCreatedKeys(createdKeys); setLiveSelectedKeys(new Set(createdKeys)); setLiveScope("created") }
      const allIssuesCreated = withAttachments.results.every((item) => item.ok)
      const attachmentFailed = withAttachments.results.some((item) => Boolean(item.attachmentError))
      const placementNeedsReview = withAttachments.results.some((item) => item.ok && item.sprintAssigned === false)
      const estimateNeedsReview = withAttachments.results.some((item) => item.ok && Boolean(item.estimateError))
      const worklogNeedsReview = withAttachments.results.some((item) => item.ok && Boolean(item.worklogError))
      const postCreateNeedsReview = placementNeedsReview || estimateNeedsReview || worklogNeedsReview
      recordActivity({ kind: "create", outcome: allIssuesCreated && !attachmentFailed ? (placementNeedsReview || estimateNeedsReview || worklogNeedsReview ? "warning" : "success") : "warning", title: "Batch created", detail: `${createdKeys.length}/${withAttachments.results.length} ${t.issues}`, issueKeys: createdKeys })
      if (allIssuesCreated && !attachmentFailed) {
        if (worklogNeedsReview) toast.warning("Some worklogs could not be added", { description: withAttachments.results.find((item) => item.worklogError)?.worklogError })
        else if (estimateNeedsReview) toast.warning(t.estimateApplyFailed, { description: t.createdReviewEstimate })
        else toast.success(t.createSucceeded, { description: `${createdKeys.length} ${t.issues}` })
        if (!postCreateNeedsReview) {
          clearDraftBatch(payload); setRunResult(null); setLiveActionMessage(t.draftCleared); setMode("manage")
        } else {
          setLiveActionMessage(worklogNeedsReview ? "Review failed worklogs before leaving this batch." : placementNeedsReview ? t.createdReviewPlacement : t.createdReviewEstimate)
        }
      } else if (!allIssuesCreated) toast.error(t.updatePartial, { description: withAttachments.results.find((item) => !item.ok)?.error })
    } finally { setCreating(false) }
  }

  async function retryFailed() {
    if (!payload || !metadata || !runResult) return
    const failedIndexes = runResult.results.filter((item) => !item.ok).map((item) => item.index)
    if (!failedIndexes.length) return
    const retryPayload: BulkPayload = { ...payload, issues: failedIndexes.map((index) => payload.issues[index]) }
    const seedEpicKeys: Record<string, string> = {}
    for (const result of runResult.results) if (result.ok && result.ref && result.type.toLowerCase() === "epic" && result.key) seedEpicKeys[result.ref] = result.key
    setCreating(true); setProgress({ done: 0, total: retryPayload.issues.length })
    try {
      const retry = await createIssues(retryPayload, metadata.detectedFieldMap, (done, total) => setProgress({ done, total }), seedEpicKeys, selectedBoardId)
      const remapped: CreateRunResult = { ...retry, results: retry.results.map((item) => ({ ...item, index: failedIndexes[item.index] })) }
      const withAttachments = await uploadAttachmentsForResults(remapped, attachmentsByIndex)
      const byIndex = new Map(withAttachments.results.map((item): [number, CreateRunResult["results"][number]] => [item.index, item]))
      setRunResult({ ...runResult, finishedAt: withAttachments.finishedAt, results: runResult.results.map((item) => byIndex.get(item.index) ?? item) })
    } finally { setCreating(false) }
  }

  async function retrySprintPlacement() {
    if (!runResult) return
    const failed = runResult.results.filter((item) => item.ok && item.key && item.sprintAssigned === false && typeof item.sprintId === "number")
    if (!failed.length) return
    const bySprint = new Map<number, typeof failed>()
    failed.forEach((item) => { const sprintId = item.sprintId as number; bySprint.set(sprintId, [...(bySprint.get(sprintId) ?? []), item]) })
    const updates = new Map<number, { sprintAssigned: boolean; sprintError?: string }>()
    for (const [sprintId, items] of bySprint) {
      try { await assignIssueKeysToSprint(sprintId, items.map((item) => item.key as string)); items.forEach((item) => updates.set(item.index, { sprintAssigned: true })) }
      catch (error) { const message = error instanceof Error ? error.message : "Sprint assignment failed."; items.forEach((item) => updates.set(item.index, { sprintAssigned: false, sprintError: message })) }
    }
    setRunResult({ ...runResult, finishedAt: new Date().toISOString(), results: runResult.results.map((item) => ({ ...item, ...(updates.get(item.index) ?? {}) })) })
  }

  async function retryWorklogs() {
    if (!runResult) return
    const updates = new Map<number, { worklogAssigned: boolean; worklogError?: string }>()
    for (const item of runResult.results.filter((result) => result.ok && result.key && result.worklogAssigned === false)) {
      if (!item.key || !item.worklogMinutes) continue
      try {
        const started = item.worklogStarted ? new Date(item.worklogStarted) : new Date()
        await addJiraWorklog(item.key, item.worklogMinutes, item.worklogComment ?? "", Number.isNaN(started.getTime()) ? new Date() : started)
        updates.set(item.index, { worklogAssigned: true })
      } catch (error) { updates.set(item.index, { worklogAssigned: false, worklogError: error instanceof Error ? error.message : "Worklog failed." }) }
    }
    setRunResult({ ...runResult, finishedAt: new Date().toISOString(), results: runResult.results.map((item) => ({ ...item, ...(updates.get(item.index) ?? {}) })) })
  }

  async function createQuickIssue() {
    if (!metadata || !selectedProjectKey || !quickIssue.summary.trim()) return
    setQuickCreating(true); setQuickResult(null)
    try {
      const sprint = quickIssue.type.toLowerCase() === "epic" ? undefined : quickPlacement === "backlog" ? null : quickSprintId ?? payload?.defaults?.sprint ?? null
      const quickPayload: BulkPayload = { project: selectedProjectKey, defaults: {}, issues: [{ ...quickIssue, sprint }] }
      const localValidation = validatePayload(quickPayload, metadata, project ?? undefined, sprints)
      if (!localValidation.valid) { setValidation(localValidation); toast.error(t.validationFailed, { description: localValidation.errors[0]?.message }); return }
      const withAttachments = await uploadAttachmentsForResults(await createIssues(quickPayload, metadata.detectedFieldMap, undefined, {}, selectedBoardId), { 0: quickAttachments })
      setQuickResult(withAttachments)
      if (withAttachments.results[0]?.ok) {
        const key = withAttachments.results[0]?.key
        if (key) { setLastCreatedKeys([key]); setLiveSelectedKeys(new Set([key])); setLiveScope("created"); recordActivity({ kind: "create", outcome: withAttachments.results[0]?.estimateError ? "warning" : "success", title: "Quick issue created", detail: quickIssue.summary.trim(), issueKeys: [key] }) }
        setQuickIssue({ type: quickIssue.type, summary: "", description: "", priority: quickIssue.priority, assignee: quickIssue.assignee, labels: quickIssue.labels, estimate: undefined })
        setDuplicateProjectIssues([]); setDuplicateCheckedSummary(""); setQuickAttachments([])
        if (withAttachments.results[0]?.estimateError) toast.warning(t.estimateApplyFailed, { description: withAttachments.results[0]?.estimateError })
        else toast.success(t.quickCreateSucceeded, { description: withAttachments.results[0]?.key })
      } else toast.error(t.updatePartial, { description: withAttachments.results[0]?.error })
    } finally { setQuickCreating(false) }
  }

  return { executeCreateBatch, retryFailed, retrySprintPlacement, retryWorklogs, createQuickIssue }
}
