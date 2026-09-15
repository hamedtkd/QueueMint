import { BarChart3, CheckCircle2, Clock3, Target } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { AppLocale, WorklogDaySummary } from "@/types"
import { cn } from "@/lib/utils"
import { formatWorklogMinutes } from "./worklog-utils"

function pct(value: number, total: number) { return total > 0 ? Math.max(0, Math.min(100, Math.round((value / total) * 100))) : 0 }

export function WorklogSummaryStrip({ locale, targetMinutes, dayMinutes, scopeMinutes, remainingMinutes, draftMinutes, daySummary, date }: {
  locale: AppLocale
  targetMinutes: number
  dayMinutes: number
  scopeMinutes: number
  remainingMinutes: number
  draftMinutes: number
  daySummary: WorklogDaySummary
  date: Date
}) {
  const isFa = locale === "fa"
  const today = new Date()
  const isToday = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()
  const source = daySummary.source === "tempo" ? "Tempo" : daySummary.source === "mixed" ? "Jira + board" : daySummary.source === "scope" ? "Board scan" : daySummary.source === "jira" ? "Jira" : "Not synced"
  const cards = [
    { id: "target", label: isFa ? "هدف روزانه" : "Daily target", value: targetMinutes, icon: Target, detail: `${pct(dayMinutes, targetMinutes)}% ${isFa ? "تکمیل" : "complete"}`, progress: pct(dayMinutes, targetMinutes), tone: "blue" },
    { id: "logged", label: isFa ? (isToday ? "ثبت شده امروز" : "ثبت شده در روز") : (isToday ? "Logged today" : "Logged on day"), value: dayMinutes, icon: CheckCircle2, detail: `${source} · ${formatWorklogMinutes(scopeMinutes)} ${isFa ? "در بورد" : "in board"}`, progress: pct(dayMinutes, targetMinutes), tone: "green" },
    { id: "remaining", label: isFa ? "باقی مانده" : "Remaining", value: remainingMinutes, icon: Clock3, detail: remainingMinutes ? `${pct(remainingMinutes, targetMinutes)}% ${isFa ? "باقی" : "remaining"}` : (isFa ? "هدف کامل شده" : "Target reached"), progress: pct(remainingMinutes, targetMinutes), tone: "orange" },
    { id: "draft", label: isFa ? "Draft فعلی" : "Current draft", value: draftMinutes, icon: BarChart3, detail: draftMinutes ? (isFa ? "آماده Review" : "Ready to review") : (isFa ? "هنوز Draft نیست" : "No draft yet"), progress: pct(draftMinutes, targetMinutes), tone: "violet" },
  ]
  return (
    <div className="qm-worklog-kpis">
      {cards.map(({ id, label, value, icon: Icon, detail, progress, tone }) => (
        <div key={id} className="qm-worklog-kpi">
          <div className="flex items-start gap-3">
            <span className={cn("qm-worklog-kpi-icon", `is-${tone}`)}><Icon className="size-4" /></span>
            <div className="min-w-0 flex-1"><div className="text-[11px] font-medium text-muted-foreground">{label}</div><div className="mt-0.5 flex items-center gap-2"><span className="text-xl font-semibold tabular-nums tracking-tight">{formatWorklogMinutes(value)}</span>{id === "draft" && draftMinutes ? <Badge variant="outline" className="border-primary/20 bg-primary/5 px-1.5 py-0 text-[9px] text-primary">{isFa ? "Draft" : "Draft"}</Badge> : null}</div></div>
          </div>
          <div className="mt-3 flex items-center gap-2"><Progress value={progress} className={cn("h-1.5 flex-1", `qm-progress-${tone}`)} /><span className="max-w-28 truncate text-[10px] text-muted-foreground">{detail}</span></div>
        </div>
      ))}
    </div>
  )
}
