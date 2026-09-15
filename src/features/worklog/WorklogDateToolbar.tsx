import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import type { AppLocale } from "@/types"

function shiftDate(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  next.setHours(12, 0, 0, 0)
  return next
}

function sameLocalDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function WorklogDateToolbar({ locale, value, onChange, loading }: {
  locale: AppLocale
  value: Date
  onChange: (date: Date) => void
  loading?: boolean
}) {
  const isFa = locale === "fa"
  const today = new Date()
  const isToday = sameLocalDay(value, today)
  const localeCode = isFa ? "fa-IR-u-ca-gregory" : "en-US"
  return (
    <div className="inline-flex items-center gap-1.5">
      <Button variant="outline" size="icon-sm" className="size-9" aria-label={isFa ? "روز قبل" : "Previous day"} onClick={() => onChange(shiftDate(value, -1))}><ChevronLeft className="size-4" /></Button>
      <DatePicker value={value} onChange={onChange} locale={localeCode} disableAfter={today} disabled={loading} ariaLabel={isFa ? "انتخاب تاریخ Worklog" : "Choose worklog date"} />
      <Button variant="outline" size="icon-sm" className="size-9" disabled={isToday || loading} aria-label={isFa ? "روز بعد" : "Next day"} onClick={() => onChange(shiftDate(value, 1))}><ChevronRight className="size-4" /></Button>
    </div>
  )
}
