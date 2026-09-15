import { Save, Settings2, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { AppLocale } from "@/types"
import { formatWorklogMinutes } from "./worklog-utils"

export function WorklogSettingsPanel({ locale, targetText, targetMinutes, onTargetText, onSaveTarget }: {
  locale: AppLocale
  targetText: string
  targetMinutes: number
  onTargetText: (value: string) => void
  onSaveTarget: () => void
}) {
  const isFa = locale === "fa"
  return (
    <Card className="gap-0 border-primary/15 bg-card py-0 shadow-none">
      <CardContent className="flex flex-col gap-3 border-s-4 border-s-primary/55 p-3 sm:flex-row sm:items-center">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Settings2 className="size-4" /></span>
        <div className="min-w-0 sm:flex-1"><div className="text-sm font-semibold">{isFa ? "تنظیمات Worklog" : "Worklog settings"}</div><div className="text-xs text-muted-foreground">{isFa ? "هدف روزانه فقط Remaining رو محاسبه میکنه و روی انتخاب تسک تاثیری نداره." : "Daily target calculates Remaining only and never decides which issues are selected."}</div></div>
        <label className="flex min-w-0 items-center gap-2 text-xs font-medium"><span className="inline-flex shrink-0 items-center gap-1.5 text-muted-foreground"><Target className="size-3.5" />{isFa ? "هدف روزانه" : "Daily target"}</span><Input value={targetText} onChange={(event) => onTargetText(event.target.value)} className="w-32" placeholder="7h 30m" /><span className="hidden min-w-14 text-xs font-medium tabular-nums text-muted-foreground md:inline">{formatWorklogMinutes(targetMinutes)}</span><Button variant="outline" onClick={onSaveTarget}><Save className="size-4" />{isFa ? "ذخیره" : "Save"}</Button></label>
      </CardContent>
    </Card>
  )
}
