import { type ChangeEvent } from "react"
import { CheckCircle2, Copy, Trash2, XCircle } from "lucide-react"
import { AttachmentPicker, type LocalAttachment } from "@/components/attachment-picker"
import { AssigneeCombobox, BoardSelect, buildEpicOptions, EpicCombobox, LabelsCombobox, PrioritySelect, ProjectCombobox, SimpleSelect, SprintSelect } from "@/components/jira-controls"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { copy } from "@/features/app-shell/app-copy"
import type { Placement } from "@/features/bulk/bulk-utils"
import { EstimateInput } from "@/features/quick-issue/EstimateInput"
import { PlacementToggle } from "@/features/placement/PlacementToggle"
import type { AppLocale, BulkIssue, BulkPayload, JiraBoard, JiraMetadata, JiraPriority, JiraSprint, JiraUser } from "@/types"

export function IssueInspectorSheet({ open, onOpenChange, locale, t, issue, index, payload, issueTypes, priorities, sprints, epicOptions, labelOptions, users, timeTrackingAvailable, attachments, onAttachments, onUpdate, onDuplicate, onDelete }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: AppLocale
  t: typeof copy.en | typeof copy.fa
  issue?: BulkIssue
  index: number
  payload?: BulkPayload
  issueTypes: Array<{ id: string; name: string }>
  priorities: JiraPriority[]
  sprints: JiraSprint[]
  epicOptions: ReturnType<typeof buildEpicOptions>
  labelOptions: string[]
  users: JiraUser[]
  timeTrackingAvailable: boolean
  attachments: LocalAttachment[]
  onAttachments: (files: LocalAttachment[]) => void
  onUpdate: (patch: Partial<BulkIssue>) => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const isEpic = issue?.type?.toLowerCase() === "epic"
  const effectiveSprintId = issue?.sprint !== undefined ? issue.sprint : payload?.defaults?.sprint
  const placement: Placement = typeof effectiveSprintId === "number" ? "sprint" : "backlog"
  const preferredSprintId = typeof effectiveSprintId === "number" ? effectiveSprintId : sprints.find((sprint) => sprint.state === "active")?.id ?? sprints[0]?.id
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={locale === "fa" ? "left" : "right"} className="w-[min(94vw,520px)]">
        <SheetHeader>
          <SheetTitle>{t.issueDetails} {issue ? `#${index + 1}` : ""}</SheetTitle>
          <SheetDescription>{issue?.summary ?? t.noIssueSelected}</SheetDescription>
        </SheetHeader>
        <SheetBody>
          {!issue || !payload ? (
            <div className="grid min-h-56 place-items-center text-center text-sm text-muted-foreground">{t.noIssueSelected}</div>
          ) : (
            <div className="space-y-5">
              <Field><FieldLabel>{t.summary} *</FieldLabel><Input value={issue.summary} onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdate({ summary: event.target.value })} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field><FieldLabel>{t.type}</FieldLabel><SimpleSelect value={issue.type} onValueChange={(type) => onUpdate({ type })} items={issueTypes.length ? issueTypes.map((item) => ({ value: item.name, label: item.name })) : [{ value: issue.type, label: issue.type }]} /></Field>
                <Field><FieldLabel>{t.priority}</FieldLabel><PrioritySelect priorities={priorities} value={issue.priority} defaultPriority={payload.defaults?.priority} onValueChange={(priority) => onUpdate({ priority })} inheritedLabel={t.useDefault} /></Field>
                {!isEpic ? <div className="sm:col-span-2"><EstimateInput label={t.estimate} value={issue.estimate ?? ""} onValueChange={(estimate) => onUpdate({ estimate: estimate.trim() ? estimate : undefined })} placeholder={t.estimatePlaceholder} help={timeTrackingAvailable ? t.estimateHelp : t.estimateUnavailable} inheritedText={payload.defaults?.estimate ? `${t.inheritedEstimate}: ${payload.defaults.estimate}` : undefined} /></div> : null}
              </div>
              <div className="rounded-xl border bg-muted/15 p-3">
                <div className="mb-3">
                  <div className="text-sm font-medium">{locale === "fa" ? "ثبت زمان بعد از ساخت" : "Worklog after create"}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">{locale === "fa" ? "اختیاری. QueueMint اول تسک را میسازد و بعد از تایید همین Review، زمان را روی Jira ثبت میکند." : "Optional. QueueMint creates the issue first, then adds this worklog after the same review is confirmed."}</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
                  <Field>
                    <FieldLabel>{locale === "fa" ? "دقیقه" : "Minutes"}</FieldLabel>
                    <Input
                      type="number"
                      min={1}
                      max={1440}
                      value={issue.worklog?.minutes ?? ""}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        if (!event.target.value) { onUpdate({ worklog: undefined }); return }
                        const minutes = Math.round(Number(event.target.value))
                        if (Number.isFinite(minutes) && minutes > 0) onUpdate({ worklog: { ...issue.worklog, minutes } })
                      }}
                      placeholder="90"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>{locale === "fa" ? "کامنت Worklog" : "Worklog comment"}</FieldLabel>
                    <Input
                      value={issue.worklog?.comment ?? ""}
                      disabled={!issue.worklog}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => issue.worklog ? onUpdate({ worklog: { ...issue.worklog, comment: event.target.value || undefined } }) : undefined}
                      placeholder={locale === "fa" ? "مثلا: پیاده سازی بخش اولیه" : "e.g. Implemented the first working slice"}
                    />
                  </Field>
                </div>
              </div>
              {!isEpic ? (
                <>
                  <Field><FieldLabel>{t.placement}</FieldLabel><PlacementToggle value={placement} onChange={(next) => onUpdate({ sprint: next === "backlog" ? null : preferredSprintId ?? null })} t={t} /></Field>
                  {placement === "sprint" ? <Field><FieldLabel>{t.sprint}</FieldLabel><SprintSelect sprints={sprints} value={issue.sprint} defaultSprint={payload.defaults?.sprint} onValueChange={(sprint) => onUpdate({ sprint })} inheritedLabel={t.useDefault} allowBacklog={false} activeLabel={t.active} futureLabel={t.future} /></Field> : null}
                  <Field><FieldLabel>{t.epic}</FieldLabel><EpicCombobox options={epicOptions} value={issue.epic} onValueChange={(epic) => onUpdate({ epic })} placeholder={t.epicSearch} emptyLabel={t.epicEmpty} batchLabel={t.batchEpic} jiraLabel={t.jiraEpic} clearLabel={t.noEpic} /></Field>
                </>
              ) : null}
              <Field><FieldLabel>{t.assignee}</FieldLabel><AssigneeCombobox users={users} value={issue.assignee} defaultAssignee={payload.defaults?.assignee} allowInherited onValueChange={(assignee) => onUpdate({ assignee })} placeholder={t.assigneeSearch} emptyLabel={t.assigneeEmpty} unassignedLabel={t.unassigned} inheritedLabel={t.useDefault} /></Field>
              <Field><FieldLabel>{t.labels}</FieldLabel><LabelsCombobox projectKey={payload.project} options={labelOptions} value={issue.labels ?? []} onValueChange={(labels) => onUpdate({ labels })} placeholder={t.labelSearch} emptyLabel={t.labelEmpty} createLabel={(label) => `${t.createLabel}: ${label}`} loadingLabel={t.loadingLabels} /></Field>
              <Field><FieldLabel>{t.ref}</FieldLabel><Input value={issue.ref ?? ""} onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdate({ ref: event.target.value || undefined })} placeholder="phase-2" /></Field>
              <Field><FieldLabel>{t.description}</FieldLabel><RichTextEditor value={issue.description ?? ""} onChange={(description) => onUpdate({ description })} helpText={t.richHelp} /></Field>
              <AttachmentPicker files={attachments} onChange={onAttachments} label={t.addAttachment} helper={t.attachmentHelp} addLabel={t.addAttachment} dropLabel={t.attachmentDrop} dropActiveLabel={t.attachmentDropActive} formatHint={t.attachmentTypes} />
            </div>
          )}
        </SheetBody>
        {issue ? (
          <SheetFooter>
            <Button variant="outline" onClick={onDuplicate}><Copy className="size-4" />{t.duplicate}</Button>
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="size-4" />{t.delete}</Button>
            <Button className="ms-auto min-w-20" onClick={() => onOpenChange(false)}>{t.done}</Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

export function JsonSheet({ open, onOpenChange, locale, t, jsonText, setJsonText, parsedError }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: AppLocale
  t: typeof copy.en | typeof copy.fa
  jsonText: string
  setJsonText: (value: string) => void
  parsedError?: string
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={locale === "fa" ? "right" : "left"} className="w-[min(96vw,680px)]">
        <SheetHeader><SheetTitle>{t.rawJson}</SheetTitle><SheetDescription>{t.bulkHint}</SheetDescription></SheetHeader>
        <SheetBody>
          <Textarea value={jsonText} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setJsonText(event.target.value)} className="json-editor min-h-[70dvh] resize-none bg-muted/15 font-mono text-[13px] leading-6" spellCheck={false} />
          <div className="mt-3"><Badge variant={parsedError ? "destructive" : "success"}>{parsedError ? <XCircle className="size-3" /> : <CheckCircle2 className="size-3" />}{parsedError ? t.jsonInvalid : t.jsonValid}</Badge>{parsedError ? <div className="mt-2 text-xs text-destructive">{parsedError}</div> : null}</div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

export function BatchSettingsSheet({ open, onOpenChange, locale, t, payload, metadata, boards, selectedBoardId, sprints, labels, users, loading, autoSprintNote, onProject, onBoard, onDefaults }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: AppLocale
  t: typeof copy.en | typeof copy.fa
  payload?: BulkPayload
  metadata: JiraMetadata | null
  boards: JiraBoard[]
  selectedBoardId: number | null
  sprints: JiraSprint[]
  labels: string[]
  users: JiraUser[]
  loading: boolean
  autoSprintNote: boolean
  onProject: (key: string) => void
  onBoard: (id: number) => void
  onDefaults: (patch: Partial<NonNullable<BulkPayload["defaults"]>>) => void
}) {
  const placement: Placement = typeof payload?.defaults?.sprint === "number" ? "sprint" : "backlog"
  const preferredSprintId = typeof payload?.defaults?.sprint === "number" ? payload.defaults.sprint : sprints.find((sprint) => sprint.state === "active")?.id ?? sprints[0]?.id
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={locale === "fa" ? "left" : "right"}>
        <SheetHeader><SheetTitle>{t.batchSettings}</SheetTitle><SheetDescription>{t.context}</SheetDescription></SheetHeader>
        <SheetBody className="space-y-5">
          <Field><FieldLabel>{t.project}</FieldLabel><ProjectCombobox projects={metadata?.projects ?? []} value={payload?.project} onValueChange={onProject} placeholder={t.projectSearch} emptyLabel={t.projectEmpty} disabled={!payload || !metadata} /></Field>
          <Field><FieldLabel>{t.board}</FieldLabel><BoardSelect boards={boards} value={selectedBoardId} onValueChange={onBoard} disabled={!boards.length || loading} /></Field>
          <Field><FieldLabel>{t.placement}</FieldLabel><PlacementToggle value={placement} onChange={(next) => onDefaults({ sprint: next === "backlog" ? null : preferredSprintId ?? null })} t={t} /></Field>
          {placement === "sprint" ? <Field><FieldLabel>{t.defaultSprint}</FieldLabel><SprintSelect sprints={sprints} value={payload?.defaults?.sprint} onValueChange={(sprint) => onDefaults({ sprint })} allowInherited={false} allowBacklog={false} noDefaultLabel={t.noDefault} activeLabel={t.active} futureLabel={t.future} /></Field> : null}
          <Field><FieldLabel>{t.defaultPriority}</FieldLabel><PrioritySelect priorities={metadata?.priorities ?? []} value={payload?.defaults?.priority} onValueChange={(priority) => onDefaults({ priority })} allowInherited={false} noDefaultLabel={t.noDefault} /></Field>
          <EstimateInput label={t.defaultEstimate} value={payload?.defaults?.estimate ?? ""} onValueChange={(estimate) => onDefaults({ estimate: estimate.trim() ? estimate : undefined })} placeholder={t.estimatePlaceholder} help={metadata?.estimation.timeTracking ? t.estimateHelp : t.estimateUnavailable} />
          <Field><FieldLabel>{t.defaultAssignee}</FieldLabel><AssigneeCombobox users={users} value={payload?.defaults?.assignee} onValueChange={(assignee) => onDefaults({ assignee })} placeholder={t.assigneeSearch} emptyLabel={t.assigneeEmpty} unassignedLabel={t.unassigned} /></Field>
          <Field><FieldLabel>{t.defaultLabels}</FieldLabel><LabelsCombobox projectKey={payload?.project} options={labels} value={payload?.defaults?.labels ?? []} onValueChange={(nextLabels) => onDefaults({ labels: nextLabels })} placeholder={t.labelSearch} emptyLabel={t.labelEmpty} createLabel={(label) => `${t.createLabel}: ${label}`} loadingLabel={t.loadingLabels} /></Field>
          {autoSprintNote ? <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />{t.autoSprint}</div> : null}
        </SheetBody>
        <SheetFooter className="justify-end"><Button className="min-w-24" onClick={() => onOpenChange(false)}>{t.done}</Button></SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
