import { useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function sameDay(a?: Date, b?: Date) {
  return Boolean(a && b && dateKey(a) === dateKey(b))
}

function monthGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

export function Calendar({ selected, month, onMonthChange, onSelect, locale = "en-US", disabled }: {
  selected?: Date
  month: Date
  onMonthChange: (date: Date) => void
  onSelect: (date: Date) => void
  locale?: string
  disabled?: (date: Date) => boolean
}) {
  const days = useMemo(() => monthGrid(month), [month])
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "narrow" })
  const monthTitle = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(month)
  const weekdayDates = Array.from({ length: 7 }, (_, index) => new Date(2024, 0, 7 + index))
  const today = new Date()

  return (
    <div data-slot="calendar" className="w-[280px] select-none">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon-sm" aria-label="Previous month" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="size-4" /></Button>
        <div className="text-sm font-semibold capitalize">{monthTitle}</div>
        <Button variant="ghost" size="icon-sm" aria-label="Next month" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="size-4" /></Button>
      </div>
      <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground">
        {weekdayDates.map((date) => <span key={date.toISOString()} className="py-1">{weekday.format(date)}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((date) => {
          const outside = date.getMonth() !== month.getMonth()
          const isSelected = sameDay(date, selected)
          const isToday = sameDay(date, today)
          const isDisabled = disabled?.(date) ?? false
          return (
            <button
              key={date.toISOString()}
              type="button"
              aria-pressed={isSelected}
              disabled={isDisabled}
              onClick={() => onSelect(date)}
              className={cn(
                "grid size-9 place-items-center rounded-lg text-xs outline-none transition hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-30",
                outside && "text-muted-foreground/45",
                isToday && !isSelected && "font-semibold text-primary",
                isSelected && "bg-primary font-semibold text-primary-foreground hover:bg-primary/92",
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
