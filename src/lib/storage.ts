import type {
  AppLocale, AppTheme, BodyFontMode, DensityMode, HeadingFontMode, NeutralTone, RadiusMode, ReviewLayout,
  SidebarAccentMode, SidebarStyle, SurfaceStyle,
} from "@/types"

export interface SavedIssueView {
  id: string
  name: string
  createdAt: string
  projectKey?: string
  boardId?: number | null
  scope: "created" | "board"
  search: string
  view: "list" | "board"
  sort?: "updated-desc" | "updated-asc" | "key-asc" | "key-desc"
  filters: {
    type: string | string[]
    priority: string | string[]
    status: string | string[]
    assignee: string | string[]
    sprint: string | string[]
    label: string | string[]
    estimate: string
    myIssuesOnly: boolean
  }
}

export interface SavedWorkspaceAction {
  id: string
  name: string
  createdAt: string
  projectKey?: string
  boardId?: number | null
  priority?: string
  assignee?: string | null
  issueType?: string
  epicLink?: string | null
  placement: "keep" | "sprint" | "backlog"
  sprintId?: number | null
  originalEstimate?: string
  remainingEstimate?: string
  storyPoints?: string
  dynamicEdits?: Record<string, { mode: "set" | "clear"; value: unknown }>
}

export type AutomationConditionKind = "unassigned" | "no-estimate" | "backlog" | "priority-is" | "status-is" | "type-is" | "label-has"

export interface AutomationRule {
  id: string
  name: string
  createdAt: string
  projectKey?: string
  boardId?: number | null
  enabled: boolean
  condition: {
    kind: AutomationConditionKind
    value?: string
  }
  actionId: string
  lastCheckedAt?: string
  lastMatchCount?: number
}

export type ActivityKind = "create" | "bulk-edit" | "automation" | "worklog" | "undo" | "move" | "assign" | "delete"
export type ActivityOutcome = "success" | "warning" | "error"

export interface ActivityEntry {
  id: string
  createdAt: string
  kind: ActivityKind
  outcome: ActivityOutcome
  title: string
  detail?: string
  issueKeys: string[]
  projectKey?: string
  boardId?: number | null
  automationRuleId?: string
}

const STORAGE_KEY = "queuemint-state-v1"
const LEGACY_STORAGE_KEYS = ["raadco-jira-bulk-creator-state-v3"]

export interface StoredState {
  jsonText?: string
  selectedProject?: string
  selectedBoardId?: number
  theme?: AppTheme
  locale?: AppLocale
  accentColor?: string
  reviewLayout?: ReviewLayout
  gridColumns?: 2 | 3 | 4
  density?: DensityMode
  radius?: RadiusMode
  neutralTone?: NeutralTone
  bodyFont?: BodyFontMode
  headingFont?: HeadingFontMode
  sidebarStyle?: SidebarStyle
  sidebarAccent?: SidebarAccentMode
  surfaceStyle?: SurfaceStyle
  lastMode?: "dashboard" | "quick" | "bulk" | "review" | "manage" | "worklog" | "automation" | "customize"
  lastCreatedKeys?: string[]
  onboardingComplete?: boolean
  savedActions?: SavedWorkspaceAction[]
  savedViews?: SavedIssueView[]
  automationRules?: AutomationRule[]
  activityLog?: ActivityEntry[]
}

export async function loadState(): Promise<StoredState> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return {}
  const keys = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]
  const result = await chrome.storage.local.get(keys)
  const current = result?.[STORAGE_KEY] as StoredState | undefined
  if (current) return current

  for (const legacyKey of LEGACY_STORAGE_KEYS) {
    const legacy = result?.[legacyKey] as StoredState | undefined
    if (!legacy) continue
    await chrome.storage.local.set({ [STORAGE_KEY]: legacy })
    return legacy
  }
  return {}
}

export async function saveState(state: StoredState) {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return
  await chrome.storage.local.set({ [STORAGE_KEY]: state })
}
