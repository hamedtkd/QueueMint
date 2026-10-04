import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import type { SavedIssueView } from "@/lib/storage"
import { filterManageIssues, groupLiveIssues, type ManageIssueFilterState } from "./manage-utils"
import { sortManageIssues, type ManageSort } from "./manage-sorting"
import type { ManageJiraScreenProps, ManageView } from "./manage-types"

type PendingManageMutation =
  | { kind: "assign"; count: number; targetLabel: string }
  | { kind: "move"; count: number; keys: string[]; sprintId: number | null; targetLabel: string }

function normalizeMultiFilter(value?: string | string[]) {
  const values = Array.isArray(value) ? value : value ? [value] : []
  return Array.from(new Set(values.map((item) => item.trim()).filter((item) => item && item !== "all")))
}

export function useManageJiraModel(props: ManageJiraScreenProps) {
  const { t, locale, project, selectedBoardId, sprints, priorities, metadata, issues, selectedKeys, setSelectedKeys, lastCreatedKeys, scope, setScope, search, onMove, savedViews, onSaveView } = props
  const [draggedKey, setDraggedKey] = useState<string | null>(null)
  const [overLane, setOverLane] = useState<string | null>(null)
  const [moveTarget, setMoveTarget] = useState("")
  const [pendingMutation, setPendingMutation] = useState<PendingManageMutation | null>(null)
  const [view, setView] = useState<ManageView>("board")
  const [sort, setSort] = useState<ManageSort>("updated-desc")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [saveViewOpen, setSaveViewOpen] = useState(false)
  const [saveViewName, setSaveViewName] = useState("")
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [assigneeFilter, setAssigneeFilterState] = useState<string[]>([])
  const [sprintFilter, setSprintFilter] = useState<string[]>([])
  const [labelFilter, setLabelFilter] = useState<string[]>([])
  const [estimateFilter, setEstimateFilter] = useState("all")
  const [myIssuesOnly, setMyIssuesOnlyState] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const createdSet = useMemo(() => new Set(lastCreatedKeys), [lastCreatedKeys])
  const currentUser = metadata?.user?.displayName || metadata?.user?.name || metadata?.user?.key
  const matchingSavedViews = useMemo(
    () => savedViews.filter((saved) => (!saved.projectKey || saved.projectKey === project?.key) && (!saved.boardId || saved.boardId === selectedBoardId)),
    [savedViews, project?.key, selectedBoardId],
  )
  const createdIssues = useMemo(() => issues.filter((issue) => createdSet.has(issue.key)), [issues, createdSet])
  const typeOptions = useMemo(() => {
    const available = new Set(issues.map((issue) => issue.type).filter(Boolean))
    const ordered = (project?.issueTypes ?? []).map((item) => item.name).filter((name) => available.delete(name))
    return [...ordered, ...Array.from(available).sort((a, b) => a.localeCompare(b))]
  }, [issues, project?.issueTypes])
  const priorityOptions = useMemo(() => {
    const available = new Set(issues.map((issue) => issue.priority).filter((value): value is string => Boolean(value)))
    const ordered = priorities.map((item) => item.name).filter((name) => available.delete(name))
    return [...ordered, ...Array.from(available).sort((a, b) => a.localeCompare(b))]
  }, [issues, priorities])
  const statusOptions = useMemo(() => Array.from(new Set(issues.map((issue) => issue.status).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b)), [issues])
  const assigneeOptions = useMemo(() => Array.from(new Set(issues.map((issue) => issue.assignee).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b)), [issues])
  const labelOptions = useMemo(() => Array.from(new Set(issues.flatMap((issue) => issue.labels))).sort((a, b) => a.localeCompare(b)), [issues])
  const activeFilterCount = [typeFilter, priorityFilter, statusFilter, assigneeFilter, sprintFilter, labelFilter].filter((values) => values.length > 0).length + (estimateFilter !== "all" ? 1 : 0) + (myIssuesOnly ? 1 : 0)
  const filterState = useMemo<ManageIssueFilterState>(() => ({
    search, type: typeFilter, priority: priorityFilter, status: statusFilter, assignee: assigneeFilter, sprint: sprintFilter, label: labelFilter, estimate: estimateFilter, myIssuesOnly, currentUser,
  }), [search, typeFilter, priorityFilter, statusFilter, assigneeFilter, sprintFilter, labelFilter, estimateFilter, myIssuesOnly, currentUser])
  const createdFilteredIssues = useMemo(() => filterManageIssues(createdIssues, filterState), [createdIssues, filterState])
  const boardFilteredIssues = useMemo(() => filterManageIssues(issues, filterState), [issues, filterState])
  const createdSortedIssues = useMemo(() => sortManageIssues(createdFilteredIssues, sort), [createdFilteredIssues, sort])
  const boardSortedIssues = useMemo(() => sortManageIssues(boardFilteredIssues, sort), [boardFilteredIssues, sort])
  const visibleIssues = scope === "created" ? createdSortedIssues : boardSortedIssues
  const hasActiveFiltering = Boolean(search.trim() || activeFilterCount)
  const createdScopeCount = hasActiveFiltering ? createdFilteredIssues.length : createdIssues.length
  const boardScopeCount = hasActiveFiltering ? boardFilteredIssues.length : issues.length

  useEffect(() => { setPage(1) }, [search, typeFilter, priorityFilter, statusFilter, assigneeFilter, sprintFilter, labelFilter, estimateFilter, myIssuesOnly, scope, sort])
  useEffect(() => { if (scope === "created" && !createdIssues.length) setScope("board") }, [scope, createdIssues.length, setScope])
  useEffect(() => {
    if (!selectedKeys.size) return
    const visibleKeys = new Set(visibleIssues.map((issue) => issue.key))
    const next = new Set(Array.from(selectedKeys).filter((key) => visibleKeys.has(key)))
    if (next.size !== selectedKeys.size) setSelectedKeys(next)
  }, [visibleIssues, selectedKeys, setSelectedKeys])
  useEffect(() => { if (issues.length > 100) setView("list") }, [issues.length])

  useEffect(() => {
    const preset = props.commandPreset
    if (!preset) return
    setScope(preset.scope ?? "board")
    props.setSearch(preset.search ?? "")
    setView(preset.view ?? "list")
    setTypeFilter(normalizeMultiFilter(preset.filters?.type))
    setPriorityFilter(normalizeMultiFilter(preset.filters?.priority))
    setStatusFilter(normalizeMultiFilter(preset.filters?.status))
    setAssigneeFilterState(normalizeMultiFilter(preset.filters?.assignee))
    setSprintFilter(normalizeMultiFilter(preset.filters?.sprint))
    setLabelFilter(normalizeMultiFilter(preset.filters?.label))
    setEstimateFilter(preset.filters?.estimate ?? "all")
    setMyIssuesOnlyState(preset.filters?.myIssuesOnly ?? false)
    setFiltersOpen(true)
    props.onCommandPresetApplied?.()
  }, [props.commandPreset?.id])

  const pageCount = Math.max(1, Math.ceil(visibleIssues.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageIssues = view === "list" ? visibleIssues.slice((safePage - 1) * pageSize, safePage * pageSize) : visibleIssues
  const groups = useMemo(() => groupLiveIssues(visibleIssues, sprints), [visibleIssues, sprints])
  const allPageSelected = pageIssues.length > 0 && pageIssues.every((issue) => selectedKeys.has(issue.key))
  const allMatchingSelected = visibleIssues.length > 0 && visibleIssues.every((issue) => selectedKeys.has(issue.key))
  const moveItems = useMemo(() => [
    { value: "backlog", label: t.backlog },
    ...sprints.map((sprint) => ({ value: `sprint:${sprint.id}`, label: sprint.name })),
  ], [sprints, t.backlog])

  function toggle(key: string) {
    const next = new Set(selectedKeys)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setSelectedKeys(next)
  }

  function setAssigneeFilter(next: string[]) {
    setAssigneeFilterState(next)
    if (next.length) setMyIssuesOnlyState(false)
  }

  function setMyIssuesOnly(next: boolean | ((current: boolean) => boolean)) {
    const resolved = typeof next === "function" ? next(myIssuesOnly) : next
    setMyIssuesOnlyState(resolved)
    if (resolved) setAssigneeFilterState([])
  }

  function requestMoveSelection(value: string) {
    if (!value || !selectedKeys.size) return
    setMoveTarget("")
    const keys = Array.from(selectedKeys)
    if (value === "backlog") setPendingMutation({ kind: "move", count: keys.length, keys, sprintId: null, targetLabel: t.backlog })
    else if (value.startsWith("sprint:")) {
      const id = Number(value.slice("sprint:".length))
      const sprint = sprints.find((item) => item.id === id)
      if (Number.isInteger(id) && id > 0 && sprint) setPendingMutation({ kind: "move", count: keys.length, keys, sprintId: id, targetLabel: sprint.name })
    }
  }

  function requestAssignToMe() {
    if (!selectedKeys.size || !currentUser) return
    setPendingMutation({ kind: "assign", count: selectedKeys.size, targetLabel: currentUser })
  }

  function confirmPendingMutation() {
    const pending = pendingMutation
    setPendingMutation(null)
    if (!pending) return
    if (pending.kind === "assign") props.onAssignToMe()
    else onMove(pending.keys, pending.sprintId)
  }

  function clearFilters() {
    setTypeFilter([]); setPriorityFilter([]); setStatusFilter([]); setAssigneeFilterState([]); setSprintFilter([]); setLabelFilter([]); setEstimateFilter("all"); setMyIssuesOnlyState(false)
  }

  function applySavedView(saved: SavedIssueView) {
    const savedMyIssues = Boolean(saved.filters.myIssuesOnly)
    setScope(saved.scope); props.setSearch(saved.search); setView(saved.view); setSort(saved.sort ?? "updated-desc")
    setTypeFilter(normalizeMultiFilter(saved.filters.type)); setPriorityFilter(normalizeMultiFilter(saved.filters.priority)); setStatusFilter(normalizeMultiFilter(saved.filters.status))
    setAssigneeFilterState(savedMyIssues ? [] : normalizeMultiFilter(saved.filters.assignee)); setSprintFilter(normalizeMultiFilter(saved.filters.sprint)); setLabelFilter(normalizeMultiFilter(saved.filters.label))
    setEstimateFilter(saved.filters.estimate || "all"); setMyIssuesOnlyState(savedMyIssues); setFiltersOpen(true)
    toast.success(locale === "fa" ? "نمای ذخیره شده اعمال شد" : "Saved view applied", { description: saved.name })
  }

  function saveCurrentView() {
    const trimmed = saveViewName.trim()
    if (!trimmed) return
    onSaveView({ name: trimmed, projectKey: project?.key, boardId: selectedBoardId, scope, search, view, sort, filters: { type: typeFilter, priority: priorityFilter, status: statusFilter, assignee: assigneeFilter, sprint: sprintFilter, label: labelFilter, estimate: estimateFilter, myIssuesOnly } })
    setSaveViewName(""); setSaveViewOpen(false)
  }

  function selectPage() {
    const next = new Set(selectedKeys)
    if (allPageSelected) pageIssues.forEach((issue) => next.delete(issue.key)); else pageIssues.forEach((issue) => next.add(issue.key))
    setSelectedKeys(next)
  }
  function selectMatching() {
    const next = new Set(selectedKeys)
    if (allMatchingSelected) visibleIssues.forEach((issue) => next.delete(issue.key)); else visibleIssues.forEach((issue) => next.add(issue.key))
    setSelectedKeys(next)
  }

  const filterItems = {
    type: typeOptions.map((value) => ({ value, label: value })),
    priority: priorityOptions.map((value) => ({ value, label: value })),
    status: statusOptions.map((value) => ({ value, label: value })),
    assignee: [{ value: "__unassigned__", label: t.unassigned }, ...assigneeOptions.map((value) => ({ value, label: value }))],
    sprint: [{ value: "backlog", label: t.backlog }, ...sprints.map((sprint) => ({ value: String(sprint.id), label: sprint.name }))],
    label: labelOptions.map((value) => ({ value, label: value })),
    estimate: [{ value: "all", label: t.allEstimates }, { value: "estimated", label: t.estimated }, { value: "unestimated", label: t.unestimated }],
  }

  return { draggedKey, setDraggedKey, overLane, setOverLane, moveTarget, pendingMutation, setPendingMutation, view, setView, sort, setSort, filtersOpen, setFiltersOpen, saveViewOpen, setSaveViewOpen, saveViewName, setSaveViewName, typeFilter, setTypeFilter, priorityFilter, setPriorityFilter, statusFilter, setStatusFilter, assigneeFilter, setAssigneeFilter, sprintFilter, setSprintFilter, labelFilter, setLabelFilter, estimateFilter, setEstimateFilter, myIssuesOnly, setMyIssuesOnly, page, setPage, pageSize, setPageSize, currentUser, matchingSavedViews, createdIssues, activeFilterCount, visibleIssues, hasActiveFiltering, createdScopeCount, boardScopeCount, pageCount, safePage, pageIssues, groups, allPageSelected, allMatchingSelected, moveItems, toggle, requestMoveSelection, requestAssignToMe, confirmPendingMutation, clearFilters, applySavedView, saveCurrentView, selectPage, selectMatching, filterItems }
}
