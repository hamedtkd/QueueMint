import { Clock3, Copy, Inbox, Pencil, Trash2, UserRound } from "lucide-react"

import { JiraUserAvatar } from "@/components/jira-user-avatar"
import { priorityTone } from "@/components/priority"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SelectionCheckbox } from "@/components/ui/selection-checkbox"
import { copy } from "@/features/app-shell/app-copy"
import { cn } from "@/lib/utils"
import type { BulkIssue, BulkPayload, JiraSprint, JiraUser } from "@/types"
import { assigneePresentation, effectiveEstimate, effectivePriority, effectiveSprint } from "./review-effective"

export function ReviewIssueTable({ entries, payload, selectedIndex, selectedForCreate, sprints, users, allVisibleSelected, someVisibleSelected, t, onSelect, onToggle, onToggleAll, onEdit, onDuplicate, onDelete }: {
  entries: Array<{ issue: BulkIssue; index: number }>
  payload?: BulkPayload
  selectedIndex: number
  selectedForCreate: Set<number>
  sprints: JiraSprint[]
  users: JiraUser[]
  allVisibleSelected: boolean
  someVisibleSelected: boolean
  t: typeof copy.en | typeof copy.fa
  onSelect: (index: number) => void
  onToggle: (index: number) => void
  onToggleAll: (checked: boolean) => void
  onEdit: (index: number) => void
  onDuplicate: (index: number) => void
  onDelete: (index: number) => void
}) {
  const cols = "grid-cols-[42px_118px_minmax(260px,1.6fr)_120px_180px_105px_170px_112px]"

  return (
    <div className="qm-review-table-scroll overflow-x-auto">
      <div className="min-w-[1140px]">
        <div className={cn("sticky top-0 z-10 grid items-center gap-3 border-b bg-muted/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur", cols)}>
          <span className="grid place-items-center"><SelectionCheckbox checked={allVisibleSelected} indeterminate={someVisibleSelected && !allVisibleSelected} onChange={onToggleAll} label={t.selectAll} /></span>
          <span>Issue</span><span>Summary</span><span>{t.priority}</span><span>{t.placement}</span><span>{t.estimate}</span><span>{t.assignee}</span><span className="text-end">Actions</span>
        </div>
        <div>
          {entries.map(({ issue, index }) => {
            const checked = selectedForCreate.has(index)
            const priority = effectivePriority(issue, payload)
            const estimate = effectiveEstimate(issue, payload)
            const sprintId = effectiveSprint(issue, payload)
            const sprint = typeof sprintId === "number" ? sprints.find((item) => item.id === sprintId) : undefined
            const assignee = assigneePresentation(issue, payload, users)
            const tone = priorityTone(priority)
            const ToneIcon = tone.icon
            return (
              <div
                key={`${issue.ref ?? issue.summary}-${index}`}
                className={cn("grid cursor-pointer items-center gap-3 border-b px-3 py-2.5 transition-colors hover:bg-accent/30", cols, checked && "bg-primary/[0.05]", selectedIndex === index && "ring-1 ring-inset ring-primary/20")}
                onClick={() => onSelect(index)}
                onDoubleClick={() => onEdit(index)}
              >
                <span className="grid place-items-center"><SelectionCheckbox checked={checked} onChange={() => onToggle(index)} label={checked ? t.clearSelection : t.selected} /></span>
                <span className="min-w-0"><span className="font-mono text-[11px] text-muted-foreground">{payload?.project ? `${payload.project}-${index + 1}` : `#${index + 1}`}</span><Badge variant="outline" className="ms-2 px-1.5 py-0 text-[10px]">{issue.type}</Badge></span>
                <span className="min-w-0 truncate text-sm font-medium">{issue.summary || "-"}</span>
                <span className={cn("inline-flex w-fit items-center gap-1 rounded-[var(--qm-control-radius)] px-2 py-1 text-xs", tone.className, "bg-current/10")}><ToneIcon className="size-3.5" />{priority ?? "-"}</span>
                <span className="min-w-0 truncate text-xs text-muted-foreground">{sprint ? sprint.name : <span className="inline-flex items-center gap-1"><Inbox className="size-3" />{t.backlog}</span>}</span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" />{estimate ?? "-"}</span>
                <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground" title={assignee.inherited ? t.inherited : undefined}>
                  {assignee.identity ? <JiraUserAvatar name={assignee.label} avatarUrl={assignee.avatarUrl} className="size-5" /> : <UserRound className="size-3.5 shrink-0" />}
                  <span className="truncate">{assignee.label ?? t.unassigned}</span>{assignee.inherited ? <span className="shrink-0 text-[10px] text-primary">↳</span> : null}
                </span>
                <span className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={(event) => { event.stopPropagation(); onEdit(index) }} aria-label={t.issueDetails}><Pencil className="size-3.5" /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={(event) => { event.stopPropagation(); onDuplicate(index) }} aria-label={t.duplicate}><Copy className="size-3.5" /></Button>
                  <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={(event) => { event.stopPropagation(); onDelete(index) }} aria-label={t.delete}><Trash2 className="size-3.5" /></Button>
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
