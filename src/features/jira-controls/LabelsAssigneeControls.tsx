import { useEffect, useMemo, useState, type KeyboardEvent } from "react"
import { LoaderCircle, Plus, Tags, UserRound } from "lucide-react"

import { JiraUserAvatar } from "@/components/jira-user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxOption,
  ComboboxSearch,
  ComboboxTrigger,
} from "@/components/ui/combobox"
import { getLabelSuggestions } from "@/lib/jira"
import type { JiraUser } from "@/types"
import { SearchableSingle } from "./SearchableSingle"

export function LabelsCombobox({ options, value, onValueChange, placeholder, emptyLabel, createLabel, projectKey, loadingLabel = "Loading Jira labels…", disabled = false }: {
  options: string[]; value: string[]; onValueChange: (value: string[]) => void; placeholder: string; emptyLabel: string; createLabel: (value: string) => string; projectKey?: string; loadingLabel?: string; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [remote, setRemote] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const normalized = query.trim()
  useEffect(() => {
    if (!open || !projectKey) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      void getLabelSuggestions(projectKey, normalized).then((next) => { if (!cancelled) setRemote(next) }).catch(() => { if (!cancelled) setRemote([]) }).finally(() => { if (!cancelled) setLoading(false) })
    }, 220)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [open, normalized, projectKey])
  const known = useMemo(() => Array.from(new Set([...options, ...remote, ...value].map((item) => item.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [options, remote, value])
  const filtered = useMemo(() => known.filter((item) => !normalized || item.toLowerCase().includes(normalized.toLowerCase())), [known, normalized])
  const canCreate = Boolean(normalized) && !known.some((item) => item.toLowerCase() === normalized.toLowerCase())
  const toggle = (label: string) => onValueChange(value.includes(label) ? value.filter((item) => item !== label) : [...value, label])
  function addQueryLabel() {
    if (!normalized) return
    if (!value.some((item) => item.toLowerCase() === normalized.toLowerCase())) onValueChange([...value, normalized])
    setQuery("")
  }
  return <Combobox open={open} onOpenChange={setOpen}>
    <ComboboxTrigger asChild><Button type="button" variant="outline" disabled={disabled} className="min-h-10 h-auto w-full min-w-0 justify-between whitespace-normal px-3 py-1.5 font-normal" aria-haspopup="listbox"><span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-start"><Tags className="size-4 shrink-0 text-muted-foreground" />{value.length ? value.map((label) => <Badge key={label} variant="secondary">{label}</Badge>) : <span className="truncate text-muted-foreground">{placeholder}</span>}</span></Button></ComboboxTrigger>
    <ComboboxContent className="min-w-[300px]"><ComboboxSearch value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => { if (event.key === "Enter" && canCreate) { event.preventDefault(); addQueryLabel() } }} placeholder={placeholder} autoFocus />{loading ? <div className="mb-1 flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin" />{loadingLabel}</div> : null}<ComboboxList>{canCreate ? <ComboboxOption onClick={addQueryLabel}><span className="inline-flex items-center gap-2 font-medium text-primary"><Plus className="size-4" />{createLabel(normalized)}</span></ComboboxOption> : null}{filtered.length ? filtered.map((label) => <ComboboxOption key={label} selected={value.includes(label)} onClick={() => toggle(label)}><span className="inline-flex items-center gap-2"><Tags className="size-3.5 text-muted-foreground" />{label}</span></ComboboxOption>) : !canCreate && !loading ? <ComboboxEmpty>{emptyLabel}</ComboboxEmpty> : null}</ComboboxList></ComboboxContent>
  </Combobox>
}

function userIdentity(user: JiraUser) { return user.name || user.key || user.displayName || "" }
function userLabel(user: JiraUser) { const id = userIdentity(user); return user.displayName && user.displayName !== id ? `${user.displayName} · ${id}` : user.displayName || id }

function UserOption({ user, fallback, label }: { user?: JiraUser; fallback: string; label: string }) {
  const name = user?.displayName || fallback
  const avatarUrl = user?.avatarUrls?.["32x32"] ?? user?.avatarUrls?.["24x24"] ?? user?.avatarUrls?.["48x48"]
  return <div className="flex min-w-0 items-center gap-2"><JiraUserAvatar name={name} avatarUrl={avatarUrl} className="size-7" /><span className="min-w-0 flex-1 truncate">{label}</span></div>
}

export function AssigneeCombobox({ users, value, onValueChange, placeholder, emptyLabel, unassignedLabel, allowInherited = false, inheritedLabel = "Use batch default", defaultAssignee }: {
  users: JiraUser[]; value?: string; onValueChange: (value: string | undefined) => void; placeholder: string; emptyLabel: string; unassignedLabel: string; allowInherited?: boolean; inheritedLabel?: string; defaultAssignee?: string
}) {
  const map = useMemo(() => new Map(users.map((user): [string, JiraUser] => [userIdentity(user), user]).filter(([key]) => Boolean(key))), [users])
  const inheritedKey = "__assignee_default__"; const unassignedKey = "__unassigned__"
  const encoded = allowInherited && value === undefined ? inheritedKey : value || unassignedKey
  const labelFor = (key: string) => key === inheritedKey ? defaultAssignee ? `${inheritedLabel} · ${userLabel(map.get(defaultAssignee) ?? { name: defaultAssignee })}` : inheritedLabel : key === unassignedKey ? unassignedLabel : userLabel(map.get(key) ?? { name: key })
  return <SearchableSingle items={[...(allowInherited ? [inheritedKey] : []), unassignedKey, ...Array.from(map.keys())]} value={encoded} onValueChange={(next) => { if (!next || next === inheritedKey || next === unassignedKey) onValueChange(undefined); else onValueChange(next) }} itemLabel={labelFor} placeholder={placeholder} emptyLabel={emptyLabel} leading={<UserRound className="size-4 shrink-0 text-muted-foreground" />} renderValue={(key) => key === inheritedKey || key === unassignedKey ? <span className="truncate text-muted-foreground">{labelFor(key)}</span> : <UserOption user={map.get(key)} fallback={key} label={labelFor(key)} />} renderItem={(key) => key === inheritedKey || key === unassignedKey ? <span className="text-muted-foreground">{labelFor(key)}</span> : <UserOption user={map.get(key)} fallback={key} label={labelFor(key)} />} />
}

export function BulkAssigneeCombobox({ users, value, onValueChange, placeholder, emptyLabel, unassignedLabel, noChangeLabel, disabled }: {
  users: JiraUser[]; value: string | null | undefined; onValueChange: (value: string | null | undefined) => void; placeholder: string; emptyLabel: string; unassignedLabel: string; noChangeLabel: string; disabled?: boolean
}) {
  const map = useMemo(() => new Map(users.map((user): [string, JiraUser] => [userIdentity(user), user]).filter(([key]) => Boolean(key))), [users])
  const noChange = "__bulk_no_change__"; const unassigned = "__bulk_unassigned__"
  const encoded = value === undefined ? noChange : value === null ? unassigned : value
  const labelFor = (key: string) => key === noChange ? noChangeLabel : key === unassigned ? unassignedLabel : userLabel(map.get(key) ?? { name: key })
  return <SearchableSingle items={[noChange, unassigned, ...Array.from(map.keys())]} value={encoded} onValueChange={(next) => { if (!next || next === noChange) onValueChange(undefined); else if (next === unassigned) onValueChange(null); else onValueChange(next) }} itemLabel={labelFor} placeholder={placeholder} emptyLabel={emptyLabel} disabled={disabled} leading={<UserRound className="size-4 shrink-0 text-muted-foreground" />} renderValue={(key) => key === noChange || key === unassigned ? <span className="truncate text-muted-foreground">{labelFor(key)}</span> : <UserOption user={map.get(key)} fallback={key} label={labelFor(key)} />} renderItem={(key) => key === noChange || key === unassigned ? <span className="text-muted-foreground">{labelFor(key)}</span> : <UserOption user={map.get(key)} fallback={key} label={labelFor(key)} />} />
}
