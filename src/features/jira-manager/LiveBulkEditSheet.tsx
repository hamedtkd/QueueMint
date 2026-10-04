import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { Bookmark, LoaderCircle, PlusCircle, Save } from "lucide-react"
import { BulkAssigneeCombobox, BulkEpicCombobox, BulkIssueTypeSelect, JiraFieldCombobox, PrioritySelect, SimpleSelect, SprintSelect, buildEpicOptions } from "@/components/jira-controls"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { copy } from "@/features/app-shell/app-copy"
import { dynamicFieldInitialValue, isDynamicDraftReady, isDynamicFieldSupported, type DynamicFieldDraft } from "@/features/bulk/bulk-utils"
import { SmartAssigneeSuggestions } from "@/features/intelligence/SmartAssigneeSuggestions"
import { EstimateInput } from "@/features/quick-issue/EstimateInput"
import type { AssigneeSuggestion } from "@/lib/intelligence"
import type { SavedWorkspaceAction } from "@/lib/storage"
import { isValidJiraEstimate } from "@/lib/validation"
import type { AppLocale, JiraEditableField, JiraMetadata, JiraPriority, JiraSprint, JiraUser } from "@/types"
import { DynamicBulkFieldEditor } from "./DynamicBulkFieldEditor"
import { SavedActionComposer } from "./SavedActionComposer"

export function LiveBulkEditSheet({
  open,
  onOpenChange,
  locale,
  t,
  selectedCount,
  priorities,
  users,
  assigneeSuggestions,
  issueTypes,
  epicOptions,
  epicLinkFieldId,
  sprints,
  priority,
  setPriority,
  assignee,
  setAssignee,
  issueType,
  setIssueType,
  epicLink,
  setEpicLink,
  placement,
  setPlacement,
  sprintId,
  setSprintId,
  originalEstimate,
  setOriginalEstimate,
  remainingEstimate,
  setRemainingEstimate,
  storyPoints,
  setStoryPoints,
  estimation,
  dynamicFields,
  dynamicEdits,
  setDynamicEdits,
  dynamicLoading,
  dynamicError,
  coreFieldIds,
  savedActions,
  preparing,
  onComposeAction,
  onSaveAction,
  onApply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: AppLocale
  t: typeof copy.en | typeof copy.fa
  selectedCount: number
  priorities: JiraPriority[]
  users: JiraUser[]
  assigneeSuggestions: AssigneeSuggestion[]
  issueTypes: Array<{ id: string; name: string; iconUrl?: string }>
  epicOptions: ReturnType<typeof buildEpicOptions>
  epicLinkFieldId?: string
  sprints: JiraSprint[]
  priority: string | undefined
  setPriority: (value: string | undefined) => void
  assignee: string | null | undefined
  setAssignee: (value: string | null | undefined) => void
  issueType: string | undefined
  setIssueType: (value: string | undefined) => void
  epicLink: string | null | undefined
  setEpicLink: (value: string | null | undefined) => void
  placement: "keep" | "sprint" | "backlog"
  setPlacement: (value: "keep" | "sprint" | "backlog") => void
  sprintId: number | null
  setSprintId: (value: number | null) => void
  originalEstimate: string
  setOriginalEstimate: (value: string) => void
  remainingEstimate: string
  setRemainingEstimate: (value: string) => void
  storyPoints: string
  setStoryPoints: (value: string) => void
  estimation?: JiraMetadata["estimation"]
  dynamicFields: JiraEditableField[]
  dynamicEdits: Record<string, DynamicFieldDraft>
  setDynamicEdits: (value: Record<string, DynamicFieldDraft>) => void
  dynamicLoading: boolean
  dynamicError: string | null
  coreFieldIds: string[]
  savedActions: SavedWorkspaceAction[]
  preparing: boolean
  onComposeAction: (action: SavedWorkspaceAction) => void
  onSaveAction: (name: string) => void
  onApply: () => void
}) {
  const [fieldToAdd, setFieldToAdd] = useState("")
  const [saveActionOpen, setSaveActionOpen] = useState(false)
  const [saveActionName, setSaveActionName] = useState("")
  const invalidOriginalEstimate = Boolean(originalEstimate.trim()) && !isValidJiraEstimate(originalEstimate)
  const invalidRemainingEstimate = Boolean(remainingEstimate.trim()) && !isValidJiraEstimate(remainingEstimate)
  const hasInvalidEstimate = invalidOriginalEstimate || invalidRemainingEstimate
  const fixedIds = useMemo(() => new Set([
    "summary",
    "description",
    "issuetype",
    "priority",
    "assignee",
    "timetracking",
    "timeoriginalestimate",
    "timeestimate",
    ...coreFieldIds,
  ]), [coreFieldIds])
  const supportedDynamicFields = useMemo(() => dynamicFields.filter((field) => {
    if (field.availableOn !== field.representativeCount) return false
    if (fixedIds.has(field.id)) return false
    const name = field.name.trim().toLowerCase()
    const custom = field.schema?.custom?.toLowerCase() ?? ""
    if (name === "sprint" || custom.includes("gh-sprint")) return false
    return isDynamicFieldSupported(field)
  }), [dynamicFields, fixedIds])
  const metadataReady = !dynamicLoading && !dynamicError && selectedCount > 0
  const editableEverywhere = (fieldId: string) => metadataReady && dynamicFields.some((field) => field.id === fieldId && field.availableOn === field.representativeCount)
  const issueTypeEditable = editableEverywhere("issuetype")
  const priorityEditable = editableEverywhere("priority")
  const assigneeEditable = editableEverywhere("assignee")
  const epicEditable = epicLinkFieldId ? editableEverywhere(epicLinkFieldId) : true
  const timeTrackingEditable = editableEverywhere("timetracking") || editableEverywhere("timeestimate")
  const storyPointsEditable = useMemo(() => {
    const fieldId = estimation?.storyPointsFieldId
    if (!fieldId || dynamicLoading || dynamicError || !selectedCount) return false
    return dynamicFields.some((field) => field.id === fieldId && field.availableOn === field.representativeCount)
  }, [dynamicFields, dynamicError, dynamicLoading, estimation?.storyPointsFieldId, selectedCount])
  const timeTrackingHint = dynamicLoading ? t.preparingPreview : dynamicError ? t.editMetadataFailed : t.timeTrackingScreenHint
  const activeDynamicFields = supportedDynamicFields.filter((field) => Boolean(dynamicEdits[field.id]))
  const addableFields = supportedDynamicFields.filter((field) => !dynamicEdits[field.id])
  const dynamicReady = activeDynamicFields.every((field) => isDynamicDraftReady(field, dynamicEdits[field.id]))
  const hasUnsupportedFixedChange = metadataReady && (
    (issueType !== undefined && !issueTypeEditable) || (priority !== undefined && !priorityEditable) ||
    (assignee !== undefined && !assigneeEditable) || (epicLink !== undefined && !epicEditable) ||
    (Boolean(remainingEstimate.trim()) && !timeTrackingEditable) || (Boolean(storyPoints.trim()) && !storyPointsEditable)
  )
  const hasFieldChange = priority !== undefined || assignee !== undefined || issueType !== undefined || epicLink !== undefined || Boolean(originalEstimate.trim()) || Boolean(remainingEstimate.trim()) || Boolean(storyPoints.trim()) || activeDynamicFields.length > 0
  const hasChange = hasFieldChange || placement !== "keep"
  const metadataBlocksCurrentChange = hasFieldChange && (dynamicLoading || Boolean(dynamicError))

  useEffect(() => {
    if (open) return
    setSaveActionOpen(false)
    setSaveActionName("")
  }, [open])

  function addField(fieldId: string) {
    const field = supportedDynamicFields.find((item) => item.id === fieldId)
    if (!field) return
    setDynamicEdits({ ...dynamicEdits, [field.id]: { mode: "set", value: dynamicFieldInitialValue(field) } })
    setFieldToAdd("")
  }

  function updateDynamicField(fieldId: string, draft: DynamicFieldDraft) {
    setDynamicEdits({ ...dynamicEdits, [fieldId]: draft })
  }

  function removeDynamicField(fieldId: string) {
    const next = { ...dynamicEdits }
    delete next[fieldId]
    setDynamicEdits(next)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={locale === "fa" ? "left" : "right"} className="w-[min(96vw,560px)]">
        <SheetHeader><SheetTitle>{t.bulkEdit}</SheetTitle><SheetDescription>{selectedCount} {t.selectedIssues}</SheetDescription></SheetHeader>
        <SheetBody className="space-y-5">
          <SavedActionComposer locale={locale} actions={savedActions} onCompose={onComposeAction} />
          {metadataReady ? <div className="rounded-[var(--qm-control-radius)] border border-primary/15 bg-primary/[0.035] px-3 py-2 text-xs leading-5 text-muted-foreground">{t.bulkFieldGuardHint}</div> : null}
          <Field><FieldLabel>{t.editIssueType}</FieldLabel><BulkIssueTypeSelect issueTypes={issueTypes} value={issueType} onValueChange={setIssueType} noChangeLabel={t.noChange} disabled={!issueTypes.length || !issueTypeEditable} /></Field>
          <Field><FieldLabel>{t.editPriority}</FieldLabel><PrioritySelect priorities={priorities} value={priority} onValueChange={setPriority} allowInherited={false} noDefaultLabel={t.noChange} disabled={!priorityEditable} /></Field>
          <Field><FieldLabel>{t.editAssignee}</FieldLabel><BulkAssigneeCombobox users={users} value={assignee} onValueChange={setAssignee} placeholder={t.noChange} emptyLabel={t.assigneeEmpty} unassignedLabel={t.unassign} noChangeLabel={t.noChange} disabled={!assigneeEditable} />{assigneeEditable ? <SmartAssigneeSuggestions locale={locale} suggestions={assigneeSuggestions} onSelect={setAssignee} /> : null}</Field>
          {epicLinkFieldId ? <Field><FieldLabel>{t.editEpicLink}</FieldLabel><BulkEpicCombobox options={epicOptions} value={epicLink} onValueChange={setEpicLink} placeholder={t.epicSearch} emptyLabel={t.epicEmpty} noChangeLabel={t.noChange} clearLabel={t.removeEpicLink} disabled={!epicEditable} /></Field> : null}
          <Field><FieldLabel>{t.editPlacement}</FieldLabel><SimpleSelect value={placement} onValueChange={(value) => setPlacement(value as "keep" | "sprint" | "backlog")} items={[{ value: "keep", label: t.noChange }, { value: "sprint", label: t.sprint }, { value: "backlog", label: t.backlog }]} /></Field>
          {placement === "sprint" ? <Field><FieldLabel>{t.sprint}</FieldLabel><SprintSelect sprints={sprints} value={sprintId ?? undefined} onValueChange={(value) => setSprintId(typeof value === "number" ? value : null)} allowInherited={false} allowBacklog={false} noDefaultLabel={t.noDefault} activeLabel={t.active} futureLabel={t.future} /></Field> : null}
          {estimation?.timeTracking ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <EstimateInput label={t.originalEstimate} value={originalEstimate} onValueChange={setOriginalEstimate} placeholder={t.estimatePlaceholder} help={t.estimateHelp} />
              <EstimateInput label={t.remainingEstimate} value={remainingEstimate} onValueChange={setRemainingEstimate} placeholder={t.estimatePlaceholder} help={t.estimateHelp} inheritedText={timeTrackingEditable ? undefined : timeTrackingHint} disabled={!timeTrackingEditable} />
            </div>
          ) : null}
          {estimation?.storyPointsFieldId ? <Field><FieldLabel>{estimation.storyPointsFieldName ?? t.storyPoints}</FieldLabel><Input type="number" min="0" step="0.5" value={storyPoints} onChange={(event: ChangeEvent<HTMLInputElement>) => setStoryPoints(event.target.value)} placeholder={t.noChange} dir="ltr" disabled={!storyPointsEditable} /><div className="text-xs text-muted-foreground">{!storyPointsEditable ? (dynamicLoading ? t.preparingPreview : dynamicError ? t.editMetadataFailed : t.fieldNotEditable.replace("{field}", estimation.storyPointsFieldName ?? t.storyPoints).replace("{count}", String(selectedCount))) : null}</div></Field> : null}

          <section className="rounded-[var(--qm-panel-radius)] border bg-muted/[0.12] p-3.5">
            <div className="mb-3 flex items-start gap-3">
              <div className="grid size-8 shrink-0 place-items-center rounded-[var(--qm-control-radius)] bg-primary/10 text-primary"><PlusCircle className="size-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{t.dynamicFields}</div>
                <div className="mt-0.5 text-xs leading-5 text-muted-foreground">{t.dynamicFieldsHint}</div>
              </div>
            </div>

            {dynamicLoading ? <div className="flex items-center gap-2 rounded-[var(--qm-control-radius)] border border-dashed px-3 py-3 text-xs text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />{t.preparingPreview}</div> : null}
            {dynamicError ? <div className="rounded-[var(--qm-control-radius)] border border-warning/30 bg-warning/8 px-3 py-2 text-xs text-warning">{dynamicError}</div> : null}

            {!dynamicLoading && addableFields.length ? (
              <div className="mt-3">
                <JiraFieldCombobox
                  fields={addableFields}
                  value={fieldToAdd}
                  onValueChange={(value) => { setFieldToAdd(value); addField(value) }}
                  placeholder={t.addJiraField}
                  emptyLabel={t.noDynamicFields}
                />
              </div>
            ) : null}

            {!dynamicLoading && !dynamicError && !supportedDynamicFields.length ? <div className="mt-3 text-xs text-muted-foreground">{t.noDynamicFields}</div> : null}

            {activeDynamicFields.length ? (
              <div className="mt-3 space-y-3">
                {activeDynamicFields.map((field) => (
                  <DynamicBulkFieldEditor
                    key={field.id}
                    field={field}
                    draft={dynamicEdits[field.id]}
                    t={t}
                    onChange={(draft) => updateDynamicField(field.id, draft)}
                    onRemove={() => removeDynamicField(field.id)}
                  />
                ))}
              </div>
            ) : null}
          </section>

          {saveActionOpen ? (
            <section className="rounded-[var(--qm-panel-radius)] border border-primary/20 bg-primary/[0.035] p-3.5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Save className="size-4 text-primary" />{t.saveAction}</div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input value={saveActionName} onChange={(event: ChangeEvent<HTMLInputElement>) => setSaveActionName(event.target.value)} placeholder={t.actionNamePlaceholder} autoFocus maxLength={80} onKeyDown={(event) => { if (event.key === "Enter" && saveActionName.trim()) { onSaveAction(saveActionName); setSaveActionOpen(false); setSaveActionName("") } }} />
                <Button type="button" disabled={!saveActionName.trim()} onClick={() => { onSaveAction(saveActionName); setSaveActionOpen(false); setSaveActionName("") }}><Save className="size-4" />{t.saveAction}</Button>
                <Button type="button" variant="ghost" onClick={() => { setSaveActionOpen(false); setSaveActionName("") }}>{t.cancel}</Button>
              </div>
            </section>
          ) : null}
        </SheetBody>
        <SheetFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setSaveActionOpen(true)} disabled={!hasChange || hasInvalidEstimate || hasUnsupportedFixedChange || !dynamicReady || metadataBlocksCurrentChange || preparing || (placement === "sprint" && !sprintId)}><Bookmark className="size-4" />{t.saveAction}</Button>
          <Button onClick={onApply} disabled={!hasChange || hasInvalidEstimate || hasUnsupportedFixedChange || !dynamicReady || metadataBlocksCurrentChange || preparing || (placement === "sprint" && !sprintId)}>
            {preparing ? <LoaderCircle className="size-4 animate-spin" /> : null}{preparing ? t.preparingPreview : t.bulkEditPreview}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
