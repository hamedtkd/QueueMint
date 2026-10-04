import { useMemo, useState, type ChangeEvent } from "react"
import { AlertCircle, Check, CheckCircle2, CircleDot, Clock3, Code2, Filter, Grid2X2, Grid3X3, Inbox, Layers3, List, ListChecks, Search, Settings2, SlidersHorizontal } from "lucide-react"
import { SimpleSelect } from "@/components/jira-controls"
import { priorityTone } from "@/components/priority"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DEFAULT_FILTER } from "@/features/bulk/bulk-utils"
import { copy } from "@/features/app-shell/app-copy"
import { cn } from "@/lib/utils"
import type { BulkIssue, BulkPayload, JiraBoard, JiraPriority, JiraSprint, JiraUser, ReviewLayout, ValidationResult } from "@/types"
import { ContextItem } from "./ReviewContext"
import { BoardLayout, groupIssues, IssueCard } from "./ReviewIssueBoard"
import { ReviewIssueTable } from "./ReviewIssueTable"
import { selectedVisibleCount, setVisibleSelection } from "./review-selection"

export function ReviewScreen({
  t,
  payload,
  issues,
  visibleEntries,
  selectedIndex,
  setSelectedIndex,
  selectedForCreate,
  toggleSelectedForCreate,
  setSelectedForCreate,
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  placementFilter,
  setPlacementFilter,
  issueTypes,
  sprints,
  priorities,
  users,
  reviewLayout,
  setReviewLayout,
  onEdit,
  onDuplicate,
  onDelete,
  onBatchSettings,
  onJson,
  onSendBacklog,
  onMoveSelected,
  onMoveIssue,
  contextPlacement,
  selectedBoard,
  validation,
  autoSprintNote,
  remoteNote,
}: {
  t: typeof copy.en | typeof copy.fa
  payload?: BulkPayload
  issues: BulkIssue[]
  visibleEntries: Array<{ issue: BulkIssue; index: number }>
  selectedIndex: number
  setSelectedIndex: (index: number) => void
  selectedForCreate: Set<number>
  toggleSelectedForCreate: (index: number) => void
  setSelectedForCreate: (next: Set<number>) => void
  search: string
  setSearch: (value: string) => void
  typeFilter: string
  setTypeFilter: (value: string) => void
  placementFilter: string
  setPlacementFilter: (value: string) => void
  issueTypes: Array<{ id: string; name: string }>
  sprints: JiraSprint[]
  priorities: JiraPriority[]
  users: JiraUser[]
  reviewLayout: ReviewLayout
  setReviewLayout: (layout: ReviewLayout) => void
  onEdit: (index: number) => void
  onDuplicate: (index: number) => void
  onDelete: (index: number) => void
  onBatchSettings: () => void
  onJson: () => void
  onSendBacklog: () => void
  onMoveSelected: (sprint: number | null) => void
  onMoveIssue: (index: number, sprint: number | null) => void
  contextPlacement: string
  selectedBoard?: JiraBoard
  validation: ValidationResult
  autoSprintNote: boolean
  remoteNote: string | null
}) {
  const grouped = useMemo(() => groupIssues(visibleEntries, payload, sprints), [visibleEntries, payload, sprints])
  const visibleIndexes = useMemo(() => visibleEntries.map((entry) => entry.index), [visibleEntries])
  const visibleSelectedCount = selectedVisibleCount(selectedForCreate, visibleIndexes)
  const allVisibleSelected = visibleIndexes.length > 0 && visibleSelectedCount === visibleIndexes.length
  const someVisibleSelected = visibleSelectedCount > 0
  const [moveTarget, setMoveTarget] = useState("")
  const moveItems = useMemo(() => [
    { value: "backlog", label: t.backlog },
    ...sprints.map((sprint) => ({ value: `sprint:${sprint.id}`, label: `${sprint.state === "active" ? "●" : "○"} ${sprint.name}` })),
  ], [sprints, t.backlog])

  function moveSelection(value: string) {
    if (!value) return
    if (value === "backlog") onMoveSelected(null)
    else if (value.startsWith("sprint:")) {
      const sprintId = Number(value.slice("sprint:".length))
      if (Number.isInteger(sprintId) && sprintId > 0) onMoveSelected(sprintId)
    }
    setMoveTarget("")
  }

  function toggleVisibleSelection(checked: boolean) {
    setSelectedForCreate(setVisibleSelection(selectedForCreate, visibleIndexes, checked))
  }

  return (
    <div className="qm-screen animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="qm-page-heading qm-page-heading-row flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="qm-eyebrow">WORKFLOW</div>
          <h1 className="qm-page-title">{t.reviewTitle}</h1>
          <p className="qm-page-subtitle">{t.reviewHint}</p>
        </div>
        <div className="qm-heading-actions flex items-center gap-3">
          <Button variant="outline" onClick={onJson}><Code2 className="size-4" />{t.rawJson}</Button>
          <Button variant="outline" onClick={onBatchSettings}><SlidersHorizontal className="size-4" />{t.batchSettings}</Button>
        </div>
      </div>

      <section className="context-summary qm-review-summary mb-5 overflow-hidden rounded-[var(--qm-panel-radius)] border px-3 py-3 sm:px-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="qm-context-items flex min-w-0 flex-1 flex-wrap">
            <ContextItem label={t.project} value={payload?.project ?? "—"} icon={Layers3} />
            <ContextItem label={t.board} value={selectedBoard?.name ?? "—"} icon={ListChecks} />
            <ContextItem label={t.placement} value={contextPlacement} icon={payload?.defaults?.sprint === undefined ? SlidersHorizontal : typeof payload.defaults.sprint === "number" ? CircleDot : Inbox} tone={typeof payload?.defaults?.sprint === "number" ? "success" : undefined} />
            <ContextItem label={t.priority} value={payload?.defaults?.priority ?? t.noDefault} icon={priorityTone(payload?.defaults?.priority).icon} />
            <ContextItem label={t.estimate} value={payload?.defaults?.estimate ?? t.noDefault} icon={Clock3} />
          </div>
          <div className="context-counts grid shrink-0 grid-cols-2 items-stretch">
            <div className="qm-context-count min-w-24 px-4 py-1.5 text-center">
              <div className="text-xl font-semibold tabular-nums">{issues.length}</div>
              <div className="text-[11px] text-muted-foreground">{t.issues}</div>
            </div>
            <div className="qm-context-count min-w-24 px-4 py-1.5 text-center">
              <div className="text-xl font-semibold tabular-nums text-primary">{selectedForCreate.size}</div>
              <div className="text-[11px] text-muted-foreground">{t.selected}</div>
            </div>
          </div>
        </div>
        {autoSprintNote || remoteNote ? (
          <div className="mt-3 flex items-start gap-2 border-t border-border/70 pt-2.5 text-xs text-muted-foreground">
            {autoSprintNote ? <><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" /><span>{t.autoSprint}</span></> : <><AlertCircle className="mt-0.5 size-3.5 shrink-0" /><span>{remoteNote}</span></>}
          </div>
        ) : null}
      </section>

      <section className="qm-review-panel rounded-[var(--qm-panel-radius)] border bg-card shadow-none">
        <div className="qm-filter-row border-b p-3">
          <div className="qm-review-toolbar grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_190px_190px_auto] xl:items-center">
            <div className="relative min-w-0">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} placeholder={t.searchIssues} className="ps-9" />
            </div>
            <SimpleSelect value={typeFilter} onValueChange={setTypeFilter} className="qm-toolbar-field" items={[{ value: DEFAULT_FILTER, label: t.allTypes }, ...issueTypes.map((type) => ({ value: type.name.toLowerCase(), label: type.name }))]} />
            <SimpleSelect value={placementFilter} onValueChange={setPlacementFilter} className="qm-toolbar-field" items={[{ value: DEFAULT_FILTER, label: t.allPlacements }, { value: "sprint", label: t.sprintOnly }, { value: "backlog", label: t.backlogOnly }]} />
            <div className="qm-view-toggle-group inline-flex w-fit border bg-background xl:justify-self-end">
              <Button variant={reviewLayout === "board" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setReviewLayout("board")} aria-label={t.boardView}><Grid2X2 className="size-4" /></Button>
              <Button variant={reviewLayout === "list" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setReviewLayout("list")} aria-label={t.list}><List className="size-4" /></Button>
              <Button variant={reviewLayout === "grid" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setReviewLayout("grid")} aria-label={t.grid}><Grid3X3 className="size-4" /></Button>
            </div>
          </div>

        </div>

        <div className={cn("review-sticky-actions selection-dock qm-selection-row mx-2 mt-2 flex flex-col gap-3 rounded-[var(--qm-panel-radius)] border px-3 py-2.5 sm:mx-3 lg:flex-row lg:items-center", selectedForCreate.size ? "is-active" : "")}>
          <div className="flex min-w-0 items-center gap-3">
            <span className={cn("qm-selection-check grid size-6 shrink-0 place-items-center rounded-[var(--qm-control-radius)] border", selectedForCreate.size ? "border-primary bg-primary text-primary-foreground" : "bg-background text-transparent")}> <Check className="size-3.5" /> </span>
            <span className="text-sm font-semibold"><span className="tabular-nums">{selectedForCreate.size}</span> {t.selected}</span>
            {reviewLayout !== "list" ? <><span className="qm-mini-divider" aria-hidden="true" /><Button variant="ghost" size="sm" className="h-8 px-1.5" onClick={() => toggleVisibleSelection(!allVisibleSelected)}>{allVisibleSelected ? t.clearSelection : t.selectAll}</Button></> : null}
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:justify-end">
            <Button variant="outline" className="qm-selection-control" onClick={onBatchSettings}><Settings2 className="size-4" />{t.batchSettings}</Button>
            <SimpleSelect value={moveTarget} onValueChange={moveSelection} className="qm-selection-control min-w-[190px] flex-1 lg:w-[240px] lg:flex-none" placeholder={t.moveSelected} disabled={!selectedForCreate.size} items={moveItems} />
            <Button variant="outline" className="qm-selection-control" onClick={onSendBacklog} disabled={!selectedForCreate.size}><Inbox className="size-4" />{t.backlog}</Button>
          </div>
        </div>

        <div className="p-3 sm:p-4">
          {!visibleEntries.length ? (
            <div className="grid min-h-52 place-items-center rounded-[var(--qm-panel-radius)] border border-dashed bg-muted/10 text-center">
              <div><Filter className="mx-auto mb-2 size-5 text-muted-foreground" /><div className="text-sm font-medium">{t.noIssues}</div></div>
            </div>
          ) : reviewLayout === "board" ? (
            <BoardLayout
              groups={grouped}
              payload={payload}
              selectedIndex={selectedIndex}
              selectedForCreate={selectedForCreate}
              priorities={priorities}
              sprints={sprints}
              users={users}
              t={t}
              onSelect={setSelectedIndex}
              onToggle={toggleSelectedForCreate}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onMoveIssue={onMoveIssue}
            />
          ) : reviewLayout === "list" ? (
            <ReviewIssueTable
              entries={visibleEntries}
              payload={payload}
              selectedIndex={selectedIndex}
              selectedForCreate={selectedForCreate}
              sprints={sprints}
              users={users}
              allVisibleSelected={allVisibleSelected}
              someVisibleSelected={someVisibleSelected}
              t={t}
              onSelect={setSelectedIndex}
              onToggle={toggleSelectedForCreate}
              onToggleAll={toggleVisibleSelection}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          ) : (
            <div className="review-grid">
              {visibleEntries.map(({ issue, index }) => (
                <IssueCard
                  key={`${issue.ref ?? issue.summary}-${index}`}
                  issue={issue}
                  index={index}
                  payload={payload}
                  selected={selectedIndex === index}
                  checked={selectedForCreate.has(index)}
                  priorities={priorities}
                  sprints={sprints}
                  users={users}
                  layout="grid"
                  t={t}
                  onSelect={() => setSelectedIndex(index)}
                  onToggle={() => toggleSelectedForCreate(index)}
                  onEdit={() => onEdit(index)}
                  onDuplicate={() => onDuplicate(index)}
                  onDelete={() => onDelete(index)}
                />
              ))}
            </div>
          )}
        </div>

        {validation.errors.length || validation.warnings.length ? (
          <div className="border-t px-4 py-3 text-xs">
            <span className={validation.errors.length ? "font-medium text-destructive" : "font-medium text-success"}>{validation.errors.length} {t.errors}</span>
            <span className="mx-2 text-border">•</span>
            <span className="text-warning">{validation.warnings.length} {t.warnings}</span>
          </div>
        ) : null}
      </section>
    </div>
  )
}
