import type { CloneIssueOptions, JiraIssueDetails, JiraUser } from "@/types"
import { sendJiraRequest } from "./request"

type RawDetails = {
  id?: string
  key?: string
  fields?: {
    summary?: string; description?: string; issuetype?: { name?: string }; priority?: { name?: string }; status?: { name?: string }
    assignee?: JiraUser | null; reporter?: JiraUser | null; labels?: string[]
    components?: Array<{ id?: string; name?: string }>; fixVersions?: Array<{ id?: string; name?: string }>
    created?: string; updated?: string; duedate?: string; parent?: { key?: string; fields?: { summary?: string } } | null
    comment?: { comments?: Array<{ id?: string; body?: string; created?: string; updated?: string; author?: JiraUser }> }
    attachment?: Array<{ id?: string; filename?: string; size?: number; mimeType?: string; content?: string; thumbnail?: string; author?: JiraUser }>
    timeoriginalestimate?: number; timeestimate?: number; [key: string]: unknown
  }
}

export async function getJiraIssueDetails(issueKey: string, storyPointsFieldId?: string): Promise<JiraIssueDetails> {
  if (!/^[A-Z][A-Z0-9_]*-\d+$/i.test(issueKey)) throw new Error("Invalid Jira issue key.")
  const requestedFields = ["summary", "description", "issuetype", "priority", "status", "assignee", "reporter", "labels", "components", "fixVersions", "created", "updated", "duedate", "parent", "comment", "attachment", "timeoriginalestimate", "timeestimate", ...(storyPointsFieldId ? [storyPointsFieldId] : [])]
  const raw = await sendJiraRequest<RawDetails>(`/rest/api/2/issue/${encodeURIComponent(issueKey)}?fields=${encodeURIComponent(requestedFields.join(","))}`)
  if (!raw?.id || !raw?.key) throw new Error("Jira did not return the requested issue.")
  const fields = raw.fields ?? {}
  const rawStoryPoints = storyPointsFieldId ? fields[storyPointsFieldId] : undefined
  return {
    id: raw.id, key: raw.key, summary: fields.summary ?? raw.key,
    description: typeof fields.description === "string" ? fields.description : undefined,
    type: fields.issuetype?.name, priority: fields.priority?.name, status: fields.status?.name,
    assignee: fields.assignee ?? null, reporter: fields.reporter ?? null,
    labels: Array.isArray(fields.labels) ? fields.labels.filter((value): value is string => typeof value === "string") : [],
    components: Array.isArray(fields.components) ? fields.components.filter((value): value is { id?: string; name: string } => Boolean(value?.name)) : [],
    fixVersions: Array.isArray(fields.fixVersions) ? fields.fixVersions.filter((value): value is { id?: string; name: string } => Boolean(value?.name)) : [],
    created: fields.created, updated: fields.updated, dueDate: fields.duedate, parent: fields.parent ?? null,
    comments: (fields.comment?.comments ?? []).filter((item): item is { id: string; body?: string; created?: string; updated?: string; author?: JiraUser } => typeof item?.id === "string"),
    attachments: (fields.attachment ?? []).filter((item): item is { id: string; filename: string; size?: number; mimeType?: string; content?: string; thumbnail?: string; author?: JiraUser } => typeof item?.id === "string" && typeof item?.filename === "string"),
    originalEstimateSeconds: typeof fields.timeoriginalestimate === "number" ? fields.timeoriginalestimate : undefined,
    remainingEstimateSeconds: typeof fields.timeestimate === "number" ? fields.timeestimate : undefined,
    storyPoints: typeof rawStoryPoints === "number" && Number.isFinite(rawStoryPoints) ? rawStoryPoints : undefined,
  }
}

// Export only the fields needed by Worklog. Avoid fetching Jira comments and unrelated private fields.
export async function getJiraIssueExportDetails(issueKey: string) {
  if (!/^[A-Z][A-Z0-9_]*-\d+$/i.test(issueKey)) throw new Error("Invalid Jira issue key.")
  const raw = await sendJiraRequest<RawDetails>("/rest/api/2/issue/" + encodeURIComponent(issueKey) + "?fields=description%2Cattachment")
  if (!raw?.id || !raw?.key) throw new Error("Jira did not return the requested issue.")
  return {
    description: typeof raw.fields?.description === "string" ? raw.fields.description : "",
    attachments: (raw.fields?.attachment ?? []).filter((item): item is { id: string; filename: string; size?: number; mimeType?: string; content?: string; thumbnail?: string; author?: JiraUser } =>
      typeof item?.id === "string" && typeof item?.filename === "string"),
  }
}

export async function cloneJiraIssue(issueKey: string, options: CloneIssueOptions) {
  const details = await getJiraIssueDetails(issueKey)
  const targetProjectKey = options.targetProjectKey.replace(/[^A-Za-z0-9_-]/g, "")
  if (!targetProjectKey) throw new Error("Choose a target Jira project.")
  if (!options.issueType.trim()) throw new Error("Choose an issue type for the clone.")
  if (!options.summary.trim()) throw new Error("Enter a summary for the clone.")
  const baseFields: Record<string, unknown> = { project: { key: targetProjectKey }, issuetype: { name: options.issueType.trim() }, summary: options.summary.trim() }
  const portableFields: Record<string, unknown> = { ...baseFields }
  if (details.description) portableFields.description = details.description
  if (details.priority) portableFields.priority = { name: details.priority }
  if (details.labels.length) portableFields.labels = details.labels
  try {
    const created = await sendJiraRequest<{ id: string; key: string; self: string }>("/rest/api/2/issue", "POST", { fields: portableFields })
    if (!created?.key) throw new Error("Jira did not return the cloned issue key.")
    return created
  } catch (firstError) {
    try {
      const created = await sendJiraRequest<{ id: string; key: string; self: string }>("/rest/api/2/issue", "POST", { fields: baseFields })
      if (!created?.key) throw new Error("Jira did not return the cloned issue key.")
      return created
    } catch (fallbackError) {
      const firstMessage = firstError instanceof Error ? firstError.message : "Clone with portable fields failed."
      const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : "Minimal clone failed."
      throw new Error(`${firstMessage} | Minimal clone retry: ${fallbackMessage}`)
    }
  }
}
