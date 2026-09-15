import { useEffect } from "react"

import type { LocalAttachment } from "@/components/attachment-picker"
import { accentForDarkMode, foregroundForHex, type DynamicFieldDraft, type Mode, type Placement } from "@/features/bulk/bulk-utils"
import { getBulkEditableFields } from "@/lib/jira"
import { loadState, saveState, type ActivityEntry, type AutomationRule, type SavedIssueView, type SavedWorkspaceAction } from "@/lib/storage"
import { LEGACY_SAMPLE_JSON } from "@/sample"
import type {
  AppLocale, AppTheme, BulkIssue, BulkPayload, CreateRunResult, DensityMode, JiraEditableField,
  JiraIssueSearchResult, JiraLiveIssue, JiraMetadata, JiraSprint, RadiusMode, ReviewLayout,
} from "@/types"
import type { StateSetter } from "./types"

type LifecycleOptions = {
  jsonText: string; payload: BulkPayload | undefined; selectedBoardId: number | null; theme: AppTheme; locale: AppLocale; accentColor: string
  reviewLayout: ReviewLayout; gridColumns: 2 | 3 | 4; density: DensityMode; radius: RadiusMode; mode: Mode; lastCreatedKeys: string[]; onboardingComplete: boolean
  savedActions: SavedWorkspaceAction[]; savedViews: SavedIssueView[]; automationRules: AutomationRule[]; activityLog: ActivityEntry[]; hydrated: boolean
  metadata: JiraMetadata | null; issueCount: number; selectedIndex: number; sprints: JiraSprint[]; selectedProjectKey: string | undefined
  liveBulkOpen: boolean; liveSelectedKeys: Set<string>; liveIssues: JiraLiveIssue[]; quickIssue: BulkIssue; quickSprintId: number | null | undefined; loadingProject: boolean
  issueTypes: Array<{ name: string }>; connect: (showFeedback?: boolean) => Promise<boolean>; loadProjectContext: (key: string) => Promise<void>; loadLiveBoard: () => Promise<void>
  setJsonText: StateSetter<string>; setSelectedBoardId: StateSetter<number | null>; setLocale: StateSetter<AppLocale>; setTheme: StateSetter<AppTheme>
  setAccentColor: StateSetter<string>; setReviewLayout: StateSetter<ReviewLayout>; setGridColumns: StateSetter<2 | 3 | 4>; setDensity: StateSetter<DensityMode>; setRadius: StateSetter<RadiusMode>; setMode: StateSetter<Mode>
  setLastCreatedKeys: StateSetter<string[]>; setLiveSelectedKeys: StateSetter<Set<string>>; setSavedActions: StateSetter<SavedWorkspaceAction[]>; setSavedViews: StateSetter<SavedIssueView[]>
  setAutomationRules: StateSetter<AutomationRule[]>; setActivityLog: StateSetter<ActivityEntry[]>; setOnboardingComplete: StateSetter<boolean>; setHydrated: StateSetter<boolean>
  setSelectedIndex: StateSetter<number>; setSelectedForCreate: StateSetter<Set<number>>; setDuplicateProjectIssues: StateSetter<JiraIssueSearchResult[]>; setDuplicateCheckedSummary: StateSetter<string>
  setLiveDynamicFields: StateSetter<JiraEditableField[]>; setLiveDynamicError: StateSetter<string | null>; setLiveDynamicLoading: StateSetter<boolean>; setCommandOpen: StateSetter<boolean>
  setQuickIssue: StateSetter<BulkIssue>; setQuickSprintId: StateSetter<number | null | undefined>; setQuickPlacement: StateSetter<Placement>
}

export function useAppLifecycle(options: LifecycleOptions) {
  const o = options
  useEffect(() => {
    void loadState().then((state) => {
      const legacyBundledSample = state.jsonText === LEGACY_SAMPLE_JSON
      if (state.jsonText && !legacyBundledSample) o.setJsonText(state.jsonText)
      if (state.selectedBoardId && !legacyBundledSample) o.setSelectedBoardId(state.selectedBoardId)
      if (state.locale) o.setLocale(state.locale); if (state.theme) o.setTheme(state.theme); if (state.accentColor) o.setAccentColor(state.accentColor)
      if (state.reviewLayout) o.setReviewLayout(state.reviewLayout); if (state.gridColumns) o.setGridColumns(state.gridColumns); if (state.density) o.setDensity(state.density); if (state.radius) o.setRadius(state.radius); if (state.lastMode) o.setMode(state.lastMode)
      if (state.lastCreatedKeys?.length) { o.setLastCreatedKeys(state.lastCreatedKeys); o.setLiveSelectedKeys(new Set(state.lastCreatedKeys)) }
      if (state.savedActions?.length) o.setSavedActions(state.savedActions); if (state.savedViews?.length) o.setSavedViews(state.savedViews)
      if (state.automationRules?.length) o.setAutomationRules(state.automationRules); if (state.activityLog?.length) o.setActivityLog(state.activityLog)
      o.setOnboardingComplete(Boolean(state.onboardingComplete)); o.setHydrated(true)
    })
  }, [])

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const apply = () => {
      const dark = o.theme === "dark" || (o.theme === "system" && media.matches)
      const effectiveAccent = dark ? accentForDarkMode(o.accentColor) : o.accentColor
      document.documentElement.classList.toggle("dark", dark)
      document.documentElement.style.setProperty("--primary", effectiveAccent)
      document.documentElement.style.setProperty("--ring", effectiveAccent)
      document.documentElement.style.setProperty("--primary-foreground", foregroundForHex(effectiveAccent))
    }
    apply(); media.addEventListener("change", apply); return () => media.removeEventListener("change", apply)
  }, [o.theme, o.accentColor])

  useEffect(() => {
    document.documentElement.lang = o.locale; document.documentElement.dir = o.locale === "fa" ? "rtl" : "ltr"; document.documentElement.dataset.density = o.density; document.documentElement.dataset.radius = o.radius
  }, [o.locale, o.density, o.radius])

  useEffect(() => {
    const timer = window.setTimeout(() => void saveState({
      jsonText: o.jsonText, selectedProject: o.payload?.project, selectedBoardId: o.selectedBoardId ?? undefined,
      theme: o.theme, locale: o.locale, accentColor: o.accentColor, reviewLayout: o.reviewLayout, gridColumns: o.gridColumns,
      density: o.density, radius: o.radius, lastMode: o.mode, lastCreatedKeys: o.lastCreatedKeys, onboardingComplete: o.onboardingComplete,
      savedActions: o.savedActions, savedViews: o.savedViews, automationRules: o.automationRules, activityLog: o.activityLog,
    }), 250)
    return () => window.clearTimeout(timer)
  }, [o.jsonText, o.payload?.project, o.selectedBoardId, o.theme, o.locale, o.accentColor, o.reviewLayout, o.gridColumns, o.density, o.radius, o.mode, o.lastCreatedKeys, o.onboardingComplete, o.savedActions, o.savedViews, o.automationRules, o.activityLog])

  useEffect(() => { if (o.hydrated) void o.connect(false) }, [o.hydrated])
  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.runtime?.onMessage) return
    const listener = (message: unknown) => {
      if (!message || typeof message !== "object") return
      const type = (message as { type?: string }).type
      if (type === "QUEUEMINT_JIRA_CANDIDATE_CHANGED") void o.connect(false)
      if (type === "QUEUEMINT_OPEN_COMMAND_PALETTE") o.setCommandOpen(true)
    }
    chrome.runtime.onMessage.addListener(listener); return () => chrome.runtime.onMessage.removeListener(listener)
  }, [o.hydrated])
  useEffect(() => { if (o.metadata && o.payload?.project) void o.loadProjectContext(o.payload.project) }, [o.metadata, o.payload?.project])
  useEffect(() => {
    if (o.selectedIndex >= o.issueCount) o.setSelectedIndex(Math.max(0, o.issueCount - 1))
    o.setSelectedForCreate((current) => {
      if (!o.issueCount) return new Set()
      const next = new Set(Array.from(current).filter((index) => index < o.issueCount))
      if (current.size === 0) for (let index = 0; index < o.issueCount; index += 1) next.add(index)
      return next
    })
  }, [o.issueCount, o.selectedIndex])
  useEffect(() => {
    if ((o.mode === "manage" || o.mode === "dashboard" || o.mode === "quick" || o.mode === "automation" || o.mode === "worklog") && o.selectedBoardId && o.metadata) void o.loadLiveBoard()
  }, [o.mode, o.selectedBoardId, o.sprints.length, o.metadata])
  useEffect(() => {
    o.setDuplicateProjectIssues([]); o.setDuplicateCheckedSummary(""); o.setQuickSprintId(undefined)
    o.setQuickIssue((current) => ({ ...current, assignee: undefined, epic: undefined, components: undefined }))
  }, [o.selectedProjectKey])
  useEffect(() => {
    if (!o.liveBulkOpen || !o.liveSelectedKeys.size) { o.setLiveDynamicFields([]); o.setLiveDynamicError(null); return }
    const representatives = new Map<string, string>()
    for (const issue of o.liveIssues.filter((item) => o.liveSelectedKeys.has(item.key))) if (!representatives.has(issue.type)) representatives.set(issue.type, issue.key)
    const keys = Array.from(representatives.values()); if (!keys.length) return
    let cancelled = false; o.setLiveDynamicLoading(true); o.setLiveDynamicError(null)
    void getBulkEditableFields(keys).then((fields) => { if (!cancelled) o.setLiveDynamicFields(fields) }).catch((error) => {
      if (!cancelled) { o.setLiveDynamicFields([]); o.setLiveDynamicError(error instanceof Error ? error.message : "Unable to load Jira edit metadata.") }
    }).finally(() => { if (!cancelled) o.setLiveDynamicLoading(false) })
    return () => { cancelled = true }
  }, [o.liveBulkOpen, o.liveSelectedKeys, o.liveIssues])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const primary = (event.ctrlKey || event.metaKey) && event.shiftKey && key === "k"
      const fallback = event.altKey && event.shiftKey && key === "k"
      if (primary || fallback) { event.preventDefault(); event.stopPropagation(); o.setCommandOpen((current) => !current) }
    }
    window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown)
  }, [])
  useEffect(() => {
    if (!o.quickIssue.type && o.issueTypes.length) o.setQuickIssue((current) => ({ ...current, type: o.issueTypes[0].name }))
    if (o.quickIssue.type === "Task" && o.issueTypes.length && !o.issueTypes.some((item) => item.name === "Task")) o.setQuickIssue((current) => ({ ...current, type: o.issueTypes[0].name }))
  }, [o.issueTypes, o.quickIssue.type])
  useEffect(() => {
    if (o.quickSprintId !== undefined) return
    if (typeof o.payload?.defaults?.sprint === "number") { o.setQuickSprintId(o.payload.defaults.sprint); o.setQuickPlacement("sprint"); return }
    const preferred = o.sprints.find((sprint) => sprint.state === "active") ?? o.sprints[0]
    if (preferred) { o.setQuickSprintId(preferred.id); o.setQuickPlacement("sprint") }
    else if (o.sprints.length === 0 && !o.loadingProject) o.setQuickPlacement("backlog")
  }, [o.payload?.defaults?.sprint, o.quickSprintId, o.sprints, o.loadingProject])
}
