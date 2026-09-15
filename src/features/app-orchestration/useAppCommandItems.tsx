import {
  ArrowLeftRight, Bookmark, Bolt, Bug, ClipboardCopy, Clock3, Eye, ExternalLink, FileJson, History, Layers3,
  LayoutDashboard, ListChecks, RefreshCcw, Settings2, SlidersHorizontal, Sparkles, SquareKanban,
  UserCheck, UsersRound,
} from "lucide-react"

import type { CommandPaletteItem } from "@/components/command-palette"
import type { AppCopy } from "@/features/app-shell/app-copy"
import type { Mode } from "@/features/bulk/bulk-utils"
import type { RecentBoard, RecentProject } from "@/features/productivity/productivity-storage"
import type { SavedWorkspaceAction } from "@/lib/storage"
import type { AppLocale, JiraBoard, JiraLiveIssue, JiraProject, JiraSprint } from "@/types"

type CommandItemOptions = {
  t: AppCopy
  locale: AppLocale
  issueCount: number
  liveSelectedKeys: Set<string>
  liveIssues: JiraLiveIssue[]
  currentUserIdentity?: string
  currentProjectKey?: string
  selectedBoardId: number | null
  projects: JiraProject[]
  boards: JiraBoard[]
  sprints: JiraSprint[]
  savedActions: SavedWorkspaceAction[]
  recentProjects: RecentProject[]
  recentBoards: RecentBoard[]
  favoriteCommandIds: Set<string>
  sprintSummary?: { label: string; issueCount: number }
  setMode: (mode: Mode) => void
  onOpenWorklog: () => void
  onWorklogSelected: () => void
  onBulkEdit: () => void
  onInspect: (key: string) => void
  onOpenInJira: (key: string) => void
  onAssignToMe: () => void
  onMoveSelected: (sprintId: number | null) => void
  onShowUnassignedBugs: (bugType: string) => void
  onSwitchProject: (projectKey: string) => void
  onSwitchBoard: (boardId: number) => void
  onHistory: () => void
  onSettings: () => void
  onBatchSettings: () => void
  onRefresh: () => void
  onSavedAction: (action: SavedWorkspaceAction) => void
  onCopySprintSummary: () => void
  onToggleFavorite: (id: string) => void
}

export function useAppCommandItems(o: CommandItemOptions): CommandPaletteItem[] {
  const isFa = o.locale === "fa"
  const groups = {
    favorite: isFa ? "محبوب‌ها" : "Favorites", recent: isFa ? "زمینه‌های اخیر" : "Recent context",
    navigate: isFa ? "رفتن به" : "Navigate", actions: isFa ? "عملیات Jira" : "Jira actions",
    saved: isFa ? "عملیات ذخیره شده" : "Saved actions", context: isFa ? "زمینه" : "Context", utility: isFa ? "ابزار" : "Utilities",
  }
  const selectedCount = o.liveSelectedKeys.size
  const selectedKey = selectedCount === 1 ? Array.from(o.liveSelectedKeys)[0] : undefined
  const bugType = o.liveIssues.find((issue) => issue.type.toLowerCase() === "bug")?.type ?? "Bug"
  const unassignedBugCount = o.liveIssues.filter((issue) => issue.type.toLowerCase() === bugType.toLowerCase() && !issue.assignee && !issue.assigneeId).length
  const usableSprints = o.sprints.filter((sprint) => sprint.state !== "closed")
  const selectedDescription = selectedCount ? `${selectedCount} ${o.t.selectedIssues}` : (isFa ? "ابتدا تسک انتخاب کن" : "Select issues first")
  const items: CommandPaletteItem[] = [
    { id: "workspace", group: groups.navigate, label: o.t.workspaceTitle, description: o.t.workspaceHint, keywords: "home dashboard workspace", icon: <LayoutDashboard className="size-4" />, onSelect: () => o.setMode("dashboard") },
    { id: "quick", group: groups.navigate, label: o.t.openQuickIssue, description: o.t.quickHint, keywords: "new create issue bug task", icon: <Bolt className="size-4" />, onSelect: () => o.setMode("quick") },
    { id: "bulk", group: groups.navigate, label: o.t.openImport, description: o.t.bulkHint, keywords: "json import batch", icon: <FileJson className="size-4" />, onSelect: () => o.setMode("bulk") },
    { id: "review", group: groups.navigate, label: o.t.openReview, description: o.t.reviewHint, keywords: "review draft", icon: <ListChecks className="size-4" />, disabled: !o.issueCount, onSelect: () => o.setMode("review") },
    { id: "manage", group: groups.navigate, label: o.t.openManager, description: o.t.manageHint, keywords: "jira board manage issues", icon: <SquareKanban className="size-4" />, onSelect: () => o.setMode("manage") },
    { id: "worklog", group: groups.navigate, label: isFa ? "دستیار ثبت زمان" : "Worklog Assistant", description: isFa ? "تکمیل زمان امروز یا ثبت زمان روی تسک‌های انتخابی" : "Complete today or log work on selected issues", keywords: "time worklog log work daily target", icon: <Clock3 className="size-4" />, onSelect: o.onOpenWorklog },
    { id: "automation", group: groups.navigate, label: isFa ? "اتوماسیون" : "Automations", description: isFa ? "قوانین امن و عملیات ذخیره شده" : "Safe rules and saved actions", keywords: "automation rules activity macro", icon: <Sparkles className="size-4" />, onSelect: () => o.setMode("automation") },
    { id: "assign-selected", group: groups.actions, label: isFa ? "اختصاص انتخاب‌ها به من" : "Assign selected to me", description: selectedDescription, keywords: "assign selected me owner", icon: <UserCheck className="size-4" />, disabled: !selectedCount || !o.currentUserIdentity, onSelect: o.onAssignToMe },
    { id: "bulk-edit", group: groups.actions, label: o.t.bulkEdit, description: selectedDescription, keywords: "edit selected jira fields", icon: <UsersRound className="size-4" />, disabled: !selectedCount, onSelect: o.onBulkEdit },
    { id: "worklog-selected", group: groups.actions, label: isFa ? "ثبت زمان روی انتخاب‌ها" : "Log work on selected", description: selectedDescription, keywords: "worklog time selected issues", icon: <Clock3 className="size-4" />, disabled: !selectedCount, onSelect: o.onWorklogSelected },
    { id: "inspect-selected", group: groups.actions, label: isFa ? "نمایش جزئیات تسک انتخابی" : "Inspect selected issue", description: selectedKey ?? (isFa ? "دقیقا یک تسک را انتخاب کن" : "Select exactly one issue"), keywords: "issue detail inspector comments attachments", icon: <Eye className="size-4" />, disabled: !selectedKey, onSelect: () => selectedKey && o.onInspect(selectedKey) },
    { id: "open-selected-jira", group: groups.actions, label: isFa ? "باز کردن تسک انتخابی در Jira" : "Open selected issue in Jira", description: selectedKey ?? (isFa ? "دقیقا یک تسک را انتخاب کن" : "Select exactly one issue"), keywords: "open jira selected issue", icon: <ExternalLink className="size-4" />, disabled: !selectedKey, onSelect: () => selectedKey && o.onOpenInJira(selectedKey) },
    { id: "move-backlog", group: groups.actions, label: isFa ? "انتقال انتخاب‌ها به بک لاگ" : "Move selected to backlog", description: selectedDescription, keywords: "move selected backlog", icon: <ArrowLeftRight className="size-4" />, disabled: !selectedCount, onSelect: () => o.onMoveSelected(null) },
    ...usableSprints.map((sprint) => ({ id: `move-sprint:${sprint.id}`, group: groups.actions, label: isFa ? `انتقال انتخاب‌ها به ${sprint.name}` : `Move selected to ${sprint.name}`, description: selectedDescription, keywords: `move selected sprint ${sprint.name} ${sprint.state}`, icon: <ArrowLeftRight className="size-4" />, disabled: !selectedCount, onSelect: () => o.onMoveSelected(sprint.id) })),
    { id: "show-unassigned-bugs", group: groups.actions, label: isFa ? "نمایش باگ‌های بدون مسئول" : "Show unassigned bugs", description: unassignedBugCount ? `${unassignedBugCount} ${o.t.issues}` : (isFa ? "موردی در بورد فعلی نیست" : "No matching issues on this board"), keywords: "show filter unassigned bugs ownership", icon: <Bug className="size-4" />, disabled: !unassignedBugCount, onSelect: () => o.onShowUnassignedBugs(bugType) },
  ]

  items.push(...o.savedActions.filter((action) => !action.projectKey || action.projectKey === o.currentProjectKey).map((action) => ({ id: `saved:${action.id}`, group: groups.saved, label: action.name, description: selectedDescription, keywords: "saved action preset automation macro apply", icon: <Bookmark className="size-4" />, disabled: !selectedCount, onSelect: () => o.onSavedAction(action) })))

  const recentKeys = new Set(o.recentProjects.map((item) => item.key))
  items.push(...o.recentProjects.flatMap((recent) => {
    const project = o.projects.find((item) => item.key === recent.key)
    if (!project) return []
    return [{ id: `project:${project.key}`, group: groups.recent, label: `${project.key} - ${project.name}`, description: project.key === o.currentProjectKey ? (isFa ? "پروژه فعلی" : "Current project") : (isFa ? "باز کردن پروژه اخیر" : "Open recent project"), keywords: `recent switch project ${project.key} ${project.name}`, icon: <Layers3 className="size-4" />, disabled: project.key === o.currentProjectKey, onSelect: () => o.onSwitchProject(project.key) }]
  }))
  items.push(...o.projects.filter((project) => !recentKeys.has(project.key)).map((project) => ({ id: `project:${project.key}`, group: groups.context, label: isFa ? `پروژه: ${project.name}` : `Project: ${project.name}`, description: project.key === o.currentProjectKey ? (isFa ? "پروژه فعلی" : "Current project") : project.key, keywords: `switch project ${project.key} ${project.name}`, icon: <Layers3 className="size-4" />, disabled: project.key === o.currentProjectKey, onSelect: () => o.onSwitchProject(project.key) })))
  const recentBoardIds = new Set(o.recentBoards.filter((item) => item.projectKey === o.currentProjectKey).map((item) => item.id))
  items.push(...o.recentBoards.flatMap((recent) => {
    if (recent.projectKey !== o.currentProjectKey) return []
    const board = o.boards.find((item) => item.id === recent.id)
    if (!board) return []
    return [{ id: `board:${board.id}`, group: groups.recent, label: board.name, description: board.id === o.selectedBoardId ? (isFa ? "بورد فعلی" : "Current board") : (isFa ? "باز کردن بورد اخیر" : "Open recent board"), keywords: `recent switch board ${board.name} ${board.type}`, icon: <SquareKanban className="size-4" />, disabled: board.id === o.selectedBoardId, onSelect: () => o.onSwitchBoard(board.id) }]
  }))
  items.push(...o.boards.filter((board) => !recentBoardIds.has(board.id)).map((board) => ({ id: `board:${board.id}`, group: groups.context, label: isFa ? `بورد: ${board.name}` : `Board: ${board.name}`, description: board.id === o.selectedBoardId ? (isFa ? "بورد فعلی" : "Current board") : board.type, keywords: `switch board ${board.name} ${board.type}`, icon: <SquareKanban className="size-4" />, disabled: board.id === o.selectedBoardId, onSelect: () => o.onSwitchBoard(board.id) })))
  items.push(
    { id: "copy-sprint-summary", group: groups.utility, label: isFa ? "کپی خلاصه اسپرینت" : "Copy sprint summary", description: o.sprintSummary ? `${o.sprintSummary.label} · ${o.sprintSummary.issueCount} ${o.t.issues}` : (isFa ? "اسپرینت فعال پیدا نشد" : "No active sprint"), keywords: "copy sprint summary slack meeting share", icon: <ClipboardCopy className="size-4" />, disabled: !o.sprintSummary, onSelect: o.onCopySprintSummary },
    { id: "history", group: groups.utility, label: o.t.changeHistory, description: o.t.historyHint, keywords: "undo history", icon: <History className="size-4" />, onSelect: o.onHistory },
    { id: "settings", group: groups.utility, label: o.t.sidebarSettings, description: o.t.settings, keywords: "theme language appearance backup restore", icon: <Settings2 className="size-4" />, onSelect: o.onSettings },
    { id: "batch-settings", group: groups.utility, label: o.t.batchSettings, description: o.t.context, keywords: "project board sprint defaults context", icon: <SlidersHorizontal className="size-4" />, onSelect: o.onBatchSettings },
    { id: "refresh", group: groups.utility, label: o.t.refreshWorkspace, description: o.t.refreshBoard, keywords: "reload jira board", icon: <RefreshCcw className="size-4" />, disabled: !o.selectedBoardId, onSelect: o.onRefresh },
  )
  return items.map((item) => {
    const favorite = o.favoriteCommandIds.has(item.id)
    return { ...item, favorite, group: favorite ? groups.favorite : item.group, onToggleFavorite: () => o.onToggleFavorite(item.id) }
  }).sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)))
}
