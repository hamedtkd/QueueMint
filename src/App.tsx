import { useMemo, type CSSProperties } from "react"
import { toast } from "sonner"

import { buildEpicOptions } from "@/components/jira-controls"
import { copy } from "@/features/app-shell/app-copy"
import { DEFAULT_FILTER } from "@/features/bulk/bulk-utils"
import { AppView } from "@/features/app-orchestration/AppView"
import type { AppActionGroups, AppDerivedModel } from "@/features/app-orchestration/app-view-model"
import { useAppCommandItems } from "@/features/app-orchestration/useAppCommandItems"
import { useAppLifecycle } from "@/features/app-orchestration/useAppLifecycle"
import { useAppState } from "@/features/app-orchestration/useAppState"
import { useBatchValidation } from "@/features/app-orchestration/useBatchValidation"
import { useBulkEditFlow } from "@/features/app-orchestration/useBulkEditFlow"
import { useCreateFlow } from "@/features/app-orchestration/useCreateFlow"
import { useDraftActions } from "@/features/app-orchestration/useDraftActions"
import { useJiraConnection } from "@/features/app-orchestration/useJiraConnection"
import { useLiveBoardOperations } from "@/features/app-orchestration/useLiveBoardOperations"
import { useProjectContext } from "@/features/app-orchestration/useProjectContext"
import { useWorkspaceAutomation } from "@/features/app-orchestration/useWorkspaceAutomation"
import { buildSprintShareSummary } from "@/features/productivity/sprint-summary"
import { useProductivityState } from "@/features/productivity/useProductivityState"
import { findPotentialDuplicates, suggestAssignees } from "@/lib/intelligence"
import { parseBulkJson } from "@/lib/validation"
import { jiraBrowseUrl } from "@/lib/jira"
import { AI_PROMPT_TEMPLATE, SAMPLE_PAYLOAD } from "@/sample"
import type { BulkPayload, JiraIssueSearchResult } from "@/types"

function App() {
  const appState = useAppState()
  const {
    jsonText, setJsonText, metadata, setMetadata, connectionStatus, setConnectionStatus, connectionSheetOpen, setConnectionSheetOpen,
    onboardingComplete, setOnboardingComplete, setOnboardingOpen, onboardingUrl, setOnboardingUrl, hydrated, setHydrated,
    project, setProject, boards, setBoards, selectedBoardId, setSelectedBoardId, sprints, setSprints, jiraEpics, setJiraEpics,
    projectLabels, setProjectLabels, assignableUsers, setAssignableUsers, setValidation, setConnectionError, contextMismatch, setContextMismatch,
    ignoredContextKey, setIgnoredContextKey, setRemoteNote, loadingConnection, setLoadingConnection, loadingProject, setLoadingProject,
    setCreating, setCreateDialogOpen, progress, setProgress, runResult, setRunResult, selectedIndex, setSelectedIndex,
    selectedForCreate, setSelectedForCreate, search, setSearch, typeFilter, setTypeFilter, placementFilter, setPlacementFilter,
    mode, setMode, locale, setLocale, theme, setTheme, accentColor, setAccentColor, reviewLayout, setReviewLayout,
    gridColumns, setGridColumns, density, setDensity, radius, setRadius, setSettingsOpen, setBatchSettingsOpen, setJsonSheetOpen, setInspectorOpen,
    setAutoSprintNote, attachmentsByIndex, setAttachmentsByIndex, quickIssue, setQuickIssue, quickPlacement, setQuickPlacement,
    quickSprintId, setQuickSprintId, quickAttachments, setQuickAttachments, setQuickCreating, setQuickResult,
    liveIssues, setLiveIssues, liveSelectedKeys, setLiveSelectedKeys, worklogSelectedKeys, setWorklogSelectedKeys, lastCreatedKeys, setLastCreatedKeys, setLiveScope,
    setLoadingLive, setLiveActionMessage, liveBulkOpen, setLiveBulkOpen, liveBulkPriority, setLiveBulkPriority,
    liveBulkAssignee, setLiveBulkAssignee, liveBulkIssueType, setLiveBulkIssueType, liveBulkEpicLink, setLiveBulkEpicLink,
    liveBulkPlacement, setLiveBulkPlacement, liveBulkSprintId, setLiveBulkSprintId, liveBulkOriginalEstimate, setLiveBulkOriginalEstimate,
    liveBulkRemainingEstimate, setLiveBulkRemainingEstimate, liveBulkStoryPoints, setLiveBulkStoryPoints,
    liveDynamicFields, setLiveDynamicFields, liveDynamicEdits, setLiveDynamicEdits, setLiveDynamicLoading, setLiveDynamicError,
    bulkPreview, setBulkPreview, setBulkPreviewOpen, setBulkPreviewLoading, setBulkApplying, setBulkHistory, setBulkHistoryOpen,
    setUndoingHistoryId, setDeleteDialogOpen, deleteConfirmText, setDeleteConfirmText, setCommandOpen, setManageCommandPreset,
    savedActions, setSavedActions, savedViews, setSavedViews, automationRules, setAutomationRules, activityLog, setActivityLog,
    activeAutomationRuleId, setActiveAutomationRuleId, duplicateProjectIssues, setDuplicateProjectIssues, setDuplicateLoading,
    setDuplicateCheckedSummary, setIssueDetailOpen, setIssueDetailKey, setIssueDetails, setIssueDetailLoading, setIssueDetailError,
  } = appState

  const t = copy[locale]
  const parsed = useMemo(() => parseBulkJson(jsonText), [jsonText])
  const payload = parsed.payload
  const issues = Array.isArray(payload?.issues) ? payload.issues : []
  const issueCount = issues.length
  const selectedIssue = issues[selectedIndex]
  const selectedProjectKey = payload?.project ?? metadata?.projects[0]?.key
  const productivity = useProductivityState(selectedProjectKey, project?.name, selectedBoardId, boards.find((item) => item.id === selectedBoardId)?.name)
  const issueTypes = useMemo(() => project?.issueTypes?.filter((item) => !item.subtask) ?? [], [project])
  const epicOptions = useMemo(
    () => buildEpicOptions(issues.filter((issue) => issue.type?.toLowerCase() === "epic" && issue.ref).map((issue) => ({ ref: issue.ref as string, summary: issue.summary })), jiraEpics),
    [issues, jiraEpics],
  )
  const liveEpicOptions = useMemo(() => buildEpicOptions([], jiraEpics), [jiraEpics])
  const allLabelOptions = useMemo(() => {
    const fromJson = [...(payload?.defaults?.labels ?? []), ...issues.flatMap((issue) => issue.labels ?? [])]
    return Array.from(new Set([...projectLabels, ...fromJson].map((label) => label.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
  }, [projectLabels, payload?.defaults?.labels, issues])
  const selectedLiveIssues = useMemo(() => liveIssues.filter((issue) => liveSelectedKeys.has(issue.key)), [liveIssues, liveSelectedKeys])
  const liveAssigneeSuggestions = useMemo(() => suggestAssignees(selectedLiveIssues, liveIssues, assignableUsers), [selectedLiveIssues, liveIssues, assignableUsers])
  const quickAssigneeSuggestions = useMemo(() => suggestAssignees([{ type: quickIssue.type, labels: quickIssue.labels ?? [] }], liveIssues, assignableUsers), [quickIssue.type, quickIssue.labels, liveIssues, assignableUsers])
  const quickDuplicateMatches = useMemo(() => {
    const byKey = new Map<string, JiraIssueSearchResult>()
    for (const issue of liveIssues) byKey.set(issue.key, { id: issue.id, key: issue.key, summary: issue.summary, type: issue.type, priority: issue.priority, status: issue.status, assignee: issue.assignee, assigneeId: issue.assigneeId, avatarUrl: issue.avatarUrl, labels: issue.labels })
    for (const issue of duplicateProjectIssues) byKey.set(issue.key, issue)
    return findPotentialDuplicates(quickIssue.summary, Array.from(byKey.values()), 4)
  }, [quickIssue.summary, liveIssues, duplicateProjectIssues])
  const visibleIssueEntries = useMemo(() => {
    const q = search.trim().toLowerCase()
    return issues.map((issue, index) => ({ issue, index }))
      .filter(({ issue }) => typeFilter === DEFAULT_FILTER || issue.type?.toLowerCase() === typeFilter.toLowerCase())
      .filter(({ issue }) => {
        if (placementFilter === DEFAULT_FILTER || issue.type?.toLowerCase() === "epic") return true
        const effectiveSprint = issue.sprint !== undefined ? issue.sprint : payload?.defaults?.sprint
        return placementFilter === "sprint" ? typeof effectiveSprint === "number" : typeof effectiveSprint !== "number"
      })
      .filter(({ issue }) => !q || issue.summary?.toLowerCase().includes(q) || issue.description?.toLowerCase().includes(q) || issue.labels?.some((label) => label.toLowerCase().includes(q)))
  }, [issues, search, typeFilter, placementFilter, payload?.defaults?.sprint])

  const draftActions = useDraftActions({
    payload, issueTypes, locale, selectedForCreate, setJsonText, setValidation, setRunResult, setSelectedIndex,
    setSelectedForCreate, setMode, setInspectorOpen, setAttachmentsByIndex, setProgress, setSearch, setTypeFilter, setPlacementFilter,
  })
  const liveActions = useLiveBoardOperations({
    selectedBoardId, sprints, metadata, lastCreatedKeys, payload, t, locale, selectedProjectKey, quickIssue, liveIssues, liveSelectedKeys,
    setLiveIssues, setLiveSelectedKeys, setLoadingLive, setLiveActionMessage, setActivityLog, setDuplicateProjectIssues,
    setDuplicateLoading, setDuplicateCheckedSummary, setIssueDetailKey, setIssueDetailOpen, setIssueDetails, setIssueDetailError, setIssueDetailLoading,
  })
  const automationActions = useWorkspaceAutomation({
    payload, selectedBoardId, metadata, locale, t, liveSelectedKeys, liveIssues, savedActions, liveBulkPriority, liveBulkAssignee,
    liveBulkIssueType, liveBulkEpicLink, liveBulkPlacement, liveBulkSprintId, liveBulkOriginalEstimate, liveBulkRemainingEstimate,
    liveBulkStoryPoints, liveDynamicEdits, setSavedActions, setSavedViews, setAutomationRules, setMode, setActiveAutomationRuleId,
    setLiveBulkOpen, setLiveSelectedKeys, setLiveBulkPriority, setLiveBulkAssignee, setLiveBulkIssueType, setLiveBulkEpicLink,
    setLiveBulkPlacement, setLiveBulkSprintId, setLiveBulkOriginalEstimate, setLiveBulkRemainingEstimate, setLiveBulkStoryPoints, setLiveDynamicEdits,
  })
  const bulkActions = useBulkEditFlow({
    payload, selectedBoardId, metadata, t, liveSelectedKeys, liveIssues, assignableUsers, liveEpicOptions, sprints,
    liveBulkPriority, liveBulkAssignee, liveBulkIssueType, liveBulkEpicLink, liveBulkPlacement, liveBulkSprintId,
    liveBulkOriginalEstimate, liveBulkRemainingEstimate, liveBulkStoryPoints, liveDynamicFields, liveDynamicEdits,
    bulkPreview, activeAutomationRuleId, automationRules, deleteConfirmText, loadLiveBoard: liveActions.loadLiveBoard,
    resetLiveBulkDraft: automationActions.resetLiveBulkDraft, recordActivity: liveActions.recordActivity,
    setBulkPreviewLoading, setLiveActionMessage, setBulkPreview, setLiveBulkOpen, setBulkPreviewOpen, setBulkApplying,
    setBulkHistory, setActiveAutomationRuleId, setUndoingHistoryId, setLastCreatedKeys, setLiveSelectedKeys, setDeleteDialogOpen, setDeleteConfirmText,
  })
  const projectActions = useProjectContext({
    payload, parsedPayload: parsed.payload, selectedBoardId, quickSprintId, t, writePayload: draftActions.writePayload,
    updateDefaults: draftActions.updateDefaults, setLoadingProject, setRemoteNote, setAutoSprintNote, setProject, setBoards,
    setProjectLabels, setAssignableUsers, setSelectedBoardId, setSprints, setJiraEpics, setJsonText, setQuickSprintId, setLiveIssues, setLiveSelectedKeys,
  })
  const connectionActions = useJiraConnection({
    jsonText, metadata, connectionStatus, contextMismatch, onboardingComplete, ignoredContextKey, selectedBoardId, boards, t,
    chooseBoard: projectActions.chooseBoard, setLoadingConnection, setConnectionError, setConnectionStatus, setOnboardingUrl,
    setOnboardingOpen, setMetadata, setProject, setBoards, setSprints, setJiraEpics, setProjectLabels, setAssignableUsers,
    setContextMismatch, setIgnoredContextKey, setJsonText, setSelectedBoardId, setLastCreatedKeys, setLiveSelectedKeys, setOnboardingComplete,
  })
  const validationActions = useBatchValidation({
    payload, parsedError: parsed.error, metadata, project, sprints, selectedForCreate, t, setValidating: appState.setValidating,
    setRemoteNote, setValidation, setProject, setCreateDialogOpen, setJsonText, setRunResult, setSelectedIndex, setAttachmentsByIndex, setSelectedForCreate,
  })
  const createActions = useCreateFlow({
    payload, metadata, selectedBoardId, attachmentsByIndex, runResult, quickIssue, selectedProjectKey, quickPlacement, quickSprintId,
    project, sprints, quickAttachments, t, includedIndicesForCreation: validationActions.includedIndicesForCreation,
    clearDraftBatch: draftActions.clearDraftBatch, recordActivity: liveActions.recordActivity, setCreateDialogOpen, setCreating,
    setRunResult, setProgress, setLastCreatedKeys, setLiveSelectedKeys, setLiveScope, setLiveActionMessage, setMode,
    setQuickCreating, setQuickResult, setQuickIssue, setDuplicateProjectIssues, setDuplicateCheckedSummary, setQuickAttachments, setValidation,
  })
  const actions: AppActionGroups = {
    draft: draftActions, live: liveActions, automation: automationActions, bulk: bulkActions,
    project: projectActions, connection: connectionActions, validation: validationActions, create: createActions,
  }

  useAppLifecycle({
    jsonText, payload, selectedBoardId, theme, locale, accentColor, reviewLayout, gridColumns, density, radius, mode,
    lastCreatedKeys, onboardingComplete, savedActions, savedViews, automationRules, activityLog, hydrated, metadata,
    issueCount, selectedIndex, sprints, selectedProjectKey, liveBulkOpen, liveSelectedKeys, liveIssues, quickIssue,
    quickSprintId, loadingProject, issueTypes, connect: connectionActions.connect, loadProjectContext: projectActions.loadProjectContext,
    loadLiveBoard: liveActions.loadLiveBoard, setJsonText, setSelectedBoardId, setLocale, setTheme, setAccentColor, setReviewLayout,
    setGridColumns, setDensity, setRadius, setMode, setLastCreatedKeys, setLiveSelectedKeys, setSavedActions, setSavedViews, setAutomationRules,
    setActivityLog, setOnboardingComplete, setHydrated, setSelectedIndex, setSelectedForCreate, setDuplicateProjectIssues,
    setDuplicateCheckedSummary, setLiveDynamicFields, setLiveDynamicError, setLiveDynamicLoading, setCommandOpen, setQuickIssue,
    setQuickSprintId, setQuickPlacement,
  })

  const successCount = runResult?.results.filter((item) => item.ok).length ?? 0
  const failureCount = runResult?.results.filter((item) => !item.ok).length ?? 0
  const sprintFailureCount = runResult?.results.filter((item) => item.ok && item.sprintAssigned === false).length ?? 0
  const attachmentFailureCount = runResult?.results.filter((item) => Boolean(item.attachmentError)).length ?? 0
  const estimateFailureCount = runResult?.results.filter((item) => Boolean(item.estimateError)).length ?? 0
  const worklogFailureCount = runResult?.results.filter((item) => Boolean(item.worklogError)).length ?? 0
  const progressValue = progress.total ? (progress.done / progress.total) * 100 : 0
  const effectiveDefaultSprint = typeof payload?.defaults?.sprint === "number" ? sprints.find((item) => item.id === payload.defaults?.sprint) : undefined
  const contextPlacement = typeof payload?.defaults?.sprint === "number" ? effectiveDefaultSprint?.name ?? `Sprint ${payload.defaults.sprint}` : t.backlog
  const creationIndices = validationActions.includedIndicesForCreation()
  const creationCount = creationIndices.length
  const creationWorklogs = creationIndices.flatMap((index) => {
    const worklog = payload?.issues[index]?.worklog
    return worklog ? [worklog] : []
  })
  const creationWorklogCount = creationWorklogs.length
  const creationWorklogMinutes = creationWorklogs.reduce((sum, item) => sum + item.minutes, 0)
  const contextualSamplePayload: BulkPayload = {
    ...SAMPLE_PAYLOAD, project: payload?.project || project?.key || "PROJECT_KEY",
    defaults: {
      ...SAMPLE_PAYLOAD.defaults, sprint: payload?.defaults?.sprint ?? null,
      priority: payload?.defaults?.priority ?? SAMPLE_PAYLOAD.defaults?.priority,
      estimate: metadata?.estimation.timeTracking ? (payload?.defaults?.estimate ?? SAMPLE_PAYLOAD.defaults?.estimate) : undefined,
    },
  }
  const contextualAiPrompt = AI_PROMPT_TEMPLATE.replaceAll("PROJECT_KEY", contextualSamplePayload.project)
  const sprintShareSummary = buildSprintShareSummary(locale, payload?.project, sprints, liveIssues)
  const commandItems = useAppCommandItems({
    t, locale, issueCount, liveSelectedKeys, liveIssues, currentUserIdentity: metadata?.user?.name || metadata?.user?.key,
    currentProjectKey: payload?.project, selectedBoardId, projects: metadata?.projects ?? [], boards, sprints, savedActions,
    recentProjects: productivity.recentProjects, recentBoards: productivity.recentBoards, favoriteCommandIds: productivity.favoriteCommandIds,
    sprintSummary: sprintShareSummary ? { label: sprintShareSummary.sprint.name, issueCount: sprintShareSummary.issueCount } : undefined, setMode,
    onOpenWorklog: () => { setWorklogSelectedKeys(new Set()); setMode("worklog") },
    onWorklogSelected: () => { setWorklogSelectedKeys(new Set(liveSelectedKeys)); setMode("worklog") },
    onBulkEdit: () => { setActiveAutomationRuleId(null); setMode("manage"); setLiveBulkOpen(true) },
    onInspect: (key) => void liveActions.openIssueDetails(key), onOpenInJira: (key) => window.open(jiraBrowseUrl(key), "_blank"),
    onAssignToMe: () => void liveActions.assignLiveSelectionToMe(),
    onMoveSelected: (sprintId) => void liveActions.moveLiveIssues(Array.from(liveSelectedKeys), sprintId),
    onShowUnassignedBugs: (bugType) => {
      setLiveSelectedKeys(new Set()); setManageCommandPreset({ id: crypto.randomUUID(), scope: "board", view: "list", filters: { type: bugType, assignee: "__unassigned__" } }); setMode("manage")
    },
    onSwitchProject: (key) => void projectActions.chooseProject(key),
    onSwitchBoard: (id) => { setLiveScope("board"); void projectActions.chooseBoard(id) },
    onHistory: () => setBulkHistoryOpen(true), onSettings: () => setSettingsOpen(true), onBatchSettings: () => setBatchSettingsOpen(true),
    onRefresh: () => void liveActions.loadLiveBoard(), onSavedAction: automationActions.loadSavedAction,
    onCopySprintSummary: () => { if (sprintShareSummary) void navigator.clipboard.writeText(sprintShareSummary.text).then(() => toast.success(locale === "fa" ? "خلاصه اسپرینت کپی شد" : "Sprint summary copied")) },
    onToggleFavorite: productivity.toggleFavoriteCommand,
  })
  const derived: AppDerivedModel = {
    t, parsedError: parsed.error, payload, issues, issueCount, selectedIssue, selectedProjectKey, issueTypes, epicOptions,
    liveEpicOptions, allLabelOptions, liveAssigneeSuggestions, quickAssigneeSuggestions, quickDuplicateMatches, visibleIssueEntries,
    successCount, failureCount, sprintFailureCount, attachmentFailureCount, estimateFailureCount, worklogFailureCount, progressValue, contextPlacement,
    creationCount, creationWorklogCount, creationWorklogMinutes, contextualSamplePayload, contextualAiPrompt, appStyle: { "--review-cols": String(gridColumns) } as CSSProperties, commandItems,
  }

  return <AppView state={appState} derived={derived} actions={actions} />
}

export default App
