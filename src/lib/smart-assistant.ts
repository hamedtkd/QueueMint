import type { QueueMintPageDiagnostics } from "@/features/capture-pro/types"
import type { QueueMintPageContext } from "@/lib/capture"
import type { JiraIssueSearchResult } from "@/types"

const SETTINGS_KEY = "queuemint-smart-assistant-v1"
const API_KEY_SESSION_KEY = "queuemint-smart-assistant-api-key-v1"
const OPENAI_ORIGIN = "https://api.openai.com/*"
const OPENAI_URL = "https://api.openai.com/v1/responses"

export type SmartAssistantProvider = "local" | "openai"

export interface SmartAssistantSettings {
  provider: SmartAssistantProvider
  model: string
  apiKey: string
}

interface StoredSmartAssistantSettings {
  provider: SmartAssistantProvider
  model: string
}

export interface SmartAssistantDataOptions {
  currentDraft: boolean
  pageContext: boolean
  screenshot: boolean
  diagnostics: boolean
  jiraMetadata: boolean
  duplicateCandidates: boolean
}

export interface SmartAssistantMetadata {
  issueTypes: string[]
  priorities: string[]
  components: string[]
  labels: string[]
  epics: Array<{ key: string; label: string }>
  assignees: Array<{ id: string; name: string }>
}

export interface SmartAssistantDraft {
  summary: string
  description: string
  issueType?: string
  priority?: string
  component?: string
  labels?: string[]
  epic?: string
  assignee?: string
}

export interface SmartAssistantDuplicate {
  key: string
  score: number
  reason: string
}

export interface SmartAssistantSuggestion extends SmartAssistantDraft {
  issueType: string
  priority: string
  component: string
  labels: string[]
  epic: string
  assignee: string
  stepsToReproduce: string[]
  expectedResult: string
  actualResult: string
  duplicates: SmartAssistantDuplicate[]
}

export interface GenerateSmartAssistantInput {
  locale: "en" | "fa"
  projectKey: string
  draft: SmartAssistantDraft
  options: SmartAssistantDataOptions
  metadata?: SmartAssistantMetadata
  pageContext?: QueueMintPageContext | null
  screenshot?: string | null
  diagnostics?: QueueMintPageDiagnostics | null
  duplicateCandidates?: JiraIssueSearchResult[]
}

export const DEFAULT_SMART_ASSISTANT_SETTINGS: SmartAssistantSettings = {
  provider: "local",
  model: "gpt-5.6-luna",
  apiKey: "",
}

export const DEFAULT_SMART_ASSISTANT_OPTIONS: SmartAssistantDataOptions = {
  currentDraft: true,
  pageContext: false,
  screenshot: false,
  diagnostics: false,
  jiraMetadata: false,
  duplicateCandidates: false,
}

function normalizedStoredSettings(value: Partial<SmartAssistantSettings> | undefined): StoredSmartAssistantSettings {
  return {
    provider: value?.provider === "openai" ? "openai" : "local",
    model: value?.model?.trim() || DEFAULT_SMART_ASSISTANT_SETTINGS.model,
  }
}

async function loadSessionApiKey() {
  if (!chrome.storage?.session) return ""
  const result = await chrome.storage.session.get(API_KEY_SESSION_KEY)
  const value = result?.[API_KEY_SESSION_KEY]
  return typeof value === "string" ? value.trim() : ""
}

async function saveSessionApiKey(apiKey: string) {
  if (!chrome.storage?.session) return
  const value = apiKey.trim()
  if (value) await chrome.storage.session.set({ [API_KEY_SESSION_KEY]: value })
  else await chrome.storage.session.remove(API_KEY_SESSION_KEY)
}

export async function loadSmartAssistantSettings(): Promise<SmartAssistantSettings> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return DEFAULT_SMART_ASSISTANT_SETTINGS
  const result = await chrome.storage.local.get(SETTINGS_KEY)
  const legacy = result?.[SETTINGS_KEY] as Partial<SmartAssistantSettings> | undefined
  const stored = normalizedStoredSettings(legacy)
  let apiKey = await loadSessionApiKey()

  if (!apiKey && typeof legacy?.apiKey === "string" && legacy.apiKey.trim()) {
    apiKey = legacy.apiKey.trim()
    await saveSessionApiKey(apiKey)
  }
  if (legacy && Object.prototype.hasOwnProperty.call(legacy, "apiKey")) {
    await chrome.storage.local.set({ [SETTINGS_KEY]: stored })
  }

  return { ...stored, apiKey }
}

export async function saveSmartAssistantSettings(settings: SmartAssistantSettings) {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return
  const stored = normalizedStoredSettings(settings)
  await chrome.storage.local.set({ [SETTINGS_KEY]: stored })
  await saveSessionApiKey(settings.apiKey)
}

export async function requestSmartAssistantPermission(settings: SmartAssistantSettings) {
  if (settings.provider !== "openai") return true
  if (typeof chrome === "undefined" || !chrome.permissions?.request) return true
  return chrome.permissions.request({ origins: [OPENAI_ORIGIN] })
}

function clip(value: string | undefined, max: number) {
  return (value ?? "").slice(0, max)
}

async function downscaleImage(dataUrl: string) {
  if (!dataUrl.startsWith("data:image/")) return dataUrl
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image(); element.onload = () => resolve(element); element.onerror = reject; element.src = dataUrl
    })
    const maxEdge = 1600
    const scale = Math.min(1, maxEdge / Math.max(image.width, image.height))
    if (scale >= 1) return dataUrl
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale))
    const context = canvas.getContext("2d"); if (!context) return dataUrl
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL("image/jpeg", 0.82)
  } catch { return dataUrl }
}

function buildPayload(input: GenerateSmartAssistantInput) {
  const payload: Record<string, unknown> = { projectKey: input.projectKey }
  if (input.options.currentDraft) payload.currentDraft = input.draft
  if (input.options.pageContext && input.pageContext) payload.pageContext = {
    url: clip(input.pageContext.url, 1800), title: clip(input.pageContext.title, 500), hostname: input.pageContext.hostname,
    selection: clip(input.pageContext.selection, 4000), viewport: [input.pageContext.viewportWidth, input.pageContext.viewportHeight],
    document: [input.pageContext.documentWidth, input.pageContext.documentHeight], scroll: [input.pageContext.scrollX, input.pageContext.scrollY],
  }
  if (input.options.diagnostics && input.diagnostics) payload.diagnostics = {
    errors: input.diagnostics.errors.slice(0, 20), network: input.diagnostics.network.slice(0, 30), navigation: input.diagnostics.navigation,
  }
  if (input.options.jiraMetadata && input.metadata) payload.jiraMetadata = {
    issueTypes: input.metadata.issueTypes.slice(0, 30), priorities: input.metadata.priorities.slice(0, 30), components: input.metadata.components.slice(0, 50),
    labels: input.metadata.labels.slice(0, 60), epics: input.metadata.epics.slice(0, 50), assignees: input.metadata.assignees.slice(0, 60),
  }
  if (input.options.duplicateCandidates && input.duplicateCandidates) payload.duplicateCandidates = input.duplicateCandidates.slice(0, 35).map((issue) => ({
    key: issue.key, summary: issue.summary, type: issue.type, priority: issue.priority, status: issue.status, labels: issue.labels,
  }))
  return payload
}

const schema = {
  type: "object", additionalProperties: false,
  properties: {
    summary: { type: "string" }, description: { type: "string" }, stepsToReproduce: { type: "array", items: { type: "string" } },
    expectedResult: { type: "string" }, actualResult: { type: "string" }, issueType: { type: "string" }, priority: { type: "string" },
    component: { type: "string" }, labels: { type: "array", items: { type: "string" } }, epic: { type: "string" }, assignee: { type: "string" },
    duplicates: { type: "array", items: { type: "object", additionalProperties: false, properties: { key: { type: "string" }, score: { type: "number" }, reason: { type: "string" } }, required: ["key", "score", "reason"] } },
  },
  required: ["summary", "description", "stepsToReproduce", "expectedResult", "actualResult", "issueType", "priority", "component", "labels", "epic", "assignee", "duplicates"],
}

export function normalizeJiraWikiFormatting(value: string) {
  return value
    .replace(/^\s*(#{1,6})\s+(.+)$/gm, (_, hashes: string, text: string) => `h${hashes.length}. ${text}`)
    .replace(/^\s*[-+]\s+/gm, "* ")
    .replace(/^\s*\d+[.)]\s+/gm, "# ")
    .replace(/\*\*([^*\n]+)\*\*/g, "*$1*")
    .replace(/__([^_\n]+)__/g, "*$1*")
    .replace(/`([^`\n]+)`/g, "{{$1}}")
}

function normalizeSuggestionFormatting(suggestion: SmartAssistantSuggestion): SmartAssistantSuggestion {
  return {
    ...suggestion,
    description: normalizeJiraWikiFormatting(suggestion.description),
    stepsToReproduce: suggestion.stepsToReproduce.map(normalizeJiraWikiFormatting),
    expectedResult: normalizeJiraWikiFormatting(suggestion.expectedResult),
    actualResult: normalizeJiraWikiFormatting(suggestion.actualResult),
  }
}

function outputText(response: unknown) {
  const data = response as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> }
  for (const item of data.output ?? []) for (const content of item.content ?? []) if (content.type === "output_text" && content.text) return content.text
  return ""
}

export async function generateSmartAssistant(settings: SmartAssistantSettings, input: GenerateSmartAssistantInput): Promise<SmartAssistantSuggestion> {
  if (settings.provider !== "openai" || !settings.apiKey.trim()) throw new Error("Configure OpenAI in QueueMint Settings before using AI suggestions.")
  if (!Object.values(input.options).some(Boolean)) throw new Error("Choose at least one data source for Smart Assistant.")
  const content: Array<Record<string, unknown>> = [{
    type: "input_text",
    text: `You are QueueMint Smart Assistant. Draft a concise, high-quality Jira issue from the supplied evidence. Do not invent facts. Empty string means no reliable suggestion. Use only exact Jira metadata values when metadata is supplied. Duplicate keys must come from the supplied duplicate candidates and scores must be 0 to 100. Write issue text in the same language as the supplied draft/context, otherwise use ${input.locale === "fa" ? "Persian" : "English"}. If formatting is useful, use Jira wiki markup only: *bold*, _italic_, {{code}}, * bullet items, # numbered items, and h2. headings. Do not use Markdown **bold**, backticks, or Markdown list markers.\n\nINPUT:\n${JSON.stringify(buildPayload(input))}`,
  }]
  if (input.options.screenshot && input.screenshot) content.push({ type: "input_image", image_url: await downscaleImage(input.screenshot), detail: "low" })
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${settings.apiKey.trim()}` },
    body: JSON.stringify({ model: settings.model.trim() || DEFAULT_SMART_ASSISTANT_SETTINGS.model, store: false, input: [{ role: "user", content }], text: { format: { type: "json_schema", name: "queuemint_issue_suggestion", strict: true, schema } } }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error((body as { error?: { message?: string } }).error?.message || `OpenAI request failed (${response.status}).`)
  const text = outputText(body)
  if (!text) throw new Error("OpenAI returned no structured suggestion.")
  return normalizeSuggestionFormatting(JSON.parse(text) as SmartAssistantSuggestion)
}

export function buildAssistantDescription(suggestion: SmartAssistantSuggestion, locale: "en" | "fa") {
  const stepsTitle = locale === "fa" ? "مراحل بازتولید" : "Steps to reproduce"
  const expectedTitle = locale === "fa" ? "نتیجه مورد انتظار" : "Expected result"
  const actualTitle = locale === "fa" ? "نتیجه فعلی" : "Actual result"
  const sections = [normalizeJiraWikiFormatting(suggestion.description.trim())]
  if (suggestion.stepsToReproduce.length) sections.push(`*${stepsTitle}:*\n${suggestion.stepsToReproduce.map((step) => `# ${normalizeJiraWikiFormatting(step).replace(/^\s*[#*]\s+/, "")}`).join("\n")}`)
  if (suggestion.expectedResult.trim()) sections.push(`*${expectedTitle}:*\n${normalizeJiraWikiFormatting(suggestion.expectedResult.trim())}`)
  if (suggestion.actualResult.trim()) sections.push(`*${actualTitle}:*\n${normalizeJiraWikiFormatting(suggestion.actualResult.trim())}`)
  return sections.filter(Boolean).join("\n\n")
}
