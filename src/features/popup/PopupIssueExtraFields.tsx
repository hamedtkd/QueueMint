import { Boxes, CalendarDays, Clock3, Gauge, PackageCheck, Tags } from "lucide-react"

import { LabelsCombobox } from "@/components/jira-controls"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/capture-select"
import { formatDateOnly, parseDateOnly } from "@/lib/date-only"
import type { AppLocale, JiraMetadata, JiraProject } from "@/types"
import type { PopupCopy } from "./popup-copy"
import { PopupFieldSection, PopupFieldShell } from "./PopupFieldShell"

export type PopupIssueExtraFieldsProps = {
  t: PopupCopy
  locale: AppLocale
  metadata: JiraMetadata
  projectInfo: JiraProject | null
  issueType: string
  projectKey: string
  labelOptions: string[]
  createFieldIds: string[] | null
  estimate: string
  storyPoints: string
  labels: string
  dueDate: string
  component: string
  fixVersion: string
  onEstimate: (value: string) => void
  onStoryPoints: (value: string) => void
  onLabels: (value: string) => void
  onDueDate: (value: string) => void
  onComponent: (value: string) => void
  onFixVersion: (value: string) => void
}

export function PopupIssueExtraFields(props: PopupIssueExtraFieldsProps) {
  const { t, locale, metadata, projectInfo, issueType, projectKey, labelOptions, createFieldIds, estimate, storyPoints, labels, dueDate, component, fixVersion } = props
  const isEpic = issueType.toLowerCase() === "epic"
  const versions = projectInfo?.versions?.filter((item) => !item.released && !item.archived) ?? []
  const isCreateField = (fieldId: string) => createFieldIds === null || createFieldIds.includes(fieldId)
  const storyPointsField = metadata.estimation.storyPointsFieldId
  const isFa = locale === "fa"
  const localeCode = isFa ? "fa-IR-u-ca-gregory" : "en-US"

  return <PopupFieldSection icon={Gauge} title={t.advancedFields}>
    {metadata.estimation.timeTracking && !isEpic ? <PopupFieldShell icon={Clock3} label={t.estimate} tone="details">
      <Input value={estimate} onChange={(event) => props.onEstimate(event.target.value)} placeholder="3h, 2d, 30m" />
    </PopupFieldShell> : null}
    {storyPointsField && !isEpic && isCreateField(storyPointsField) ? <PopupFieldShell icon={Gauge} label={t.storyPoints} tone="planning">
      <Input type="number" min="0" step="0.5" value={storyPoints} onChange={(event) => props.onStoryPoints(event.target.value)} />
    </PopupFieldShell> : null}
    {isCreateField("labels") ? <PopupFieldShell icon={Tags} label={t.labels} tone="details">
      <LabelsCombobox
        projectKey={projectKey}
        options={labelOptions}
        value={labels.split(",").map((item) => item.trim()).filter(Boolean)}
        onValueChange={(nextLabels) => props.onLabels(nextLabels.join(", "))}
        placeholder={t.labelSearch}
        emptyLabel={t.labelEmpty}
        createLabel={(label) => `${t.createLabel}: ${label}`}
        loadingLabel={t.loadingLabels}
      />
    </PopupFieldShell> : null}
    {isCreateField("duedate") ? <PopupFieldShell icon={CalendarDays} label={t.dueDate} tone="details">
      <DatePicker
        value={parseDateOnly(dueDate)}
        onChange={(date) => props.onDueDate(formatDateOnly(date))}
        onClear={() => props.onDueDate("")}
        locale={localeCode}
        placeholder={isFa ? "انتخاب تاریخ" : "Choose a date"}
        clearLabel={isFa ? "پاک کردن" : "Clear"}
        todayLabel={isFa ? "امروز" : "Today"}
        showToday
        ariaLabel={t.dueDate}
        className="w-full"
      />
    </PopupFieldShell> : null}
    {projectInfo?.components?.length && isCreateField("components") ? <PopupFieldShell icon={Boxes} label={t.component} tone="context">
      <Select value={component || "__none"} onValueChange={(value) => props.onComponent(value === "__none" ? "" : value)}>
        <SelectTrigger><SelectValue placeholder={t.component} /></SelectTrigger>
        <SelectContent><SelectItem value="__none">{t.none}</SelectItem>{projectInfo.components.map((item) => <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>)}</SelectContent>
      </Select>
    </PopupFieldShell> : null}
    {versions.length && isCreateField("fixVersions") ? <PopupFieldShell icon={PackageCheck} label={t.fixVersion} tone="planning">
      <Select value={fixVersion || "__none"} onValueChange={(value) => props.onFixVersion(value === "__none" ? "" : value)}>
        <SelectTrigger><SelectValue placeholder={t.fixVersion} /></SelectTrigger>
        <SelectContent><SelectItem value="__none">{t.none}</SelectItem>{versions.map((item) => <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>)}</SelectContent>
      </Select>
    </PopupFieldShell> : null}
  </PopupFieldSection>
}
