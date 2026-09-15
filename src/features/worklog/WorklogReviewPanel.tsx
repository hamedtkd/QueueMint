import { AlertTriangle, Clock3, LoaderCircle, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { AppLocale, JiraLiveIssue, WorklogDraftEntry } from "@/types"
import { formatWorklogMinutes } from "./worklog-utils"

export function WorklogReviewPanel({ locale, draft, draftMinutes, issues, remainingMinutes, applying, onUpdate, onRemove, onClear, onApply }: {
  locale: AppLocale
  draft: WorklogDraftEntry[]
  draftMinutes: number
  issues: JiraLiveIssue[]
  remainingMinutes: number
  applying: boolean
  onUpdate: (issueKey: string, patch: Partial<Pick<WorklogDraftEntry, "minutes" | "comment">>) => void
  onRemove: (issueKey: string) => void
  onClear: () => void
  onApply: () => void
}) {
  const isFa = locale === "fa"
  const issueMap = new Map(issues.map((issue) => [issue.key, issue]))
  const exceedsRemaining = remainingMinutes > 0 && draftMinutes > remainingMinutes
  return (
    <Card className="gap-0 border-emerald-200/70 py-0 shadow-none dark:border-emerald-900/60">
      <CardContent className="p-3">
        <div className="mb-3 flex flex-wrap items-center gap-2"><div className="text-sm font-semibold">{isFa ? "Review نهایی" : "Final review"}</div><span className="text-xs text-muted-foreground">{isFa ? "زمان و کامنت هر تسک رو قبل از ثبت اصلاح کن." : "Edit time and comments before the Jira write."}</span><Badge className="ms-auto">{draft.length} · {formatWorklogMinutes(draftMinutes)}</Badge></div>
        {exceedsRemaining ? <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><span>{isFa ? `این Draft از زمان باقی مانده امروز بیشتره: ${formatWorklogMinutes(draftMinutes)} در برابر ${formatWorklogMinutes(remainingMinutes)}.` : `This draft exceeds today's remaining target: ${formatWorklogMinutes(draftMinutes)} vs ${formatWorklogMinutes(remainingMinutes)}.`}</span></div> : null}
        <div className="overflow-x-auto rounded-xl border">
          <div className="min-w-[880px]">
            <div className="grid grid-cols-[minmax(300px,1.25fr)_200px_minmax(260px,1fr)_44px] gap-3 border-b bg-muted/20 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><span>{isFa ? "تسک" : "Issue"}</span><span>{isFa ? "زمان" : "Time"}</span><span>{isFa ? "کامنت" : "Comment"}</span><span /></div>
            {draft.map((entry) => {
              const issue = issueMap.get(entry.issueKey)
              return <div key={entry.issueKey} className="grid grid-cols-[minmax(300px,1.25fr)_200px_minmax(260px,1fr)_44px] items-center gap-3 border-b px-3 py-2.5 last:border-b-0 hover:bg-muted/[0.12]"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-primary">{entry.issueKey}</span>{issue?.status ? <Badge variant="outline" className="font-normal">{issue.status}</Badge> : null}{issue?.sprintName ? <Badge variant="outline" className="font-normal">{issue.sprintName}</Badge> : null}</div><div className="mt-0.5 truncate text-sm font-medium">{entry.summary}</div></div><div className="flex items-center gap-2"><Input aria-label={isFa ? `دقیقه برای ${entry.issueKey}` : `Minutes for ${entry.issueKey}`} type="number" min={1} max={1440} value={entry.minutes} onChange={(event) => onUpdate(entry.issueKey, { minutes: Math.max(0, Math.round(Number(event.target.value) || 0)) })} className="w-24 tabular-nums" /><span className="whitespace-nowrap rounded-md bg-muted/70 px-2 py-1.5 text-xs font-medium tabular-nums text-muted-foreground">{formatWorklogMinutes(entry.minutes)}</span></div><Input value={entry.comment} onChange={(event) => onUpdate(entry.issueKey, { comment: event.target.value })} placeholder={isFa ? "کامنت اختیاری" : "Optional worklog comment"} /><Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => onRemove(entry.issueKey)} aria-label={isFa ? "حذف" : "Remove"}><Trash2 className="size-4" /></Button></div>
            })}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3"><div className="text-sm text-muted-foreground">{draft.length} {isFa ? "تسک" : "issues"} · <strong className="text-foreground">{formatWorklogMinutes(draftMinutes)}</strong></div><Button variant="ghost" className="ms-auto" onClick={onClear}>{isFa ? "پاک کردن Draft" : "Clear draft"}</Button><Button size="lg" onClick={onApply} disabled={applying || !draftMinutes} className="min-w-36">{applying ? <LoaderCircle className="size-4 animate-spin" /> : <Clock3 className="size-4" />}{isFa ? "ثبت در Jira" : "Add worklogs"}</Button></div>
      </CardContent>
    </Card>
  )
}
