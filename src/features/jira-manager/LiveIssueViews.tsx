import { CircleDot, Clock3, ExternalLink, Eye, GripVertical, Inbox, UserRound } from "lucide-react"
import { JiraUserAvatar } from "@/components/jira-user-avatar"
import { priorityTone } from "@/components/priority"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { copy } from "@/features/app-shell/app-copy"
import { IssueSelectionToggle } from "@/features/review/ReviewIssueBoard"
import { jiraBrowseUrl } from "@/lib/jira"
import { cn } from "@/lib/utils"
import type { AppLocale, JiraLiveIssue } from "@/types"
import { formatEstimate } from "./manage-utils"

export function LiveIssueSelection({ selected, onToggle }: { selected: boolean; onToggle: () => void }) {
  return <IssueSelectionToggle selected={selected} onToggle={onToggle} label={selected ? "Deselect issue" : "Select issue"} />
}

export function LiveIssueListRow({ issue, selected, locale, t, onToggle, onSelectRange, onOpenDetails }: {
  issue: JiraLiveIssue
  selected: boolean
  locale: AppLocale
  t: typeof copy.en | typeof copy.fa
  onToggle: () => void
  onSelectRange?: () => void
  onOpenDetails: () => void
}) {
  const tone = priorityTone(issue.priority)
  const ToneIcon = tone.icon
  return (
    <article role="button" tabIndex={0} onClick={(event) => { if (event.ctrlKey || event.metaKey || event.shiftKey) { if (event.shiftKey && onSelectRange) onSelectRange(); else onToggle(); return } onOpenDetails() }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpenDetails() } }} className={cn("grid cursor-pointer grid-cols-[28px_minmax(0,1fr)_36px] gap-x-2 gap-y-1.5 px-3 py-3 transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30 xl:grid-cols-[34px_104px_minmax(280px,1fr)_120px_150px_145px_110px_52px] xl:items-center xl:gap-3", selected && "bg-primary/[0.035]")}>
      <div className="row-span-2 pt-0.5 xl:row-auto xl:pt-0"><LiveIssueSelection selected={selected} onToggle={onToggle} /></div>
      <div className="col-start-2 row-start-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground xl:col-auto xl:row-auto"><span className="font-mono" dir="ltr">{issue.key}</span><Badge variant="outline" className="px-1.5 py-0">{issue.type}</Badge></div>
      <div className="col-start-2 row-start-2 min-w-0 xl:col-auto xl:row-auto"><div className="truncate text-sm font-medium" title={issue.summary}>{issue.summary}</div><div className="mt-1 flex flex-wrap gap-1 xl:hidden">{issue.status ? <Badge variant="secondary">{issue.status}</Badge> : null}<span className={cn("inline-flex items-center gap-1 rounded-[var(--qm-control-radius)] px-1.5 py-0.5 text-xs", tone.className, "bg-current/10")}><ToneIcon className="size-3" />{issue.priority ?? "—"}</span>{issue.assignee ? <Badge variant="secondary" className="max-w-44 gap-1.5"><JiraUserAvatar name={issue.assignee} avatarUrl={issue.avatarUrl} className="size-4" /><span className="truncate">{issue.assignee}</span></Badge> : null}<Badge variant="secondary">{issue.placement === "sprint" ? issue.sprintName ?? "Sprint" : t.backlog}</Badge>{formatEstimate(issue) !== "—" ? <Badge variant="outline"><Clock3 className="me-1 size-3" />{formatEstimate(issue)}</Badge> : null}</div></div>
      <div className="hidden truncate text-xs xl:block">{issue.status ?? "—"}</div>
      <div className="hidden min-w-0 xl:flex xl:items-center xl:gap-2">{issue.assignee ? <><JiraUserAvatar name={issue.assignee} avatarUrl={issue.avatarUrl} className="size-5" /><span className="truncate text-xs">{issue.assignee}</span></> : <span className="text-xs text-muted-foreground">-</span>}</div>
      <div className="hidden xl:block">{issue.placement === "sprint" ? <span className="inline-flex max-w-full items-center gap-1 rounded-[var(--qm-control-radius)] bg-success/10 px-2 py-1 text-xs text-success"><CircleDot className="size-3 shrink-0" /><span className="truncate">{issue.sprintName ?? "Sprint"}</span></span> : <span className="inline-flex items-center gap-1 rounded-[var(--qm-control-radius)] bg-muted px-2 py-1 text-xs text-muted-foreground"><Inbox className="size-3" />{t.backlog}</span>}</div>
      <div className="hidden text-xs xl:flex xl:items-center xl:gap-1"><Clock3 className="size-3.5 text-muted-foreground" />{formatEstimate(issue)}</div>
      <Button variant="ghost" size="icon-sm" className="col-start-3 row-span-2 row-start-1 self-start xl:col-auto xl:row-auto xl:self-auto" onClick={(event) => { event.stopPropagation(); window.open(jiraBrowseUrl(issue.key), "_blank") }} aria-label={`${t.open} ${issue.key}`}><ExternalLink className="size-4" /></Button>
    </article>
  )
}

export function LiveIssueCard({ issue, selected, locale, onToggle, onSelectRange, onOpenDetails, onDragStart, onDragEnd }: {
  issue: JiraLiveIssue
  selected: boolean
  locale: AppLocale
  onToggle: () => void
  onSelectRange?: () => void
  onOpenDetails: () => void
  onDragStart: () => void
  onDragEnd: () => void
}) {
  const tone = priorityTone(issue.priority)
  const ToneIcon = tone.icon
  return (
    <article
      draggable
      tabIndex={0}
      onClick={(event) => { if (event.ctrlKey || event.metaKey || event.shiftKey) { if (event.shiftKey && onSelectRange) onSelectRange(); else onToggle(); return } onOpenDetails() }}
      onKeyDown={(event) => { if (event.key === "Enter") onOpenDetails() }}
      onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; onDragStart() }}
      onDragEnd={onDragEnd}
      className={cn("live-issue-card group relative cursor-grab rounded-[var(--qm-control-radius)] border bg-card p-3 outline-none transition-[border-color,box-shadow,background-color] focus-visible:ring-2 focus-visible:ring-ring/30 active:cursor-grabbing", selected && "border-primary bg-primary/[0.025] ring-2 ring-primary/15")}
    >
      <div className="absolute end-3 top-3"><LiveIssueSelection selected={selected} onToggle={onToggle} /></div>
      <div className="pe-10">
        <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground"><GripVertical className="size-3.5 opacity-55" /><span className="font-mono" dir="ltr">{issue.key}</span><Badge variant="outline" className="px-1.5 py-0">{issue.type}</Badge></div>
        <div className="min-h-11 text-sm font-semibold leading-5">{issue.summary}</div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span className={cn("inline-flex items-center gap-1 rounded-[var(--qm-control-radius)] px-2 py-1", tone.className, "bg-current/10")}><ToneIcon className="size-3.5" />{issue.priority ?? "—"}</span>
          {issue.placement === "sprint" ? <span className="inline-flex items-center gap-1 rounded-[var(--qm-control-radius)] bg-success/10 px-2 py-1 text-success"><CircleDot className="size-3" />{issue.sprintName ?? "Sprint"}</span> : <span className="inline-flex items-center gap-1 rounded-[var(--qm-control-radius)] bg-muted px-2 py-1 text-muted-foreground"><Inbox className="size-3" />Backlog</span>}
          {issue.assignee ? <span className="inline-flex max-w-full items-center gap-1.5 rounded-[var(--qm-control-radius)] bg-muted px-2 py-1 text-muted-foreground"><JiraUserAvatar name={issue.assignee} avatarUrl={issue.avatarUrl} className="size-4" /><span className="truncate">{issue.assignee}</span></span> : null}
          {issue.status ? <Badge variant="outline">{issue.status}</Badge> : null}
          {formatEstimate(issue) !== "—" ? <Badge variant="outline"><Clock3 className="me-1 size-3" />{formatEstimate(issue)}</Badge> : null}
        </div>
        {issue.labels.length ? <div className="mt-2 flex flex-wrap gap-1">{issue.labels.slice(0, 3).map((label) => <Badge key={label} variant="secondary" className="max-w-28 truncate px-1.5 py-0 text-[10px]">{label}</Badge>)}{issue.labels.length > 3 ? <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">+{issue.labels.length - 3}</Badge> : null}</div> : null}
      </div>
      <div className="mt-3 flex items-center gap-1 border-t pt-2"><Button variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); onOpenDetails() }}><Eye className="size-3.5" />{locale === "fa" ? "جزئیات" : "Details"}</Button><Button variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); window.open(jiraBrowseUrl(issue.key), "_blank") }}><ExternalLink className="size-3.5" />{locale === "fa" ? "باز کردن" : "Open"}</Button></div>
    </article>
  )
}
