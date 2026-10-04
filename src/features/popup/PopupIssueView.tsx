import { Bug, FileText, LoaderCircle, Sparkles } from "lucide-react"

import type { LocalAttachment } from "@/components/attachment-picker"
import { Button } from "@/components/ui/button"
import { SmartAssistantCard } from "@/features/intelligence/SmartAssistantCard"
import { Input } from "@/components/ui/input"
import type { QueueMintPageDiagnostics } from "@/features/capture-pro/types"
import type { QueueMintPageContext } from "@/lib/capture"
import type { DuplicateMatch } from "@/lib/intelligence"
import type { SmartCaptureSuggestion, SmartPreflightItem, SmartTemplateId } from "@/lib/smart-capture"
import type { SmartAssistantSuggestion } from "@/lib/smart-assistant"
import { jiraBrowseUrl } from "@/lib/jira"
import type { AppLocale, JiraBoard, JiraConnectionStatus, JiraEpic, JiraMetadata, JiraProject, JiraSprint, JiraUser } from "@/types"
import type { PopupCopy } from "./popup-copy"
import { PopupDuplicateCheck } from "./PopupDuplicateCheck"
import { PopupEvidenceSection } from "./PopupEvidenceSection"
import { PopupFieldShell } from "./PopupFieldShell"
import { PopupIssueExtraFields } from "./PopupIssueExtraFields"
import { PopupIssueMainFields } from "./PopupIssueMainFields"
import { PopupPreflightCard } from "./PopupPreflightCard"
import { PopupSmartDraftCard } from "./PopupSmartDraftCard"
import { openFullWorkspace } from "./popup-shared"

export type PopupIssueViewProps = {
  t: PopupCopy; locale: AppLocale; status: JiraConnectionStatus; loadingMetadata: boolean; metadata: JiraMetadata | null; projectInfo: JiraProject | null
  finalScreenshot: string | null; captureContext: QueueMintPageContext | null; smartTemplate: SmartTemplateId; smartCategoryLabel: string; smartSuggestion: SmartCaptureSuggestion
  summary: string; duplicateMatches: DuplicateMatch[]; duplicateLoading: boolean; duplicateCheckedSummary: string; projectKey: string; boards: JiraBoard[]; boardId: number | null; sprints: JiraSprint[]; sprintId: number | null
  issueType: string; createFieldIds: string[] | null; labelOptions: string[]; assignees: JiraUser[]; assignee: string; priority: string; epics: JiraEpic[]; epic: string; description: string; moreFields: boolean; estimate: string; storyPoints: string; labels: string; dueDate: string; component: string; fixVersion: string
  includeContext: boolean; includeScreenshot: boolean; includeDiagnostics: boolean; screenshotCount: number; attachments: LocalAttachment[]; diagnostics: QueueMintPageDiagnostics | null; preflight: SmartPreflightItem[]; creating: boolean; capturing: boolean
  onSmartTemplate: (value: SmartTemplateId) => void; onApplySmart: () => void; onApplyAi: (suggestion: SmartAssistantSuggestion) => void; onSummary: (value: string) => void; onCheckDuplicates: () => void; onProject: (value: string) => void; onBoard: (value: string) => void; onSprint: (value: number | null) => void; onIssueType: (value: string) => void; onAssignee: (value: string) => void; onPriority: (value: string) => void; onEpic: (value: string) => void; onDescription: (value: string) => void; onMoreFields: () => void
  onEstimate: (value: string) => void; onStoryPoints: (value: string) => void; onLabels: (value: string) => void; onDueDate: (value: string) => void; onComponent: (value: string) => void; onFixVersion: (value: string) => void; onIncludeContext: (value: boolean) => void; onIncludeScreenshot: (value: boolean) => void; onIncludeDiagnostics: (value: boolean) => void; onAttachments: (files: LocalAttachment[]) => void; onAddCapture: (mode: "visible" | "full") => void; onCreate: () => void
}

export function PopupIssueView(props: PopupIssueViewProps) {
  const { t, locale, status, loadingMetadata, metadata, projectInfo, finalScreenshot, captureContext, smartTemplate, smartCategoryLabel, smartSuggestion, summary, duplicateMatches, duplicateLoading, duplicateCheckedSummary, projectKey, boards, boardId, sprints, sprintId, issueType, createFieldIds, labelOptions, assignees, assignee, priority, epics, epic, description, moreFields, estimate, storyPoints, labels, dueDate, component, fixVersion, includeContext, includeScreenshot, includeDiagnostics, screenshotCount, attachments, diagnostics, preflight, creating, capturing } = props
  const selectedLabels = labels.split(",").map((item) => item.trim()).filter(Boolean)
  const availableLabels = Array.from(new Set([...labelOptions, ...selectedLabels]))
  const assistantMetadata = metadata ? {
    issueTypes: projectInfo?.issueTypes?.map((item) => item.name) ?? [], priorities: metadata.priorities.map((item) => item.name), components: projectInfo?.components?.map((item) => item.name) ?? [],
    labels: availableLabels, epics: epics.map((item) => ({ key: item.key, label: item.name || item.summary || item.key })),
    assignees: assignees.map((user) => ({ id: user.name || user.key || user.displayName || "", name: user.displayName || user.name || user.key || "" })).filter((item) => item.id),
  } : undefined
  return (
    <div className="space-y-3">
      <div><div className="text-base font-semibold">{finalScreenshot ? t.createBug : t.createIssue}</div><div className="mt-1 text-xs text-muted-foreground">{finalScreenshot ? t.screenshotReady : status.selectedTab?.title ?? status.origin}</div></div>
      {loadingMetadata ? <div className="grid min-h-64 place-items-center rounded-[var(--qm-panel-radius)] border bg-card"><div className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />{t.loadingJira}</div></div> : metadata ? <>
        <PopupSmartDraftCard t={t} template={smartTemplate} categoryLabel={smartCategoryLabel} suggestion={smartSuggestion} onTemplate={props.onSmartTemplate} onApply={props.onApplySmart} />
        <SmartAssistantCard locale={locale} projectKey={projectKey} draft={{ summary, description, issueType, priority, component, labels: selectedLabels, epic, assignee }} metadata={assistantMetadata} pageContext={captureContext} screenshot={finalScreenshot} diagnostics={diagnostics} onApply={props.onApplyAi} onOpenIssue={(key) => window.open(jiraBrowseUrl(key), "_blank")} />
        <div className="qm-capture-issue-form">
          <PopupFieldShell icon={FileText} label={t.summary} tone="details" className="qm-field-span-2 qm-popup-summary-card">
            <Input value={summary} onChange={(event) => props.onSummary(event.target.value)} maxLength={255} autoFocus />
            <PopupDuplicateCheck locale={locale} summary={summary} checkedSummary={duplicateCheckedSummary} loading={duplicateLoading} matches={duplicateMatches} onCheck={props.onCheckDuplicates} />
          </PopupFieldShell>
          <PopupIssueMainFields t={t} metadata={metadata} projectInfo={projectInfo} projectKey={projectKey} boards={boards} boardId={boardId} sprints={sprints} sprintId={sprintId} issueType={issueType} assignees={assignees} assignee={assignee} priority={priority} epics={epics} epic={epic} description={description} moreFields={moreFields} onProject={props.onProject} onBoard={props.onBoard} onSprint={props.onSprint} onIssueType={props.onIssueType} onAssignee={props.onAssignee} onPriority={props.onPriority} onEpic={props.onEpic} onDescription={props.onDescription} onMoreFields={props.onMoreFields} />
          {moreFields ? <PopupIssueExtraFields t={t} locale={locale} metadata={metadata} projectInfo={projectInfo} issueType={issueType} projectKey={projectKey} labelOptions={labelOptions} createFieldIds={createFieldIds} estimate={estimate} storyPoints={storyPoints} labels={labels} dueDate={dueDate} component={component} fixVersion={fixVersion} onEstimate={props.onEstimate} onStoryPoints={props.onStoryPoints} onLabels={props.onLabels} onDueDate={props.onDueDate} onComponent={props.onComponent} onFixVersion={props.onFixVersion} /> : null}
          <PopupEvidenceSection t={t} context={captureContext} screenshotCount={screenshotCount} attachments={attachments} diagnostics={diagnostics} includeContext={includeContext} includeScreenshot={includeScreenshot} includeDiagnostics={includeDiagnostics} capturing={capturing} onAttachments={props.onAttachments} onIncludeContext={props.onIncludeContext} onIncludeScreenshot={props.onIncludeScreenshot} onIncludeDiagnostics={props.onIncludeDiagnostics} onAddCapture={props.onAddCapture} />
          <PopupPreflightCard t={t} items={preflight} />
          <Button className="qm-field-span-2 w-full" onClick={props.onCreate} disabled={creating || !projectKey || !issueType || !summary.trim()}>{creating ? <LoaderCircle className="size-4 animate-spin" /> : finalScreenshot ? <Bug className="size-4" /> : <Sparkles className="size-4" />}{creating ? t.creating : finalScreenshot ? t.createBug : t.createIssue}</Button>
        </div>
      </> : <div className="rounded-[var(--qm-panel-radius)] border border-warning/25 bg-warning/5 p-4 text-center"><div className="font-semibold">{t.noJira}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{t.noJiraHint}</p><Button variant="outline" size="sm" className="mt-3" onClick={openFullWorkspace}>{t.openWorkspace}</Button></div>}
    </div>
  )
}
