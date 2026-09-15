import { JiraUserAvatar } from "@/components/jira-user-avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AppLocale, JiraLiveIssue } from "@/types"
import { formatWorklogMinutes } from "./worklog-utils"
import { formatWorklogUpdated, issueTypeIcon, statusTone } from "./worklog-view-utils"
import { WorklogEstimateStatus } from "./WorklogEstimateStatus"
import { WorklogSelectionCheckbox } from "./WorklogSelectionCheckbox"

export function WorklogIssueTable({ locale, issues, selectedKeys, loggedMinutesByIssue, allVisibleSelected, someVisibleSelected, onToggle, onToggleAll }: {
  locale: AppLocale
  issues: JiraLiveIssue[]
  selectedKeys: Set<string>
  loggedMinutesByIssue: Record<string, number>
  allVisibleSelected: boolean
  someVisibleSelected: boolean
  onToggle: (key: string) => void
  onToggleAll: (checked: boolean) => void
}) {
  const isFa = locale === "fa"
  const cols = "grid-cols-[42px_minmax(300px,1.5fr)_130px_170px_150px_100px_115px_80px]"
  return (
    <div className="qm-worklog-data-view qm-worklog-table-scroll qm-worklog-scroll">
      <div className="min-w-[1110px]">
        <div className={cn("sticky top-0 z-10 grid gap-3 border-b bg-muted/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur", cols)}>
          <span className="grid place-items-center"><WorklogSelectionCheckbox checked={allVisibleSelected} indeterminate={someVisibleSelected && !allVisibleSelected} onChange={onToggleAll} label={isFa ? "انتخاب همه موارد نمایش داده شده" : "Select all visible issues"} /></span>
          <span>{isFa ? "تسک" : "Issue"}</span><span>{isFa ? "وضعیت" : "Status"}</span><span>{isFa ? "مسئول" : "Assignee"}</span><span>{isFa ? "اسپرینت" : "Sprint"}</span><span>Estimate</span><span>{isFa ? "لاگ امروز" : "Logged today"}</span><span>{isFa ? "آپدیت" : "Updated"}</span>
        </div>
        <div>
          {!issues.length ? <div className="grid min-h-36 place-items-center px-4 text-sm text-muted-foreground">{isFa ? "تسکی با این فیلتر پیدا نشد." : "No issues match these filters."}</div> : issues.map((issue) => {
            const selected = selectedKeys.has(issue.key)
            const logged = loggedMinutesByIssue[issue.key] ?? 0
            const TypeIcon = issueTypeIcon(issue.type)
            return (
              <label key={issue.key} className={cn("grid cursor-pointer items-center gap-3 border-b px-4 py-2.5 transition hover:bg-sky-50/55 dark:hover:bg-sky-950/15", cols, selected && "bg-primary/[0.055]")}>
                <span className="grid place-items-center"><WorklogSelectionCheckbox checked={selected} onChange={() => onToggle(issue.key)} label={`${selected ? "Deselect" : "Select"} ${issue.key}`} /></span>
                <span className="min-w-0"><span className="flex items-center gap-1.5 font-mono text-xs text-primary"><TypeIcon className="size-3.5" />{issue.key}</span><span className="mt-0.5 block truncate text-sm font-medium text-foreground">{issue.summary}</span></span>
                <Badge variant="outline" className={cn("w-fit max-w-28 truncate font-normal", statusTone(issue))}>{issue.status ?? "—"}</Badge>
                <span className="flex min-w-0 items-center gap-2">{issue.assignee ? <JiraUserAvatar name={issue.assignee} avatarUrl={issue.avatarUrl} className="size-5" /> : <span className="size-5 rounded-full bg-muted" />}<span className="truncate text-xs text-muted-foreground">{issue.assignee ?? (isFa ? "بدون مسئول" : "Unassigned")}</span></span>
                <span className="truncate text-xs text-muted-foreground">{issue.sprintName ?? "Backlog"}</span>
                <WorklogEstimateStatus issue={issue} locale={locale} />
                <span className={cn("text-xs font-medium tabular-nums", logged ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground")}>{logged ? formatWorklogMinutes(logged) : "—"}</span>
                <span className="text-xs text-muted-foreground">{formatWorklogUpdated(issue.updated)}</span>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}
