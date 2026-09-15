import { useMemo, useState } from "react"
import { Activity, BookOpen, Bug, CheckSquare2, Clock3, ClipboardCopy, Columns3, Download, Filter, Grid2X2, ListFilter, Search, Shapes, Table2, Upload, UserRound, UserX, UsersRound, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { AppLocale, JiraLiveIssue, JiraUser } from "@/types"
import { EMPTY_WORKLOG_FILTERS, filterWorklogIssues, type WorklogFilters, worklogFilterCount } from "./worklog-filtering"
import { sortWorklogIssues } from "./worklog-issues"
import { WorklogFilterSelect, type WorklogFilterOption } from "./WorklogFilterSelect"
import { WorklogIssueBoard } from "./WorklogIssueBoard"
import { WorklogIssueCards } from "./WorklogIssueCards"
import { WorklogIssueTable } from "./WorklogIssueTable"
import { useWorklogBoardColumns } from "./useWorklogBoardColumns"

export type WorklogIssueView = "table" | "board" | "cards"

function itemLabel(items: WorklogFilterOption[], value: string) { return items.find((item) => item.value === value)?.label ?? value }
function userAvatar(user?: JiraUser) { return user?.avatarUrls?.["24x24"] ?? user?.avatarUrls?.["32x32"] ?? user?.avatarUrls?.["48x48"] }
function typeIcon(type: string) { const value = type.toLowerCase(); return value.includes("bug") ? Bug : value.includes("story") ? BookOpen : value.includes("task") ? CheckSquare2 : Shapes }

export function WorklogIssuePicker({ locale, date, issues, selectedKeys, currentUser, boardId, sprintFilter, dailyCandidateKeys, loggedMinutesByIssue, onSelectedKeysChange, onCopyForAi, onDownloadForAi, onOpenImport }: {
  locale: AppLocale
  date: Date
  issues: JiraLiveIssue[]
  selectedKeys: Set<string>
  currentUser?: JiraUser
  boardId: number | null
  sprintFilter: string
  dailyCandidateKeys: Set<string>
  loggedMinutesByIssue: Record<string, number>
  onSelectedKeysChange: (keys: Set<string>) => void
  onCopyForAi: (issues: JiraLiveIssue[]) => void
  onDownloadForAi: (issues: JiraLiveIssue[]) => void
  onOpenImport: () => void
}) {
  const isFa = locale === "fa"
  const [filters, setFilters] = useState<WorklogFilters>(EMPTY_WORKLOG_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [view, setView] = useState<WorklogIssueView>("board")
  const scopedIssues = useMemo(() => issues.filter((issue) => sprintFilter === "all" || (sprintFilter === "backlog" ? issue.placement === "backlog" : issue.sprintId === Number(sprintFilter.slice(7)))), [issues, sprintFilter])
  const statuses = useMemo(() => Array.from(new Set(scopedIssues.map((issue) => issue.status).filter((value): value is string => Boolean(value)))).sort(), [scopedIssues])
  const types = useMemo(() => Array.from(new Set(scopedIssues.map((issue) => issue.type).filter(Boolean))).sort(), [scopedIssues])
  const assignees = useMemo(() => Array.from(new Set(scopedIssues.map((issue) => issue.assignee).filter((value): value is string => Boolean(value)))).sort(), [scopedIssues])
  const avatarByAssignee = useMemo(() => new Map(scopedIssues.flatMap((issue) => issue.assignee ? [[issue.assignee, issue.avatarUrl] as const] : [])), [scopedIssues])
  const visible = useMemo(() => sortWorklogIssues(filterWorklogIssues(scopedIssues, filters, currentUser, dailyCandidateKeys, loggedMinutesByIssue, date)), [scopedIssues, filters, currentUser, dailyCandidateKeys, loggedMinutesByIssue, date])
  const selectedIssues = useMemo(() => issues.filter((issue) => selectedKeys.has(issue.key)), [issues, selectedKeys])
  const activeFilters = worklogFilterCount(filters)
  const exportIssues = selectedKeys.size ? selectedIssues : visible
  const selectedVisibleCount = visible.reduce((sum, issue) => sum + Number(selectedKeys.has(issue.key)), 0)
  const allVisibleSelected = visible.length > 0 && selectedVisibleCount === visible.length
  const someVisibleSelected = selectedVisibleCount > 0
  const boardColumns = useWorklogBoardColumns(boardId, visible)

  function set<K extends keyof WorklogFilters>(key: K, value: WorklogFilters[K]) { setFilters((current) => ({ ...current, [key]: value })) }
  function toggle(key: string) { const next = new Set(selectedKeys); if (next.has(key)) next.delete(key); else next.add(key); onSelectedKeysChange(next) }
  function toggleAllVisible(checked: boolean) { const next = new Set(selectedKeys); for (const issue of visible) { if (checked) next.add(issue.key); else next.delete(issue.key) } onSelectedKeysChange(next) }
  function clearFilters() { setFilters(EMPTY_WORKLOG_FILTERS) }

  const assigneeItems: WorklogFilterOption[] = [
    { value: "all", label: isFa ? "همه افراد" : "All assignees", icon: UsersRound },
    { value: "__me__", label: isFa ? "فقط من" : "Only me", icon: UserRound, avatarUrl: userAvatar(currentUser) },
    { value: "__unassigned__", label: isFa ? "بدون مسئول" : "Unassigned", icon: UserX },
    ...assignees.map((value) => ({ value, label: value, icon: UserRound, avatarUrl: avatarByAssignee.get(value) })),
  ]
  const statusItems: WorklogFilterOption[] = [{ value: "all", label: isFa ? "همه وضعیت ها" : "All statuses", icon: ListFilter }, ...statuses.map((value) => ({ value, label: value, icon: ListFilter }))]
  const typeItems: WorklogFilterOption[] = [{ value: "all", label: isFa ? "همه نوع ها" : "All types", icon: Shapes }, ...types.map((value) => ({ value, label: value, icon: typeIcon(value) }))]
  const activityItems: WorklogFilterOption[] = [
    { value: "all", label: isFa ? "همه فعالیت ها" : "All activity", icon: Activity },
    { value: "suggested", label: `${isFa ? "مرتبط با این روز" : "Relevant day"} · ${dailyCandidateKeys.size}`, icon: Activity },
    { value: "active", label: isFa ? "در حال انجام / بررسی" : "In progress / review", icon: Activity },
    { value: "updated-today", label: isFa ? "آپدیت شده در این روز" : "Updated on day", icon: Activity },
    { value: "done-today", label: isFa ? "Done شده در این روز" : "Done on day", icon: Activity },
    { value: "logged-today", label: isFa ? "Worklog دارد" : "Has worklog", icon: Clock3 },
    { value: "unlogged-today", label: isFa ? "Worklog ندارد" : "No worklog", icon: Clock3 },
  ]
  const estimateItems: WorklogFilterOption[] = [{ value: "all", label: isFa ? "هر Estimate" : "Any estimate", icon: Clock3 }, { value: "estimated", label: isFa ? "Estimate دارد" : "Has estimate", icon: Clock3 }, { value: "unestimated", label: isFa ? "بدون Estimate" : "No estimate", icon: Clock3 }]
  const chips = [filters.assignee !== "all" ? itemLabel(assigneeItems, filters.assignee) : "", filters.status !== "all" ? itemLabel(statusItems, filters.status) : "", filters.type !== "all" ? itemLabel(typeItems, filters.type) : "", filters.activity !== "all" ? itemLabel(activityItems, filters.activity) : "", filters.estimate !== "all" ? itemLabel(estimateItems, filters.estimate) : ""].filter(Boolean)
  const views = [{ id: "table" as const, icon: Table2, label: isFa ? "جدول" : "Table" }, { id: "board" as const, icon: Columns3, label: isFa ? "بورد" : "Board" }, { id: "cards" as const, icon: Grid2X2, label: isFa ? "کارت" : "Cards" }]

  return (
    <section className="qm-worklog-issues-panel">
      <div className="qm-worklog-issues-head">
        <div><h2 className="text-base font-semibold">{isFa ? "انتخاب تسک های Jira" : "Select Jira issues"}</h2><p className="mt-0.5 text-xs text-muted-foreground">{isFa ? "تسک ها رو ببین و فقط مواردی که روی اونها کار کردی انتخاب کن." : "Browse and select issues to log time. Board columns come from Jira."}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-lg border bg-background p-0.5">{views.map(({ id, icon: Icon, label }) => <Button key={id} variant="ghost" size="sm" aria-pressed={view === id} title={label} onClick={() => setView(id)} className={cn("h-8 rounded-md px-2.5", view === id && "bg-primary/8 text-primary")}><Icon className="size-3.5" /><span className="hidden 2xl:inline">{label}</span></Button>)}</div>
        </div>
      </div>

      <div className="qm-worklog-issues-toolbar">
        <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={filters.search} onChange={(event) => set("search", event.target.value)} className="h-9 ps-9" placeholder={isFa ? "جستجو با key، summary یا label..." : "Search issues (key, summary, or label...)"} /></div>
        <Button variant="outline" size="sm" className="h-9" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen}><Filter className="size-3.5" />{isFa ? "فیلترها" : "Filters"}{activeFilters ? <Badge className="ms-1 h-4 min-w-4 px-1 text-[9px]">{activeFilters}</Badge> : null}</Button>
        <span className="hidden h-7 w-px bg-border 2xl:block" />
        <Button variant="ghost" size="sm" className="h-9" onClick={() => onCopyForAi(exportIssues)} disabled={!exportIssues.length}><ClipboardCopy className="size-3.5" /><span className="hidden 2xl:inline">{isFa ? "کپی برای AI" : "Copy for AI"}</span></Button>
        <Button variant="ghost" size="icon-sm" className="size-9" onClick={() => onDownloadForAi(exportIssues)} disabled={!exportIssues.length} aria-label={isFa ? "دانلود JSON" : "Download JSON"}><Download className="size-3.5" /></Button>
        <Button variant="outline" size="sm" className="h-9" onClick={onOpenImport}><Upload className="size-3.5" />{isFa ? "Import" : "Import JSON"}</Button>
      </div>

      {filtersOpen ? <div className="qm-worklog-filter-panel">
        <WorklogFilterSelect ariaLabel={isFa ? "فیلتر مسئول" : "Assignee filter"} value={filters.assignee} items={assigneeItems} onValueChange={(value) => set("assignee", value)} />
        <WorklogFilterSelect ariaLabel={isFa ? "فیلتر وضعیت" : "Status filter"} value={filters.status} items={statusItems} onValueChange={(value) => set("status", value)} />
        <WorklogFilterSelect ariaLabel={isFa ? "فیلتر نوع" : "Issue type filter"} value={filters.type} items={typeItems} onValueChange={(value) => set("type", value)} />
        <WorklogFilterSelect ariaLabel={isFa ? "فیلتر فعالیت" : "Activity filter"} value={filters.activity} items={activityItems} onValueChange={(value) => set("activity", value as WorklogFilters["activity"])} />
        <WorklogFilterSelect ariaLabel={isFa ? "فیلتر Estimate" : "Estimate filter"} value={filters.estimate} items={estimateItems} onValueChange={(value) => set("estimate", value as WorklogFilters["estimate"])} />
        {activeFilters ? <Button variant="ghost" size="sm" className="h-10" onClick={clearFilters}><X className="size-3.5" />{isFa ? "پاک کردن" : "Clear"}</Button> : null}
      </div> : null}

      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2 text-[11px] text-muted-foreground">
        <span>{visible.length} / {scopedIssues.length} {isFa ? "قابل مشاهده" : "visible"}</span>
        {chips.map((chip) => <Badge key={chip} variant="outline" className="bg-background px-1.5 py-0 font-normal">{chip}</Badge>)}
        <span className="ms-auto"><strong className="text-foreground">{selectedKeys.size}</strong> {isFa ? "انتخاب" : "selected"}</span>
      </div>

      {view !== "table" ? <div className="flex items-center gap-2 border-b bg-muted/[0.08] px-3 py-2"><Button variant="outline" size="sm" onClick={() => toggleAllVisible(true)} disabled={!visible.length || allVisibleSelected}><CheckSquare2 className="size-3.5" />{isFa ? "انتخاب نمایان" : "Select visible"}</Button><Button variant="ghost" size="sm" onClick={() => onSelectedKeysChange(new Set())} disabled={!selectedKeys.size}>{isFa ? "پاک کردن انتخاب" : "Clear selection"}</Button>{someVisibleSelected ? <span className="text-[11px] text-muted-foreground">{selectedVisibleCount}/{visible.length}</span> : null}</div> : null}

      {view === "table" ? <WorklogIssueTable locale={locale} issues={visible} selectedKeys={selectedKeys} loggedMinutesByIssue={loggedMinutesByIssue} allVisibleSelected={allVisibleSelected} someVisibleSelected={someVisibleSelected} onToggle={toggle} onToggleAll={toggleAllVisible} /> : null}
      {view === "board" ? <WorklogIssueBoard locale={locale} issues={visible} columns={boardColumns.columns} columnsSource={boardColumns.source} columnsLoading={boardColumns.loading} selectedKeys={selectedKeys} loggedMinutesByIssue={loggedMinutesByIssue} onToggle={toggle} /> : null}
      {view === "cards" ? <WorklogIssueCards locale={locale} issues={visible} selectedKeys={selectedKeys} loggedMinutesByIssue={loggedMinutesByIssue} onToggle={toggle} /> : null}
    </section>
  )
}
