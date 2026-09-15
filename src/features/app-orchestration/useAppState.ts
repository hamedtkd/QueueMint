import { useRef, useState } from "react"

import type { LocalAttachment } from "@/components/attachment-picker"
import { DEFAULT_FILTER, EMPTY_VALIDATION, type BulkHistoryEntry, type DynamicFieldDraft, type Mode, type PendingBulkPreview, type Placement } from "@/features/bulk/bulk-utils"
import type { ActivityEntry, AutomationRule, SavedIssueView, SavedWorkspaceAction } from "@/lib/storage"
import type { ManageCommandPreset } from "@/features/jira-manager/manage-types"
import { EMPTY_JSON } from "@/sample"
import type {
  AppLocale, AppTheme, BulkIssue, CreateRunResult, DensityMode, JiraBoard, JiraConnectionStatus,
  JiraEditableField, JiraEpic, JiraIssueDetails, JiraIssueSearchResult, JiraLiveIssue, JiraMetadata,
  JiraProject, JiraSprint, JiraTabContext, JiraUser, RadiusMode, ReviewLayout, ValidationResult,
} from "@/types"

export function useAppState() {
  const [jsonText, setJsonText] = useState(EMPTY_JSON)
  const [metadata, setMetadata] = useState<JiraMetadata | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<JiraConnectionStatus | null>(null)
  const [connectionSheetOpen, setConnectionSheetOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [onboardingUrl, setOnboardingUrl] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [project, setProject] = useState<JiraProject | null>(null)
  const [boards, setBoards] = useState<JiraBoard[]>([])
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null)
  const [sprints, setSprints] = useState<JiraSprint[]>([])
  const [jiraEpics, setJiraEpics] = useState<JiraEpic[]>([])
  const [projectLabels, setProjectLabels] = useState<string[]>([])
  const [assignableUsers, setAssignableUsers] = useState<JiraUser[]>([])
  const [validation, setValidation] = useState<ValidationResult>(EMPTY_VALIDATION)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [contextMismatch, setContextMismatch] = useState<JiraTabContext | null>(null)
  const [ignoredContextKey, setIgnoredContextKey] = useState<string | null>(null)
  const [remoteNote, setRemoteNote] = useState<string | null>(null)
  const [loadingConnection, setLoadingConnection] = useState(false)
  const [loadingProject, setLoadingProject] = useState(false)
  const [validating, setValidating] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [runResult, setRunResult] = useState<CreateRunResult | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedForCreate, setSelectedForCreate] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState(DEFAULT_FILTER)
  const [placementFilter, setPlacementFilter] = useState(DEFAULT_FILTER)
  const [mode, setMode] = useState<Mode>("dashboard")
  const [locale, setLocale] = useState<AppLocale>("en")
  const [theme, setTheme] = useState<AppTheme>("system")
  const [accentColor, setAccentColor] = useState("#0f766e")
  const [reviewLayout, setReviewLayout] = useState<ReviewLayout>("board")
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(3)
  const [density, setDensity] = useState<DensityMode>("comfortable")
  const [radius, setRadius] = useState<RadiusMode>("medium")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [batchSettingsOpen, setBatchSettingsOpen] = useState(false)
  const [jsonSheetOpen, setJsonSheetOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [autoSprintNote, setAutoSprintNote] = useState(false)
  const [copiedAiPrompt, setCopiedAiPrompt] = useState(false)
  const [attachmentsByIndex, setAttachmentsByIndex] = useState<Record<number, LocalAttachment[]>>({})
  const [quickIssue, setQuickIssue] = useState<BulkIssue>({ type: "Task", summary: "", description: "" })
  const [quickPlacement, setQuickPlacement] = useState<Placement>("sprint")
  const [quickSprintId, setQuickSprintId] = useState<number | null | undefined>(undefined)
  const [quickAttachments, setQuickAttachments] = useState<LocalAttachment[]>([])
  const [quickCreating, setQuickCreating] = useState(false)
  const [quickResult, setQuickResult] = useState<CreateRunResult | null>(null)
  const [liveIssues, setLiveIssues] = useState<JiraLiveIssue[]>([])
  const [liveSelectedKeys, setLiveSelectedKeys] = useState<Set<string>>(new Set())
  const [worklogSelectedKeys, setWorklogSelectedKeys] = useState<Set<string>>(new Set())
  const [lastCreatedKeys, setLastCreatedKeys] = useState<string[]>([])
  const [liveScope, setLiveScope] = useState<"created" | "board">("created")
  const [liveSearch, setLiveSearch] = useState("")
  const [loadingLive, setLoadingLive] = useState(false)
  const [liveActionMessage, setLiveActionMessage] = useState<string | null>(null)
  const [liveBulkOpen, setLiveBulkOpen] = useState(false)
  const [liveBulkPriority, setLiveBulkPriority] = useState<string | undefined>(undefined)
  const [liveBulkAssignee, setLiveBulkAssignee] = useState<string | null | undefined>(undefined)
  const [liveBulkIssueType, setLiveBulkIssueType] = useState<string | undefined>(undefined)
  const [liveBulkEpicLink, setLiveBulkEpicLink] = useState<string | null | undefined>(undefined)
  const [liveBulkPlacement, setLiveBulkPlacement] = useState<"keep" | "sprint" | "backlog">("keep")
  const [liveBulkSprintId, setLiveBulkSprintId] = useState<number | null>(null)
  const [liveBulkOriginalEstimate, setLiveBulkOriginalEstimate] = useState("")
  const [liveBulkRemainingEstimate, setLiveBulkRemainingEstimate] = useState("")
  const [liveBulkStoryPoints, setLiveBulkStoryPoints] = useState("")
  const [liveDynamicFields, setLiveDynamicFields] = useState<JiraEditableField[]>([])
  const [liveDynamicEdits, setLiveDynamicEdits] = useState<Record<string, DynamicFieldDraft>>({})
  const [liveDynamicLoading, setLiveDynamicLoading] = useState(false)
  const [liveDynamicError, setLiveDynamicError] = useState<string | null>(null)
  const [bulkPreview, setBulkPreview] = useState<PendingBulkPreview | null>(null)
  const [bulkPreviewOpen, setBulkPreviewOpen] = useState(false)
  const [bulkPreviewLoading, setBulkPreviewLoading] = useState(false)
  const [bulkApplying, setBulkApplying] = useState(false)
  const [bulkHistory, setBulkHistory] = useState<BulkHistoryEntry[]>([])
  const [bulkHistoryOpen, setBulkHistoryOpen] = useState(false)
  const [undoingHistoryId, setUndoingHistoryId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [commandOpen, setCommandOpen] = useState(false)
  const [manageCommandPreset, setManageCommandPreset] = useState<ManageCommandPreset | null>(null)
  const [savedActions, setSavedActions] = useState<SavedWorkspaceAction[]>([])
  const [savedViews, setSavedViews] = useState<SavedIssueView[]>([])
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([])
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([])
  const [activeAutomationRuleId, setActiveAutomationRuleId] = useState<string | null>(null)
  const [duplicateProjectIssues, setDuplicateProjectIssues] = useState<JiraIssueSearchResult[]>([])
  const [duplicateLoading, setDuplicateLoading] = useState(false)
  const [duplicateCheckedSummary, setDuplicateCheckedSummary] = useState("")
  const [issueDetailOpen, setIssueDetailOpen] = useState(false)
  const [issueDetailKey, setIssueDetailKey] = useState<string | null>(null)
  const [issueDetails, setIssueDetails] = useState<JiraIssueDetails | null>(null)
  const [issueDetailLoading, setIssueDetailLoading] = useState(false)
  const [issueDetailError, setIssueDetailError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  return {
    jsonText, setJsonText, metadata, setMetadata, connectionStatus, setConnectionStatus, connectionSheetOpen, setConnectionSheetOpen,
    onboardingOpen, setOnboardingOpen, onboardingComplete, setOnboardingComplete, onboardingUrl, setOnboardingUrl, hydrated, setHydrated,
    project, setProject, boards, setBoards, selectedBoardId, setSelectedBoardId, sprints, setSprints, jiraEpics, setJiraEpics,
    projectLabels, setProjectLabels, assignableUsers, setAssignableUsers, validation, setValidation, connectionError, setConnectionError,
    contextMismatch, setContextMismatch, ignoredContextKey, setIgnoredContextKey, remoteNote, setRemoteNote, loadingConnection, setLoadingConnection,
    loadingProject, setLoadingProject, validating, setValidating, creating, setCreating, createDialogOpen, setCreateDialogOpen, progress, setProgress,
    runResult, setRunResult, selectedIndex, setSelectedIndex, selectedForCreate, setSelectedForCreate, search, setSearch, typeFilter, setTypeFilter,
    placementFilter, setPlacementFilter, mode, setMode, locale, setLocale, theme, setTheme, accentColor, setAccentColor, reviewLayout, setReviewLayout,
    gridColumns, setGridColumns, density, setDensity, radius, setRadius, settingsOpen, setSettingsOpen, batchSettingsOpen, setBatchSettingsOpen, jsonSheetOpen, setJsonSheetOpen,
    inspectorOpen, setInspectorOpen, autoSprintNote, setAutoSprintNote, copiedAiPrompt, setCopiedAiPrompt, attachmentsByIndex, setAttachmentsByIndex,
    quickIssue, setQuickIssue, quickPlacement, setQuickPlacement, quickSprintId, setQuickSprintId, quickAttachments, setQuickAttachments, quickCreating, setQuickCreating,
    quickResult, setQuickResult, liveIssues, setLiveIssues, liveSelectedKeys, setLiveSelectedKeys, worklogSelectedKeys, setWorklogSelectedKeys, lastCreatedKeys, setLastCreatedKeys, liveScope, setLiveScope,
    liveSearch, setLiveSearch, loadingLive, setLoadingLive, liveActionMessage, setLiveActionMessage, liveBulkOpen, setLiveBulkOpen, liveBulkPriority, setLiveBulkPriority,
    liveBulkAssignee, setLiveBulkAssignee, liveBulkIssueType, setLiveBulkIssueType, liveBulkEpicLink, setLiveBulkEpicLink, liveBulkPlacement, setLiveBulkPlacement,
    liveBulkSprintId, setLiveBulkSprintId, liveBulkOriginalEstimate, setLiveBulkOriginalEstimate, liveBulkRemainingEstimate, setLiveBulkRemainingEstimate,
    liveBulkStoryPoints, setLiveBulkStoryPoints, liveDynamicFields, setLiveDynamicFields, liveDynamicEdits, setLiveDynamicEdits, liveDynamicLoading, setLiveDynamicLoading,
    liveDynamicError, setLiveDynamicError, bulkPreview, setBulkPreview, bulkPreviewOpen, setBulkPreviewOpen, bulkPreviewLoading, setBulkPreviewLoading,
    bulkApplying, setBulkApplying, bulkHistory, setBulkHistory, bulkHistoryOpen, setBulkHistoryOpen, undoingHistoryId, setUndoingHistoryId,
    deleteDialogOpen, setDeleteDialogOpen, deleteConfirmText, setDeleteConfirmText, commandOpen, setCommandOpen, manageCommandPreset, setManageCommandPreset, savedActions, setSavedActions,
    savedViews, setSavedViews, automationRules, setAutomationRules, activityLog, setActivityLog, activeAutomationRuleId, setActiveAutomationRuleId,
    duplicateProjectIssues, setDuplicateProjectIssues, duplicateLoading, setDuplicateLoading, duplicateCheckedSummary, setDuplicateCheckedSummary,
    issueDetailOpen, setIssueDetailOpen, issueDetailKey, setIssueDetailKey, issueDetails, setIssueDetails, issueDetailLoading, setIssueDetailLoading,
    issueDetailError, setIssueDetailError, fileRef,
  }
}
