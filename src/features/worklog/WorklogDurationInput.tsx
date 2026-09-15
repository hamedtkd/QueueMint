import { useEffect, useState } from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { formatWorklogMinutes, parseWorklogDuration } from "./worklog-utils"

export function WorklogDurationInput({ minutes, onChange, className, ariaLabel, disabled }: {
  minutes: number
  onChange: (minutes: number) => void
  className?: string
  ariaLabel: string
  disabled?: boolean
}) {
  const [text, setText] = useState(() => minutes > 0 ? formatWorklogMinutes(minutes) : "")
  useEffect(() => setText(minutes > 0 ? formatWorklogMinutes(minutes) : ""), [minutes])

  function commit() {
    const parsed = parseWorklogDuration(text)
    if (!parsed) { setText(minutes > 0 ? formatWorklogMinutes(minutes) : ""); return }
    const safe = Math.min(1440, Math.max(1, parsed))
    onChange(safe)
    setText(formatWorklogMinutes(safe))
  }

  return (
    <Input
      value={text}
      disabled={disabled}
      aria-label={ariaLabel}
      placeholder="1h 30m"
      className={cn("h-9 w-[92px] text-center text-xs font-medium tabular-nums", className)}
      onChange={(event) => setText(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur() }}
    />
  )
}
