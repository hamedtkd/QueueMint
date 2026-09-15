import { Check, Clock3, Layers3, ListChecks, Send } from "lucide-react"

import { cn } from "@/lib/utils"
import type { AppLocale } from "@/types"
import { formatWorklogMinutes } from "./worklog-utils"

export function WorklogWorkflowRail({ locale, currentStep, scopeReady, selectedCount, draftCount, draftMinutes, onStep }: {
  locale: AppLocale
  currentStep: 1 | 2 | 3 | 4
  scopeReady: boolean
  selectedCount: number
  draftCount: number
  draftMinutes: number
  onStep: (step: 1 | 2 | 3 | 4) => void
}) {
  const isFa = locale === "fa"
  const steps = [
    { id: 1 as const, icon: Layers3, label: isFa ? "انتخاب محدوده" : "Choose scope", detail: isFa ? "پروژه، بورد و اسپرینت" : "Project, board and sprint", ready: scopeReady },
    { id: 2 as const, icon: ListChecks, label: isFa ? "انتخاب تسک" : "Select issues", detail: selectedCount ? `${selectedCount} ${isFa ? "انتخاب" : "selected"}` : (isFa ? "تسک‌ها رو انتخاب کن" : "Pick Jira issues"), ready: selectedCount > 0 },
    { id: 3 as const, icon: Clock3, label: isFa ? "تقسیم زمان" : "Distribute time", detail: draftCount ? formatWorklogMinutes(draftMinutes) : (isFa ? "زمان رو مشخص کن" : "Assign time across issues"), ready: draftCount > 0 },
    { id: 4 as const, icon: Send, label: isFa ? "Review و ثبت" : "Review & submit", detail: draftCount ? `${draftCount} · ${formatWorklogMinutes(draftMinutes)}` : (isFa ? "تایید نهایی" : "Check and submit worklog"), ready: draftCount > 0 },
  ]

  return (
    <nav className="qm-worklog-stepper" aria-label={isFa ? "مراحل ثبت زمان" : "Worklog steps"}>
      {steps.map(({ id, icon: Icon, label, detail, ready }) => {
        const active = currentStep === id
        const complete = id < currentStep && ready
        const disabled = (id === 2 && !scopeReady) || (id === 3 && !selectedCount) || (id === 4 && !draftCount)
        return <button key={id} type="button" disabled={disabled} onClick={() => onStep(id)} className={cn("qm-worklog-step", active && "is-active", complete && "is-complete")}>
          <span className="qm-worklog-step-icon">{complete ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}</span>
          <span className="min-w-0"><span className="block truncate text-xs font-semibold">{id}. {label}</span><span className="block truncate text-[10px] text-muted-foreground">{detail}</span></span>
        </button>
      })}
    </nav>
  )
}
