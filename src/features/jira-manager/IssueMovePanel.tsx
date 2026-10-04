import { useEffect, useMemo, useState } from "react"
import { ArrowLeftRight, ExternalLink, LoaderCircle, SquareKanban } from "lucide-react"
import { IssueTypeSelect, ProjectCombobox, SimpleSelect } from "@/components/jira-controls"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { getBoardsForProject, getProject, getSprintsForBoard, jiraErrorMessage, moveJiraIssue } from "@/lib/jira"
import type { AppLocale, JiraBoard, JiraIssueDetails, JiraProject, JiraSprint } from "@/types"
import { toast } from "sonner"

type Props = {
  locale: AppLocale
  details: JiraIssueDetails
  projects: JiraProject[]
  currentBoardId?: number | null
  deploymentType?: string
  onNativeMove: () => void
  onMoved: (newKey: string) => void
}

export function IssueMovePanel({ locale, details, projects, currentBoardId, deploymentType, onNativeMove, onMoved }: Props) {
  const sourceProjectKey = details.key.split("-")[0] ?? ""
  const [projectKey, setProjectKey] = useState(sourceProjectKey)
  const [project, setProject] = useState<JiraProject | null>(null)
  const [issueType, setIssueType] = useState(details.type ?? "Task")
  const [boards, setBoards] = useState<JiraBoard[]>([])
  const [boardId, setBoardId] = useState<number | null>(null)
  const [sprints, setSprints] = useState<JiraSprint[]>([])
  const [sprintId, setSprintId] = useState<number | null>(null)
  const [loadingTarget, setLoadingTarget] = useState(false)
  const [loadingSprints, setLoadingSprints] = useState(false)
  const [moving, setMoving] = useState(false)
  const [targetError, setTargetError] = useState<string | null>(null)

  useEffect(() => {
    setProjectKey(sourceProjectKey)
    setIssueType(details.type ?? "Task")
    setBoardId(null)
    setSprintId(null)
  }, [details.id, details.type, sourceProjectKey, currentBoardId])

  useEffect(() => {
    let active = true
    if (!projectKey) return () => { active = false }
    setLoadingTarget(true); setTargetError(null); setSprints([]); setSprintId(null)
    void Promise.all([getProject(projectKey), getBoardsForProject(projectKey)])
      .then(([nextProject, nextBoards]) => {
        if (!active) return
        setProject(nextProject); setBoards(nextBoards)
        const types = nextProject.issueTypes ?? []
        setIssueType((current) => {
          const preferred = projectKey.toUpperCase() === sourceProjectKey.toUpperCase() && details.type ? details.type : current
          return types.some((item) => item.name === preferred) ? preferred : (types.find((item) => !item.subtask)?.name ?? types[0]?.name ?? "Task")
        })
        setBoardId((current) => nextBoards.some((item) => item.id === current) ? current : null)
      })
      .catch((error) => {
        if (!active) return
        setProject(null); setBoards([]); setBoardId(null)
        setTargetError(jiraErrorMessage(error, locale === "fa" ? "اطلاعات مقصد از Jira خوانده نشد." : "Could not load the Jira destination."))
      })
      .finally(() => { if (active) setLoadingTarget(false) })
    return () => { active = false }
  }, [projectKey, locale])

  const selectedBoard = useMemo(() => boards.find((item) => item.id === boardId) ?? null, [boards, boardId])
  const targetTypes = project?.issueTypes ?? []
  const selectedType = targetTypes.find((item) => item.name === issueType)
  const projectChanged = projectKey.toUpperCase() !== sourceProjectKey.toUpperCase()
  const directProjectMoveSupported = !deploymentType || deploymentType.toLowerCase() === "cloud"

  useEffect(() => {
    let active = true
    setSprints([]); setSprintId(null)
    if (!selectedBoard || selectedBoard.type.toLowerCase() !== "scrum") return () => { active = false }
    setLoadingSprints(true)
    void getSprintsForBoard(selectedBoard.id)
      .then((next) => { if (active) setSprints(next) })
      .catch((error) => { if (active) toast.warning(locale === "fa" ? "اسپرینت‌های بورد خوانده نشد" : "Could not load board sprints", { description: jiraErrorMessage(error) }) })
      .finally(() => { if (active) setLoadingSprints(false) })
    return () => { active = false }
  }, [selectedBoard?.id, selectedBoard?.type, locale])

  async function executeMove() {
    if (!selectedType || moving) return
    setMoving(true)
    try {
      const result = await moveJiraIssue({
        issueId: details.id,
        issueKey: details.key,
        sourceProjectKey,
        targetProjectKey: projectKey,
        targetIssueTypeId: selectedType.id,
        targetBoardId: boardId,
        targetBoardType: selectedBoard?.type,
        targetSprintId: sprintId,
        deploymentType,
      })
      const title = result.pending
        ? (locale === "fa" ? "انتقال در Jira شروع شد" : "Jira move started")
        : (locale === "fa" ? "تسک منتقل شد" : "Issue moved")
      const placement = selectedBoard ? `${selectedBoard.name}${sprintId ? ` · ${sprints.find((item) => item.id === sprintId)?.name ?? "Sprint"}` : ""}` : projectKey
      if (result.warning) toast.warning(title, { description: `${result.key} · ${result.warning}` })
      else toast.success(title, { description: `${result.key} → ${placement}` })
      if (!result.pending) onMoved(result.key)
    } catch (error) {
      toast.error(locale === "fa" ? "انتقال انجام نشد" : "Move failed", { description: jiraErrorMessage(error, locale === "fa" ? "Jira اجازه این انتقال را نداد." : "Jira did not allow this move.") })
    } finally {
      setMoving(false)
    }
  }

  const hasMeaningfulMove = projectChanged || Boolean(boardId)
  const blockedCrossProject = projectChanged && !directProjectMoveSupported
  const disabled = moving || loadingTarget || Boolean(targetError) || !selectedType || !hasMeaningfulMove || blockedCrossProject

  return (
    <div className="mt-4 space-y-4 border-t pt-4">
      <div className="flex items-start gap-3 rounded-[var(--qm-panel-radius)] border bg-muted/15 p-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-[var(--qm-control-radius)] bg-primary/10 text-primary"><ArrowLeftRight className="size-4" /></span>
        <div className="min-w-0"><div className="text-sm font-semibold">{locale === "fa" ? "انتقال واقعی تسک" : "Move issue"}</div><div className="mt-1 text-xs leading-5 text-muted-foreground">{locale === "fa" ? "پروژه مقصد را انتخاب کن؛ برای بورد Scrum می‌توانی Backlog یا Sprint مقصد را هم مشخص کنی. بوردهای Jira بر اساس Filter هستند، بنابراین انتخاب بورد یعنی Placement در بورد/اسپرینت مقصد، نه مالکیت انحصاری بورد." : "Choose the target project and optional board placement. Jira boards are filter-based, so board selection controls backlog/sprint placement rather than exclusive board ownership."}</div></div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field><FieldLabel>{locale === "fa" ? "پروژه مقصد" : "Target project"}</FieldLabel><ProjectCombobox projects={projects} value={projectKey} onValueChange={setProjectKey} placeholder={locale === "fa" ? "انتخاب پروژه" : "Choose project"} emptyLabel={locale === "fa" ? "پروژه‌ای پیدا نشد" : "No projects found"} disabled={moving} /></Field>
        <Field><FieldLabel>{locale === "fa" ? "نوع تسک در مقصد" : "Target issue type"}</FieldLabel><IssueTypeSelect issueTypes={targetTypes} value={issueType} onValueChange={setIssueType} disabled={moving || loadingTarget || !targetTypes.length || !projectChanged} placeholder={locale === "fa" ? "نوع تسک" : "Issue type"} /><FieldDescription>{projectChanged ? (locale === "fa" ? "نوع Issue در پروژه مقصد را انتخاب کن." : "Choose the issue type in the destination project.") : (locale === "fa" ? "در انتقال بین بوردهای همین پروژه، نوع Issue حفظ می‌شود." : "Same-project board placement keeps the current issue type.")}</FieldDescription></Field>
        <Field><FieldLabel>{locale === "fa" ? "بورد مقصد" : "Target board"}</FieldLabel><SimpleSelect value={boardId ? String(boardId) : "__none"} onValueChange={(value) => { setBoardId(value === "__none" ? null : Number(value)); setSprintId(null) }} disabled={moving || loadingTarget} items={[{ value: "__none", label: locale === "fa" ? "فقط پروژه / بدون Placement" : "Project only / no placement" }, ...boards.map((item) => ({ value: String(item.id), label: `${item.name} · ${item.type}${projectKey === sourceProjectKey && item.id === currentBoardId ? (locale === "fa" ? " · فعلی" : " · current") : ""}` }))]} /></Field>
        {selectedBoard?.type.toLowerCase() === "scrum" ? <Field><FieldLabel>{locale === "fa" ? "Placement" : "Placement"}</FieldLabel><SimpleSelect value={sprintId ? String(sprintId) : "__backlog"} onValueChange={(value) => setSprintId(value === "__backlog" ? null : Number(value))} disabled={moving || loadingSprints} items={[{ value: "__backlog", label: locale === "fa" ? "Backlog بورد" : "Board backlog" }, ...sprints.map((item) => ({ value: String(item.id), label: `${item.name} · ${item.state}` }))]} /><FieldDescription>{loadingSprints ? (locale === "fa" ? "در حال خواندن اسپرینت‌ها…" : "Loading sprints…") : (locale === "fa" ? "انتقال به Sprint از Jira Agile API انجام می‌شود." : "Sprint placement uses Jira's Agile API.")}</FieldDescription></Field> : null}
      </div>

      {targetError ? <div className="rounded-[var(--qm-control-radius)] border border-warning/25 bg-warning/5 p-3 text-xs leading-5 text-warning">{targetError}</div> : null}
      {blockedCrossProject ? <div className="rounded-[var(--qm-control-radius)] border border-warning/25 bg-warning/5 p-3 text-xs leading-5 text-warning">{locale === "fa" ? "انتقال مستقیم بین پروژه‌ها با API رسمی Bulk Move فقط در Jira Cloud پشتیبانی می‌شود. برای این Jira از Move خود Jira استفاده کن." : "Direct cross-project move uses Jira Cloud's official Bulk Move API. Use Jira's native Move flow for this deployment."}</div> : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onNativeMove} disabled={moving}><ExternalLink className="size-4" />{locale === "fa" ? "Move خود Jira" : "Jira native move"}</Button>
        <Button onClick={() => void executeMove()} disabled={disabled}>{moving ? <LoaderCircle className="size-4 animate-spin" /> : <SquareKanban className="size-4" />}{locale === "fa" ? "انتقال تسک" : "Move issue"}</Button>
      </div>
    </div>
  )
}
