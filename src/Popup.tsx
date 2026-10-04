import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Toaster } from "@/components/ui/sonner"
import { POPUP_COPY } from "@/features/popup/popup-copy"
import { PopupCaptureView } from "@/features/popup/PopupCaptureView"
import { PopupHeader } from "@/features/popup/PopupHeader"
import { PopupHomeView } from "@/features/popup/PopupHomeView"
import { PopupIssueView } from "@/features/popup/PopupIssueView"
import { PopupSuccessView } from "@/features/popup/PopupSuccessView"
import { usePopupAppearance } from "@/features/popup/use-popup-appearance"
import { usePopupCapture } from "@/features/popup/use-popup-capture"
import { usePopupJiraForm } from "@/features/popup/use-popup-jira-form"
import { usePopupSmart } from "@/features/popup/use-popup-smart"
import { getJiraConnectionStatus, jiraErrorMessage } from "@/lib/jira"
import type { JiraConnectionStatus } from "@/types"

type View = "home" | "capture" | "issue" | "success"

export default function Popup() {
  const { locale, theme, isDark, toggleLocale, toggleTheme } = usePopupAppearance()
  const t = POPUP_COPY[locale]
  const captureDraftId = new URLSearchParams(window.location.search).get("captureDraft")
  const isStandaloneCapture = Boolean(captureDraftId)
  const [view, setView] = useState<View>("home")
  const [status, setStatus] = useState<JiraConnectionStatus>({ configured: false, tabs: [] })
  const [createdKey, setCreatedKey] = useState("")
  const [restoredSessionId, setRestoredSessionId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void getJiraConnectionStatus()
      .then((next) => { if (active) setStatus(next) })
      .catch((error) => {
        if (!active) return
        setStatus({ configured: false, tabs: [] })
        toast.error(t.noJira, { description: jiraErrorMessage(error, t.noJiraHint) })
      })
    return () => { active = false }
  }, [captureDraftId, t.noJira, t.noJiraHint])

  const capture = usePopupCapture({ captureDraftId, t, onCaptureReady: () => setView("capture") })
  const form = usePopupJiraForm({ status, t })
  const smart = usePopupSmart({ locale, t, form, captureContext: capture.captureContext, finalScreenshot: capture.finalScreenshot })

  useEffect(() => {
    if (!capture.sessionId || !capture.restoredIssueDraft || !status.configured || restoredSessionId === capture.sessionId) return
    void form.restoreIssueDraft(capture.restoredIssueDraft).then((restored) => {
      if (!restored) return
      setRestoredSessionId(capture.sessionId)
      if (capture.sessionView === "issue") setView("issue")
    })
  }, [capture.sessionId, capture.sessionView, capture.restoredIssueDraft, status.configured, restoredSessionId])

  useEffect(() => {
    if (!capture.sessionId || view === "success") return
    if (capture.restoredIssueDraft && restoredSessionId !== capture.sessionId) return
    if (view !== "issue" && !form.attachments.length && !capture.restoredIssueDraft) return
    const timer = window.setTimeout(() => { void capture.persistIssueDraft(view === "issue" ? "issue" : "capture", form.issueDraft) }, 250)
    return () => window.clearTimeout(timer)
  }, [capture.sessionId, view, form.issueDraft, restoredSessionId])

  function changeView(next: "home" | "capture") {
    if (view === "issue" && next === "capture") void capture.persistIssueDraft("capture", form.issueDraft)
    setView(next)
  }

  async function addCaptureFromIssue(mode: "visible" | "full") {
    if (capture.sessionId) await capture.persistIssueDraft("capture", form.issueDraft)
    await capture.takeCapture(mode)
  }

  async function beginQuickIssue() {
    capture.setFinalScreenshot(null); capture.setCaptureContext(null)
    form.setIncludeScreenshot(false); form.setAttachments([]); form.setSummary(""); form.setDescription("")
    if (await form.ensureMetadata(false)) setView("issue")
  }

  async function reportCapture() {
    const screenshot = await capture.prepareReport()
    if (!screenshot) return
    form.setIncludeScreenshot(true)
    await capture.refreshDiagnostics()
    if (!form.summary && capture.captureContext?.title) form.setSummary(`Bug: ${capture.captureContext.title}`.slice(0, 180))
    if (form.metadata) {
      const bugType = form.projectInfo?.issueTypes?.find((item) => item.name.toLowerCase() === "bug")
      if (bugType) form.changeIssueType(bugType.name)
      setView("issue")
      return
    }
    if (await form.ensureMetadata(true)) setView("issue")
  }

  async function createIssue() {
    const key = await form.createIssue({ captureContext: capture.captureContext, finalScreenshot: capture.finalScreenshot, screenshots: capture.allScreenshots(), diagnostics: capture.diagnostics })
    if (!key) return
    setCreatedKey(key); setView("success"); setRestoredSessionId(null)
    await capture.completeSession()
  }

  async function resetCaptureSession(confirmFirst = false) {
    if (confirmFirst && !window.confirm(`${t.resetCapture}?`)) return
    const sourceTabId = capture.captureContext?.tabId
    form.resetFields(); smart.reset(); setCreatedKey(""); setRestoredSessionId(null)
    await capture.resetSession(); setView("home")
    if (!isStandaloneCapture) return
    if (sourceTabId) { try { await chrome.tabs.update(sourceTabId, { active: true }) } catch { /* source tab may be closed */ } }
    try { const current = await chrome.tabs.getCurrent(); if (current?.id) await chrome.tabs.remove(current.id) } catch { /* keep the cleared editor open */ }
  }

  function addRecordedEvidence(file: File) {
    form.setAttachments([...form.attachments, { id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`, file }])
  }

  return (
    <div className={`qm-popup-shell ${isStandaloneCapture ? "is-capture-workspace" : ""}`}>
      <PopupHeader locale={locale} theme={theme} isDark={isDark} view={view} standaloneCapture={isStandaloneCapture} status={status} finalScreenshot={capture.finalScreenshot} hasCaptureSession={Boolean(capture.sessionId)} t={t} onBack={changeView} onResetCapture={() => void resetCaptureSession(true)} onTheme={toggleTheme} onLocale={toggleLocale} />
      <div className="qm-popup-body">
        {view === "home" ? <PopupHomeView t={t} status={status} activeTitle={capture.activeTitle} activeUrl={capture.activeUrl} capturing={capture.capturing} onCapture={(mode) => void capture.takeCapture(mode)} onCapturePro={() => void capture.openCapturePro()} onQuickIssue={() => void beginQuickIssue()} /> : null}
        {view === "capture" ? <PopupCaptureView t={t} locale={locale} status={status} standalone={isStandaloneCapture} loadingMetadata={form.loadingMetadata} dataUrl={capture.captureDataUrl} context={capture.captureContext} editorRef={capture.editorRef} shots={capture.shots} activeShotId={capture.activeShotId} editorState={capture.activeEditorState()} capturing={capture.capturing} onRetake={() => void capture.retakeCapture("visible")} onAddCapture={(mode) => void capture.takeCapture(mode)} onSelectShot={capture.selectShot} onRemoveShot={capture.removeShot} onEditorState={capture.updateEditorState} onCopy={() => void capture.copyScreenshot()} onFullscreen={() => void capture.openFullscreen()} onDownload={capture.download} onReport={() => void reportCapture()} onRecorded={addRecordedEvidence} /> : null}
        {view === "issue" ? <PopupIssueView
          t={t} locale={locale} status={status} loadingMetadata={form.loadingMetadata} metadata={form.metadata} projectInfo={form.projectInfo} finalScreenshot={capture.finalScreenshot} captureContext={capture.captureContext}
          smartTemplate={smart.smartTemplate} smartCategoryLabel={smart.smartCategoryLabel} smartSuggestion={smart.smartSuggestion} summary={form.summary} duplicateMatches={smart.duplicateMatches} duplicateLoading={smart.duplicateLoading} duplicateCheckedSummary={smart.duplicateCheckedSummary}
          projectKey={form.projectKey} boards={form.boards} boardId={form.boardId} sprints={form.sprints} sprintId={form.sprintId} issueType={form.issueType} createFieldIds={form.createFieldIds} labelOptions={form.projectLabels} assignees={form.assignees} assignee={form.assignee} priority={form.priority} epics={form.epics} epic={form.epic} description={form.description} moreFields={form.moreFields}
          estimate={form.estimate} storyPoints={form.storyPoints} labels={form.labels} dueDate={form.dueDate} component={form.component} fixVersion={form.fixVersion} includeContext={form.includeContext} includeScreenshot={form.includeScreenshot} includeDiagnostics={form.includeDiagnostics} screenshotCount={capture.shots.length} attachments={form.attachments} diagnostics={capture.diagnostics} preflight={smart.preflight} creating={form.creating} capturing={capture.capturing}
          onSmartTemplate={smart.setSmartTemplate} onApplySmart={smart.applySuggestion} onApplyAi={smart.applyAiSuggestion} onSummary={form.setSummary} onCheckDuplicates={() => void smart.checkDuplicates()} onProject={(value) => { smart.resetDuplicates(); void form.changeProject(value) }} onBoard={(value) => void form.changeBoard(value)} onSprint={form.setSprintId} onIssueType={form.changeIssueType} onAssignee={form.setAssignee} onPriority={form.setPriority} onEpic={form.setEpic} onDescription={form.setDescription} onMoreFields={() => form.setMoreFields(!form.moreFields)}
          onEstimate={form.setEstimate} onStoryPoints={form.setStoryPoints} onLabels={form.setLabels} onDueDate={form.setDueDate} onComponent={form.setComponent} onFixVersion={form.setFixVersion} onIncludeContext={form.setIncludeContext} onIncludeScreenshot={form.setIncludeScreenshot} onIncludeDiagnostics={form.setIncludeDiagnostics} onAttachments={form.setAttachments} onAddCapture={(mode) => void addCaptureFromIssue(mode)} onCreate={() => void createIssue()}
        /> : null}
        {view === "success" ? <PopupSuccessView t={t} createdKey={createdKey} onReset={() => void resetCaptureSession()} /> : null}
      </div>
      <Toaster dir={locale === "fa" ? "rtl" : "ltr"} />
    </div>
  )
}
