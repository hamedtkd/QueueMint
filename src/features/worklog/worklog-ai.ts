import { loadSmartAssistantSettings, requestSmartAssistantPermission } from "@/lib/smart-assistant"
import type { JiraLiveIssue, WorklogDraftEntry } from "@/types"
import { normalizeWorklogDraft } from "./worklog-utils"

const OPENAI_URL = "https://api.openai.com/v1/responses"

type Suggestion = { issueKey: string; minutes: number; comment: string }

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    assignments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { issueKey: { type: "string" }, minutes: { type: "integer" }, comment: { type: "string" } },
        required: ["issueKey", "minutes", "comment"],
      },
    },
  },
  required: ["assignments"],
}

function outputText(response: unknown) {
  const data = response as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> }
  for (const item of data.output ?? []) for (const content of item.content ?? []) if (content.type === "output_text" && content.text) return content.text
  return ""
}

export async function generateAiWorklogDraft(locale: "en" | "fa", issues: JiraLiveIssue[], targetMinutes: number, note: string, loggedMinutesByIssue: Record<string, number> = {}, date = new Date()): Promise<WorklogDraftEntry[]> {
  const settings = await loadSmartAssistantSettings()
  if (settings.provider !== "openai" || !settings.apiKey.trim()) throw new Error(locale === "fa" ? "اول OpenAI را در تنظیمات Smart Assistant فعال کن." : "Configure OpenAI in Smart Assistant settings first.")
  if (!(await requestSmartAssistantPermission(settings))) throw new Error(locale === "fa" ? "مجوز اتصال به OpenAI داده نشد." : "OpenAI network permission was not granted.")
  const candidates = issues.slice(0, 80).map((issue) => ({
    key: issue.key,
    summary: issue.summary,
    status: issue.status,
    assignee: issue.assignee,
    originalEstimateSeconds: issue.originalEstimateSeconds,
    remainingEstimateSeconds: issue.remainingEstimateSeconds,
    storyPoints: issue.storyPoints,
    sprint: issue.sprintName ?? (issue.placement === "backlog" ? "Backlog" : undefined),
    alreadyLoggedOnDateMinutes: loggedMinutesByIssue[issue.key] ?? 0,
  }))
  const prompt = [
    "You are QueueMint Worklog Assistant.",
    `Selected worklog date: ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}.`,
    `Allocate exactly ${targetMinutes} minutes across only the supplied Jira issues.`,
    "Use the user's work note as the strongest evidence. Status, sprint, estimates, and already-logged time are context only. Do not invent completed work or duplicate time already logged on the selected date.",
    "Return only issue keys from candidates. Use positive whole minutes. Keep comments short, factual, and suitable for a Jira worklog.",
    `Write comments in ${locale === "fa" ? "Persian" : "English"}.`,
    `WORK NOTE: ${note.trim() || "No additional work note was supplied."}`,
    `CANDIDATES: ${JSON.stringify(candidates)}`,
  ].join("\n")
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${settings.apiKey.trim()}` },
    body: JSON.stringify({ model: settings.model, store: false, input: prompt, text: { format: { type: "json_schema", name: "queuemint_worklog_suggestion", strict: true, schema } } }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error((body as { error?: { message?: string } }).error?.message || `OpenAI request failed (${response.status}).`)
  const text = outputText(body)
  if (!text) throw new Error("OpenAI returned no worklog suggestion.")
  const parsed = JSON.parse(text) as { assignments?: Suggestion[] }
  const byKey = new Map(issues.map((issue) => [issue.key.toUpperCase(), issue]))
  const draft = (parsed.assignments ?? []).flatMap((item): WorklogDraftEntry[] => {
    const issue = byKey.get(String(item.issueKey).toUpperCase())
    const minutes = Math.round(Number(item.minutes))
    if (!issue || !Number.isFinite(minutes) || minutes <= 0) return []
    return [{ issueKey: issue.key, summary: issue.summary, minutes, comment: String(item.comment ?? "").slice(0, 4000) }]
  })
  if (!draft.length) throw new Error("OpenAI did not return a usable worklog suggestion.")
  return normalizeWorklogDraft(draft, targetMinutes)
}
