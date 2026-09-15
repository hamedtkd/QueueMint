import { Bolt, Bookmark, CircleDot, Clock3, Command, FileJson, Inbox, ListChecks, LoaderCircle, Play, RefreshCcw, Rocket, Sparkles, SquareKanban, Trash2, Upload, UserRound, WandSparkles } from "lucide-react"

import { BoardSelect, ProjectCombobox } from "@/components/jira-controls"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { copy } from "@/features/app-shell/app-copy"
import type { Mode } from "@/features/bulk/bulk-utils"
import type { SavedWorkspaceAction } from "@/lib/storage"
import { cn } from "@/lib/utils"
import type { AppLocale, JiraBoard, JiraLiveIssue, JiraProject, JiraSprint } from "@/types"

export function WorkspaceDashboard({
  t,
  locale,
  project,
  projects,
  selectedProjectKey,
  boards,
  selectedBoardId,
  board,
  sprints,
  issues,
  draftIssueCount,
  selectedCount,
  lastCreatedCount,
  savedActions,
  loading,
  contextLoading,
  onRefresh,
  onProjectChange,
  onBoardChange,
  onMode,
  onCommands,
  onUseAction,
  onDeleteAction,
}: {
  t: typeof copy.en | typeof copy.fa
  locale: AppLocale
  project: JiraProject | null
  projects: JiraProject[]
  selectedProjectKey?: string
  boards: JiraBoard[]
  selectedBoardId: number | null
  board?: JiraBoard
  sprints: JiraSprint[]
  issues: JiraLiveIssue[]
  draftIssueCount: number
  selectedCount: number
  lastCreatedCount: number
  savedActions: SavedWorkspaceAction[]
  loading: boolean
  contextLoading: boolean
  onRefresh: () => void
  onProjectChange: (projectKey: string) => void
  onBoardChange: (boardId: number) => void
  onMode: (mode: Mode) => void
  onCommands: () => void
  onUseAction: (action: SavedWorkspaceAction) => void
  onDeleteAction: (id: string) => void
}) {
  const activeSprint = sprints.find((sprint) => sprint.state === "active")
  const activeSprintCount = activeSprint ? issues.filter((issue) => issue.placement === "sprint" && issue.sprintId === activeSprint.id).length : 0
  const backlogCount = issues.filter((issue) => issue.placement === "backlog").length
  const unassignedCount = issues.filter((issue) => !issue.assignee).length
  const unestimatedCount = issues.filter((issue) => {
    if (typeof issue.storyPoints === "number") return false
    return !((issue.remainingEstimateSeconds ?? 0) > 0 || (issue.originalEstimateSeconds ?? 0) > 0)
  }).length

  const statCards = [
    { id: "active", label: t.activeSprintIssues, value: activeSprintCount, icon: CircleDot, detail: activeSprint?.name ?? t.noDefault },
    { id: "backlog", label: t.backlogIssues, value: backlogCount, icon: Inbox, detail: board?.name ?? t.board },
    { id: "unassigned", label: t.unassignedIssues, value: unassignedCount, icon: UserRound, detail: `${issues.length} ${t.issues}` },
    { id: "unestimated", label: t.unestimatedIssues, value: unestimatedCount, icon: Clock3, detail: `${issues.length} ${t.issues}` },
  ]

  function actionSummary(action: SavedWorkspaceAction) {
    const parts: string[] = []
    if (action.issueType) parts.push(action.issueType)
    if (action.priority) parts.push(action.priority)
    if (action.assignee !== undefined) parts.push(action.assignee === null ? t.unassign : t.assignee)
    if (action.placement === "backlog") parts.push(t.backlog)
    if (action.placement === "sprint") parts.push(sprints.find((item) => item.id === action.sprintId)?.name ?? t.sprint)
    if (action.storyPoints) parts.push(`${action.storyPoints} SP`)
    if (action.originalEstimate) parts.push(action.originalEstimate)
    if (action.dynamicEdits && Object.keys(action.dynamicEdits).length) parts.push(`+${Object.keys(action.dynamicEdits).length} ${t.dynamicFields}`)
    return parts.slice(0, 4).join(" · ") || t.noChange
  }

  return (
    <div className="qm-screen animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="qm-page-heading qm-page-heading-row flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="qm-eyebrow">WORKSPACE</div>
          <h1 className="qm-page-title">{t.workspaceTitle}</h1>
          <p className="qm-page-subtitle">{t.workspaceHint}</p>
        </div>
        <div className="qm-heading-actions flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={onCommands}><Command className="size-4" />{t.commandPalette}<kbd className="ms-1 rounded border bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground">Ctrl/⌘ Shift K</kbd></Button>
          <Button variant="outline" onClick={onRefresh} disabled={loading || !board}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}{t.refreshWorkspace}</Button>
        </div>
      </div>

      <section className="mb-5 rounded-2xl border bg-card p-4 shadow-none sm:p-5">
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,.9fr)_auto] xl:items-end">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/[0.07] text-primary"><SquareKanban className="size-5" /></div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">{t.boardOverview}</div>
              <div className="mt-1 truncate text-lg font-semibold">{project ? `${project.key} - ${project.name}` : t.project} · {board?.name ?? t.board}</div>
              <div className="mt-1 text-xs text-muted-foreground">{issues.length} {t.issues}{selectedCount ? ` · ${selectedCount} ${t.selected}` : ""}{lastCreatedCount ? ` · ${lastCreatedCount} ${t.lastCreated}` : ""}</div>
            </div>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <Field className="min-w-0">
              <FieldLabel>{t.project}</FieldLabel>
              <ProjectCombobox
                projects={projects}
                value={selectedProjectKey}
                onValueChange={onProjectChange}
                placeholder={t.projectSearch}
                emptyLabel={t.projectEmpty}
                disabled={contextLoading || !projects.length}
              />
            </Field>
            <Field className="min-w-0">
              <FieldLabel>{t.board}</FieldLabel>
              <BoardSelect
                boards={boards}
                value={selectedBoardId}
                onValueChange={onBoardChange}
                disabled={contextLoading || !boards.length}
              />
            </Field>
          </div>

          <Button className="w-full xl:w-auto" onClick={() => onMode("manage")}><SquareKanban className="size-4" />{t.openManager}</Button>
        </div>
      </section>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ id, label, value, icon: Icon, detail }) => (
          <button key={id} type="button" onClick={() => onMode("manage")} className="rounded-2xl border bg-card p-4 text-start transition-colors hover:border-primary/25 hover:bg-primary/[0.02]">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted/55 text-muted-foreground"><Icon className="size-4" /></span>
              <span className="min-w-0 flex-1"><span className="block text-xs text-muted-foreground">{label}</span><span className="mt-1 block text-2xl font-semibold tabular-nums">{value}</span><span className="mt-1 block truncate text-[11px] text-muted-foreground">{detail}</span></span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
        <section className="min-w-0 rounded-2xl border bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Bookmark className="size-4" /></div>
            <div className="min-w-0 flex-1"><h2 className="text-base font-semibold">{t.savedActions}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{t.savedActionsHint}</p></div>
          </div>
          {!savedActions.length ? (
            <div className="grid min-h-40 place-items-center rounded-xl border border-dashed bg-muted/10 px-6 text-center text-sm text-muted-foreground">{t.noSavedActions}</div>
          ) : (
            <div className="space-y-2">
              {savedActions.slice(0, 6).map((action) => (
                <div key={action.id} className="flex items-center gap-3 rounded-xl border bg-background p-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted/50 text-muted-foreground"><WandSparkles className="size-4" /></div>
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{action.name}</div><div className="mt-0.5 truncate text-[11px] text-muted-foreground">{actionSummary(action)}</div></div>
                  <Button variant="outline" size="sm" onClick={() => onUseAction(action)}><Play className={cn("size-3.5", locale === "fa" && "rotate-180")} />{t.useAction}</Button>
                  <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => onDeleteAction(action.id)} aria-label={t.deleteAction} title={t.deleteAction}><Trash2 className="size-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="min-w-0 overflow-hidden rounded-2xl border bg-card p-4 sm:p-5">
          <div className="mb-4 flex min-w-0 items-start gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted/55 text-muted-foreground"><Rocket className="size-4" /></div><div className="min-w-0"><h2 className="text-base font-semibold">{t.quickActions}</h2><p className="mt-1 text-xs text-muted-foreground">{t.commandPaletteHint}</p></div></div>
          <div className="grid min-w-0 gap-2">
            <Button variant="outline" className="h-auto w-full min-w-0 justify-start gap-3 overflow-hidden whitespace-normal px-3 py-3" onClick={() => onMode("quick")}><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Bolt className="size-4" /></span><span className="min-w-0 flex-1 text-start"><span className="block truncate text-sm font-medium">{t.openQuickIssue}</span><span className="mt-0.5 block whitespace-normal break-words text-[11px] font-normal leading-4 text-muted-foreground">{t.quickHint}</span></span></Button>
            <Button variant="outline" className="h-auto w-full min-w-0 justify-start gap-3 overflow-hidden whitespace-normal px-3 py-3" onClick={() => onMode("bulk")}><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted/50 text-muted-foreground"><FileJson className="size-4" /></span><span className="min-w-0 flex-1 text-start"><span className="block truncate text-sm font-medium">{t.openImport}</span><span className="mt-0.5 block whitespace-normal break-words text-[11px] font-normal leading-4 text-muted-foreground">{t.bulkHint}</span></span></Button>
            <Button variant="outline" className="h-auto w-full min-w-0 justify-start gap-3 overflow-hidden whitespace-normal px-3 py-3" onClick={() => onMode("review")} disabled={!draftIssueCount}><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted/50 text-muted-foreground"><ListChecks className="size-4" /></span><span className="min-w-0 flex-1 text-start"><span className="block truncate text-sm font-medium">{t.openReview}</span><span className="mt-0.5 block whitespace-normal break-words text-[11px] font-normal leading-4 text-muted-foreground">{t.reviewHint}</span></span></Button>
            <Button variant="outline" className="h-auto w-full min-w-0 justify-start gap-3 overflow-hidden whitespace-normal px-3 py-3" onClick={() => onMode("worklog")}><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Clock3 className="size-4" /></span><span className="min-w-0 flex-1 text-start"><span className="block truncate text-sm font-medium">{locale === "fa" ? "دستیار ثبت زمان" : "Worklog Assistant"}</span><span className="mt-0.5 block whitespace-normal break-words text-[11px] font-normal leading-4 text-muted-foreground">{locale === "fa" ? "زمان امروز را تکمیل کن یا روی انتخاب‌ها Worklog بزن." : "Complete today or log work on selected issues."}</span></span></Button>
            <Button variant="outline" className="h-auto w-full min-w-0 justify-start gap-3 overflow-hidden whitespace-normal px-3 py-3" onClick={() => onMode("automation")}><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Sparkles className="size-4" /></span><span className="min-w-0 flex-1 text-start"><span className="block truncate text-sm font-medium">{locale === "fa" ? "اتوماسیون" : "Automations"}</span><span className="mt-0.5 block whitespace-normal break-words text-[11px] font-normal leading-4 text-muted-foreground">{locale === "fa" ? "قوانین امن، پیشنهاد مسئول و تاریخچه فعالیت" : "Safe rules, smart assignment, and activity history."}</span></span></Button>
            <Button variant="outline" className="h-auto w-full min-w-0 justify-start gap-3 overflow-hidden whitespace-normal px-3 py-3" onClick={() => onMode("manage")}><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted/50 text-muted-foreground"><SquareKanban className="size-4" /></span><span className="min-w-0 flex-1 text-start"><span className="block truncate text-sm font-medium">{t.openManager}</span><span className="mt-0.5 block whitespace-normal break-words text-[11px] font-normal leading-4 text-muted-foreground">{t.manageHint}</span></span></Button>
          </div>
        </section>
      </div>
    </div>
  )
}
