import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import type { LocalAttachment } from "@/components/attachment-picker"
import { formatDiagnosticsText } from "@/features/capture-pro/diagnostics"
import type { CaptureEvidenceShot, QueueMintPageDiagnostics } from "@/features/capture-pro/types"
import { captureContextText, screenshotFilename, type QueueMintPageContext } from "@/lib/capture"
import { localAttachmentsToJira } from "@/lib/file-upload"
import { createIssues, discoverJira, getAssignableUsers, getBoardsForProject, getCreateFieldsForIssueType, getProject, getProjectEpics, getProjectLabels, getSprintsForBoard, jiraErrorMessage, uploadIssueAttachments } from "@/lib/jira"
import { loadState } from "@/lib/storage"
import type { QueueMintCaptureIssueDraft } from "@/lib/capture-draft"
import type { JiraAttachmentUpload, JiraBoard, JiraConnectionStatus, JiraEpic, JiraMetadata, JiraProject, JiraSprint, JiraUser } from "@/types"
import type { PopupCopy } from "./popup-copy"

export function usePopupJiraForm({ status, t }: { status: JiraConnectionStatus; t: PopupCopy }) {
  const [metadata, setMetadata] = useState<JiraMetadata | null>(null)
  const [projectInfo, setProjectInfo] = useState<JiraProject | null>(null)
  const [loadingMetadata, setLoadingMetadata] = useState(false)
  const [projectKey, setProjectKey] = useState("")
  const [issueType, setIssueType] = useState("Bug")
  const [priority, setPriority] = useState("")
  const [boards, setBoards] = useState<JiraBoard[]>([])
  const [boardId, setBoardId] = useState<number | null>(null)
  const [sprints, setSprints] = useState<JiraSprint[]>([])
  const [sprintId, setSprintId] = useState<number | null>(null)
  const [assignees, setAssignees] = useState<JiraUser[]>([])
  const [assignee, setAssignee] = useState("")
  const [epics, setEpics] = useState<JiraEpic[]>([])
  const [projectLabels, setProjectLabels] = useState<string[]>([])
  const [epic, setEpic] = useState("")
  const [estimate, setEstimate] = useState("")
  const [storyPoints, setStoryPoints] = useState("")
  const [labels, setLabels] = useState("")
  const [component, setComponent] = useState("")
  const [fixVersion, setFixVersion] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [moreFields, setMoreFields] = useState(false)
  const [createFieldIds, setCreateFieldIds] = useState<string[] | null>(null)
  const createFieldsRequest = useRef(0)
  const [summary, setSummary] = useState("")
  const [description, setDescription] = useState("")
  const [includeContext, setIncludeContext] = useState(true)
  const [includeScreenshot, setIncludeScreenshot] = useState(true)
  const [includeDiagnostics, setIncludeDiagnostics] = useState(false)
  const [attachments, setAttachments] = useState<LocalAttachment[]>([])
  const [creating, setCreating] = useState(false)
  const issueTypes = useMemo(() => projectInfo?.issueTypes ?? [], [projectInfo])
  const issueDraft = useMemo<QueueMintCaptureIssueDraft>(() => ({
    summary, description, projectKey, issueType, priority, boardId, sprintId, assignee, epic, estimate, storyPoints, labels, component, fixVersion, dueDate, moreFields,
    includeContext, includeScreenshot, includeDiagnostics, attachments: attachments.map(({ id, file }) => ({ id, file })),
  }), [summary, description, projectKey, issueType, priority, boardId, sprintId, assignee, epic, estimate, storyPoints, labels, component, fixVersion, dueDate, moreFields, includeContext, includeScreenshot, includeDiagnostics, attachments])


  async function refreshCreateFields(nextProject: string, nextIssueType: string) {
    const requestId = ++createFieldsRequest.current
    try {
      const capability = await getCreateFieldsForIssueType(nextProject, nextIssueType)
      if (requestId !== createFieldsRequest.current) return
      setCreateFieldIds(capability ? Object.keys(capability.fields) : null)
    } catch {
      if (requestId === createFieldsRequest.current) setCreateFieldIds(null)
    }
  }

  async function loadProjectOptionSets(nextProject: string) {
    const [boardsResult, assigneesResult, epicsResult, labelsResult] = await Promise.allSettled([
      getBoardsForProject(nextProject),
      getAssignableUsers(nextProject, "", 100),
      getProjectEpics(nextProject, 100),
      getProjectLabels(nextProject),
    ])
    const projectBoards = boardsResult.status === "fulfilled" ? boardsResult.value : [] as JiraBoard[]
    const projectAssignees = assigneesResult.status === "fulfilled" ? assigneesResult.value : [] as JiraUser[]
    const projectEpics = epicsResult.status === "fulfilled" ? epicsResult.value : [] as JiraEpic[]
    const projectLabels = labelsResult.status === "fulfilled" ? labelsResult.value : [] as string[]
    const failures = [
      boardsResult.status === "rejected" ? `${t.board}: ${jiraErrorMessage(boardsResult.reason, t.issueFailed)}` : "",
      assigneesResult.status === "rejected" ? `${t.assignee}: ${jiraErrorMessage(assigneesResult.reason, t.issueFailed)}` : "",
      epicsResult.status === "rejected" ? `${t.epic}: ${jiraErrorMessage(epicsResult.reason, t.issueFailed)}` : "",
      labelsResult.status === "rejected" ? `${t.labels}: ${jiraErrorMessage(labelsResult.reason, t.issueFailed)}` : "",
    ].filter(Boolean)
    if (failures.length) toast.warning(t.loadingJira, { description: failures.join(" • ") })
    return { projectBoards, projectAssignees, projectEpics, projectLabels }
  }

  async function loadBoardSprints(nextBoardId: number) {
    try { return await getSprintsForBoard(nextBoardId) }
    catch (error) {
      toast.warning(t.loadingJira, { description: `${t.sprint}: ${jiraErrorMessage(error, t.issueFailed)}` })
      return [] as JiraSprint[]
    }
  }

  async function loadProjectOptions(nextProject: string, project: JiraProject) {
    const { projectBoards, projectAssignees, projectEpics, projectLabels: nextProjectLabels } = await loadProjectOptionSets(nextProject)
    setBoards(projectBoards); setAssignees(projectAssignees); setEpics(projectEpics); setProjectLabels(nextProjectLabels)
    const contextualBoardId = status.context?.projectKey === nextProject ? status.context?.boardId : undefined
    const selectedBoard = projectBoards.find((item) => item.id === contextualBoardId) ?? projectBoards[0] ?? null
    setBoardId(selectedBoard?.id ?? null); setSprintId(null)
    setSprints(selectedBoard ? await loadBoardSprints(selectedBoard.id) : [])
    if (component && !project.components?.some((item) => item.name === component)) setComponent("")
    if (fixVersion && !project.versions?.some((item) => item.name === fixVersion)) setFixVersion("")
    if (epic && !projectEpics.some((item) => item.key === epic)) setEpic("")
    if (assignee && assignee !== "__unassigned" && !projectAssignees.some((item) => (item.name ?? item.key) === assignee)) setAssignee("")
  }

  async function ensureMetadata(preferBug = true) {
    if (!status.configured) return false
    setLoadingMetadata(true)
    try {
      const [jiraMeta, stored] = await Promise.all([discoverJira(), loadState()])
      setMetadata(jiraMeta)
      const preferred = [status.context?.projectKey, stored.selectedProject, jiraMeta.projects[0]?.key].find((key): key is string => Boolean(key && jiraMeta.projects.some((project) => project.key === key)))
      if (!preferred) throw new Error("No Jira projects are available.")
      setProjectKey(preferred)
      const project = await getProject(preferred)
      setProjectInfo(project)
      const types = project.issueTypes ?? []
      const defaultType = preferBug
        ? types.find((item) => item.name.toLowerCase() === "bug")?.name ?? types.find((item) => item.name.toLowerCase() === "task")?.name ?? types[0]?.name ?? "Bug"
        : types.find((item) => item.name.toLowerCase() === "task")?.name ?? types.find((item) => item.name.toLowerCase() === "bug")?.name ?? types[0]?.name ?? "Task"
      setIssueType(defaultType)
      await Promise.all([loadProjectOptions(preferred, project), refreshCreateFields(preferred, defaultType)])
      return true
    } catch (error) {
      toast.error(jiraErrorMessage(error, t.issueFailed))
      return false
    } finally { setLoadingMetadata(false) }
  }

  async function restoreIssueDraft(draft: QueueMintCaptureIssueDraft) {
    if (!status.configured) return false
    setLoadingMetadata(true)
    try {
      const jiraMeta = await discoverJira()
      setMetadata(jiraMeta)
      const preferred = jiraMeta.projects.some((item) => item.key === draft.projectKey) ? draft.projectKey : jiraMeta.projects[0]?.key
      if (!preferred) throw new Error("No Jira projects are available.")
      setProjectKey(preferred)
      const project = await getProject(preferred)
      setProjectInfo(project)
      const { projectBoards, projectAssignees, projectEpics, projectLabels: nextProjectLabels } = await loadProjectOptionSets(preferred)
      setBoards(projectBoards); setAssignees(projectAssignees); setEpics(projectEpics); setProjectLabels(nextProjectLabels)
      const selectedBoard = projectBoards.find((item) => item.id === draft.boardId) ?? projectBoards[0] ?? null
      setBoardId(selectedBoard?.id ?? null)
      const boardSprints = selectedBoard ? await loadBoardSprints(selectedBoard.id) : []
      setSprints(boardSprints); setSprintId(boardSprints.some((item) => item.id === draft.sprintId) ? draft.sprintId : null)
      const types = project.issueTypes ?? []
      const restoredType = types.some((item) => item.name === draft.issueType) ? draft.issueType : types.find((item) => item.name.toLowerCase() === "bug")?.name ?? types[0]?.name ?? "Bug"
      setIssueType(restoredType)
      void refreshCreateFields(preferred, restoredType)
      setSummary(draft.summary); setDescription(draft.description); setPriority(draft.priority); setAssignee(draft.assignee); setEpic(draft.epic)
      setEstimate(draft.estimate); setStoryPoints(draft.storyPoints); setLabels(draft.labels); setComponent(draft.component); setFixVersion(draft.fixVersion); setDueDate(draft.dueDate)
      const restoredAttachments = (draft.attachments ?? []).map((item) => ({ ...item, previewUrl: item.file.type.startsWith("image/") ? URL.createObjectURL(item.file) : undefined }))
      setMoreFields(draft.moreFields); setIncludeContext(draft.includeContext); setIncludeScreenshot(draft.includeScreenshot); setIncludeDiagnostics(draft.includeDiagnostics); setAttachments(restoredAttachments)
      return true
    } catch (error) { toast.error(jiraErrorMessage(error, t.issueFailed)); return false } finally { setLoadingMetadata(false) }
  }

  async function changeProject(nextProject: string) {
    setProjectKey(nextProject); setProjectInfo(null); setLoadingMetadata(true); setBoardId(null); setSprintId(null); setBoards([]); setSprints([]); setProjectLabels([]); setCreateFieldIds(null)
    try {
      const project = await getProject(nextProject)
      setProjectInfo(project)
      const types = project.issueTypes ?? []
      const nextType = types.some((item) => item.name === issueType) ? issueType : types.find((item) => item.name.toLowerCase() === "bug")?.name ?? types[0]?.name ?? "Bug"
      if (nextType !== issueType) setIssueType(nextType)
      await Promise.all([loadProjectOptions(nextProject, project), refreshCreateFields(nextProject, nextType)])
    } catch (error) { toast.error(jiraErrorMessage(error, t.issueFailed)) } finally { setLoadingMetadata(false) }
  }

  async function changeBoard(value: string) {
    const nextBoardId = value === "__none" ? null : Number(value)
    setBoardId(Number.isInteger(nextBoardId) ? nextBoardId : null); setSprintId(null)
    if (!nextBoardId) return setSprints([])
    try { setSprints(await getSprintsForBoard(nextBoardId)) } catch (error) { setSprints([]); toast.error(jiraErrorMessage(error, t.issueFailed)) }
  }

  function changeIssueType(value: string) {
    setIssueType(value)
    void refreshCreateFields(projectKey, value)
    if (value.toLowerCase() === "epic") { setSprintId(null); setEpic("") }
  }

  async function createIssue({ captureContext, finalScreenshot, screenshots, diagnostics }: { captureContext: QueueMintPageContext | null; finalScreenshot: string | null; screenshots: CaptureEvidenceShot[]; diagnostics: QueueMintPageDiagnostics | null }) {
    if (!metadata || !projectKey || !summary.trim()) { toast.error(!summary.trim() ? t.required : t.issueFailed); return null }
    setCreating(true)
    try {
      const contextBlock = includeContext && captureContext ? captureContextText(captureContext) : ""
      const diagnosticsBlock = includeDiagnostics && diagnostics ? formatDiagnosticsText(diagnostics) : ""
      const body = [description.trim(), contextBlock ? `QueueMint Capture\n${contextBlock}` : "", diagnosticsBlock].filter(Boolean).join("\n\n---\n\n")
      const extraFields: Record<string, unknown> = {}
      if (assignee === "__unassigned") extraFields.assignee = null
      if (dueDate) extraFields.duedate = dueDate
      const points = Number(storyPoints)
      if (metadata.estimation.storyPointsFieldId && storyPoints.trim() && Number.isFinite(points)) extraFields[metadata.estimation.storyPointsFieldId] = points
      const parsedLabels = labels.split(",").map((item) => item.trim()).filter(Boolean)
      const isEpic = issueType.toLowerCase() === "epic"
      const result = await createIssues({ project: projectKey, issues: [{ type: issueType, summary: summary.trim(), description: body || undefined, priority: priority || undefined, sprint: isEpic ? undefined : sprintId, assignee: assignee && assignee !== "__unassigned" ? assignee : undefined, epic: !isEpic && epic ? epic : undefined, estimate: !isEpic && estimate.trim() ? estimate.trim() : undefined, labels: parsedLabels.length ? parsedLabels : undefined, components: component ? [component] : undefined, fixVersions: fixVersion ? [fixVersion] : undefined, fields: Object.keys(extraFields).length ? extraFields : undefined }] }, metadata.detectedFieldMap, undefined, {}, boardId)
      const created = result.results.find((item) => item.ok && item.key)
      if (!created?.key) throw new Error(result.results.find((item) => !item.ok)?.error ?? t.issueFailed)
      const createdResult = result.results.find((item) => item.key === created.key)
      const skippedNames = (createdResult?.skippedCreateFields ?? []).map((fieldId) => metadata.fields.find((field) => field.id === fieldId)?.name ?? fieldId)
      const skippedWarning = skippedNames.length ? `Jira skipped fields that are not available when creating this issue type: ${skippedNames.join(", ")}.` : undefined
      const warnings = [createdResult?.sprintError, createdResult?.estimateError, skippedWarning].filter(Boolean)
      if (warnings.length) toast.warning(warnings.join(" • "))
      const evidenceUploads: JiraAttachmentUpload[] = []
      if (includeScreenshot) {
        const sourceShots = screenshots.length ? screenshots : finalScreenshot && captureContext ? [{ id: "fallback", dataUrl: finalScreenshot, context: captureContext, createdAt: captureContext.capturedAt, kind: "visible" as const }] : []
        for (const [index, shot] of sourceShots.entries()) {
          const base64 = shot.dataUrl.split(",")[1]
          if (!base64) continue
          const baseName = screenshotFilename(shot.context).replace(/\.png$/i, "")
          evidenceUploads.push({ name: `${baseName}-${index + 1}.png`, type: "image/png", base64 })
        }
      }
      evidenceUploads.push(...await localAttachmentsToJira(attachments))
      const uploadWarnings: string[] = []
      for (const attachment of evidenceUploads) {
        try { await uploadIssueAttachments(created.key, [attachment]) }
        catch (error) { uploadWarnings.push(jiraErrorMessage(error, "Attachment upload failed.")) }
      }
      if (uploadWarnings.length) toast.warning(`Issue created, but ${uploadWarnings.length} evidence file(s) could not be uploaded.`)
      toast.success(`${t.created}: ${created.key}`)
      return created.key
    } catch (error) { toast.error(jiraErrorMessage(error, t.issueFailed)); return null } finally { setCreating(false) }
  }

  function resetFields() {
    setSummary(""); setDescription(""); setPriority(""); setAssignee(""); setEpic(""); setSprintId(null); setEstimate(""); setStoryPoints(""); setLabels(""); setComponent(""); setFixVersion(""); setDueDate(""); setMoreFields(false); setAttachments([]); setIncludeDiagnostics(false)
  }

  return { metadata, projectInfo, loadingMetadata, projectKey, issueType, issueTypes, priority, boards, boardId, sprints, sprintId, assignees, assignee, epics, projectLabels, epic, estimate, storyPoints, labels, component, fixVersion, dueDate, moreFields, createFieldIds, summary, description, includeContext, includeScreenshot, includeDiagnostics, attachments, creating, issueDraft, setSummary, setDescription, setPriority, setAssignee, setEpic, setSprintId, setEstimate, setStoryPoints, setLabels, setComponent, setFixVersion, setDueDate, setMoreFields, setIncludeContext, setIncludeScreenshot, setIncludeDiagnostics, setAttachments, ensureMetadata, restoreIssueDraft, changeProject, changeBoard, changeIssueType, createIssue, resetFields }
}
