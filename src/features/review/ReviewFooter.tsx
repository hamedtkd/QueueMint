import { useEffect, useState } from "react"
import { CheckCircle2, ExternalLink, LoaderCircle, Rocket, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { copy } from "@/features/app-shell/app-copy"
import { jiraBrowseUrl } from "@/lib/jira"
import { cn } from "@/lib/utils"
import type { AppLocale, CreateRunResult, ValidationResult } from "@/types"

export function ReviewActionBar({ t, issueCount, selectedCount, creationCount, validation, creating, progressValue, onValidate, onCreate }: {
  t: typeof copy.en | typeof copy.fa
  issueCount: number
  selectedCount: number
  creationCount: number
  validation: ValidationResult
  creating: boolean
  progressValue: number
  onValidate: () => void
  onCreate: () => void
}) {
  const label = t.createCount.replace("{count}", String(creationCount))
  return (
    <div className="qm-review-footer">
      <div className="qm-review-footer-inner">
        <div className="flex min-w-0 items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{selectedCount}/{issueCount} {t.selected}</span>
          <span className="hidden sm:inline">•</span>
          <span className={validation.errors.length ? "text-destructive" : validation.valid ? "text-emerald-600" : ""}>{validation.valid ? <CheckCircle2 className="me-1 inline size-3.5" /> : null}{validation.errors.length} {t.errors}</span>
        </div>
        {creating ? <div className="min-w-0 flex-1 sm:mx-4"><Progress value={progressValue} /></div> : <div className="flex-1" />}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onValidate} disabled={creating}><CheckCircle2 className="size-4" />{t.validate}</Button>
          <Button onClick={onCreate} disabled={creating || creationCount === 0}>{creating ? <LoaderCircle className="size-4 animate-spin" /> : <Rocket className="size-4" />}{label}</Button>
        </div>
      </div>
    </div>
  )
}

export function RunResultsSheet({ t, locale, runResult, successCount, failureCount, sprintFailureCount, attachmentFailureCount, estimateFailureCount, worklogFailureCount, creating, onRetryFailed, onRetrySprint, onRetryWorklog }: {
  t: typeof copy.en | typeof copy.fa
  locale: AppLocale
  runResult: CreateRunResult | null
  successCount: number
  failureCount: number
  sprintFailureCount: number
  attachmentFailureCount: number
  estimateFailureCount: number
  worklogFailureCount: number
  creating: boolean
  onRetryFailed: () => void
  onRetrySprint: () => void
  onRetryWorklog: () => void
}) {
  const [open, setOpen] = useState(false)
  useEffect(() => { if (runResult) setOpen(true) }, [runResult])
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side={locale === "fa" ? "left" : "right"}>
        <SheetHeader><SheetTitle>{t.runResults}</SheetTitle><SheetDescription>{runResult ? `${successCount} ${t.created} · ${failureCount} ${t.failed}` : t.noResults}</SheetDescription></SheetHeader>
        <SheetBody>
          {!runResult ? <div className="py-12 text-center text-sm text-muted-foreground">{t.noResults}</div> : (
            <div className="space-y-2">
              {runResult.results.map((item) => (
                <div key={`${item.index}-${item.key ?? item.summary}`} className="rounded-xl border p-3 text-sm">
                  <div className="flex items-start gap-2">
                    {item.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />}
                    <div className="min-w-0 flex-1"><div className="font-medium">{item.summary}</div><div className="mt-1 text-xs text-muted-foreground">{item.key ?? item.error}</div>{item.sprintError ? <div className="mt-1 text-xs text-amber-600">{item.sprintError}</div> : null}{item.estimateError ? <div className="mt-1 text-xs text-amber-600">{t.estimateApplyFailed}: {item.estimateError}</div> : null}{item.attachmentError ? <div className="mt-1 text-xs text-amber-600">{t.attachmentsFailed}: {item.attachmentError}</div> : null}{item.worklogError ? <div className="mt-1 text-xs text-amber-600">Worklog: {item.worklogError}</div> : null}</div>
                    {item.key ? <Button variant="ghost" size="icon-sm" onClick={() => window.open(jiraBrowseUrl(item.key as string), "_blank")} aria-label={t.viewIssue}><ExternalLink className="size-3.5" /></Button> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
          {runResult ? <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-6"><Stat value={successCount} label={t.created} tone="success" /><Stat value={failureCount} label={t.failed} tone="danger" /><Stat value={sprintFailureCount} label="Sprint" tone="warning" /><Stat value={estimateFailureCount} label={t.estimate} tone="warning" /><Stat value={attachmentFailureCount} label="Files" tone="warning" /><Stat value={worklogFailureCount} label="Worklog" tone="warning" /></div> : null}
        </SheetBody>
        {runResult ? <SheetFooter className="flex flex-wrap gap-2">{failureCount ? <Button variant="outline" onClick={onRetryFailed} disabled={creating}>{t.retryFailed}</Button> : null}{sprintFailureCount ? <Button variant="outline" onClick={onRetrySprint} disabled={creating}>{t.retrySprint}</Button> : null}{worklogFailureCount ? <Button variant="outline" onClick={onRetryWorklog} disabled={creating}>{locale === "fa" ? "تلاش مجدد Worklog" : "Retry worklog"}</Button> : null}<Button className="ms-auto" onClick={() => setOpen(false)}>{t.done}</Button></SheetFooter> : null}
      </SheetContent>
    </Sheet>
  )
}

function Stat({ value, label, tone }: { value: number; label: string; tone: "success" | "danger" | "warning" }) {
  return <div className="rounded-lg bg-muted/35 p-2.5"><div className={cn("text-base font-semibold", tone === "success" ? "text-emerald-600" : tone === "danger" ? "text-destructive" : "text-amber-600")}>{value}</div><div className="mt-0.5 text-muted-foreground">{label}</div></div>
}
