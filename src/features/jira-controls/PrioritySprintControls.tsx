import { CalendarClock, CircleDot } from "lucide-react"

import { PriorityVisual } from "@/components/priority"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { JiraPriority, JiraSprint } from "@/types"

const DEFAULT_VALUE = "__default__"
const NONE_VALUE = "__none__"
const UNSET_VALUE = "__unset__"

export function PrioritySelect({ priorities, value, defaultPriority, onValueChange, allowInherited = true, noDefaultLabel = "No default", inheritedLabel = "Use batch default", className }: {
  priorities: JiraPriority[]; value?: string; defaultPriority?: string; onValueChange: (value: string | undefined) => void; allowInherited?: boolean; noDefaultLabel?: string; inheritedLabel?: string; className?: string
}) {
  const encoded = allowInherited ? value ?? DEFAULT_VALUE : value ?? UNSET_VALUE
  const visiblePriority = value ?? defaultPriority
  const inherited = allowInherited && value === undefined && Boolean(defaultPriority)
  return <Select value={encoded} onValueChange={(next) => onValueChange(next === DEFAULT_VALUE || next === UNSET_VALUE ? undefined : next)}>
    <SelectTrigger className={className} aria-label="Priority">
      {visiblePriority ? <PriorityVisual name={visiblePriority} compact inherited={inherited} inheritedLabel={inheritedLabel} /> : <span className="text-muted-foreground">{allowInherited ? inheritedLabel : noDefaultLabel}</span>}
    </SelectTrigger>
    <SelectContent>
      {allowInherited ? <><SelectItem value={DEFAULT_VALUE}><div className="flex min-w-0 items-center gap-2"><span className="grid size-6 place-items-center rounded-md bg-muted text-muted-foreground">↳</span><div className="min-w-0"><div className="font-medium">{inheritedLabel}</div>{defaultPriority ? <div className="text-[11px] text-muted-foreground">{defaultPriority}</div> : null}</div></div></SelectItem><SelectSeparator /></> : <><SelectItem value={UNSET_VALUE}><span className="text-muted-foreground">{noDefaultLabel}</span></SelectItem><SelectSeparator /></>}
      <SelectGroup>{priorities.map((priority) => <SelectItem key={priority.id} value={priority.name}><PriorityVisual name={priority.name} compact /></SelectItem>)}</SelectGroup>
    </SelectContent>
  </Select>
}

export function SprintVisual({ sprint, inherited = false, inheritedLabel = "default", backlogLabel = "Backlog", compact = false }: {
  sprint?: JiraSprint; inherited?: boolean; inheritedLabel?: string; backlogLabel?: string; compact?: boolean
}) {
  if (!sprint) return <span className="inline-flex min-w-0 items-center gap-2 text-muted-foreground"><span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted"><CalendarClock className="size-3.5" /></span><span className="truncate">{backlogLabel}</span></span>
  const active = sprint.state === "active"
  return <span className="inline-flex min-w-0 items-center gap-2"><span className={cn("grid shrink-0 place-items-center rounded-md", compact ? "size-6" : "size-7", active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300")}><CircleDot className={compact ? "size-3.5" : "size-4"} /></span><span className="min-w-0 truncate"><span className="font-medium">{sprint.name}</span>{inherited ? <span className="ms-1 text-[11px] font-normal text-muted-foreground">{inheritedLabel}</span> : null}</span></span>
}

export function SprintSelect({ sprints, value, defaultSprint, onValueChange, allowInherited = true, allowBacklog = true, inheritedLabel = "Use batch default", noDefaultLabel = "No default", backlogLabel = "Backlog / no sprint", activeLabel = "Active", futureLabel = "Future", disabled, className }: {
  sprints: JiraSprint[]; value?: number | null; defaultSprint?: number | null; onValueChange: (value: number | null | undefined) => void; allowInherited?: boolean; allowBacklog?: boolean; inheritedLabel?: string; noDefaultLabel?: string; backlogLabel?: string; activeLabel?: string; futureLabel?: string; disabled?: boolean; className?: string
}) {
  const normalizedValue = !allowBacklog && value === null ? undefined : value
  const encoded = allowInherited ? normalizedValue === undefined ? DEFAULT_VALUE : normalizedValue === null ? NONE_VALUE : String(normalizedValue) : normalizedValue === undefined ? UNSET_VALUE : normalizedValue === null ? NONE_VALUE : String(normalizedValue)
  const effectiveId = normalizedValue !== undefined ? normalizedValue : defaultSprint
  const selectedSprint = typeof effectiveId === "number" ? sprints.find((item) => item.id === effectiveId) : undefined
  const inherited = allowInherited && normalizedValue === undefined && typeof defaultSprint === "number"
  return <Select value={encoded} disabled={disabled} onValueChange={(next) => { if (next === DEFAULT_VALUE || next === UNSET_VALUE) onValueChange(undefined); else if (next === NONE_VALUE) onValueChange(null); else onValueChange(Number(next)) }}>
    <SelectTrigger className={className} aria-label="Sprint">{encoded === UNSET_VALUE ? <span className="text-muted-foreground">{noDefaultLabel}</span> : encoded === DEFAULT_VALUE && !selectedSprint ? <span className="text-muted-foreground">{inheritedLabel}</span> : <SprintVisual sprint={selectedSprint} inherited={inherited} inheritedLabel={inheritedLabel} backlogLabel={backlogLabel} compact />}</SelectTrigger>
    <SelectContent>
      {allowInherited ? <SelectItem value={DEFAULT_VALUE}><div className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-md bg-muted text-muted-foreground">↳</span><div><div className="font-medium">{inheritedLabel}</div><div className="text-[11px] text-muted-foreground">{typeof defaultSprint === "number" ? sprints.find((item) => item.id === defaultSprint)?.name ?? defaultSprint : backlogLabel}</div></div></div></SelectItem> : allowBacklog ? <SelectItem value={UNSET_VALUE}><span className="text-muted-foreground">{noDefaultLabel}</span></SelectItem> : null}
      {allowBacklog ? <><SelectItem value={NONE_VALUE}><SprintVisual backlogLabel={backlogLabel} compact /></SelectItem><SelectSeparator /></> : allowInherited ? <SelectSeparator /> : null}
      <SelectGroup><SelectGroupLabel>{activeLabel}</SelectGroupLabel>{sprints.filter((item) => item.state === "active").map((sprint) => <SelectItem key={sprint.id} value={String(sprint.id)}><SprintVisual sprint={sprint} compact /></SelectItem>)}</SelectGroup>
      {sprints.some((item) => item.state !== "active") ? <SelectGroup><SelectGroupLabel>{futureLabel}</SelectGroupLabel>{sprints.filter((item) => item.state !== "active").map((sprint) => <SelectItem key={sprint.id} value={String(sprint.id)}><SprintVisual sprint={sprint} compact /></SelectItem>)}</SelectGroup> : null}
    </SelectContent>
  </Select>
}
