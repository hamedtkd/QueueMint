import type { ChangeEvent } from "react"
import { ShieldAlert } from "lucide-react"

import { AppearanceSheet } from "@/features/app-shell/AppearanceSheet"
import { EMPTY_VALIDATION } from "@/features/bulk/bulk-utils"
import { JiraConnectionSheet } from "@/features/connection/JiraConnectionSheet"
import { JiraOnboardingSheet } from "@/features/connection/JiraOnboardingSheet"
import { BulkHistorySheet, LiveBulkPreviewSheet } from "@/features/jira-manager/BulkPreviewHistorySheets"
import { IssueDetailSheet } from "@/features/jira-manager/IssueDetailSheet"
import { LiveBulkEditSheet } from "@/features/jira-manager/LiveBulkEditSheet"
import { RunResultsSheet } from "@/features/review/ReviewFooter"
import { BatchSettingsSheet, IssueInspectorSheet, JsonSheet } from "@/features/review/ReviewSheets"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { openJira } from "@/lib/jira"
import type { AppActionGroups, AppDerivedModel, AppStateModel } from "./app-view-model"

type Props = { state: AppStateModel; derived: AppDerivedModel; actions: AppActionGroups }

export function AppOverlays({ state: s, derived: d, actions: a }: Props) {
  const { t, payload } = d
  return (
    <>
      <IssueDetailSheet
        open={s.issueDetailOpen} onOpenChange={s.setIssueDetailOpen} locale={s.locale} details={s.issueDetails}
        issueKey={s.issueDetailKey} loading={s.issueDetailLoading} error={s.issueDetailError} projects={s.metadata?.projects ?? []}
        currentProjectKey={payload?.project} onRefresh={() => void a.live.loadLiveBoard()}
      />

      <IssueInspectorSheet
        open={s.inspectorOpen} onOpenChange={s.setInspectorOpen} locale={s.locale} t={t} issue={d.selectedIssue}
        index={s.selectedIndex} payload={payload} issueTypes={d.issueTypes} priorities={s.metadata?.priorities ?? []}
        sprints={s.sprints} epicOptions={d.epicOptions} labelOptions={d.allLabelOptions} users={s.assignableUsers}
        timeTrackingAvailable={s.metadata?.estimation.timeTracking ?? false} attachments={s.attachmentsByIndex[s.selectedIndex] ?? []}
        onAttachments={(files) => s.setAttachmentsByIndex((current) => ({ ...current, [s.selectedIndex]: files }))}
        onUpdate={(patch) => a.draft.updateIssue(s.selectedIndex, patch)} onDuplicate={() => a.draft.duplicateIssue(s.selectedIndex)}
        onDelete={() => { a.draft.deleteIssue(s.selectedIndex); s.setInspectorOpen(false) }}
      />

      <JsonSheet
        open={s.jsonSheetOpen} onOpenChange={s.setJsonSheetOpen} locale={s.locale} t={t} jsonText={s.jsonText}
        setJsonText={(value) => { s.setJsonText(value); s.setValidation(EMPTY_VALIDATION); s.setRunResult(null) }} parsedError={d.parsedError}
      />

      <BatchSettingsSheet
        open={s.batchSettingsOpen} onOpenChange={s.setBatchSettingsOpen} locale={s.locale} t={t} payload={payload}
        metadata={s.metadata} boards={s.boards} selectedBoardId={s.selectedBoardId} sprints={s.sprints}
        labels={d.allLabelOptions} users={s.assignableUsers} loading={s.loadingProject} autoSprintNote={s.autoSprintNote}
        onProject={(key) => void a.project.chooseProject(key)} onBoard={(id) => void a.project.chooseBoard(id)} onDefaults={a.draft.updateDefaults}
      />

      <LiveBulkEditSheet
        open={s.liveBulkOpen} onOpenChange={s.setLiveBulkOpen} locale={s.locale} t={t} selectedCount={s.liveSelectedKeys.size}
        priorities={s.metadata?.priorities ?? []} users={s.assignableUsers} assigneeSuggestions={d.liveAssigneeSuggestions}
        issueTypes={d.issueTypes} epicOptions={d.liveEpicOptions} epicLinkFieldId={s.metadata?.detectedFieldMap.epicLink}
        sprints={s.sprints} priority={s.liveBulkPriority} setPriority={s.setLiveBulkPriority} assignee={s.liveBulkAssignee}
        setAssignee={s.setLiveBulkAssignee} issueType={s.liveBulkIssueType} setIssueType={s.setLiveBulkIssueType}
        epicLink={s.liveBulkEpicLink} setEpicLink={s.setLiveBulkEpicLink} placement={s.liveBulkPlacement} setPlacement={s.setLiveBulkPlacement}
        sprintId={s.liveBulkSprintId} setSprintId={s.setLiveBulkSprintId} originalEstimate={s.liveBulkOriginalEstimate}
        setOriginalEstimate={s.setLiveBulkOriginalEstimate} remainingEstimate={s.liveBulkRemainingEstimate}
        setRemainingEstimate={s.setLiveBulkRemainingEstimate} storyPoints={s.liveBulkStoryPoints} setStoryPoints={s.setLiveBulkStoryPoints}
        estimation={s.metadata?.estimation} dynamicFields={s.liveDynamicFields} dynamicEdits={s.liveDynamicEdits} setDynamicEdits={s.setLiveDynamicEdits}
        dynamicLoading={s.liveDynamicLoading} dynamicError={s.liveDynamicError}
        coreFieldIds={[s.metadata?.detectedFieldMap.epicLink, s.metadata?.estimation.storyPointsFieldId].filter((value): value is string => Boolean(value))}
        savedActions={s.savedActions.filter((action) => !action.projectKey || action.projectKey === payload?.project)} preparing={s.bulkPreviewLoading}
        onComposeAction={a.automation.composeSavedActionIntoBulkDraft} onSaveAction={a.automation.saveCurrentLiveBulkAction} onApply={() => void a.bulk.prepareLiveBulkEdit()}
      />

      <LiveBulkPreviewSheet
        open={s.bulkPreviewOpen} onOpenChange={(open) => { s.setBulkPreviewOpen(open); if (!open && !s.bulkApplying) s.setBulkPreview(null) }}
        locale={s.locale} t={t} preview={s.bulkPreview} applying={s.bulkApplying}
        onBack={() => { s.setBulkPreviewOpen(false); s.setLiveBulkOpen(true) }} onConfirm={() => void a.bulk.executeLiveBulkEdit()}
      />

      <BulkHistorySheet
        open={s.bulkHistoryOpen} onOpenChange={s.setBulkHistoryOpen} locale={s.locale} t={t} history={s.bulkHistory}
        undoingId={s.undoingHistoryId} onUndo={(entry) => void a.bulk.undoBulkHistory(entry)}
      />

      <AppearanceSheet
        open={s.settingsOpen} onOpenChange={s.setSettingsOpen} locale={s.locale} t={t} theme={s.theme} setTheme={s.setTheme}
        setLocale={s.setLocale} accentColor={s.accentColor} setAccentColor={s.setAccentColor} reviewLayout={s.reviewLayout}
        setReviewLayout={s.setReviewLayout} gridColumns={s.gridColumns} setGridColumns={s.setGridColumns} density={s.density} setDensity={s.setDensity} radius={s.radius} setRadius={s.setRadius}
      />

      <JiraOnboardingSheet
        open={s.onboardingOpen} onOpenChange={s.setOnboardingOpen} t={t} status={s.connectionStatus} url={s.onboardingUrl}
        setUrl={s.setOnboardingUrl} loading={s.loadingConnection} onConnect={(value, tabId) => void a.connection.connectFromOnboarding(value, tabId)}
        onSkip={() => { s.setOnboardingComplete(true); s.setOnboardingOpen(false) }}
      />

      <JiraConnectionSheet
        open={s.connectionSheetOpen} onOpenChange={s.setConnectionSheetOpen} t={t} status={s.connectionStatus}
        onSelect={(tabId) => void a.connection.switchJiraTab(tabId)} onOpenJira={() => void openJira()}
      />

      <AlertDialog open={s.deleteDialogOpen} onOpenChange={(open) => { s.setDeleteDialogOpen(open); if (!open) s.setDeleteConfirmText("") }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t.confirmDeleteTitle}</AlertDialogTitle><AlertDialogDescription>{t.confirmDeleteDescription}</AlertDialogDescription></AlertDialogHeader>
          <div className="mt-4 space-y-2">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"><ShieldAlert className="me-2 inline size-4" />{s.liveSelectedKeys.size} {t.selectedIssues}</div>
            <Input value={s.deleteConfirmText} onChange={(event: ChangeEvent<HTMLInputElement>) => s.setDeleteConfirmText(event.target.value)} placeholder={t.typeDelete} autoComplete="off" />
          </div>
          <AlertDialogFooter><AlertDialogCancel>{t.cancel}</AlertDialogCancel><AlertDialogAction disabled={s.deleteConfirmText !== "DELETE"} onClick={() => void a.bulk.deleteLiveSelection()}>{t.deleteNow}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={s.createDialogOpen} onOpenChange={s.setCreateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t.confirmCreateTitle}</AlertDialogTitle><AlertDialogDescription>{t.confirmCreateDescription}</AlertDialogDescription></AlertDialogHeader>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-muted/45 p-3 text-sm">
            <div><span className="text-muted-foreground">{t.project}</span><div className="mt-1 font-medium">{payload?.project ?? "—"}</div></div>
            <div><span className="text-muted-foreground">{t.selected}</span><div className="mt-1 font-medium">{d.creationCount}</div></div>
            <div className="col-span-2"><span className="text-muted-foreground">{t.placement}</span><div className="mt-1 font-medium">{d.contextPlacement}</div></div>
            {d.creationWorklogCount ? <div className="col-span-2"><span className="text-muted-foreground">{s.locale === "fa" ? "Worklog بعد از ساخت" : "Worklog after create"}</span><div className="mt-1 font-medium">{d.creationWorklogCount} {s.locale === "fa" ? "تسک" : "issues"} · {Math.floor(d.creationWorklogMinutes / 60)}h {d.creationWorklogMinutes % 60}m</div></div> : null}
          </div>
          <AlertDialogFooter><AlertDialogCancel>{t.cancel}</AlertDialogCancel><AlertDialogAction onClick={() => void a.create.executeCreateBatch()}>{t.confirmCreate}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RunResultsSheet
        t={t} locale={s.locale} runResult={s.runResult} successCount={d.successCount} failureCount={d.failureCount}
        sprintFailureCount={d.sprintFailureCount} attachmentFailureCount={d.attachmentFailureCount} estimateFailureCount={d.estimateFailureCount}
        worklogFailureCount={d.worklogFailureCount} creating={s.creating} onRetryFailed={() => void a.create.retryFailed()} onRetrySprint={() => void a.create.retrySprintPlacement()}
        onRetryWorklog={() => void a.create.retryWorklogs()}
      />
    </>
  )
}
