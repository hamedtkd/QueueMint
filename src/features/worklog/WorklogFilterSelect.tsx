import type { LucideIcon } from "lucide-react"

import { JiraUserAvatar } from "@/components/jira-user-avatar"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type WorklogFilterOption = {
  value: string
  label: string
  icon?: LucideIcon
  avatarUrl?: string
  tone?: string
}

function FilterVisual({ option, className }: { option?: WorklogFilterOption; className?: string }) {
  if (!option) return null
  if (option.avatarUrl) return <JiraUserAvatar name={option.label} avatarUrl={option.avatarUrl} className={cn("size-5", className)} />
  if (option.icon) {
    const Icon = option.icon
    return <span className={cn("grid size-5 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground", option.tone, className)}><Icon className="size-3.5" /></span>
  }
  return <span className={cn("size-2.5 shrink-0 rounded-full bg-muted-foreground/35", option.tone, className)} />
}

export function WorklogFilterSelect({ value, items, onValueChange, className, ariaLabel }: {
  value: string
  items: WorklogFilterOption[]
  onValueChange: (value: string) => void
  className?: string
  ariaLabel: string
}) {
  const selected = items.find((item) => item.value === value)
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger aria-label={ariaLabel} className={cn("h-10", className)}>
        <span className="flex min-w-0 items-center gap-2">
          <FilterVisual option={selected} />
          <span className="truncate">{selected?.label ?? ""}</span>
        </span>
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            <span className="flex min-w-0 items-center gap-2"><FilterVisual option={item} /><span className="truncate">{item.label}</span></span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
