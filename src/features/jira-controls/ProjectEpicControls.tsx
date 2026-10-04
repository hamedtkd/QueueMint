import { useMemo } from "react"
import { Layers3, Minus, Plus, Zap } from "lucide-react"

import { JiraIssueTypeVisual } from "@/components/jira-issue-type-visual"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { JiraBoard, JiraEditableField, JiraEpic, JiraProject } from "@/types"
import { SearchableSingle } from "./SearchableSingle"

export function SimpleSelect({ value, items, onValueChange, placeholder, disabled, className, ariaLabel }: {
  value?: string; items: Array<{ value: string; label: string }>; onValueChange: (value: string) => void; placeholder?: string; disabled?: boolean; className?: string; ariaLabel?: string
}) {
  return <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}><SelectTrigger className={className} aria-label={ariaLabel}><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{items.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
}

export function IssueTypeSelect({ issueTypes, value, onValueChange, placeholder = "Issue type", disabled, className }: {
  issueTypes: Array<{ id: string; name: string; iconUrl?: string }>; value?: string; onValueChange: (value: string) => void; placeholder?: string; disabled?: boolean; className?: string
}) {
  const selected = issueTypes.find((item) => item.name === value)
  return <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
    <SelectTrigger className={className} aria-label={placeholder}>{selected ? <JiraIssueTypeVisual name={selected.name} iconUrl={selected.iconUrl} compact /> : <span className="text-muted-foreground">{placeholder}</span>}</SelectTrigger>
    <SelectContent>{issueTypes.map((item) => <SelectItem key={item.id} value={item.name}><JiraIssueTypeVisual name={item.name} iconUrl={item.iconUrl} compact /></SelectItem>)}</SelectContent>
  </Select>
}


export function BulkIssueTypeSelect({ issueTypes, value, onValueChange, noChangeLabel = "No change", disabled, className }: {
  issueTypes: Array<{ id: string; name: string; iconUrl?: string }>; value?: string; onValueChange: (value: string | undefined) => void; noChangeLabel?: string; disabled?: boolean; className?: string
}) {
  const noChange = "__bulk_issue_type_no_change__"
  const selected = issueTypes.find((item) => item.name === value)
  const encoded = value ?? noChange
  const neutral = <span className="inline-flex min-w-0 items-center gap-2 text-muted-foreground"><span className="grid size-6 shrink-0 place-items-center rounded-[var(--qm-control-radius)] bg-muted"><Minus className="size-3.5" /></span><span className="truncate font-medium">{noChangeLabel}</span></span>
  return <Select value={encoded} onValueChange={(next) => onValueChange(next === noChange ? undefined : next)} disabled={disabled}>
    <SelectTrigger className={className} aria-label="Issue type">{selected ? <JiraIssueTypeVisual name={selected.name} iconUrl={selected.iconUrl} compact /> : neutral}</SelectTrigger>
    <SelectContent>
      <SelectItem value={noChange}>{neutral}</SelectItem>
      {issueTypes.map((item) => <SelectItem key={item.id} value={item.name}><JiraIssueTypeVisual name={item.name} iconUrl={item.iconUrl} compact /></SelectItem>)}
    </SelectContent>
  </Select>
}

export function JiraFieldCombobox({ fields, value, onValueChange, placeholder, emptyLabel, disabled }: {
  fields: JiraEditableField[]; value?: string; onValueChange: (value: string) => void; placeholder: string; emptyLabel: string; disabled?: boolean
}) {
  const map = useMemo(() => new Map(fields.map((field): [string, string] => [field.id, field.name])), [fields])
  return <SearchableSingle items={fields.map((field) => field.id)} value={value} onValueChange={(next) => next && onValueChange(next)} itemLabel={(id) => map.get(id) ?? id} placeholder={placeholder} emptyLabel={emptyLabel} disabled={disabled} leading={<Plus className="size-4 shrink-0 text-muted-foreground" />} />
}

export function ProjectCombobox({ projects, value, onValueChange, placeholder, emptyLabel, disabled }: {
  projects: JiraProject[]; value?: string; onValueChange: (value: string) => void; placeholder: string; emptyLabel: string; disabled?: boolean
}) {
  const map = useMemo(() => new Map(projects.map((project): [string, string] => [project.key, `${project.key} — ${project.name}`])), [projects])
  return <SearchableSingle items={projects.map((item) => item.key)} value={value} onValueChange={(next) => next && onValueChange(next)} itemLabel={(key) => map.get(key) ?? key} placeholder={placeholder} emptyLabel={emptyLabel} disabled={disabled} leading={<Layers3 className="size-4 shrink-0 text-muted-foreground" />} />
}

export function BoardSelect({ boards, value, onValueChange, disabled, className }: {
  boards: JiraBoard[]; value: number | null; onValueChange: (value: number) => void; disabled?: boolean; className?: string
}) {
  return <SimpleSelect value={value === null ? "" : String(value)} items={boards.map((board) => ({ value: String(board.id), label: board.name }))} onValueChange={(next) => onValueChange(Number(next))} placeholder="-" disabled={disabled} className={className} />
}

export interface EpicOption { value: string; label: string; source: "batch" | "jira" }

export function buildEpicOptions(localRefs: Array<{ ref: string; summary: string }>, jiraEpics: JiraEpic[]): EpicOption[] {
  const result: EpicOption[] = localRefs.map((item) => ({ value: item.ref, label: `${item.ref} — ${item.summary}`, source: "batch" }))
  const seen = new Set(result.map((item) => item.value.toLowerCase()))
  for (const epic of jiraEpics) {
    if (seen.has(epic.key.toLowerCase())) continue
    result.push({ value: epic.key, label: `${epic.key} — ${epic.name || epic.summary || epic.key}`, source: "jira" })
  }
  return result
}

export function EpicCombobox({ options, value, onValueChange, placeholder, emptyLabel, batchLabel = "Batch", jiraLabel = "Jira", clearLabel = "No epic" }: {
  options: EpicOption[]; value?: string; onValueChange: (value: string | undefined) => void; placeholder: string; emptyLabel: string; batchLabel?: string; jiraLabel?: string; clearLabel?: string
}) {
  const map = useMemo(() => new Map(options.map((item): [string, EpicOption] => [item.value, item])), [options])
  return <SearchableSingle items={options.map((item) => item.value)} value={value} onValueChange={(next) => onValueChange(next ?? undefined)} itemLabel={(key) => map.get(key)?.label ?? key} placeholder={placeholder} emptyLabel={emptyLabel} allowClear clearLabel={clearLabel} leading={<Zap className="size-4 shrink-0 text-primary" />} renderItem={(key) => {
    const option = map.get(key)
    return <div className="flex min-w-0 items-center gap-2"><span className={cn("size-2 shrink-0 rounded-full", option?.source === "batch" ? "bg-primary" : "bg-muted-foreground")} /><span className="min-w-0 flex-1 truncate">{option?.label ?? key}</span><Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px]">{option?.source === "batch" ? batchLabel : jiraLabel}</Badge></div>
  }} />
}

export function BulkEpicCombobox({ options, value, onValueChange, placeholder, emptyLabel, noChangeLabel = "No change", clearLabel = "Remove Epic Link", disabled }: {
  options: EpicOption[]; value: string | null | undefined; onValueChange: (value: string | null | undefined) => void; placeholder: string; emptyLabel: string; noChangeLabel?: string; clearLabel?: string; disabled?: boolean
}) {
  const noChange = "__bulk_epic_no_change__"; const clearEpic = "__bulk_epic_clear__"
  const map = useMemo(() => new Map(options.map((item): [string, EpicOption] => [item.value, item])), [options])
  const encoded = value === undefined ? noChange : value === null ? clearEpic : value
  return <SearchableSingle items={[noChange, clearEpic, ...options.map((item) => item.value)]} value={encoded} onValueChange={(next) => { if (!next || next === noChange) onValueChange(undefined); else if (next === clearEpic) onValueChange(null); else onValueChange(next) }} itemLabel={(key) => key === noChange ? noChangeLabel : key === clearEpic ? clearLabel : map.get(key)?.label ?? key} placeholder={placeholder} emptyLabel={emptyLabel} disabled={disabled} leading={<Zap className="size-4 shrink-0 text-primary" />} renderItem={(key) => {
    if (key === noChange) return <span className="text-muted-foreground">{noChangeLabel}</span>
    if (key === clearEpic) return <span className="text-muted-foreground">{clearLabel}</span>
    return <div className="flex min-w-0 items-center gap-2"><span className="size-2 shrink-0 rounded-full bg-primary" /><span className="min-w-0 flex-1 truncate">{map.get(key)?.label ?? key}</span></div>
  }} />
}
