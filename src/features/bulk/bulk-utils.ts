import type { JiraBulkEditPatch, JiraEditableField, JiraIssueFieldSnapshot, ValidationResult } from "@/types"

export const EMPTY_VALIDATION: ValidationResult = { valid: false, errors: [], warnings: [] }
export const DEFAULT_FILTER = "all"
export const ACCENT_PRESETS = ["#087b61", "#2563eb", "#4f46e5", "#7c3aed", "#c2410c"]

export function foregroundForHex(hex: string) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!match) return "#ffffff"
  const value = Number.parseInt(match[1], 16)
  const srgb = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
    const normalized = channel / 255
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.05 ? "#ffffff" : "#111827"
}

export function accentForDarkMode(hex: string) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!match) return hex
  const value = Number.parseInt(match[1], 16)
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255]
  const mixed = channels.map((channel) => Math.round(channel + (255 - channel) * 0.2))
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`
}

export type Mode = "dashboard" | "quick" | "bulk" | "review" | "manage" | "worklog" | "automation"
export type Placement = "sprint" | "backlog"
export type DynamicFieldDraft = { mode: "set" | "clear"; value: unknown }
export type BulkPlacementSnapshot = { key: string; placement: Placement; sprintId?: number }
export type BulkPreviewRow = { id: string; label: string; before: string; after: string }
export type PendingBulkPreview = {
  keys: string[]; patch: JiraBulkEditPatch; fieldIds: string[]; snapshots: JiraIssueFieldSnapshot[]; placements: BulkPlacementSnapshot[]
  targetPlacement: "keep" | "sprint" | "backlog"; targetSprintId: number | null; boardId: number | null; rows: BulkPreviewRow[]
}
export type BulkHistoryEntry = {
  id: string; createdAt: string; keys: string[]; fieldIds: string[]; snapshots: JiraIssueFieldSnapshot[]; placements: BulkPlacementSnapshot[]; boardId: number | null; changes: string[]
}

export function jiraValueLabel(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Empty"
  if (Array.isArray(value)) return value.length ? value.map(jiraValueLabel).filter(Boolean).join(", ") : "Empty"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "number" || typeof value === "string") return String(value)
  if (typeof value === "object") {
    const record = value as Record<string, unknown>
    for (const key of ["displayName", "name", "value", "key", "id"]) {
      const candidate = record[key]
      if (typeof candidate === "string" || typeof candidate === "number") return String(candidate)
    }
    try { return JSON.stringify(value) } catch { return "Value" }
  }
  return String(value)
}

function jiraSecondsLabel(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "Empty"
  const days = Math.floor(value / 28800); const hours = Math.floor((value % 28800) / 3600); const minutes = Math.floor((value % 3600) / 60)
  const parts: string[] = []
  if (days) parts.push(`${days}d`); if (hours) parts.push(`${hours}h`); if (minutes) parts.push(`${minutes}m`)
  return parts.join(" ") || "<1m"
}

function snapshotFieldLabel(fieldId: string, value: unknown) {
  return fieldId === "timeoriginalestimate" || fieldId === "timeestimate" ? jiraSecondsLabel(value) : jiraValueLabel(value)
}

export function summarizeSnapshotField(snapshots: JiraIssueFieldSnapshot[], fieldId: string, mixedLabel: string) {
  if (!snapshots.length) return "-"
  const unique = Array.from(new Set(snapshots.map((snapshot) => snapshotFieldLabel(fieldId, snapshot.fields[fieldId]))))
  return unique.length === 1 ? unique[0] : mixedLabel
}

export function allowedValuePayload(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return value
  const record = value as Record<string, unknown>
  if (typeof record.id === "string" || typeof record.id === "number") return { id: String(record.id) }
  if (typeof record.accountId === "string") return { accountId: record.accountId }
  if (typeof record.name === "string") return { name: record.name }
  if (typeof record.key === "string") return { key: record.key }
  if (typeof record.value === "string" || typeof record.value === "number") return { value: record.value }
  return value
}

export function isDynamicFieldSupported(field: JiraEditableField) {
  if (field.operations.length && !field.operations.includes("set")) return false
  const type = field.schema?.type?.toLowerCase() ?? "string"; const items = field.schema?.items?.toLowerCase() ?? ""
  return Boolean(field.allowedValues.length || ["string", "number", "date", "datetime", "boolean"].includes(type) || (type === "array" && ["string", "number"].includes(items)))
}

export function dynamicValueLabel(field: JiraEditableField, value: unknown) {
  if (!field.allowedValues.length) return jiraValueLabel(value)
  const findLabel = (candidate: unknown) => {
    const match = field.allowedValues.find((allowed) => JSON.stringify(allowedValuePayload(allowed)) === JSON.stringify(candidate))
    return match === undefined ? jiraValueLabel(candidate) : jiraValueLabel(match)
  }
  return Array.isArray(value) ? value.length ? value.map(findLabel).join(", ") : "Empty" : findLabel(value)
}

export function dynamicFieldInitialValue(field: JiraEditableField): unknown {
  if (field.schema?.type === "array") return []
  if (field.schema?.type === "boolean") return false
  return ""
}

export function dynamicFieldPayload(field: JiraEditableField, draft: DynamicFieldDraft): unknown {
  if (draft.mode === "clear") return field.schema?.type === "array" ? [] : null
  if (field.allowedValues.length) return draft.value
  const type = field.schema?.type?.toLowerCase() ?? "string"
  if (type === "number") { const number = Number(draft.value); return Number.isFinite(number) ? number : draft.value }
  if (type === "boolean") return Boolean(draft.value)
  if (type === "datetime" && typeof draft.value === "string" && draft.value.trim()) { const date = new Date(draft.value); return Number.isNaN(date.getTime()) ? draft.value : date.toISOString() }
  if (type === "array") return Array.isArray(draft.value) ? draft.value : String(draft.value ?? "").split(",").map((item) => item.trim()).filter(Boolean)
  return draft.value
}

export function isDynamicDraftReady(field: JiraEditableField, draft: DynamicFieldDraft) {
  if (draft.mode === "clear") return !field.required
  const value = draft.value
  if (field.schema?.type === "array") return Array.isArray(value) ? value.length > 0 : Boolean(String(value ?? "").trim())
  if (field.schema?.type === "boolean") return true
  return value !== null && value !== undefined && String(value).trim() !== ""
}
