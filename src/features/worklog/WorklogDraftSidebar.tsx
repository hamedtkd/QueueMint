import { useMemo, useState } from "react"
import { BrainCircuit, Check, Equal, Gauge, LoaderCircle, MessageSquareText, Plus, Save, Send, SlidersHorizontal, Target, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { AppLocale, JiraLiveIssue, WorklogDraftEntry } from "@/types"
import { WorklogDurationInput } from "./WorklogDurationInput"
import { formatWorklogMinutes } from "./worklog-utils"

export type WorklogSidebarStrategy = "manual" | "equal" | "estimate"

export function WorklogDraftSidebar({ locale, date, selectedIssues, draft, draftMinutes, remainingMinutes, targetMinutes, targetText, selectionText, loading, applying, note, onSelectionText, onTargetText, onSaveTarget, onNote, onManual, onBuild, onAi, onUpdate, onRemove, onDeselect, onFocusIssues, onApply }: {
  locale: AppLocale
  date: Date
  selectedIssues: JiraLiveIssue[]
  draft: WorklogDraftEntry[]
  draftMinutes: number
  remainingMinutes: number
  targetMinutes: number
  targetText: string
  selectionText: string
  loading: boolean
  applying: boolean
  note: string
  onSelectionText: (value: string) => void
  onTargetText: (value: string) => void
  onSaveTarget: () => void
  onNote: (value: string) => void
  onManual: () => void
  onBuild: (strategy: "equal" | "estimate") => void
  onAi: () => void
  onUpdate: (issueKey: string, patch: Partial<Pick<WorklogDraftEntry, "minutes" | "comment">>) => void
  onRemove: (issueKey: string) => void
  onDeselect: (issueKey: string) => void
  onFocusIssues: () => void
  onApply: (defaultComment: string) => void
}) {
  const isFa = locale === "fa"
  const [strategy, setStrategy] = useState<WorklogSidebarStrategy>("estimate")
  const [comment, setComment] = useState(note)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const draftByKey = useMemo(() => new Map(draft.map((entry) => [entry.issueKey, entry])), [draft])
  const ready = draft.some((entry) => entry.minutes > 0) && draftMinutes > 0
  const dateText = new Intl.DateTimeFormat(isFa ? "fa-IR-u-ca-gregory" : "en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(date)
  const methods = [
    { id: "manual" as const, icon: SlidersHorizontal, title: isFa ? "دستی" : "Manual", hint: isFa ? "زمان هر تسک رو خودت وارد کن" : "Set time for each issue" },
    { id: "equal" as const, icon: Equal, title: isFa ? "تقسیم مساوی" : "Auto-distribute", hint: isFa ? "زمان کل رو مساوی تقسیم کن" : "Split the target evenly" },
    { id: "estimate" as const, icon: Gauge, title: isFa ? "بر اساس Estimate" : "Use estimates", hint: isFa ? "Estimate فقط وزن تقسیم زمانه" : "Use estimates as weights" },
  ]

  function chooseMethod(next: WorklogSidebarStrategy) {
    setStrategy(next)
    if (next === "manual") onManual()
    else onBuild(next)
  }

  return (
    <aside className="qm-worklog-draft-sidebar">
      <div className="qm-worklog-draft-head">
        <div><div className="text-base font-semibold">{isFa ? "پیش نویس Worklog" : "Worklog draft"}</div><div className="mt-0.5 text-xs text-muted-foreground">{selectedIssues.length} {isFa ? "تسک" : "issues"} · <strong className="text-foreground">{formatWorklogMinutes(draftMinutes)}</strong></div></div>
        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold", ready ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-300" : "border-border bg-muted/30 text-muted-foreground")}><Check className="size-3" />{ready ? (isFa ? "آماده ثبت" : "Ready to submit") : (isFa ? "در حال آماده سازی" : "Preparing")}</span>
      </div>

      <div className="qm-worklog-draft-scroll qm-worklog-scroll">
        <div className="qm-worklog-draft-list">
          {!selectedIssues.length ? <button type="button" onClick={onFocusIssues} className="grid min-h-36 w-full place-items-center rounded-xl border border-dashed bg-muted/10 px-5 text-center text-sm text-muted-foreground hover:border-primary/30 hover:bg-primary/[0.025]"><span><Plus className="mx-auto mb-2 size-5 text-primary" />{isFa ? "از بورد یا جدول چند تسک انتخاب کن" : "Choose issues from the board or table"}</span></button> : selectedIssues.map((issue) => {
            const entry = draftByKey.get(issue.key)
            return <div key={issue.key} className="qm-worklog-draft-row">
              <button type="button" className="grid size-5 shrink-0 place-items-center rounded border border-primary bg-primary text-primary-foreground" aria-label={isFa ? `حذف ${issue.key} از انتخاب` : `Deselect ${issue.key}`} onClick={() => onDeselect(issue.key)}><Check className="size-3.5" /></button>
              <div className="min-w-0 flex-1"><button type="button" onClick={onFocusIssues} className="font-mono text-[11px] font-medium text-primary hover:underline">{issue.key}</button><div className="mt-0.5 line-clamp-2 text-xs font-medium leading-4">{issue.summary}</div></div>
              <WorklogDurationInput minutes={entry?.minutes ?? 0} onChange={(minutes) => entry ? onUpdate(issue.key, { minutes }) : undefined} disabled={!entry} ariaLabel={isFa ? `زمان ${issue.key}` : `Time for ${issue.key}`} />
              <Button variant="ghost" size="icon-sm" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => { onRemove(issue.key); onDeselect(issue.key) }} aria-label={isFa ? "حذف" : "Remove"}><X className="size-3.5" /></Button>
            </div>
          })}
        </div>

        <Button variant="outline" size="sm" className="mx-4 my-3 w-[calc(100%-2rem)] border-primary/25 text-primary" onClick={onFocusIssues}><Plus className="size-3.5" />{isFa ? "افزودن تسک" : "Add another issue"}</Button>

        <div className="border-t px-4 py-4">
          <div className="flex items-end justify-between gap-3"><div><div className="text-xs text-muted-foreground">{isFa ? "زمان کل Draft" : "Total time"}</div><div className="mt-0.5 text-xl font-semibold tabular-nums">{formatWorklogMinutes(draftMinutes)}</div></div><label className="grid gap-1 text-[11px] font-medium text-muted-foreground"><span>{isFa ? "زمان برای تقسیم" : "Time to distribute"}</span><Input value={selectionText} onChange={(event) => onSelectionText(event.target.value)} className="h-9 w-28 bg-background text-center text-xs font-medium" placeholder="7h 30m" /></label></div>
          <div className="mt-4 text-xs font-semibold">{isFa ? "روش تقسیم" : "Distribution method"}</div>
          <div className="mt-2 grid gap-2">
            {methods.map(({ id, icon: Icon, title, hint }) => <button key={id} type="button" aria-pressed={strategy === id} onClick={() => chooseMethod(id)} className={cn("flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2 text-start outline-none transition hover:border-primary/30 hover:bg-primary/[0.02] focus-visible:ring-[3px] focus-visible:ring-ring/20", strategy === id && "border-primary/35 bg-primary/[0.055]")}><span className={cn("grid size-5 shrink-0 place-items-center rounded-full border", strategy === id ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/35 text-transparent")}><Check className="size-3" /></span><Icon className={cn("size-4 shrink-0", strategy === id ? "text-primary" : "text-muted-foreground")} /><span className="min-w-0 flex-1"><span className="block text-xs font-semibold">{title}</span><span className="block text-[11px] text-muted-foreground">{hint}</span></span></button>)}
          </div>
          <Button variant="outline" size="sm" className="mt-2 w-full" onClick={onAi} disabled={!selectedIssues.length || loading}>{loading ? <LoaderCircle className="size-3.5 animate-spin" /> : <BrainCircuit className="size-3.5" />}{isFa ? "پیشنهاد AI" : "AI suggestion"}</Button>
        </div>

        <div className="border-t px-4 py-4">
          <label className="grid gap-1.5 text-xs font-medium"><span className="inline-flex items-center gap-1.5"><MessageSquareText className="size-3.5 text-muted-foreground" />{isFa ? "کامنت عمومی (اختیاری)" : "Add a comment (optional)"}</span><Textarea value={comment} onChange={(event) => { setComment(event.target.value); onNote(event.target.value) }} rows={3} maxLength={500} placeholder={isFa ? "امروز روی چه چیزی کار کردی؟" : "What did you work on today?"} /><span className="text-end text-[10px] font-normal text-muted-foreground">{comment.length}/500</span></label>
        </div>

        <div className="border-t bg-muted/[0.08] px-4 py-3">
          <button type="button" className="flex w-full items-center gap-2 text-start" onClick={() => setSettingsOpen((value) => !value)}><Target className="size-3.5 text-primary" /><span className="flex-1 text-xs font-semibold">{isFa ? "هدف روزانه" : "Daily target"}</span><span className="text-xs font-medium tabular-nums text-muted-foreground">{formatWorklogMinutes(targetMinutes)}</span></button>
          {settingsOpen ? <div className="mt-3 flex items-center gap-2"><Input value={targetText} onChange={(event) => onTargetText(event.target.value)} className="h-9 flex-1" placeholder="7h 30m" /><Button variant="outline" size="sm" onClick={onSaveTarget}><Save className="size-3.5" />{isFa ? "ذخیره" : "Save"}</Button></div> : null}
        </div>
      </div>

      <div className="qm-worklog-draft-submit">
        <Button size="lg" className="w-full" onClick={() => onApply(comment)} disabled={!ready || applying}>{applying ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}{isFa ? `ثبت Worklog (${formatWorklogMinutes(draftMinutes)})` : `Submit worklog (${formatWorklogMinutes(draftMinutes)})`}</Button>
        <div className="mt-2 text-center text-[10px] text-muted-foreground">{isFa ? `زمان برای ${dateText} در Jira ثبت میشه.` : `Time will be logged to Jira for ${dateText}.`}</div>
      </div>
    </aside>
  )
}
