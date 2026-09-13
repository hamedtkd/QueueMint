import type { ChangeEvent } from "react"
import { Bolt, CheckCircle2, ExternalLink, Layers3, LoaderCircle, Plus, XCircle } from "lucide-react"

import { AttachmentPicker, type LocalAttachment } from "@/components/attachment-picker"
import { AssigneeCombobox, EpicCombobox, LabelsCombobox, PrioritySelect, ProjectCombobox, SimpleSelect, SprintSelect, buildEpicOptions } from "@/components/jira-controls"
import { JiraUserAvatar } from "@/components/jira-user-avatar"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { copy } from "@/features/app-shell/app-copy"
import type { Placement } from "@/features/bulk/bulk-utils"
import { PotentialDuplicatesPanel } from "@/features/intelligence/PotentialDuplicatesPanel"
import { SmartAssigneeSuggestions } from "@/features/intelligence/SmartAssigneeSuggestions"
import { SmartAssistantCard } from "@/features/intelligence/SmartAssistantCard"
import { PlacementToggle } from "@/features/placement/PlacementToggle"
import { EstimateInput } from "@/features/quick-issue/EstimateInput"
import type { AssigneeSuggestion, DuplicateMatch } from "@/lib/intelligence"
import { jiraBrowseUrl } from "@/lib/jira"
import { buildAssistantDescription, type SmartAssistantSuggestion } from "@/lib/smart-assistant"
import { cn } from "@/lib/utils"
import type { AppLocale, BulkIssue, BulkPayload, CreateRunResult, JiraMetadata, JiraPriority, JiraProject, JiraSprint, JiraUser } from "@/types"

export function QuickIssueScreen({
  t,
  payload,
  metadata,
  project,
  issueTypes,
  priorities,
  sprints,
  epicOptions,
  labelOptions,
  users,
  locale,
  assigneeSuggestions,
  duplicateMatches,
  duplicateLoading,
  duplicateProjectChecked,
  onCheckDuplicates,
  onOpenDuplicate,
  onProjectChange,
  issue,
  setIssue,
  placement,
  setPlacement,
  sprintId,
  setSprintId,
  attachments,
  setAttachments,
  creating,
  result,
  onCreate,
  onAddToBatch,
  onCancel,
}: {
  t: typeof copy.en | typeof copy.fa
  payload?: BulkPayload
  metadata: JiraMetadata | null
  project: JiraProject | null
  issueTypes: Array<{ id: string; name: string }>
  priorities: JiraPriority[]
  sprints: JiraSprint[]
  epicOptions: ReturnType<typeof buildEpicOptions>
  labelOptions: string[]
  users: JiraUser[]
  locale: AppLocale
  assigneeSuggestions: AssigneeSuggestion[]
  duplicateMatches: DuplicateMatch[]
  duplicateLoading: boolean
  duplicateProjectChecked: boolean
  onCheckDuplicates: () => void
  onOpenDuplicate: (issueKey: string) => void
  onProjectChange: (projectKey: string) => void
  issue: BulkIssue
  setIssue: (issue: BulkIssue) => void
  placement: Placement
  setPlacement: (placement: Placement) => void
  sprintId: number | null | undefined
  setSprintId: (id: number | null | undefined) => void
  attachments: LocalAttachment[]
  setAttachments: (files: LocalAttachment[]) => void
  creating: boolean
  result: CreateRunResult | null
  onCreate: () => void
  onAddToBatch: () => void
  onCancel: () => void
}) {
  const isEpic = issue.type.toLowerCase() === "epic"
  const resultItem = result?.results[0]
  const projectKey = payload?.project ?? project?.key ?? ""
  const projectLabel = projectKey && project?.key === projectKey && project.name ? `${projectKey} - ${project.name}` : projectKey || "-"
  const selectedAssignee = issue.assignee ? users.find((user) => (user.name || user.key || user.displayName) === issue.assignee) : undefined
  const assigneeLabel = issue.assignee ? selectedAssignee?.displayName || issue.assignee : t.unassigned
  const assigneeAvatar = selectedAssignee?.avatarUrls?.["24x24"]
  const assistantMetadata = {
    issueTypes: issueTypes.map((item) => item.name), priorities: priorities.map((item) => item.name), components: project?.components?.map((item) => item.name) ?? [],
    labels: labelOptions, epics: epicOptions.filter((item) => item.source === "jira").map((item) => ({ key: item.value, label: item.label })),
    assignees: users.map((user) => ({ id: user.name || user.key || user.displayName || "", name: user.displayName || user.name || user.key || "" })).filter((item) => item.id),
  }
  function applyAssistant(suggestion: SmartAssistantSuggestion) {
    const nextLabels = Array.from(new Set([...(issue.labels ?? []), ...suggestion.labels].map((item) => item.trim()).filter(Boolean)))
    const nextType = suggestion.issueType && issueTypes.some((item) => item.name === suggestion.issueType) ? suggestion.issueType : issue.type
    const nextPriority = suggestion.priority && priorities.some((item) => item.name === suggestion.priority) ? suggestion.priority : issue.priority
    const nextEpic = nextType.toLowerCase() === "epic" ? undefined : suggestion.epic && epicOptions.some((item) => item.value === suggestion.epic) ? suggestion.epic : issue.epic
    const nextAssignee = suggestion.assignee && users.some((user) => (user.name || user.key || user.displayName) === suggestion.assignee) ? suggestion.assignee : issue.assignee
    const nextComponent = suggestion.component && project?.components?.some((item) => item.name === suggestion.component) ? [suggestion.component] : issue.components
    setIssue({ ...issue, summary: suggestion.summary.trim().slice(0, 255) || issue.summary, description: buildAssistantDescription(suggestion, locale) || issue.description, type: nextType, priority: nextPriority, epic: nextEpic, assignee: nextAssignee, components: nextComponent, labels: nextLabels })
  }
  return (
    <div className="qm-screen animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="qm-page-heading">
        <div className="qm-eyebrow">{t.quick.toUpperCase()}</div>
        <h1 className="qm-page-title">{t.quickTitle}</h1>
        <p className="qm-page-subtitle">{t.quickHint}</p>
      </div>

      <Card className="qm-form-card gap-0 py-0 shadow-none">
        <CardHeader className="qm-form-context border-b px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-5 sm:gap-7">
            <div className="qm-entity-summary">
              <span className="qm-entity-icon is-primary"><Layers3 className="size-[18px]" /></span>
              <span className="min-w-0">
                <span className="qm-entity-label">{t.project}</span>
                <span className="qm-entity-value" title={projectLabel}>{projectLabel}</span>
              </span>
            </div>
            <span className="qm-context-divider" aria-hidden="true" />
            <div className="qm-entity-summary">
              <span className="qm-entity-icon"><JiraUserAvatar name={assigneeLabel} avatarUrl={assigneeAvatar} className="size-7" /></span>
              <span className="min-w-0">
                <span className="qm-entity-label">{t.assignee}</span>
                <span className="qm-entity-value" title={assigneeLabel}>{assigneeLabel}</span>
              </span>
            </div>
            <div className="ms-auto flex items-center gap-2"><Button variant="outline" size="icon-sm" className="qm-add-batch-shortcut" onClick={onAddToBatch} disabled={!issue.summary.trim()} aria-label={t.addToBatch} title={t.addToBatch}><Plus className="size-3.5" /></Button><Badge variant="secondary" className="qm-context-badge"><Bolt className="size-3.5" />{t.quick}</Badge></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-5 py-4 sm:px-6">
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel>{t.summary} *</FieldLabel>
              <Input value={issue.summary} onChange={(event: ChangeEvent<HTMLInputElement>) => setIssue({ ...issue, summary: event.target.value })} autoFocus placeholder={t.summary} className="qm-control" />
              {issue.summary.trim().length >= 5 ? <PotentialDuplicatesPanel locale={locale} matches={duplicateMatches} loading={duplicateLoading} projectChecked={duplicateProjectChecked} onCheck={onCheckDuplicates} onOpen={onOpenDuplicate} /> : null}
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>{t.project}</FieldLabel>
              <ProjectCombobox projects={metadata?.projects ?? []} value={projectKey} onValueChange={onProjectChange} placeholder={t.projectSearch} emptyLabel={t.projectEmpty} disabled={!metadata || !metadata.projects.length} />
            </Field>
            <Field>
              <FieldLabel>{t.type}</FieldLabel>
              <SimpleSelect value={issue.type} onValueChange={(value) => setIssue({ ...issue, type: value })} items={issueTypes.length ? issueTypes.map((item) => ({ value: item.name, label: item.name })) : [{ value: issue.type, label: issue.type }]} />
            </Field>
            <Field>
              <FieldLabel>{t.priority}</FieldLabel>
              <PrioritySelect priorities={priorities} value={issue.priority} defaultPriority={payload?.defaults?.priority} onValueChange={(priority) => setIssue({ ...issue, priority })} inheritedLabel={t.useDefault} />
            </Field>
            {!isEpic ? <div className="sm:col-span-2"><EstimateInput
              label={t.estimate}
              value={issue.estimate ?? ""}
              onValueChange={(estimate) => setIssue({ ...issue, estimate: estimate.trim() ? estimate : undefined })}
              placeholder={t.estimatePlaceholder}
              help={metadata?.estimation.timeTracking ? t.estimateHelp : t.estimateUnavailable}
            /></div> : null}
            {!isEpic ? (
              <Field className="sm:col-span-2">
                <FieldLabel>{t.placement}</FieldLabel>
                <PlacementToggle value={placement} onChange={setPlacement} t={t} />
              </Field>
            ) : null}
            {!isEpic && placement === "sprint" ? (
              <Field>
                <FieldLabel>{t.sprint}</FieldLabel>
                <SprintSelect sprints={sprints} value={sprintId} onValueChange={setSprintId} allowInherited={false} allowBacklog={false} noDefaultLabel={locale === "fa" ? "انتخاب اسپرینت" : "Select sprint"} activeLabel={t.active} futureLabel={t.future} />
              </Field>
            ) : null}
            {!isEpic ? (
              <Field>
                <FieldLabel>{t.epic} <span className="font-normal text-muted-foreground">({t.optional})</span></FieldLabel>
                <EpicCombobox options={epicOptions} value={issue.epic} onValueChange={(epic) => setIssue({ ...issue, epic })} placeholder={t.epicSearch} emptyLabel={t.epicEmpty} batchLabel={t.batchEpic} jiraLabel={t.jiraEpic} clearLabel={t.noEpic} />
              </Field>
            ) : null}
            <Field>
              <FieldLabel>{t.assignee}</FieldLabel>
              <AssigneeCombobox users={users} value={issue.assignee} onValueChange={(assignee) => setIssue({ ...issue, assignee })} placeholder={t.assigneeSearch} emptyLabel={t.assigneeEmpty} unassignedLabel={t.unassigned} />
              <SmartAssigneeSuggestions locale={locale} suggestions={assigneeSuggestions} onSelect={(identity) => setIssue({ ...issue, assignee: identity })} />
            </Field>
            <Field>
              <FieldLabel>{t.labels}</FieldLabel>
              <LabelsCombobox projectKey={payload?.project} options={labelOptions} value={issue.labels ?? []} onValueChange={(labels) => setIssue({ ...issue, labels })} placeholder={t.labelSearch} emptyLabel={t.labelEmpty} createLabel={(label) => `${t.createLabel}: ${label}`} loadingLabel={t.loadingLabels} />
            </Field>
            {project?.components?.length ? <Field>
              <FieldLabel>{locale === "fa" ? "کامپوننت" : "Component"} <span className="font-normal text-muted-foreground">({t.optional})</span></FieldLabel>
              <SimpleSelect value={issue.components?.[0] || "__none"} onValueChange={(value) => setIssue({ ...issue, components: value === "__none" ? undefined : [value] })} items={[{ value: "__none", label: locale === "fa" ? "بدون کامپوننت" : "No component" }, ...project.components.map((item) => ({ value: item.name, label: item.name }))]} />
            </Field> : null}
          </div>

          <Field>
            <FieldLabel>{t.description}</FieldLabel>
            <RichTextEditor value={issue.description ?? ""} onChange={(description) => setIssue({ ...issue, description })} placeholder={t.description} helpText={t.richHelp} minHeight={46} />
          </Field>

          <SmartAssistantCard locale={locale} projectKey={projectKey} draft={{ summary: issue.summary, description: issue.description ?? "", issueType: issue.type, priority: issue.priority, component: issue.components?.[0], labels: issue.labels, epic: issue.epic, assignee: issue.assignee }} metadata={assistantMetadata} onApply={applyAssistant} onOpenIssue={onOpenDuplicate} />

          <AttachmentPicker files={attachments} onChange={setAttachments} label={t.addAttachment} helper={t.attachmentHelp} addLabel={t.addAttachment} dropLabel={t.attachmentDrop} dropActiveLabel={t.attachmentDropActive} formatHint={t.attachmentTypes} className="qm-attachment-compact" />

          {resultItem ? (
            <div className={cn("rounded-xl border p-3 text-sm", resultItem.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200" : "border-destructive/30 bg-destructive/5 text-destructive")}>
              <div className="flex items-start gap-2">
                {resultItem.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{resultItem.ok ? t.quickSuccess : t.quickFailure}</div>
                  <div className="mt-1 text-xs opacity-80">{resultItem.key ?? resultItem.error}</div>
                  {resultItem.estimateError ? <div className="mt-1 text-xs">{t.estimateApplyFailed}: {resultItem.estimateError}</div> : null}
                  {resultItem.attachmentError ? <div className="mt-1 text-xs">{t.attachmentsFailed}: {resultItem.attachmentError}</div> : null}
                </div>
                {resultItem.key ? <Button variant="outline" size="sm" onClick={() => window.open(jiraBrowseUrl(resultItem.key as string), "_blank")}>{t.viewIssue}<ExternalLink className="size-3.5" /></Button> : null}
              </div>
            </div>
          ) : null}
        </CardContent>
        <div className="qm-form-footer flex flex-col gap-2 border-t px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <Button variant="outline" className="sm:me-auto" onClick={() => { setIssue({ type: issue.type, summary: "", description: "", priority: issue.priority }); setAttachments([]) }}>{t.clearForm}</Button>
          <Button variant="outline" onClick={onCancel}>{t.cancel}</Button>
          <Button onClick={onCreate} disabled={!issue.summary.trim() || !metadata || creating} className="min-w-28">
            {creating ? <LoaderCircle className="size-4 animate-spin" /> : null}{t.createIssue}
          </Button>
        </div>
      </Card>
    </div>
  )
}
