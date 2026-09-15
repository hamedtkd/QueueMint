import { useState } from "react"
import { BrainCircuit, Calculator, Equal, Gauge, LoaderCircle, Sparkles, TimerReset } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { AppLocale } from "@/types"
import { formatWorklogMinutes } from "./worklog-utils"

export type WorklogDraftStrategy = "estimate" | "equal" | "ai"

export function WorklogPreparePanel({ locale, selectionText, selectedCount, remainingMinutes, selectedTargetMinutes, note, loading, onSelectionText, onUseRemaining, onNote, onBuild }: {
  locale: AppLocale
  selectionText: string
  selectedCount: number
  remainingMinutes: number
  selectedTargetMinutes: number
  note: string
  loading: boolean
  onSelectionText: (value: string) => void
  onUseRemaining: () => void
  onNote: (value: string) => void
  onBuild: (strategy: WorklogDraftStrategy) => void | Promise<void>
}) {
  const isFa = locale === "fa"
  const [strategy, setStrategy] = useState<WorklogDraftStrategy>("estimate")
  const strategies = [
    { id: "estimate" as const, icon: Gauge, label: isFa ? "بر اساس Estimate" : "By estimate", helper: isFa ? "Estimate فقط وزن تقسیم زمانه و تسک انتخاب نمیکنه." : "Estimate only weights the split and never chooses issues." },
    { id: "equal" as const, icon: Equal, label: isFa ? "تقسیم مساوی" : "Equal split", helper: isFa ? "زمان کل بین همه انتخاب‌ها برابر تقسیم میشه." : "The total is split evenly across the selection." },
    { id: "ai" as const, icon: BrainCircuit, label: isFa ? "پیشنهاد AI" : "AI suggestion", helper: isFa ? "AI از Context انتخاب‌ها و یادداشت امروز برای پیشنهاد استفاده میکنه." : "AI uses the selected issue context and your note to suggest a split." },
  ]
  const activeHelper = strategies.find((item) => item.id === strategy)?.helper

  return (
    <Card className="gap-0 border-violet-200/70 py-0 shadow-none dark:border-violet-900/60">
      <CardContent className="p-3">
        <div className="grid gap-3 xl:grid-cols-[minmax(250px,0.85fr)_minmax(460px,2.2fr)_170px] xl:items-end">
          <div className="min-w-0">
            <div className="mb-1 flex items-center justify-between gap-2"><label className="text-xs font-semibold">{isFa ? "زمان کل" : "Total time"}</label><span className="text-[11px] text-muted-foreground">{selectedCount} {isFa ? "تسک" : "issues"}</span></div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"><Input value={selectionText} onChange={(event) => onSelectionText(event.target.value)} placeholder="2h 30m" /><Button variant="outline" onClick={onUseRemaining} disabled={!remainingMinutes} className="shrink-0"><TimerReset className="size-4" />{formatWorklogMinutes(remainingMinutes)}</Button></div>
          </div>

          <div className="min-w-0">
            <div className="mb-1 text-xs font-semibold">{isFa ? "روش تقسیم" : "Distribution method"}</div>
            <ButtonGroup className="w-full" role="radiogroup" aria-label={isFa ? "روش تقسیم زمان" : "Time distribution method"}>
              {strategies.map(({ id, icon: Icon, label }) => <Button key={id} type="button" variant="ghost" aria-checked={strategy === id} role="radio" onClick={() => setStrategy(id)} className={cn("min-h-10 flex-1 justify-center rounded-none px-3", strategy === id ? "bg-primary/[0.09] text-primary hover:bg-primary/[0.12]" : "text-muted-foreground hover:text-foreground")}><Icon className="size-4" /><span className="truncate">{label}</span>{id === "estimate" ? <span className="hidden rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold sm:inline">{isFa ? "پیش فرض" : "Default"}</span> : null}</Button>)}
            </ButtonGroup>
          </div>

          <Button size="lg" onClick={() => void onBuild(strategy)} disabled={!selectedTargetMinutes || !selectedCount || loading} className="h-10 w-full">{loading && strategy === "ai" ? <LoaderCircle className="size-4 animate-spin" /> : <Calculator className="size-4" />}{isFa ? "ساخت Review" : "Build review"}</Button>
        </div>

        <div className="mt-2 text-[11px] leading-4 text-muted-foreground">{activeHelper}</div>
        {strategy === "ai" ? <label className="mt-3 grid gap-1.5 rounded-lg border border-violet-200/70 bg-violet-50/35 p-3 text-xs font-medium dark:border-violet-900/60 dark:bg-violet-950/15"><span className="inline-flex items-center gap-1.5"><Sparkles className="size-3.5 text-violet-600" />{isFa ? "یادداشت امروز برای AI" : "Today's note for AI"}</span><Textarea value={note} onChange={(event) => onNote(event.target.value)} placeholder={isFa ? "مثلا: امروز بیشتر روی Login و API validation کار کردم." : "e.g. I spent most of today on login validation and API error handling."} rows={2} /><span className="font-normal text-muted-foreground">{isFa ? "خروجی AI اول وارد Review میشه و مستقیم در Jira ثبت نمیشه." : "AI output always goes to review before anything is written to Jira."}</span></label> : null}
      </CardContent>
    </Card>
  )
}
