import type { WorklogSettings } from "@/types"

const STORAGE_KEY = "queuemint-worklog-settings-v1"
export const DEFAULT_WORKLOG_SETTINGS: WorklogSettings = { dailyTargetMinutes: 450 }

function sanitize(value: unknown): WorklogSettings {
  const candidate = value && typeof value === "object" ? value as Partial<WorklogSettings> : {}
  const minutes = Number(candidate.dailyTargetMinutes)
  return { dailyTargetMinutes: Number.isFinite(minutes) && minutes >= 30 && minutes <= 1440 ? Math.round(minutes) : DEFAULT_WORKLOG_SETTINGS.dailyTargetMinutes }
}

export async function loadWorklogSettings() {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return DEFAULT_WORKLOG_SETTINGS
  const result = await chrome.storage.local.get(STORAGE_KEY)
  return sanitize(result?.[STORAGE_KEY])
}

export async function saveWorklogSettings(settings: WorklogSettings) {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return
  await chrome.storage.local.set({ [STORAGE_KEY]: sanitize(settings) })
}
