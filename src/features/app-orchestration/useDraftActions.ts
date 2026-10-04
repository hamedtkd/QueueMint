import type { LocalAttachment } from "@/components/attachment-picker"
import { DEFAULT_FILTER, EMPTY_VALIDATION, type Mode } from "@/features/bulk/bulk-utils"
import type { AppLocale, BulkIssue, BulkPayload, CreateRunResult, ValidationResult } from "@/types"
import type { ProgressState, StateSetter } from "./types"

type IssueTypeOption = { name: string }

type DraftActionOptions = {
  payload: BulkPayload | undefined
  issueTypes: IssueTypeOption[]
  locale: AppLocale
  selectedForCreate: Set<number>
  setJsonText: StateSetter<string>
  setValidation: StateSetter<ValidationResult>
  setRunResult: StateSetter<CreateRunResult | null>
  setSelectedIndex: StateSetter<number>
  setSelectedForCreate: StateSetter<Set<number>>
  setMode: StateSetter<Mode>
  setInspectorOpen: StateSetter<boolean>
  setAttachmentsByIndex: StateSetter<Record<number, LocalAttachment[]>>
  setProgress: StateSetter<ProgressState>
  setSearch: StateSetter<string>
  setTypeFilter: StateSetter<string>
  setPlacementFilter: StateSetter<string>
}

export function useDraftActions(options: DraftActionOptions) {
  const {
    payload, issueTypes, locale, selectedForCreate, setJsonText, setValidation, setRunResult,
    setSelectedIndex, setSelectedForCreate, setMode, setInspectorOpen, setAttachmentsByIndex,
    setProgress, setSearch, setTypeFilter, setPlacementFilter,
  } = options

  function writePayload(next: BulkPayload) {
    setJsonText(JSON.stringify(next, null, 2))
    setValidation(EMPTY_VALIDATION)
    setRunResult(null)
  }

  function updateDefaults(patch: Partial<NonNullable<BulkPayload["defaults"]>>) {
    if (!payload) return
    const nextDefaults = { ...(payload.defaults ?? {}), ...patch }
    for (const key of Object.keys(nextDefaults) as Array<keyof typeof nextDefaults>) {
      if (nextDefaults[key] === undefined) delete nextDefaults[key]
    }
    writePayload({ ...payload, defaults: nextDefaults })
  }

  function updateIssue(index: number, patch: Partial<BulkIssue>) {
    if (!payload) return
    const nextIssues = payload.issues.map((issue, currentIndex) => currentIndex === index ? { ...issue, ...patch } : issue)
    writePayload({ ...payload, issues: nextIssues })
  }

  function addIssue(issue?: BulkIssue) {
    if (!payload) return
    const defaultType = issueTypes.find((item) => item.name.toLowerCase() === "task")?.name ?? issueTypes[0]?.name ?? "Task"
    const next = issue ?? { type: defaultType, summary: locale === "fa" ? "تسک جدید" : "New issue", description: "" }
    const nextIndex = payload.issues.length
    writePayload({ ...payload, issues: [...payload.issues, next] })
    setSelectedIndex(nextIndex)
    setSelectedForCreate((current) => new Set(current).add(nextIndex))
    setMode("review")
    setInspectorOpen(true)
  }

  function duplicateIssue(index: number) {
    if (!payload) return
    const source = payload.issues[index]
    const duplicated: BulkIssue = {
      ...source,
      ref: source.ref ? `${source.ref}-copy` : undefined,
      summary: `${source.summary} (${locale === "fa" ? "کپی" : "copy"})`,
    }
    const nextIssues = [...payload.issues]
    nextIssues.splice(index + 1, 0, duplicated)
    writePayload({ ...payload, issues: nextIssues })
    setAttachmentsByIndex((current) => {
      const next: Record<number, LocalAttachment[]> = {}
      for (const [key, files] of Object.entries(current)) {
        const oldIndex = Number(key)
        next[oldIndex > index ? oldIndex + 1 : oldIndex] = files
      }
      if (current[index]?.length) next[index + 1] = [...current[index]]
      return next
    })
    setSelectedIndex(index + 1)
    setSelectedForCreate(new Set(Array.from({ length: nextIssues.length }, (_, itemIndex) => itemIndex)))
  }

  function deleteIssue(index: number) {
    if (!payload) return
    const nextIssues = payload.issues.filter((_, currentIndex) => currentIndex !== index)
    writePayload({ ...payload, issues: nextIssues })
    setAttachmentsByIndex((current) => {
      const next: Record<number, LocalAttachment[]> = {}
      for (const [key, files] of Object.entries(current)) {
        const oldIndex = Number(key)
        if (oldIndex === index) continue
        next[oldIndex > index ? oldIndex - 1 : oldIndex] = files
      }
      return next
    })
    setSelectedIndex(Math.max(0, index - 1))
    setSelectedForCreate(new Set(Array.from({ length: nextIssues.length }, (_, itemIndex) => itemIndex)))
  }

  function toggleSelectedForCreate(index: number) {
    setSelectedForCreate((current) => {
      const next = new Set(current)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function moveSelectedToPlacement(sprint: number | null) {
    if (!payload || !selectedForCreate.size) return
    writePayload({
      ...payload,
      issues: payload.issues.map((issue, index) => selectedForCreate.has(index) && issue.type.toLowerCase() !== "epic" ? { ...issue, sprint } : issue),
    })
  }

  function sendSelectedToBacklog() {
    moveSelectedToPlacement(null)
  }

  function moveDraftIssue(index: number, sprint: number | null) {
    if (!payload) return
    const issue = payload.issues[index]
    if (!issue || issue.type.toLowerCase() === "epic") return
    updateIssue(index, { sprint })
  }

  function clearDraftBatch(source: BulkPayload) {
    const empty: BulkPayload = {
      project: source.project,
      defaults: source.defaults ? { ...source.defaults } : undefined,
      fieldMap: source.fieldMap ? { ...source.fieldMap } : undefined,
      issues: [],
    }
    setJsonText(JSON.stringify(empty, null, 2))
    setSelectedIndex(0)
    setSelectedForCreate(new Set())
    setAttachmentsByIndex({})
    setValidation(EMPTY_VALIDATION)
    setProgress({ done: 0, total: 0 })
    setSearch("")
    setTypeFilter(DEFAULT_FILTER)
    setPlacementFilter(DEFAULT_FILTER)
  }

  return {
    writePayload,
    updateDefaults,
    updateIssue,
    addIssue,
    duplicateIssue,
    deleteIssue,
    toggleSelectedForCreate,
    moveSelectedToPlacement,
    sendSelectedToBacklog,
    moveDraftIssue,
    clearDraftBatch,
  }
}
