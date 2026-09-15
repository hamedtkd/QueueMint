import { useEffect, useState } from "react"
import { CalendarDays, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function DatePicker({ value, onChange, locale = "en-US", disabled, disableAfter, className, ariaLabel }: {
  value: Date
  onChange: (date: Date) => void
  locale?: string
  disabled?: boolean
  disableAfter?: Date
  className?: string
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1))
  useEffect(() => setMonth(new Date(value.getFullYear(), value.getMonth(), 1)), [value])
  const text = new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(value)
  const max = disableAfter ? new Date(disableAfter.getFullYear(), disableAfter.getMonth(), disableAfter.getDate(), 23, 59, 59, 999) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={disabled} aria-label={ariaLabel} className={cn("h-9 min-w-[178px] justify-between px-3 font-normal", className)}>
          <span className="inline-flex min-w-0 items-center gap-2"><CalendarDays className="size-4 text-muted-foreground" /><span className="truncate">{text}</span></span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-3">
        <Calendar
          selected={value}
          month={month}
          onMonthChange={setMonth}
          locale={locale}
          disabled={(date) => Boolean(max && date.getTime() > max.getTime())}
          onSelect={(date) => { onChange(date); setOpen(false) }}
        />
      </PopoverContent>
    </Popover>
  )
}
