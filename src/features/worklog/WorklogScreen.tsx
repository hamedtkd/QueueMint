import { useEffect, useMemo, useRef, useState } from "react"
import { LoaderCircle, RefreshCcw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { downloadJson } from "@/lib/utils"
import type { ActivityEntry } from "@/lib/storage"
import type { AppLocale, JiraBoard, JiraLiveIssue, JiraProject, JiraSprint, JiraUser } from "@/types"
import { WorklogContextBar } from "./WorklogContextBar"
import { WorklogDateToolbar } from "./WorklogDateToolbar"
import { WorklogDraftSidebar } from "./WorklogDraftSidebar"
import { WorklogImportSheet } from "./WorklogImportSheet"
import { WorklogIssuePicker } from "./WorklogIssuePicker"
import { buildWorklogAiPackage } from "./worklog-json"
import { WorklogSummaryStrip } from "./WorklogSummaryStrip"
import { WorklogWorkflowRail } from "./WorklogWorkflowRail"
import { useWorklogAssistant } from "./useWorklogAssistant"
import { formatWorklogMinutes } from "./worklog-utils"

function startOfToday() { const date = new Date(); date.setHours(12, 0, 0, 0); return date }

export function WorklogScreen({ locale, issues, selectedKeys, onSelectedKeysChange, currentUser, projectKey, projects, boards, boardId, sprints, contextLoading, onProjectChange, onBoardChange, recordActivity }: {
  locale: AppLocale
  issues: JiraLiveIssue[]
  selectedKeys: Set<string>
  onSelectedKeysChange: (keys: Set<string>) => void
  currentUser?: JiraUser
  projectKey?: string
  projects: JiraProject[]
  boards: JiraBoard[]
  boardId: number | null
  sprints: JiraSprint[]
  contextLoading?: boolean
  onProjectChange: (key: string) => void
  onBoardChange: (id: number) => void
  recordActivity?: (input: Omit<ActivityEntry, "id" | "createdAt" | "projectKey" | "boardId">) => void
}) {
  const isFa = locale === "fa"
  const [date, setDate] = useState(startOfToday)
  const [sprintFilter, setSprintFilter] = useState("all")
  const [importOpen, setImportOpen] = useState(false)
  const scopeRef = useRef<HTMLDivElement>(null)
  const issueRef = useRef<HTMLDivElement>(null)
  const draftRef = useRef<HTMLDivElement>(null)
  const autoBuiltFor = useRef("")
  const model = useWorklogAssistant({ locale, issues, selectedKeys, currentUser, projectKey, boardId, date, recordActivity })
  const dailyCandidateKeys = useMemo(() => new Set(model.dailyCandidates.map((issue) => issue.key)), [model.dailyCandidates])
  const scopeReady = Boolean(projectKey && boardId)
  const currentStep: 1 | 2 | 3 | 4 = model.draft.length ? 4 : selectedKeys.size ? 3 : scopeReady ? 2 : 1

  useEffect(() => { window.scrollTo(0, 0) }, [])
  useEffect(() => { setSprintFilter("all"); onSelectedKeysChange(new Set()); model.setDraft([]); autoBuiltFor.current = "" }, [boardId, projectKey])
  useEffect(() => {
    const signature = Array.from(selectedKeys).sort().join("|")
    if (!signature || model.draft.length || autoBuiltFor.current === signature) return
    const minutes = model.remainingMinutes || model.targetMinutes
    model.setSelectionText(formatWorklogMinutes(minutes))
    model.prepare("estimate", minutes)
    autoBuiltFor.current = signature
  }, [selectedKeys, model.draft.length, model.remainingMinutes, model.targetMinutes])

  function aiPackage(exportIssues: JiraLiveIssue[]) {
    const target = model.selectedTargetMinutes || model.remainingMinutes || model.targetMinutes
    return buildWorklogAiPackage(exportIssues, model.targetMinutes, model.dayMinutes, target, model.note, model.loggedMinutesByIssue, date)
  }

  async function copyForAi(exportIssues: JiraLiveIssue[]) {
    try { await navigator.clipboard.writeText(JSON.stringify(aiPackage(exportIssues), null, 2)); toast.success(isFa ? "JSON برای AI کپی شد" : "AI JSON copied") }
    catch { toast.error(isFa ? "کپی JSON ناموفق بود" : "Could not copy JSON") }
  }

  function changeDate(next: Date) {
    setDate(next)
    onSelectedKeysChange(new Set())
    model.setDraft([])
    autoBuiltFor.current = ""
  }

  function deselect(issueKey: string) {
    const next = new Set(selectedKeys)
    next.delete(issueKey)
    onSelectedKeysChange(next)
    model.removeDraft(issueKey)
  }

  function scrollTo(step: 1 | 2 | 3 | 4) {
    const target = step === 1 ? scopeRef.current : step === 2 ? issueRef.current : draftRef.current
    target?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="qm-worklog-page animate-in fade-in duration-200">
      <div className="qm-worklog-layout">
        <div className="qm-worklog-main min-w-0">
          <header className="qm-worklog-heading">
            <div><h1>{isFa ? "دستیار ثبت زمان" : "Worklog Assistant"}</h1><p>{isFa ? "تسک های Jira رو انتخاب کن، زمان رو تقسیم کن و قبل از ثبت نهایی Review کن." : "Select Jira issues, distribute time, and submit your worklog in minutes."}</p></div>
            <div className="flex items-center gap-2"><WorklogDateToolbar locale={locale} value={date} onChange={changeDate} loading={model.loading} /><Button variant="outline" size="icon-sm" className="size-9" onClick={() => void model.refreshDay()} disabled={model.loading} aria-label={isFa ? "همگام سازی Worklog" : "Sync worklogs"}>{model.loading ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}</Button></div>
          </header>

          <WorklogSummaryStrip locale={locale} targetMinutes={model.targetMinutes} dayMinutes={model.dayMinutes} scopeMinutes={model.scopeMinutes} remainingMinutes={model.remainingMinutes} draftMinutes={model.draftMinutes} daySummary={model.daySummary} date={date} />
          <WorklogWorkflowRail locale={locale} currentStep={currentStep} scopeReady={scopeReady} selectedCount={selectedKeys.size} draftCount={model.draft.length} draftMinutes={model.draftMinutes} onStep={scrollTo} />
          <div ref={scopeRef} className="scroll-mt-[calc(var(--qm-topbar-height)+72px)]"><WorklogContextBar locale={locale} projects={projects} projectKey={projectKey} boards={boards} boardId={boardId} sprints={sprints} sprintFilter={sprintFilter} loading={contextLoading} onProjectChange={onProjectChange} onBoardChange={onBoardChange} onSprintFilter={setSprintFilter} /></div>
          <div ref={issueRef} className="qm-worklog-issue-stage scroll-mt-[calc(var(--qm-topbar-height)+72px)]"><WorklogIssuePicker locale={locale} date={date} issues={issues} selectedKeys={selectedKeys} currentUser={currentUser} boardId={boardId} sprintFilter={sprintFilter} dailyCandidateKeys={dailyCandidateKeys} loggedMinutesByIssue={model.loggedMinutesByIssue} onSelectedKeysChange={onSelectedKeysChange} onCopyForAi={(items) => void copyForAi(items)} onDownloadForAi={(items) => downloadJson(`queuemint-worklog-ai-${date.toISOString().slice(0, 10)}.json`, aiPackage(items))} onOpenImport={() => setImportOpen(true)} /></div>
        </div>

        <div ref={draftRef} className="min-w-0 scroll-mt-[calc(var(--qm-topbar-height)+20px)]">
          <WorklogDraftSidebar locale={locale} date={date} selectedIssues={model.selectedIssues} draft={model.draft} draftMinutes={model.draftMinutes} remainingMinutes={model.remainingMinutes} targetMinutes={model.targetMinutes} targetText={model.targetText} selectionText={model.selectionText} loading={model.loading} applying={model.applying} note={model.note} onSelectionText={model.setSelectionText} onTargetText={model.setTargetText} onSaveTarget={() => void model.saveTarget()} onNote={model.setNote} onManual={model.prepareManual} onBuild={(strategy) => model.prepare(strategy)} onAi={() => void model.prepareAi()} onUpdate={model.updateDraft} onRemove={model.removeDraft} onDeselect={deselect} onFocusIssues={() => scrollTo(2)} onApply={(comment) => void model.applyDraft(comment)} />
        </div>
      </div>

      <WorklogImportSheet open={importOpen} onOpenChange={setImportOpen} locale={locale} issues={issues} onImport={(entries) => { model.setDraft(entries); onSelectedKeysChange(new Set(entries.map((entry) => entry.issueKey))); autoBuiltFor.current = entries.map((entry) => entry.issueKey).sort().join("|"); window.setTimeout(() => scrollTo(4), 40) }} />
    </div>
  )
}
