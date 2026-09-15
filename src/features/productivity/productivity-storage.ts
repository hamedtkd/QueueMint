import { loadState, saveState, type StoredState } from "@/lib/storage"
import { loadWorklogSettings, saveWorklogSettings } from "@/features/worklog/worklog-storage"
import type { WorklogSettings } from "@/types"

const PRODUCTIVITY_KEY = "queuemint-productivity-v1"
const BACKUP_KIND = "queuemint-portable-backup"

export interface RecentProject {
  key: string
  name: string
  visitedAt: string
}

export interface RecentBoard {
  id: number
  name: string
  projectKey: string
  visitedAt: string
}

export interface ProductivityState {
  favoriteCommandIds: string[]
  recentProjects: RecentProject[]
  recentBoards: RecentBoard[]
}

export interface PortableQueueMintBackup {
  kind: typeof BACKUP_KIND
  schemaVersion: 1
  exportedAt: string
  state: Partial<StoredState>
  productivity: ProductivityState
  worklog?: WorklogSettings
}

const EMPTY_PRODUCTIVITY: ProductivityState = { favoriteCommandIds: [], recentProjects: [], recentBoards: [] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function sanitizeProductivity(value: unknown): ProductivityState {
  if (!isRecord(value)) return EMPTY_PRODUCTIVITY
  const favoriteCommandIds = Array.isArray(value.favoriteCommandIds)
    ? value.favoriteCommandIds.filter((id): id is string => typeof id === "string" && id.length <= 160).slice(0, 80)
    : []
  const recentProjects = Array.isArray(value.recentProjects)
    ? value.recentProjects.flatMap((item) => {
      if (!isRecord(item) || typeof item.key !== "string" || typeof item.name !== "string") return []
      return [{ key: item.key.slice(0, 80), name: item.name.slice(0, 160), visitedAt: typeof item.visitedAt === "string" ? item.visitedAt : new Date().toISOString() }]
    }).slice(0, 8)
    : []
  const recentBoards = Array.isArray(value.recentBoards)
    ? value.recentBoards.flatMap((item) => {
      if (!isRecord(item) || typeof item.id !== "number" || !Number.isInteger(item.id) || typeof item.name !== "string" || typeof item.projectKey !== "string") return []
      return [{ id: Number(item.id), name: item.name.slice(0, 160), projectKey: item.projectKey.slice(0, 80), visitedAt: typeof item.visitedAt === "string" ? item.visitedAt : new Date().toISOString() }]
    }).slice(0, 10)
    : []
  return { favoriteCommandIds: Array.from(new Set(favoriteCommandIds)), recentProjects, recentBoards }
}

export async function loadProductivityState(): Promise<ProductivityState> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return EMPTY_PRODUCTIVITY
  const result = await chrome.storage.local.get(PRODUCTIVITY_KEY)
  return sanitizeProductivity(result?.[PRODUCTIVITY_KEY])
}

export async function saveProductivityState(state: ProductivityState) {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return
  await chrome.storage.local.set({ [PRODUCTIVITY_KEY]: sanitizeProductivity(state) })
}


function sanitizePortableState(value: unknown): Partial<StoredState> {
  if (!isRecord(value)) return {}
  const state: Partial<StoredState> = {}
  if (typeof value.selectedProject === "string" && value.selectedProject.length <= 80) state.selectedProject = value.selectedProject
  if (typeof value.selectedBoardId === "number" && Number.isInteger(value.selectedBoardId)) state.selectedBoardId = value.selectedBoardId
  if (value.theme === "light" || value.theme === "dark" || value.theme === "system") state.theme = value.theme
  if (value.locale === "en" || value.locale === "fa") state.locale = value.locale
  if (typeof value.accentColor === "string" && /^#[0-9a-f]{6}$/i.test(value.accentColor)) state.accentColor = value.accentColor
  if (value.reviewLayout === "board" || value.reviewLayout === "grid" || value.reviewLayout === "list") state.reviewLayout = value.reviewLayout
  if (value.gridColumns === 2 || value.gridColumns === 3 || value.gridColumns === 4) state.gridColumns = value.gridColumns
  if (value.density === "compact" || value.density === "comfortable" || value.density === "spacious") state.density = value.density
  if (["none", "small", "medium", "large"].includes(String(value.radius))) state.radius = value.radius as StoredState["radius"]
  if (["dashboard", "quick", "bulk", "review", "manage", "worklog", "automation"].includes(String(value.lastMode))) state.lastMode = value.lastMode as StoredState["lastMode"]
  if (Array.isArray(value.savedActions)) state.savedActions = value.savedActions.slice(0, 200) as StoredState["savedActions"]
  if (Array.isArray(value.savedViews)) state.savedViews = value.savedViews.slice(0, 200) as StoredState["savedViews"]
  if (Array.isArray(value.automationRules)) state.automationRules = value.automationRules.slice(0, 200) as StoredState["automationRules"]
  return state
}

function portableState(state: Partial<StoredState>): Partial<StoredState> {
  return {
    selectedProject: state.selectedProject,
    selectedBoardId: state.selectedBoardId,
    theme: state.theme,
    locale: state.locale,
    accentColor: state.accentColor,
    reviewLayout: state.reviewLayout,
    gridColumns: state.gridColumns,
    density: state.density,
    radius: state.radius,
    lastMode: state.lastMode,
    savedActions: state.savedActions,
    savedViews: state.savedViews,
    automationRules: state.automationRules,
  }
}

export async function buildPortableBackup(): Promise<PortableQueueMintBackup> {
  const [state, productivity, worklog] = await Promise.all([loadState(), loadProductivityState(), loadWorklogSettings()])
  return { kind: BACKUP_KIND, schemaVersion: 1, exportedAt: new Date().toISOString(), state: portableState(state), productivity, worklog }
}

export async function restorePortableBackup(value: unknown) {
  if (!isRecord(value) || value.kind !== BACKUP_KIND || value.schemaVersion !== 1 || !isRecord(value.state)) {
    throw new Error("This is not a supported QueueMint backup file.")
  }
  const current = await loadState()
  const incoming = sanitizePortableState(value.state)
  const next: StoredState = { ...current, ...incoming }
  const worklog = isRecord(value.worklog) ? { dailyTargetMinutes: Number(value.worklog.dailyTargetMinutes) } : undefined
  await Promise.all([saveState(next), saveProductivityState(sanitizeProductivity(value.productivity)), ...(worklog ? [saveWorklogSettings(worklog)] : [])])
}
