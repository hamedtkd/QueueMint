import type { JiraIssueMoveOptions, JiraIssueMoveResult } from "@/types"
import { jiraErrorMessage } from "./errors"
import { sendJiraRequest } from "./request"

type BulkMoveProgress = {
  taskId?: string
  status?: string
  progressPercent?: number
  invalidOrInaccessibleIssueCount?: number
  totalIssueCount?: number
}

type IssueIdentity = { id?: string; key?: string }

const ISSUE_KEY = /^[A-Z][A-Z0-9_]*-\d+$/i
const PROJECT_KEY = /^[A-Z][A-Z0-9_]*$/i

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function validateMove(options: JiraIssueMoveOptions) {
  if (!/^\d+$/.test(options.issueId)) throw new Error("Invalid Jira issue id.")
  if (!ISSUE_KEY.test(options.issueKey)) throw new Error("Invalid Jira issue key.")
  if (!PROJECT_KEY.test(options.sourceProjectKey) || !PROJECT_KEY.test(options.targetProjectKey)) throw new Error("Invalid Jira project key.")
  if (!/^\d+$/.test(options.targetIssueTypeId)) throw new Error("Choose a valid target issue type.")
  if (options.targetBoardId != null && (!Number.isInteger(options.targetBoardId) || options.targetBoardId <= 0)) throw new Error("Choose a valid target board.")
  if (options.targetSprintId != null && (!Number.isInteger(options.targetSprintId) || options.targetSprintId <= 0)) throw new Error("Choose a valid target sprint.")
}

function isCloudDeployment(deploymentType?: string) {
  return !deploymentType || deploymentType.trim().toLowerCase() === "cloud"
}

async function waitForBulkMove(taskId: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const progress = await sendJiraRequest<BulkMoveProgress>(`/rest/api/3/bulk/queue/${encodeURIComponent(taskId)}`)
    const status = String(progress?.status ?? "").toUpperCase()
    if (status === "COMPLETE") {
      if ((progress.invalidOrInaccessibleIssueCount ?? 0) > 0) throw new Error("Jira completed the move with inaccessible or invalid issues.")
      return { complete: true, progress }
    }
    if (status && !["RUNNING", "PENDING", "ENQUEUED"].includes(status)) throw new Error(`Jira move ended with status ${status}.`)
    await sleep(400)
  }
  return { complete: false as const }
}

async function submitProjectMove(options: JiraIssueMoveOptions) {
  if (!isCloudDeployment(options.deploymentType)) {
    throw new Error("Direct cross-project move requires Jira Cloud. Use the Jira-native Move action for this Jira deployment.")
  }
  const target = `${options.targetProjectKey.toUpperCase()},${options.targetIssueTypeId}`
  const response = await sendJiraRequest<{ taskId?: string }>("/rest/api/3/bulk/issues/move", "POST", {
    sendBulkNotification: true,
    targetToSourcesMapping: {
      [target]: {
        issueIdsOrKeys: [options.issueKey.toUpperCase()],
        inferFieldDefaults: true,
        inferStatusDefaults: true,
        inferSubtaskTypeDefault: true,
      },
    },
  })
  if (!response?.taskId) throw new Error("Jira accepted no task id for the move request.")
  return response.taskId
}

async function resolveIssueKey(issueId: string) {
  const issue = await sendJiraRequest<IssueIdentity>(`/rest/api/2/issue/${encodeURIComponent(issueId)}?fields=project,issuetype`)
  if (!issue?.key || !ISSUE_KEY.test(issue.key)) throw new Error("Jira moved the issue but did not return its new key.")
  return issue.key
}

async function applyTargetPlacement(issueKey: string, options: JiraIssueMoveOptions) {
  if (options.targetSprintId) {
    await sendJiraRequest<unknown>(`/rest/agile/1.0/sprint/${encodeURIComponent(String(options.targetSprintId))}/issue`, "POST", { issues: [issueKey] })
    return { applied: true }
  }
  if (!options.targetBoardId) return { applied: false }

  if (options.targetBoardType?.toLowerCase() === "kanban") {
    await sendJiraRequest<unknown>(`/rest/agile/1.0/board/${encodeURIComponent(String(options.targetBoardId))}/issue`, "POST", { issues: [issueKey] })
    return { applied: true }
  }

  await sendJiraRequest<unknown>(`/rest/agile/1.0/backlog/${encodeURIComponent(String(options.targetBoardId))}/issue`, "POST", { issues: [issueKey] })
  return { applied: true }
}

export async function moveJiraIssue(options: JiraIssueMoveOptions): Promise<JiraIssueMoveResult> {
  validateMove(options)
  const projectMoved = options.sourceProjectKey.toUpperCase() !== options.targetProjectKey.toUpperCase()
  let key = options.issueKey.toUpperCase()
  let taskId: string | undefined

  if (projectMoved) {
    taskId = await submitProjectMove(options)
    const completion = await waitForBulkMove(taskId)
    if (!completion.complete) {
      return {
        key,
        taskId,
        projectMoved: true,
        placementApplied: false,
        pending: true,
        warning: "Jira accepted the project move, but it is still processing. Board placement was not applied yet.",
      }
    }
    key = await resolveIssueKey(options.issueId)
  }

  try {
    const placement = await applyTargetPlacement(key, options)
    return { key, taskId, projectMoved, placementApplied: placement.applied, pending: false }
  } catch (error) {
    if (!projectMoved) throw error
    return {
      key,
      taskId,
      projectMoved: true,
      placementApplied: false,
      pending: false,
      warning: jiraErrorMessage(error, "The project move succeeded, but Jira could not place the issue on the selected board/sprint."),
    }
  }
}
