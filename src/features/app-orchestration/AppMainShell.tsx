import { lazy, Suspense } from "react"
import { ArrowLeftRight, Layers3, LoaderCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

import { AutomationScreen } from "@/components/automation-screen"
import { CommandPalette } from "@/components/command-palette"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import { AppHeader } from "@/features/app-shell/AppHeader"
import { WorkspaceSidebar } from "@/features/app-shell/WorkspaceSidebar"
import { EMPTY_VALIDATION } from "@/features/bulk/bulk-utils"
import { looksLikeJiraCandidate } from "@/features/connection/jira-candidate"
import { BulkImportScreen } from "@/features/import/BulkImportScreen"
import { ManageJiraScreen } from "@/features/jira-manager/ManageJiraScreen"
import { QuickIssueScreen } from "@/features/quick-issue/QuickIssueScreen"
import { ReviewActionBar } from "@/features/review/ReviewFooter"
import { ReviewScreen } from "@/features/review/ReviewScreen"
import { WorkspaceDashboard } from "@/features/workspace/WorkspaceDashboard"
import { openJira } from "@/lib/jira"
import { cn, downloadJson, downloadText } from "@/lib/utils"
import type { AppActionGroups, AppDerivedModel, AppStateModel } from "./app-view-model"

const WorklogScreen = lazy(() => import("@/features/worklog/WorklogScreen").then((module) => ({ default: module.WorklogScreen })))

type Props = { state: AppStateModel; derived: AppDerivedModel; actions: AppActionGroups }

export function AppMainShell({ state: s, derived: d, actions: a }: Props) {
  const { t, payload } = d
  return (
    <>
      <Toaster dir={s.locale === "fa" ? "rtl" : "ltr"} />
      <CommandPalette open={s.commandOpen} onOpenChange={s.setCommandOpen} items={d.commandItems} title={t.commandPalette} placeholder={t.commandSearch} emptyLabel={t.commandEmpty} />
      <div className="qm-shell">
        <WorkspaceSidebar
          mode={s.mode} setMode={(mode) => { if (mode === "worklog") s.setWorklogSelectedKeys(new Set()); s.setMode(mode) }} t={t} locale={s.locale}
          onSettings={() => s.setSettingsOpen(true)} onProjects={() => s.setBatchSettingsOpen(true)}
          onHelp={() => toast.info(t.appName, { description: t.appTagline })}
        />
        <div className="qm-workspace">
          <AppHeader
            t={t} metadata={s.metadata} connectionStatus={s.connectionStatus} loadingConnection={s.loadingConnection}
            locale={s.locale} theme={s.theme} onLocale={() => s.setLocale(s.locale === "en" ? "fa" : "en")}
            onTheme={() => s.setTheme(s.theme === "dark" ? "light" : "dark")}
            onReconnect={() => s.connectionStatus?.configured ? void a.connection.connect(true) : s.setOnboardingOpen(true)}
            onConnection={() => s.metadata ? s.setConnectionSheetOpen(true) : s.setOnboardingOpen(true)}
            onSettings={() => s.setSettingsOpen(true)} onCommands={() => s.setCommandOpen(true)}
          />

          {s.connectionError ? (
            <div className="border-b border-destructive/20 bg-destructive/5 px-4 py-3">
              <div className="app-container flex items-center justify-between gap-4 text-sm text-destructive">
                <div className="flex min-w-0 items-center gap-2"><XCircle className="size-4 shrink-0" /><span className="truncate">{s.connectionError}</span></div>
                <Button variant="outline" size="sm" onClick={() => s.connectionStatus?.configured ? void openJira() : s.setOnboardingOpen(true)}>{s.connectionStatus?.configured ? t.openJira : t.connectJira}</Button>
              </div>
            </div>
          ) : null}

          {s.contextMismatch ? (
            <div className="border-b border-amber-300/60 bg-amber-50/85 px-4 py-3 text-amber-950 dark:border-amber-800/70 dark:bg-amber-950/25 dark:text-amber-100">
              <div className="app-container flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"><ArrowLeftRight className="size-4" /></div>
                  <div className="min-w-0"><div className="text-sm font-semibold">{t.contextMismatchTitle}</div><div className="mt-0.5 text-xs opacity-80">{t.contextMismatchDescription} <span className="font-mono" dir="ltr">{payload?.project || "—"} → {s.contextMismatch.projectKey}</span></div></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={a.connection.useCurrentJiraContext}>{t.useCurrentJiraContext}</Button>
                  <Button variant="outline" size="sm" onClick={a.connection.keepCurrentWorkspace}>{t.keepWorkspace}</Button>
                  <Button variant="ghost" size="sm" onClick={() => s.setConnectionSheetOpen(true)}>{t.chooseTab}</Button>
                </div>
              </div>
            </div>
          ) : !s.connectionStatus?.configured && s.connectionStatus?.candidate && looksLikeJiraCandidate(s.connectionStatus.candidate) ? (
            <div className="border-b bg-primary/[0.035] px-4 py-3">
              <div className="app-container flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Layers3 className="size-4" /></div>
                  <div className="min-w-0"><div className="text-sm font-semibold">{t.skippedOnboardingTitle}</div><div className="mt-0.5 text-xs text-muted-foreground">{t.skippedOnboardingDescription}</div></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={s.loadingConnection} onClick={() => { const candidate = s.connectionStatus?.candidate; if (candidate?.url) void a.connection.connectFromOnboarding(candidate.url, candidate.tabId) }}>{s.loadingConnection ? <LoaderCircle className="size-4 animate-spin" /> : null}{t.currentJiraTab}</Button>
                  <Button variant="outline" size="sm" onClick={() => s.setOnboardingOpen(true)}>{t.connectJira}</Button>
                </div>
              </div>
            </div>
          ) : null}

          <main className={cn("qm-page app-container", s.mode === "review" && "qm-page-review", s.mode === "worklog" && "qm-page-worklog")}>
            {s.mode === "dashboard" ? (
              <WorkspaceDashboard
                t={t} locale={s.locale} project={s.project} projects={s.metadata?.projects ?? []} selectedProjectKey={payload?.project}
                boards={s.boards} selectedBoardId={s.selectedBoardId} board={s.boards.find((item) => item.id === s.selectedBoardId)}
                sprints={s.sprints} issues={s.liveIssues} draftIssueCount={d.issueCount} selectedCount={s.liveSelectedKeys.size}
                lastCreatedCount={s.lastCreatedKeys.length} savedActions={s.savedActions} loading={s.loadingLive} contextLoading={s.loadingProject}
                onRefresh={() => void a.live.loadLiveBoard()} onProjectChange={(key) => void a.project.chooseProject(key)} onBoardChange={(id) => void a.project.chooseBoard(id)}
                onMode={s.setMode} onCommands={() => s.setCommandOpen(true)} onUseAction={a.automation.loadSavedAction} onDeleteAction={a.automation.deleteSavedAction}
              />
            ) : s.mode === "quick" ? (
              <QuickIssueScreen
                t={t} payload={payload} metadata={s.metadata} project={s.project} issueTypes={d.issueTypes} priorities={s.metadata?.priorities ?? []}
                sprints={s.sprints} epicOptions={d.epicOptions} labelOptions={d.allLabelOptions} users={s.assignableUsers} locale={s.locale}
                assigneeSuggestions={d.quickAssigneeSuggestions} duplicateMatches={d.quickDuplicateMatches} duplicateLoading={s.duplicateLoading}
                duplicateProjectChecked={Boolean(s.duplicateCheckedSummary && s.duplicateCheckedSummary === s.quickIssue.summary.trim())}
                onCheckDuplicates={() => void a.live.checkQuickDuplicates()} onOpenDuplicate={(key) => void a.live.openIssueDetails(key)} onProjectChange={(key) => void a.project.chooseProject(key)} issue={s.quickIssue} setIssue={s.setQuickIssue}
                placement={s.quickPlacement} setPlacement={s.setQuickPlacement} sprintId={s.quickSprintId} setSprintId={s.setQuickSprintId}
                attachments={s.quickAttachments} setAttachments={s.setQuickAttachments} creating={s.quickCreating} result={s.quickResult}
                onCreate={() => void a.create.createQuickIssue()} onAddToBatch={() => a.draft.addIssue({ ...s.quickIssue, sprint: s.quickPlacement === "backlog" ? null : s.quickSprintId })}
                onCancel={() => s.setMode("review")}
              />
            ) : s.mode === "bulk" ? (
              <BulkImportScreen
                t={t} jsonText={s.jsonText} setJsonText={(value) => { s.setJsonText(value); s.setValidation(EMPTY_VALIDATION); s.setRunResult(null) }}
                parsedError={d.parsedError} issueCount={d.issueCount} onImport={() => s.fileRef.current?.click()}
                onDownloadSample={() => downloadJson("jira-bulk-example.json", d.contextualSamplePayload)}
                onCopyAi={() => void navigator.clipboard.writeText(d.contextualAiPrompt).then(() => { s.setCopiedAiPrompt(true); window.setTimeout(() => s.setCopiedAiPrompt(false), 1600) })}
                onDownloadAi={() => downloadText("jira-bulk-ai-prompt.txt", d.contextualAiPrompt)} copiedAiPrompt={s.copiedAiPrompt}
                onBatchSettings={() => s.setBatchSettingsOpen(true)}
                onReset={() => { s.setJsonText(JSON.stringify(d.contextualSamplePayload, null, 2)); s.setValidation(EMPTY_VALIDATION); s.setSelectedForCreate(new Set(d.contextualSamplePayload.issues.map((_, index) => index))) }}
                onReview={() => { if (payload?.issues?.length) { s.setSelectedForCreate(new Set(payload.issues.map((_, index) => index))); s.setMode("review") } }}
              />
            ) : s.mode === "review" ? (
              <ReviewScreen
                t={t} payload={payload} issues={d.issues} visibleEntries={d.visibleIssueEntries} selectedIndex={s.selectedIndex} setSelectedIndex={s.setSelectedIndex}
                selectedForCreate={s.selectedForCreate} toggleSelectedForCreate={a.draft.toggleSelectedForCreate} setSelectedForCreate={s.setSelectedForCreate}
                search={s.search} setSearch={s.setSearch} typeFilter={s.typeFilter} setTypeFilter={s.setTypeFilter} placementFilter={s.placementFilter} setPlacementFilter={s.setPlacementFilter}
                issueTypes={d.issueTypes} sprints={s.sprints} priorities={s.metadata?.priorities ?? []} reviewLayout={s.reviewLayout} setReviewLayout={s.setReviewLayout}
                onEdit={(index) => { s.setSelectedIndex(index); s.setInspectorOpen(true) }} onDuplicate={a.draft.duplicateIssue} onDelete={a.draft.deleteIssue}
                onBatchSettings={() => s.setBatchSettingsOpen(true)} onJson={() => s.setJsonSheetOpen(true)} onSendBacklog={a.draft.sendSelectedToBacklog}
                onMoveSelected={a.draft.moveSelectedToPlacement} onMoveIssue={a.draft.moveDraftIssue} contextPlacement={d.contextPlacement}
                selectedBoard={s.boards.find((item) => item.id === s.selectedBoardId)} validation={s.validation} autoSprintNote={s.autoSprintNote} remoteNote={s.remoteNote}
              />
            ) : s.mode === "worklog" ? (
              <Suspense fallback={<div className="qm-worklog-loading"><LoaderCircle className="size-5 animate-spin" /><span>{s.locale === "fa" ? "در حال باز کردن Worklog..." : "Opening Worklog..."}</span></div>}>
                <WorklogScreen
                  locale={s.locale} issues={s.liveIssues} selectedKeys={s.worklogSelectedKeys} onSelectedKeysChange={s.setWorklogSelectedKeys} currentUser={s.metadata?.user}
                  projectKey={s.project?.key ?? payload?.project} projects={s.metadata?.projects ?? []} boards={s.boards} boardId={s.selectedBoardId} sprints={s.sprints} contextLoading={s.loadingProject}
                  onProjectChange={(key) => void a.project.chooseProject(key)} onBoardChange={(id) => void a.project.chooseBoard(id)} recordActivity={a.live.recordActivity}
                />
              </Suspense>
            ) : s.mode === "automation" ? (
              <AutomationScreen
                locale={s.locale} projectKey={payload?.project} boardId={s.selectedBoardId} issues={s.liveIssues} priorities={s.metadata?.priorities ?? []}
                savedActions={s.savedActions} rules={s.automationRules} activity={s.activityLog} currentUserIdentity={s.metadata?.user?.name || s.metadata?.user?.key}
                onCreateQuickAction={a.automation.createQuickAutomationAction} onOpenAdvancedAction={a.automation.openAdvancedAutomationActionBuilder}
                onCreateRule={a.automation.createAutomationRule} onToggleRule={a.automation.toggleAutomationRule} onDeleteRule={a.automation.deleteAutomationRule}
                onReviewRule={a.automation.reviewAutomationRule} onClearActivity={() => s.setActivityLog([])}
              />
            ) : (
              <ManageJiraScreen
                t={t} locale={s.locale} project={s.project} boards={s.boards} selectedBoardId={s.selectedBoardId} boardLoading={s.loadingProject}
                onBoardChange={(id) => { s.setLiveScope("board"); void a.project.chooseBoard(id) }} sprints={s.sprints} priorities={s.metadata?.priorities ?? []}
                users={s.assignableUsers} metadata={s.metadata} issues={s.liveIssues} selectedKeys={s.liveSelectedKeys} setSelectedKeys={s.setLiveSelectedKeys}
                lastCreatedKeys={s.lastCreatedKeys} scope={s.liveScope} setScope={s.setLiveScope} search={s.liveSearch} setSearch={s.setLiveSearch}
                loading={s.loadingLive} message={s.liveActionMessage} onRefresh={() => void a.live.loadLiveBoard()} onMove={(keys, sprintId) => void a.live.moveLiveIssues(keys, sprintId)}
                onAssignToMe={() => void a.live.assignLiveSelectionToMe()} onBulkEdit={() => { s.setActiveAutomationRuleId(null); s.setLiveBulkOpen(true) }}
                onWorklog={() => { s.setWorklogSelectedKeys(new Set(s.liveSelectedKeys)); s.setMode("worklog") }}
                onPreparePowerTool={a.automation.preparePowerTool}
                savedActions={s.savedActions} onUseSavedAction={a.automation.loadSavedAction} onDeleteSavedAction={a.automation.deleteSavedAction}
                savedViews={s.savedViews} onSaveView={a.automation.saveIssueView} onDeleteView={a.automation.deleteIssueView} onOpenIssue={(key) => void a.live.openIssueDetails(key)}
                historyCount={s.bulkHistory.length} onHistory={() => s.setBulkHistoryOpen(true)} onDelete={() => { s.setDeleteConfirmText(""); s.setDeleteDialogOpen(true) }}
                commandPreset={s.manageCommandPreset} onCommandPresetApplied={() => s.setManageCommandPreset(null)}
              />
            )}
          </main>

          {s.mode === "review" ? (
            <ReviewActionBar
              t={t} issueCount={d.issueCount} selectedCount={s.selectedForCreate.size} creationCount={d.creationCount}
              validation={s.validation} creating={s.creating} progressValue={d.progressValue}
              onValidate={() => void a.validation.validate()} onCreate={() => void a.validation.requestCreateBatch()}
            />
          ) : null}
        </div>
      </div>
    </>
  )
}
