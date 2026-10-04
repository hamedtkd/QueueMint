import { useEffect, useState, type ChangeEvent } from "react"
import { ArrowLeftRight, Clipboard, Copy, ExternalLink, LoaderCircle } from "lucide-react"
import { JiraUserAvatar } from "@/components/jira-user-avatar"
import { ProjectCombobox, SimpleSelect } from "@/components/jira-controls"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cloneJiraIssue, getProject, jiraBrowseUrl, jiraErrorMessage } from "@/lib/jira"
import { IssueMovePanel } from "./IssueMovePanel"
import type { AppLocale, JiraIssueDetails, JiraProject } from "@/types"
import { toast } from "sonner"

export function IssueDetailSheet({
  open,
  onOpenChange,
  locale,
  details,
  issueKey,
  loading,
  error,
  projects,
  currentProjectKey,
  currentBoardId,
  deploymentType,
  onRefresh,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: AppLocale
  details: JiraIssueDetails | null
  issueKey: string | null
  loading: boolean
  error: string | null
  projects: JiraProject[]
  currentProjectKey?: string
  currentBoardId?: number | null
  deploymentType?: string
  onRefresh: () => void
}) {
  const [cloneMode, setCloneMode] = useState(false)
  const [moveMode, setMoveMode] = useState(false)
  const [cloneProjectKey, setCloneProjectKey] = useState("")
  const [cloneProject, setCloneProject] = useState<JiraProject | null>(null)
  const [cloneIssueType, setCloneIssueType] = useState("")
  const [cloneSummary, setCloneSummary] = useState("")
  const [cloneLoading, setCloneLoading] = useState(false)
  const [cloneProjectLoading, setCloneProjectLoading] = useState(false)
  const [cloneProjectError, setCloneProjectError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !details) return
    setCloneMode(false)
    setMoveMode(false)
    setCloneProjectKey(currentProjectKey || details.key.split("-")[0] || "")
    setCloneIssueType(details.type ?? "Task")
    setCloneSummary(`${locale === "fa" ? "کپی" : "Copy"}: ${details.summary}`)
  }, [open, details, currentProjectKey, locale])

  useEffect(() => {
    let active = true
    if (!cloneProjectKey) { setCloneProject(null); setCloneProjectError(null); return () => { active = false } }
    setCloneProjectLoading(true); setCloneProjectError(null)
    void getProject(cloneProjectKey)
      .then((next) => {
        if (!active) return
        setCloneProject(next)
        const issueTypes = next.issueTypes?.filter((item) => !item.subtask) ?? []
        setCloneIssueType((current) => issueTypes.some((item) => item.name === current) ? current : (issueTypes[0]?.name ?? "Task"))
      })
      .catch((projectError) => { if (active) { setCloneProject(null); setCloneProjectError(jiraErrorMessage(projectError, locale === "fa" ? "اطلاعات پروژه مقصد خوانده نشد" : "Could not load target project metadata")) } })
      .finally(() => { if (active) setCloneProjectLoading(false) })
    return () => { active = false }
  }, [cloneProjectKey, locale])

  const targetIssueTypes = cloneProject?.issueTypes?.filter((item) => !item.subtask) ?? []
  const assigneeName = details?.assignee?.displayName ?? details?.assignee?.name ?? details?.assignee?.key
  const reporterName = details?.reporter?.displayName ?? details?.reporter?.name ?? details?.reporter?.key
  const assigneeAvatar = details?.assignee?.avatarUrls?.["32x32"] ?? details?.assignee?.avatarUrls?.["24x24"] ?? details?.assignee?.avatarUrls?.["48x48"]
  const reporterAvatar = details?.reporter?.avatarUrls?.["32x32"] ?? details?.reporter?.avatarUrls?.["24x24"] ?? details?.reporter?.avatarUrls?.["48x48"]

  function formatDate(value?: string) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en", { dateStyle: "medium", timeStyle: "short" }).format(date)
  }

  function secondsLabel(value?: number) {
    if (!value || value <= 0) return "-"
    const hours = Math.floor(value / 3600)
    const minutes = Math.floor((value % 3600) / 60)
    if (hours && minutes) return `${hours}h ${minutes}m`
    if (hours) return `${hours}h`
    return `${Math.max(minutes, 1)}m`
  }

  async function createClone() {
    if (!details || !cloneProjectKey || !cloneIssueType || !cloneSummary.trim()) return
    setCloneLoading(true)
    try {
      const created = await cloneJiraIssue(details.key, {
        targetProjectKey: cloneProjectKey,
        issueType: cloneIssueType,
        summary: cloneSummary.trim(),
      })
      toast.success(locale === "fa" ? "کپی تسک ساخته شد" : "Issue cloned", { description: created.key })
      setCloneMode(false)
      onRefresh()
      window.open(jiraBrowseUrl(created.key), "_blank")
    } catch (cloneError) {
      toast.error(locale === "fa" ? "ساخت کپی ناموفق بود" : "Clone failed", { description: jiraErrorMessage(cloneError, locale === "fa" ? "ساخت کپی ناموفق بود" : "Clone failed") })
    } finally {
      setCloneLoading(false)
    }
  }

  function openNativeMove() {
    if (!details) return
    try {
      const browse = new URL(jiraBrowseUrl(details.key))
      window.open(`${browse.origin}/secure/MoveIssue!default.jspa?id=${encodeURIComponent(details.id)}`, "_blank")
    } catch {
      window.open(jiraBrowseUrl(details.key), "_blank")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={locale === "fa" ? "left" : "right"} className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex min-w-0 items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground" dir="ltr">{details?.key ?? issueKey ?? "-"}</span>
            <span className="truncate">{details?.summary ?? (locale === "fa" ? "جزئیات تسک" : "Issue details")}</span>
          </SheetTitle>
          <SheetDescription>{locale === "fa" ? "جزئیات، فعالیت و عملیات سریع بدون ترک QueueMint." : "Inspect the issue, recent activity, and safe operations without leaving QueueMint."}</SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-5">
          {loading ? (
            <div className="grid min-h-56 place-items-center rounded-[var(--qm-panel-radius)] border border-dashed text-sm text-muted-foreground"><LoaderCircle className="me-2 inline size-4 animate-spin" />{locale === "fa" ? "در حال دریافت اطلاعات از Jira..." : "Loading issue from Jira..."}</div>
          ) : error ? (
            <div className="rounded-[var(--qm-panel-radius)] border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
          ) : details ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DetailMetric label={locale === "fa" ? "وضعیت" : "Status"} value={details.status ?? "-"} />
                <DetailMetric label={locale === "fa" ? "نوع" : "Issue type"} value={details.type ?? "-"} />
                <DetailMetric label={locale === "fa" ? "اولویت" : "Priority"} value={details.priority ?? "-"} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[var(--qm-panel-radius)] border p-3">
                  <div className="text-xs text-muted-foreground">{locale === "fa" ? "مسئول" : "Assignee"}</div>
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium">{assigneeName ? <><JiraUserAvatar name={assigneeName} avatarUrl={assigneeAvatar} className="size-7" /><span className="truncate">{assigneeName}</span></> : <span className="text-muted-foreground">{locale === "fa" ? "بدون مسئول" : "Unassigned"}</span>}</div>
                </div>
                <div className="rounded-[var(--qm-panel-radius)] border p-3">
                  <div className="text-xs text-muted-foreground">{locale === "fa" ? "گزارش‌دهنده" : "Reporter"}</div>
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium">{reporterName ? <><JiraUserAvatar name={reporterName} avatarUrl={reporterAvatar} className="size-7" /><span className="truncate">{reporterName}</span></> : <span className="text-muted-foreground">-</span>}</div>
                </div>
              </div>

              <div className="rounded-[var(--qm-panel-radius)] border p-4">
                <div className="mb-2 text-xs font-medium text-muted-foreground">{locale === "fa" ? "توضیحات" : "Description"}</div>
                <div className="whitespace-pre-wrap break-words text-sm leading-6">{details.description?.trim() || (locale === "fa" ? "توضیحی ثبت نشده است." : "No description.")}</div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DetailMetric label={locale === "fa" ? "زمان اولیه" : "Original estimate"} value={secondsLabel(details.originalEstimateSeconds)} />
                <DetailMetric label={locale === "fa" ? "زمان باقی‌مانده" : "Remaining estimate"} value={secondsLabel(details.remainingEstimateSeconds)} />
                <DetailMetric label="Story points" value={typeof details.storyPoints === "number" ? String(details.storyPoints) : "-"} />
                <DetailMetric label={locale === "fa" ? "موعد" : "Due date"} value={details.dueDate ? formatDate(details.dueDate) : "-"} />
              </div>

              {(details.labels.length || details.components.length || details.fixVersions.length) ? (
                <div className="space-y-3 rounded-[var(--qm-panel-radius)] border p-4">
                  {details.labels.length ? <div><div className="mb-2 text-xs text-muted-foreground">Labels</div><div className="flex flex-wrap gap-1.5">{details.labels.map((label) => <Badge key={label} variant="secondary">{label}</Badge>)}</div></div> : null}
                  {details.components.length ? <div><div className="mb-2 text-xs text-muted-foreground">Components</div><div className="flex flex-wrap gap-1.5">{details.components.map((component) => <Badge key={component.id ?? component.name} variant="outline">{component.name}</Badge>)}</div></div> : null}
                  {details.fixVersions.length ? <div><div className="mb-2 text-xs text-muted-foreground">Fix versions</div><div className="flex flex-wrap gap-1.5">{details.fixVersions.map((version) => <Badge key={version.id ?? version.name} variant="outline">{version.name}</Badge>)}</div></div> : null}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailMetric label={locale === "fa" ? "ساخته شده" : "Created"} value={formatDate(details.created)} />
                <DetailMetric label={locale === "fa" ? "آخرین تغییر" : "Updated"} value={formatDate(details.updated)} />
              </div>

              <div className="rounded-[var(--qm-panel-radius)] border p-4">
                <div className="mb-3 flex items-center justify-between gap-3"><div className="font-semibold">{locale === "fa" ? "آخرین نظرها" : "Recent comments"}</div><Badge variant="secondary">{details.comments.length}</Badge></div>
                {details.comments.length ? <div className="space-y-3">{details.comments.slice(-5).reverse().map((comment) => {
                  const author = comment.author?.displayName ?? comment.author?.name ?? comment.author?.key ?? (locale === "fa" ? "کاربر Jira" : "Jira user")
                  const avatar = comment.author?.avatarUrls?.["24x24"] ?? comment.author?.avatarUrls?.["32x32"]
                  return <div key={comment.id} className="rounded-[var(--qm-control-radius)] bg-muted/20 p-3"><div className="mb-2 flex items-center gap-2"><JiraUserAvatar name={author} avatarUrl={avatar} className="size-6" /><span className="text-xs font-medium">{author}</span><span className="ms-auto text-[11px] text-muted-foreground">{formatDate(comment.created)}</span></div><div className="whitespace-pre-wrap text-sm leading-5">{comment.body || "-"}</div></div>
                })}</div> : <div className="text-sm text-muted-foreground">{locale === "fa" ? "نظری ثبت نشده است." : "No comments yet."}</div>}
              </div>

              {details.attachments.length ? (
                <div className="rounded-[var(--qm-panel-radius)] border p-4">
                  <div className="mb-3 flex items-center justify-between gap-3"><div className="font-semibold">{locale === "fa" ? "فایل‌ها" : "Attachments"}</div><Badge variant="secondary">{details.attachments.length}</Badge></div>
                  <div className="space-y-2">{details.attachments.map((attachment) => <div key={attachment.id} className="flex min-w-0 items-center gap-2 rounded-[var(--qm-control-radius)] bg-muted/20 px-3 py-2"><Clipboard className="size-4 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 truncate text-sm">{attachment.filename}</span>{typeof attachment.size === "number" ? <span className="text-[11px] text-muted-foreground">{Math.max(1, Math.round(attachment.size / 1024))} KB</span> : null}</div>)}</div>
                </div>
              ) : null}

              <div className="rounded-[var(--qm-panel-radius)] border bg-muted/10 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={() => window.open(jiraBrowseUrl(details.key), "_blank")}><ExternalLink className="size-4" />{locale === "fa" ? "باز کردن در Jira" : "Open in Jira"}</Button>
                  <Button variant="outline" onClick={() => { setMoveMode(false); setCloneMode((value) => !value) }}><Copy className="size-4" />{locale === "fa" ? "کپی تسک" : "Clone issue"}</Button>
                  <Button variant={moveMode ? "secondary" : "outline"} onClick={() => { setCloneMode(false); setMoveMode((value) => !value) }}><ArrowLeftRight className="size-4" />{locale === "fa" ? "انتقال تسک" : "Move issue"}</Button>
                </div>

                {moveMode ? (
                  <IssueMovePanel
                    locale={locale}
                    details={details}
                    projects={projects}
                    currentBoardId={currentBoardId}
                    deploymentType={deploymentType}
                    onNativeMove={openNativeMove}
                    onMoved={() => { setMoveMode(false); onOpenChange(false); onRefresh() }}
                  />
                ) : null}

                {cloneMode ? (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    <Field><FieldLabel>{locale === "fa" ? "پروژه مقصد" : "Target project"}</FieldLabel><ProjectCombobox projects={projects} value={cloneProjectKey} onValueChange={setCloneProjectKey} placeholder={locale === "fa" ? "انتخاب پروژه" : "Choose project"} emptyLabel={locale === "fa" ? "پروژه‌ای پیدا نشد" : "No projects found"} />{cloneProjectError ? <div className="text-xs leading-5 text-warning">{cloneProjectError}</div> : null}</Field>
                    <Field><FieldLabel>{locale === "fa" ? "نوع تسک" : "Issue type"}</FieldLabel><SimpleSelect value={cloneIssueType} onValueChange={setCloneIssueType} disabled={cloneProjectLoading || !targetIssueTypes.length} items={targetIssueTypes.map((item) => ({ value: item.name, label: item.name }))} /></Field>
                    <Field><FieldLabel>{locale === "fa" ? "عنوان کپی" : "Clone summary"}</FieldLabel><Input value={cloneSummary} onChange={(event: ChangeEvent<HTMLInputElement>) => setCloneSummary(event.target.value)} /></Field>
                    <div className="rounded-[var(--qm-control-radius)] bg-muted/25 p-3 text-xs text-muted-foreground">{locale === "fa" ? "برای سازگاری بین پروژه‌ها، عنوان، توضیحات، اولویت و برچسب‌ها کپی می‌شوند. فایل‌ها، کامنت‌ها و فیلدهای وابسته به پروژه کپی نمی‌شوند." : "For cross-project safety, QueueMint copies summary, description, priority, and labels. Attachments, comments, and project-specific fields are not duplicated."}</div>
                    <div className="flex justify-end"><Button onClick={() => void createClone()} disabled={cloneLoading || cloneProjectLoading || Boolean(cloneProjectError) || !cloneProjectKey || !cloneIssueType || !cloneSummary.trim()}>{cloneLoading ? <LoaderCircle className="size-4 animate-spin" /> : <Copy className="size-4" />}{locale === "fa" ? "ساخت کپی" : "Create clone"}</Button></div>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-[var(--qm-panel-radius)] border bg-muted/10 p-3"><div className="text-[11px] text-muted-foreground">{label}</div><div className="mt-1 truncate text-sm font-semibold" title={value}>{value}</div></div>
}
