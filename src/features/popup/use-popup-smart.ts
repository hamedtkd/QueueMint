import { useMemo, useState } from "react"
import { toast } from "sonner"

import { findPotentialDuplicates } from "@/lib/intelligence"
import { searchRecentProjectIssues } from "@/lib/jira"
import { buildCapturePreflight, buildSmartCaptureSuggestion, type SmartTemplateId } from "@/lib/smart-capture"
import { buildAssistantDescription, normalizeJiraWikiFormatting, type SmartAssistantSuggestion } from "@/lib/smart-assistant"
import type { QueueMintPageContext } from "@/lib/capture"
import type { AppLocale, JiraMetadata, JiraProject } from "@/types"
import type { PopupCopy } from "./popup-copy"

type SmartForm = {
  metadata: JiraMetadata | null
  projectInfo: JiraProject | null
  projectKey: string
  issueTypes: Array<{ name: string }>
  issueType: string
  priority: string
  assignee: string
  assignees: Array<{ name?: string; key?: string; displayName?: string }>
  epics: Array<{ key: string }>
  boardId: number | null
  sprintId: number | null
  summary: string
  description: string
  labels: string
  component: string
  includeContext: boolean
  includeScreenshot: boolean
  setSummary: (value: string) => void
  setDescription: (value: string) => void
  setPriority: (value: string) => void
  setAssignee: (value: string) => void
  setEpic: (value: string) => void
  setLabels: (value: string) => void
  setComponent: (value: string) => void
  setMoreFields: (value: boolean) => void
  changeIssueType: (value: string) => void
}

export function usePopupSmart({ locale, t, form, captureContext, finalScreenshot }: { locale: AppLocale; t: PopupCopy; form: SmartForm; captureContext: QueueMintPageContext | null; finalScreenshot: string | null }) {
  const [smartTemplate, setSmartTemplate] = useState<SmartTemplateId>("auto")
  const [duplicateIssues, setDuplicateIssues] = useState<import("@/types").JiraIssueSearchResult[]>([])
  const [duplicateLoading, setDuplicateLoading] = useState(false)
  const [duplicateCheckedSummary, setDuplicateCheckedSummary] = useState("")

  const smartSuggestion = useMemo(() => buildSmartCaptureSuggestion({
    context: captureContext,
    currentSummary: form.summary,
    currentDescription: form.description,
    template: smartTemplate,
    priorityNames: form.metadata?.priorities.map((item) => item.name) ?? [],
    issueTypeNames: form.issueTypes.map((item) => item.name),
    project: form.projectInfo,
  }), [captureContext, form.summary, form.description, smartTemplate, form.metadata, form.issueTypes, form.projectInfo])

  const preflight = useMemo(() => buildCapturePreflight({
    summary: form.summary,
    projectKey: form.projectKey,
    issueType: form.issueType,
    priority: form.priority,
    assignee: form.assignee && form.assignee !== "__unassigned" ? form.assignee : undefined,
    description: form.description,
    screenshotAttached: Boolean(finalScreenshot && form.includeScreenshot),
    contextIncluded: Boolean(captureContext && form.includeContext),
    boardSelected: Boolean(form.boardId),
    sprintSelected: Boolean(form.sprintId),
    locale,
  }), [form.summary, form.projectKey, form.issueType, form.priority, form.assignee, form.description, finalScreenshot, form.includeScreenshot, captureContext, form.includeContext, form.boardId, form.sprintId, locale])

  const duplicateMatches = useMemo(() => findPotentialDuplicates(form.summary, duplicateIssues, 3), [form.summary, duplicateIssues])
  const smartCategoryLabel = smartSuggestion.category === "frontend" ? t.templateFrontend : smartSuggestion.category === "regression" ? t.templateRegression : smartSuggestion.category === "backend" ? t.templateBackend : t.templatePerformance

  async function checkDuplicates() {
    if (!form.projectKey || !form.summary.trim()) return
    setDuplicateLoading(true)
    try {
      const recent = await searchRecentProjectIssues(form.projectKey, 120)
      setDuplicateIssues(recent)
      setDuplicateCheckedSummary(form.summary.trim())
    } catch (error) {
      toast.error(locale === "fa" ? "بررسی موارد مشابه ناموفق بود" : "Duplicate check failed", { description: error instanceof Error ? error.message : undefined })
    } finally { setDuplicateLoading(false) }
  }

  function applySuggestion() {
    if (!form.summary.trim() || /^bug:\s*/i.test(form.summary.trim())) form.setSummary(smartSuggestion.summary)
    if (!form.description.trim()) form.setDescription(normalizeJiraWikiFormatting(smartSuggestion.description))
    if (!form.priority && smartSuggestion.priority) form.setPriority(smartSuggestion.priority)
    if (smartSuggestion.issueType && form.issueTypes.some((item) => item.name === smartSuggestion.issueType)) form.changeIssueType(smartSuggestion.issueType)
    if (!form.component && smartSuggestion.component && form.projectInfo?.components?.some((item) => item.name === smartSuggestion.component)) form.setComponent(smartSuggestion.component)
    const currentLabels = form.labels.split(",").map((item) => item.trim()).filter(Boolean)
    form.setLabels(Array.from(new Set([...currentLabels, ...smartSuggestion.labels])).join(", "))
    if (smartSuggestion.labels.length || smartSuggestion.component) form.setMoreFields(true)
    toast.success(t.smartApplied)
  }


  function applyAiSuggestion(suggestion: SmartAssistantSuggestion) {
    if (suggestion.summary.trim()) form.setSummary(suggestion.summary.trim().slice(0, 255))
    const structured = buildAssistantDescription(suggestion, locale)
    if (structured) form.setDescription(structured)
    if (suggestion.priority && form.metadata?.priorities.some((item) => item.name === suggestion.priority)) form.setPriority(suggestion.priority)
    const targetType = suggestion.issueType && form.issueTypes.some((item) => item.name === suggestion.issueType) ? suggestion.issueType : form.issueType
    if (targetType !== form.issueType) form.changeIssueType(targetType)
    if (suggestion.component && form.projectInfo?.components?.some((item) => item.name === suggestion.component)) { form.setComponent(suggestion.component); form.setMoreFields(true) }
    if (suggestion.epic && targetType.toLowerCase() !== "epic" && form.epics.some((item) => item.key === suggestion.epic)) form.setEpic(suggestion.epic)
    if (suggestion.assignee && suggestion.assignee !== "__unassigned" && form.assignees.some((user) => (user.name || user.key || user.displayName) === suggestion.assignee)) form.setAssignee(suggestion.assignee)
    const currentLabels = form.labels.split(",").map((item) => item.trim()).filter(Boolean)
    if (suggestion.labels.length) { form.setLabels(Array.from(new Set([...currentLabels, ...suggestion.labels])).join(", ")); form.setMoreFields(true) }
    toast.success(locale === "fa" ? "پیشنهاد Smart Assistant اعمال شد" : "Smart Assistant suggestion applied")
  }

  function reset() { setSmartTemplate("auto"); setDuplicateIssues([]); setDuplicateCheckedSummary("") }
  function resetDuplicates() { setDuplicateIssues([]); setDuplicateCheckedSummary("") }

  return { smartTemplate, setSmartTemplate, smartSuggestion, smartCategoryLabel, preflight, duplicateMatches, duplicateLoading, duplicateCheckedSummary, checkDuplicates, applySuggestion, applyAiSuggestion, reset, resetDuplicates }
}
