import { type ChangeEvent } from "react"
import { Bookmark, ChevronLeft, ChevronRight, CircleDot, Eye, History, Inbox, Layers3, Leaf, List, ListChecks, LoaderCircle, Play, RefreshCcw, TimerReset, Save, Search, SlidersHorizontal, SquareKanban, Trash2, UserCheck, UsersRound, XCircle } from "lucide-react"
import { SimpleSelect, SprintVisual } from "@/components/jira-controls"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ContextItem, BoardContextItem } from "@/features/review/ReviewContext"
import { cn } from "@/lib/utils"
import { LiveIssueCard, LiveIssueListRow } from "./LiveIssueViews"
import { ManagePowerTools } from "./ManagePowerTools"
import type { ManageJiraScreenProps } from "./manage-types"
import { useManageJiraModel } from "./useManageJiraModel"

type ManageJiraViewProps = ManageJiraScreenProps & ReturnType<typeof useManageJiraModel>

export function ManageJiraView(args: ManageJiraViewProps) {
  const { t, locale, project, boards, selectedBoardId, boardLoading, onBoardChange, sprints, issues, selectedKeys, scope, setScope, search, setSearch, loading, message, onRefresh, onMove, onAssignToMe, onBulkEdit, onWorklog, onPreparePowerTool, savedActions, onUseSavedAction, onDeleteSavedAction, onDeleteView, onOpenIssue, historyCount, onHistory, onDelete, draggedKey, setDraggedKey, overLane, setOverLane, moveTarget, view, setView, filtersOpen, setFiltersOpen, saveViewOpen, setSaveViewOpen, saveViewName, setSaveViewName, typeFilter, setTypeFilter, priorityFilter, setPriorityFilter, statusFilter, setStatusFilter, assigneeFilter, setAssigneeFilter, sprintFilter, setSprintFilter, labelFilter, setLabelFilter, estimateFilter, setEstimateFilter, myIssuesOnly, setMyIssuesOnly, setPage, pageSize, setPageSize, currentUser, matchingSavedViews, createdIssues, activeFilterCount, visibleIssues, hasActiveFiltering, createdScopeCount, boardScopeCount, pageCount, safePage, pageIssues, groups, allPageSelected, allMatchingSelected, moveItems, toggle, moveSelection, clearFilters, applySavedView, saveCurrentView, selectPage, selectMatching, filterItems } = args
return (
  <div className="qm-screen animate-in fade-in slide-in-from-bottom-2 duration-200">
    <div className="qm-page-heading qm-page-heading-row flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="qm-eyebrow">WORKFLOW</div>
        <h1 className="qm-page-title">{t.manageTitle}</h1>
        <p className="qm-page-subtitle">{t.manageHint}</p>
      </div>
      <div className="qm-heading-actions flex flex-wrap items-center gap-3">
        <div className="qm-scope-control">
          <div className="qm-scope-switch" role="group" aria-label={locale === "fa" ? "محدوده نمایش" : "Issue scope"}>
            <Button
              variant="ghost"
              size="sm"
              data-scope-active={scope === "created"}
              aria-pressed={scope === "created"}
              onClick={() => setScope("created")}
              disabled={!createdIssues.length}
              title={locale === "fa" ? "فقط تسک‌های ساخته‌شده در آخرین دسته" : "Only issues from the last created batch"}
            >
              <span>{t.createdBatch}</span>
              <Badge variant="secondary" className="qm-scope-count">{createdScopeCount}</Badge>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              data-scope-active={scope === "board"}
              aria-pressed={scope === "board"}
              onClick={() => setScope("board")}
              title={locale === "fa" ? "همه تسک‌های بورد فعلی" : "All issues on the current board"}
            >
              <span>{t.wholeBoard}</span>
              <Badge variant="secondary" className="qm-scope-count">{boardScopeCount}</Badge>
            </Button>
          </div>
          {hasActiveFiltering ? <div className="qm-scope-filter-note">{locale === "fa" ? "فیلترها هنگام تغییر محدوده فعال می‌مانند" : "Filters stay active when switching scope"}</div> : null}
        </div>
        <Button variant="outline" onClick={onHistory}><History className="size-4" />{t.history}{historyCount ? <Badge variant="secondary" className="ms-1 min-w-5 justify-center px-1.5">{historyCount}</Badge> : null}</Button>
        <Button variant="outline" onClick={onRefresh} disabled={loading}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}{t.refreshBoard}</Button>
      </div>
    </div>

    <section className="qm-manage-summary mb-5 rounded-xl border bg-card px-3 py-3 shadow-none">
      <div className="flex flex-wrap items-center text-sm">
        <div className="qm-context-items flex min-w-0 flex-1 flex-wrap">
          <ContextItem label={t.project} value={project ? `${project.key} - ${project.name}` : "-"} icon={Layers3} />
          <BoardContextItem label={t.board} boards={boards} value={selectedBoardId} onValueChange={onBoardChange} disabled={boardLoading || !boards.length} />
          <ContextItem label={t.issues} value={String(visibleIssues.length)} icon={ListChecks} />
        </div>
        {issues.length > 100 ? <span className="qm-context-note ms-auto inline-flex max-w-sm items-center gap-2 px-5 py-1.5 text-xs text-primary"><List className="size-3.5" />{t.largeBoardHint}</span> : <span className="qm-context-note ms-auto max-w-[300px] px-5 py-1.5 text-xs leading-5 text-muted-foreground">{t.postCreateHelp}</span>}
      </div>
      {view === "board" ? <div className="sr-only"><span>{t.dragHint}</span></div> : null}
      {message ? <div className="mt-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs">{message}</div> : null}
    </section>

    {savedActions.length ? (
      <section className="mb-4 rounded-xl border bg-card p-3 shadow-none">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex shrink-0 items-center gap-2"><Bookmark className="size-4 text-primary" /><span className="text-sm font-semibold">{t.savedActions}</span><Badge variant="secondary">{savedActions.length}</Badge></div>
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 xl:justify-end">
            {savedActions.slice(0, 8).map((action) => (
              <div key={action.id} className="inline-flex shrink-0 items-center rounded-lg border bg-background">
                <Button variant="ghost" size="sm" className="rounded-e-none" onClick={() => onUseSavedAction(action)} disabled={!selectedKeys.size} title={!selectedKeys.size ? t.selectIssuesFirst : action.name}><Play className={cn("size-3.5", locale === "fa" && "rotate-180")} /><span className="max-w-40 truncate">{action.name}</span></Button>
                <Button variant="ghost" size="icon-sm" className="rounded-s-none border-s text-muted-foreground hover:text-destructive" onClick={() => onDeleteSavedAction(action.id)} aria-label={t.deleteAction} title={t.deleteAction}><Trash2 className="size-3.5" /></Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    ) : null}

    <ManagePowerTools locale={locale} issues={visibleIssues} selectedKeys={selectedKeys} currentUserIdentity={args.metadata?.user?.name || args.metadata?.user?.key} onPrepare={onPreparePowerTool} />

    <section className="mb-4 rounded-xl border bg-card p-3 shadow-none">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex shrink-0 items-center gap-2">
          <Eye className="size-4 text-primary" />
          <span className="text-sm font-semibold">{locale === "fa" ? "نماهای ذخیره شده" : "Saved views"}</span>
          {matchingSavedViews.length ? <Badge variant="secondary">{matchingSavedViews.length}</Badge> : null}
        </div>
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 xl:justify-end">
          {matchingSavedViews.map((saved) => (
            <div key={saved.id} className="inline-flex shrink-0 items-center rounded-lg border bg-background">
              <Button variant="ghost" size="sm" className="rounded-e-none" onClick={() => applySavedView(saved)}><Eye className="size-3.5" /><span className="max-w-40 truncate">{saved.name}</span></Button>
              <Button variant="ghost" size="icon-sm" className="rounded-s-none border-s text-muted-foreground hover:text-destructive" onClick={() => onDeleteView(saved.id)} aria-label={locale === "fa" ? "حذف نما" : "Delete view"}><Trash2 className="size-3.5" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => setSaveViewOpen(true)}><Save className="size-3.5" />{locale === "fa" ? "ذخیره نمای فعلی" : "Save current view"}</Button>
        </div>
      </div>
    </section>

    <section className="qm-manage-panel rounded-xl border bg-card shadow-none">
      <div className="border-b p-3">
        <div className="grid gap-2 lg:grid-cols-[minmax(260px,1fr)_auto] lg:items-center">
          <div className="relative min-w-0">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} placeholder={t.searchIssues} className="ps-9" />
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Button variant={myIssuesOnly ? "secondary" : "outline"} size="sm" onClick={() => setMyIssuesOnly((value) => !value)} aria-pressed={myIssuesOnly}><UserCheck className="size-4" />{t.myIssues}</Button>
            <Button variant={filtersOpen || activeFilterCount ? "secondary" : "outline"} size="sm" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen}><SlidersHorizontal className="size-4" />{t.filtersLabel}{activeFilterCount ? <Badge className="ms-1 px-1.5 py-0">{activeFilterCount}</Badge> : null}</Button>
            <span className="qm-toolbar-divider" aria-hidden="true" />
            <Button variant="outline" size="icon" className="qm-view-toggle" onClick={() => setView((current) => current === "board" ? "list" : "board")} aria-label={view === "board" ? t.listView : t.boardViewLive} title={view === "board" ? t.listView : t.boardViewLive}>
              {view === "board" ? <SquareKanban className="size-4" /> : <List className="size-4" />}
            </Button>
          </div>
        </div>

        {filtersOpen ? (
          <div className="mt-3 grid gap-2 rounded-xl border bg-muted/10 p-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
            <SimpleSelect value={typeFilter} onValueChange={setTypeFilter} items={filterItems.type} />
            <SimpleSelect value={priorityFilter} onValueChange={setPriorityFilter} items={filterItems.priority} />
            <SimpleSelect value={statusFilter} onValueChange={setStatusFilter} items={filterItems.status} />
            <SimpleSelect value={assigneeFilter} onValueChange={setAssigneeFilter} items={filterItems.assignee} />
            <SimpleSelect value={sprintFilter} onValueChange={setSprintFilter} items={filterItems.sprint} />
            <SimpleSelect value={labelFilter} onValueChange={setLabelFilter} items={filterItems.label} />
            <SimpleSelect value={estimateFilter} onValueChange={setEstimateFilter} items={filterItems.estimate} />
            {activeFilterCount ? <div className="sm:col-span-2 xl:col-span-4 2xl:col-span-7 flex justify-end"><Button variant="ghost" size="sm" onClick={clearFilters}><XCircle className="size-4" />{t.clearFilters}</Button></div> : null}
          </div>
        ) : null}

      </div>

      <div className="qm-manage-selection review-sticky-actions flex flex-wrap items-center gap-2">
          <Badge variant={selectedKeys.size ? "default" : "secondary"} className="min-w-8 justify-center">{selectedKeys.size}</Badge>
          <span className="text-sm font-medium">{t.selected}</span>
          <span className="qm-mini-divider" aria-hidden="true" />
          <Button variant="ghost" size="sm" onClick={selectPage}>{allPageSelected ? t.clearSelection : t.selectVisible}</Button>
          {visibleIssues.length > pageIssues.length ? <Button variant="ghost" size="sm" onClick={selectMatching}>{allMatchingSelected ? t.clearSelection : `${t.selectMatching} (${visibleIssues.length})`}</Button> : null}
          <div className="ms-auto hidden items-center gap-2 lg:flex">
            <SimpleSelect value={moveTarget} onValueChange={moveSelection} className="min-w-[220px]" placeholder={t.moveSelected} disabled={!selectedKeys.size} items={moveItems} />
            <Button variant="outline" size="sm" onClick={onAssignToMe} disabled={!selectedKeys.size || !currentUser}><UserCheck className="size-4" />{t.assignToMe}</Button>
            <Button variant="outline" size="sm" onClick={onBulkEdit} disabled={!selectedKeys.size}><UsersRound className="size-4" />{t.bulkEdit}</Button>
            <Button variant="outline" size="sm" onClick={onWorklog} disabled={!selectedKeys.size}><TimerReset className="size-4" />{locale === "fa" ? "ثبت زمان" : "Log work"}</Button>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete} disabled={!selectedKeys.size}><Trash2 className="size-4" />{t.deleteSelected}</Button>
          </div>
        </div>

      <div className="p-3 sm:p-4">
        {loading ? (
          <div className="grid min-h-56 place-items-center rounded-xl border border-dashed bg-muted/10 text-sm text-muted-foreground"><LoaderCircle className="me-2 inline size-4 animate-spin" />{t.boardLoading}</div>
        ) : !visibleIssues.length ? (
          <div className="grid min-h-56 place-items-center rounded-xl border border-dashed bg-muted/10 px-6 text-center">
            <div className="max-w-md">
              <SlidersHorizontal className="mx-auto mb-3 size-5 text-muted-foreground" />
              <div className="text-sm font-medium text-foreground">
                {hasActiveFiltering
                  ? (locale === "fa" ? "در این محدوده، موردی با فیلترهای فعلی پیدا نشد." : "No issues in this scope match the current filters.")
                  : t.boardEmpty}
              </div>
              {hasActiveFiltering ? (
                <>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {locale === "fa"
                      ? `محدوده فعلی: ${scope === "created" ? t.createdBatch : t.wholeBoard}. می‌توانی محدوده را عوض کنی یا فیلترها را پاک کنی.`
                      : `Current scope: ${scope === "created" ? t.createdBatch : t.wholeBoard}. Switch scope or clear filters to broaden the results.`}
                  </div>
                  <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}><XCircle className="size-4" />{t.clearFilters}</Button>
                </>
              ) : null}
            </div>
          </div>
        ) : view === "list" ? (
          <div className="overflow-hidden rounded-xl border">
            <div className="hidden grid-cols-[34px_104px_minmax(280px,1fr)_120px_150px_145px_110px_52px] gap-3 border-b bg-muted/25 px-3 py-2 text-xs font-medium text-muted-foreground xl:grid">
              <span /><span>Key</span><span>{t.summary}</span><span>{t.status}</span><span>{t.assignee}</span><span>{t.placement}</span><span>{t.estimate}</span><span />
            </div>
            <div className="divide-y">
              {pageIssues.map((issue) => <LiveIssueListRow key={issue.key} issue={issue} selected={selectedKeys.has(issue.key)} locale={locale} t={t} onToggle={() => toggle(issue.key)} onOpenDetails={() => onOpenIssue(issue.key)} />)}
            </div>
            <div className="flex flex-col gap-2 border-t bg-muted/10 p-2.5 sm:flex-row sm:items-center">
              <div className="text-xs text-muted-foreground">{visibleIssues.length} {t.issues} · {t.page} {safePage} {t.of} {pageCount}</div>
              <div className="sm:ms-auto flex flex-wrap items-center gap-2">
                <SimpleSelect value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1) }} className="w-[120px]" items={[25, 50, 100].map((value) => ({ value: String(value), label: `${value} ${t.rowsPerPage}` }))} />
                <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft className="size-4" /></Button>
                <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={safePage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}><ChevronRight className="size-4" /></Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="board-scroll qm-board-lanes flex gap-3 overflow-x-auto pb-2">
            {groups.map((group) => {
              const targetSprint = group.sprint?.id ?? null
              const isOver = overLane === group.key
              return (
                <section
                  key={group.key}
                  className={cn("qm-board-lane min-w-[420px] flex-1 shrink-0 rounded-xl border bg-muted/18 p-3 transition-colors", group.sprint && "is-sprint", isOver && "border-primary/45 bg-primary/[0.04]")}
                  onDragOver={(event) => { if (draggedKey) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setOverLane(group.key) } }}
                  onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOverLane(null) }}
                  onDrop={(event) => {
                    event.preventDefault()
                    if (draggedKey) {
                      const keys = selectedKeys.has(draggedKey) && selectedKeys.size > 1 ? Array.from(selectedKeys) : [draggedKey]
                      onMove(keys, targetSprint)
                    }
                    setDraggedKey(null)
                    setOverLane(null)
                  }}
                >
                  <div className="qm-lane-heading mb-2 flex items-center gap-2 px-1">
                    {group.sprint ? <SprintVisual sprint={group.sprint} backlogLabel={t.backlog} compact /> : <span className="inline-flex items-center gap-2 font-medium"><span className="grid size-6 place-items-center rounded-md bg-muted"><Inbox className="size-3.5" /></span>{t.backlog}</span>}
                    <Badge variant="secondary" className="ms-auto">{group.entries.length}</Badge>
                  </div>
                  <div className="min-h-80 space-y-2">
                    {!group.entries.length ? <div className={cn("qm-empty-lane grid min-h-80 place-items-center rounded-lg border border-dashed bg-background/55 px-3 text-center text-sm text-muted-foreground", isOver && "border-primary/40 bg-primary/[0.04] text-primary")}><div>{isOver ? <><CircleDot className="mx-auto mb-3 size-5" /><div className="font-medium">{t.dragHint}</div></> : <><Leaf className="mx-auto mb-3 size-5 opacity-75" /><div className="font-medium text-foreground/70">{t.emptyLane}</div><div className="mt-2 text-xs opacity-80">{locale === "fa" ? "تسک‌ها را اینجا بکش یا از ستون دیگری منتقل کن." : "Drag issues here or move them from another lane."}</div></>}</div></div> : null}
                    {group.entries.map((issue) => (
                      <LiveIssueCard
                        key={issue.key}
                        issue={issue}
                        selected={selectedKeys.has(issue.key)}
                        locale={locale}
                        onToggle={() => toggle(issue.key)}
                        onOpenDetails={() => onOpenIssue(issue.key)}
                        onDragStart={() => setDraggedKey(issue.key)}
                        onDragEnd={() => { setDraggedKey(null); setOverLane(null) }}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </section>

    <Sheet open={saveViewOpen} onOpenChange={setSaveViewOpen}>
      <SheetContent side={locale === "fa" ? "left" : "right"} className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{locale === "fa" ? "ذخیره نمای فعلی" : "Save current view"}</SheetTitle>
          <SheetDescription>{locale === "fa" ? "جستجو، فیلترها، محدوده و نوع نمایش فعلی برای همین بورد ذخیره می‌شوند." : "Save the current search, filters, scope, and layout for this board."}</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <Field>
            <FieldLabel>{locale === "fa" ? "نام نما" : "View name"}</FieldLabel>
            <Input value={saveViewName} onChange={(event: ChangeEvent<HTMLInputElement>) => setSaveViewName(event.target.value)} placeholder={locale === "fa" ? "مثلا باگ‌های بدون مسئول" : "e.g. Unassigned bugs"} autoFocus />
          </Field>
          <div className="mt-4 rounded-xl border bg-muted/15 p-3 text-xs text-muted-foreground">
            {visibleIssues.length} {t.issues} · {activeFilterCount} {locale === "fa" ? "فیلتر فعال" : "active filters"} · {view === "board" ? (locale === "fa" ? "بورد" : "Board") : (locale === "fa" ? "لیست" : "List")}
          </div>
        </SheetBody>
        <SheetFooter>
          <Button variant="outline" onClick={() => setSaveViewOpen(false)}>{locale === "fa" ? "انصراف" : "Cancel"}</Button>
          <Button onClick={saveCurrentView} disabled={!saveViewName.trim()}><Save className="size-4" />{locale === "fa" ? "ذخیره" : "Save view"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>

  </div>
)
}
