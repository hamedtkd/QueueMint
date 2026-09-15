import { useState, type MouseEvent } from "react"
import { Check, CircleDot, Clock3, Copy, GripVertical, Inbox, Leaf, Pencil, TimerReset, Trash2, UserRound } from "lucide-react"
import { SprintVisual } from "@/components/jira-controls"
import { priorityTone } from "@/components/priority"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { copy } from "@/features/app-shell/app-copy"
import { cn } from "@/lib/utils"
import type { BulkIssue, BulkPayload, JiraPriority, JiraSprint, ReviewLayout } from "@/types"

export function IssueSelectionToggle({ selected, onToggle, label, className }: { selected: boolean; onToggle: () => void; label: string; className?: string }) {
  return (
    <button
      type="button"
      className={cn("issue-selection group/selection grid size-7 shrink-0 place-items-center rounded-lg outline-none transition-colors hover:bg-muted/70 focus-visible:ring-[3px] focus-visible:ring-ring/25", className)}
      onClick={(event) => { event.stopPropagation(); onToggle() }}
      aria-pressed={selected}
      aria-label={label}
    >
      <span className={cn("grid size-5 place-items-center rounded-[6px] border shadow-xs transition-[border-color,background-color,color,box-shadow]", selected ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-input bg-background text-transparent group-hover/selection:border-primary/45")}>
        <Check className="size-3" />
      </span>
    </button>
  )
}

export function groupIssues(entries: Array<{ issue: BulkIssue; index: number }>, payload: BulkPayload | undefined, sprints: JiraSprint[]) {
  const groups = new Map<string, { key: string; label: string; sprint?: JiraSprint; entries: typeof entries }>()
  const orderedSprints = [...sprints].sort((a, b) => (a.state === "active" ? 0 : 1) - (b.state === "active" ? 0 : 1) || a.name.localeCompare(b.name))

  for (const sprint of orderedSprints) groups.set(`sprint:${sprint.id}`, { key: `sprint:${sprint.id}`, label: sprint.name, sprint, entries: [] })
  groups.set("backlog", { key: "backlog", label: "Backlog", entries: [] })

  for (const entry of entries) {
    const effective = entry.issue.sprint !== undefined ? entry.issue.sprint : payload?.defaults?.sprint
    const sprint = typeof effective === "number" ? sprints.find((item) => item.id === effective) : undefined
    const key = sprint ? `sprint:${sprint.id}` : "backlog"
    const group = groups.get(key) ?? { key, label: sprint?.name ?? "Backlog", sprint, entries: [] }
    group.entries.push(entry)
    groups.set(key, group)
  }

  return Array.from(groups.values())
}

export function BoardLayout({ groups, payload, selectedIndex, selectedForCreate, priorities, sprints, t, onSelect, onToggle, onEdit, onDuplicate, onDelete, onMoveIssue }: {
  groups: ReturnType<typeof groupIssues>
  payload?: BulkPayload
  selectedIndex: number
  selectedForCreate: Set<number>
  priorities: JiraPriority[]
  sprints: JiraSprint[]
  t: typeof copy.en | typeof copy.fa
  onSelect: (index: number) => void
  onToggle: (index: number) => void
  onEdit: (index: number) => void
  onDuplicate: (index: number) => void
  onDelete: (index: number) => void
  onMoveIssue: (index: number, sprint: number | null) => void
}) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [overLane, setOverLane] = useState<string | null>(null)

  return (
    <div className="board-scroll qm-board-lanes flex gap-3 overflow-x-auto pb-2">
      {groups.map((group) => {
        const targetSprint = group.sprint?.id ?? null
        const isOver = overLane === group.key
        return (
          <section
            key={group.key}
            className={cn("qm-board-lane min-w-[420px] flex-1 shrink-0 rounded-xl border bg-muted/18 p-3 transition-[border-color,background-color]", group.sprint && "is-sprint", isOver && "border-primary/45 bg-primary/[0.035]")}
            onDragOver={(event) => { if (draggingIndex !== null) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setOverLane(group.key) } }}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOverLane(null) }}
            onDrop={(event) => {
              event.preventDefault()
              if (draggingIndex !== null) onMoveIssue(draggingIndex, targetSprint)
              setDraggingIndex(null)
              setOverLane(null)
            }}
          >
            <div className="qm-lane-heading mb-2 flex items-center gap-2 px-1">
              {group.sprint ? <SprintVisual sprint={group.sprint} backlogLabel={t.backlog} compact /> : <span className="inline-flex items-center gap-2 font-semibold"><span className="grid size-7 place-items-center rounded-md bg-background"><Inbox className="size-4" /></span>{t.backlog}</span>}
              <Badge variant="secondary" className="ms-auto">{group.entries.length}</Badge>
            </div>
            <div className="min-h-44 space-y-2">
              {!group.entries.length ? <div className={cn("qm-empty-lane grid min-h-44 place-items-center rounded-lg border border-dashed bg-background/55 px-3 text-center text-sm text-muted-foreground transition-colors", isOver && "border-primary/40 bg-primary/[0.04] text-primary")}><div>{isOver ? <><CircleDot className="mx-auto mb-3 size-5" /><div className="font-medium">{t.dragHint}</div></> : <><Leaf className="mx-auto mb-3 size-5 opacity-75" /><div className="font-medium text-foreground/70">{t.emptyLane}</div><div className="mt-2 text-xs opacity-80">{t.emptyLaneHint}</div></>}</div></div> : null}
              {group.entries.map(({ issue, index }) => (
                <IssueCard
                  key={`${issue.ref ?? issue.summary}-${index}`}
                  issue={issue}
                  index={index}
                  payload={payload}
                  selected={selectedIndex === index}
                  checked={selectedForCreate.has(index)}
                  priorities={priorities}
                  sprints={sprints}
                  layout="board"
                  t={t}
                  draggable={issue.type.toLowerCase() !== "epic"}
                  onDragStart={() => setDraggingIndex(index)}
                  onDragEnd={() => { setDraggingIndex(null); setOverLane(null) }}
                  onSelect={() => onSelect(index)}
                  onToggle={() => onToggle(index)}
                  onEdit={() => onEdit(index)}
                  onDuplicate={() => onDuplicate(index)}
                  onDelete={() => onDelete(index)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export function IssueCard({ issue, index, payload, selected, checked, sprints, layout, t, draggable = false, onDragStart, onDragEnd, onSelect, onToggle, onEdit, onDuplicate, onDelete }: {
  issue: BulkIssue
  index: number
  payload?: BulkPayload
  selected: boolean
  checked: boolean
  priorities: JiraPriority[]
  sprints: JiraSprint[]
  layout: ReviewLayout
  t: typeof copy.en | typeof copy.fa
  draggable?: boolean
  onDragStart?: () => void
  onDragEnd?: () => void
  onSelect: () => void
  onToggle: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const effectivePriority = issue.priority ?? payload?.defaults?.priority
  const effectiveEstimate = issue.estimate ?? payload?.defaults?.estimate
  const effectiveSprint = issue.sprint !== undefined ? issue.sprint : payload?.defaults?.sprint
  const sprint = typeof effectiveSprint === "number" ? sprints.find((item) => item.id === effectiveSprint) : undefined
  const isEpic = issue.type.toLowerCase() === "epic"
  const listMode = layout === "list"
  const tone = priorityTone(effectivePriority)
  const ToneIcon = tone.icon
  const worklogMinutes = issue.worklog?.minutes
  const worklogLabel = worklogMinutes
    ? `${Math.floor(worklogMinutes / 60) ? `${Math.floor(worklogMinutes / 60)}h ` : ""}${worklogMinutes % 60 ? `${worklogMinutes % 60}m` : ""}`.trim()
    : undefined

  return (
    <article
      className={cn(
        "issue-card group relative cursor-pointer rounded-lg border bg-card outline-none transition-[border-color,box-shadow,background-color] duration-150 hover:border-primary/25 focus-visible:ring-[3px] focus-visible:ring-ring/20",
        selected && "border-primary bg-primary/[0.025] ring-2 ring-primary/15",
        listMode ? "flex items-center gap-3 p-3" : "p-3",
      )}
      draggable={draggable}
      onDragStart={(event) => { if (!draggable) { event.preventDefault(); return }; event.dataTransfer.effectAllowed = "move"; onDragStart?.() }}
      onDragEnd={() => onDragEnd?.()}
      onClick={onSelect}
      onDoubleClick={onEdit}
      aria-current={selected ? "true" : undefined}
    >
      <IssueSelectionToggle
        selected={checked}
        onToggle={onToggle}
        label={checked ? t.clearSelection : t.selected}
        className={listMode ? "" : "absolute end-2.5 top-2.5"}
      />

      <div className={cn("min-w-0 flex-1", !listMode && "pe-10")}>
        <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          {draggable ? <GripVertical className="size-3.5 cursor-grab opacity-55" aria-hidden="true" /> : null}
          <span className="font-medium">{payload?.project ? `${payload.project}-${index + 1}` : `#${index + 1}`}</span>
          <Badge variant="outline" className={cn("px-1.5 py-0", isEpic && "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300")}>{issue.type}</Badge>
          {issue.ref ? <span className="truncate font-mono">{issue.ref}</span> : null}
        </div>
        <div className={cn("font-semibold leading-5", listMode ? "truncate text-sm" : "min-h-5 text-[15px]")}>{issue.summary || "—"}</div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1", tone.className, "bg-current/10")}><ToneIcon className="size-3.5" />{effectivePriority ?? "—"}</span>
          {!isEpic ? (
            sprint ? <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><CircleDot className="size-3" />{sprint.name}</span>
              : <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-muted-foreground"><Inbox className="size-3" />{t.backlog}</span>
          ) : null}
          {issue.assignee ? <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-muted-foreground"><UserRound className="size-3" />{issue.assignee}</span> : null}
          {!isEpic && effectiveEstimate ? <span className="inline-flex items-center gap-1 rounded-md border bg-background/70 px-2 py-1 font-mono text-muted-foreground"><Clock3 className="size-3" />{effectiveEstimate}</span> : null}
          {worklogLabel ? <span className="inline-flex items-center gap-1 rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 font-mono text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/35 dark:text-cyan-300"><TimerReset className="size-3" />{worklogLabel}</span> : null}
        </div>
        {issue.labels?.length ? (
          <div className="mt-2 flex min-w-0 flex-wrap gap-1">
            {issue.labels.slice(0, 3).map((label) => <Badge key={label} variant="secondary" className="max-w-28 truncate px-1.5 py-0 text-[10px]">{label}</Badge>)}
            {issue.labels.length > 3 ? <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">+{issue.labels.length - 3}</Badge> : null}
          </div>
        ) : null}
      </div>

      {!listMode ? (
        <div className="issue-card-actions absolute bottom-2 end-2 flex items-center gap-0.5 rounded-md border bg-card/95 p-0.5 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Button variant="ghost" size="icon-sm" onClick={(event: MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); onEdit() }} aria-label={t.issueDetails}><Pencil className="size-3.5" /></Button>
          <Button variant="ghost" size="icon-sm" onClick={(event: MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); onDuplicate() }} aria-label={t.duplicate}><Copy className="size-3.5" /></Button>
          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={(event: MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); onDelete() }} aria-label={t.delete}><Trash2 className="size-3.5" /></Button>
        </div>
      ) : (
        <Button variant="ghost" size="icon-sm" onClick={(event: MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); onEdit() }} aria-label={t.issueDetails} title={t.issueDetails}><Pencil className="size-3.5" /></Button>
      )}
    </article>
  )
}
