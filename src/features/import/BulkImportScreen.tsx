import { useRef } from "react"
import { CheckCircle2, ChevronRight, Code2, Download, RefreshCw, Settings2, Upload, UserRound, WandSparkles, XCircle } from "lucide-react"

import { JiraUserAvatar } from "@/components/jira-user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SelectionCheckbox } from "@/components/ui/selection-checkbox"
import { copy } from "@/features/app-shell/app-copy"
import { cn } from "@/lib/utils"

export function BulkImportScreen({
  t,
  jsonText,
  setJsonText,
  parsedError,
  issueCount,
  onImport,
  onDownloadSample,
  onCopyAi,
  onDownloadAi,
  copiedAiPrompt,
  assignGeneratedToMe,
  canAssignGeneratedToMe,
  currentUserLabel,
  currentUserAvatarUrl,
  onAssignGeneratedToMe,
  onBatchSettings,
  onReset,
  onReview,
}: {
  t: typeof copy.en | typeof copy.fa
  jsonText: string
  setJsonText: (value: string) => void
  parsedError?: string
  issueCount: number
  onImport: () => void
  onDownloadSample: () => void
  onCopyAi: () => void
  onDownloadAi: () => void
  copiedAiPrompt: boolean
  assignGeneratedToMe: boolean
  canAssignGeneratedToMe: boolean
  currentUserLabel?: string
  currentUserAvatarUrl?: string
  onAssignGeneratedToMe: (checked: boolean) => void
  onBatchSettings: () => void
  onReset: () => void
  onReview: () => void
}) {
  return (
    <div className="qm-screen animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="qm-page-heading">
        <div className="qm-eyebrow">{t.bulk.toUpperCase()}</div>
        <h1 className="qm-page-title">{t.bulkTitle}</h1>
        <p className="qm-page-subtitle">{t.bulkHint}</p>
      </div>

      <div className="qm-start-grid mb-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StartCard icon={Upload} title={t.uploadJson} description=".json file" action={onImport} />
        <StartCard icon={Download} title={t.sampleJson} description="Safe schema + example" action={onDownloadSample} />
        <StartCard icon={WandSparkles} title={copiedAiPrompt ? t.copied : t.aiTemplate} description={t.downloadPrompt} action={onCopyAi} secondaryAction={onDownloadAi} />
        <StartCard icon={Settings2} title={t.batchSettings} description={t.context} action={onBatchSettings} />
      </div>

      <label className={cn("mb-5 flex items-center gap-3 rounded-[var(--qm-panel-radius)] border bg-card px-4 py-3", canAssignGeneratedToMe ? "cursor-pointer hover:border-primary/25" : "cursor-not-allowed opacity-70")}>
        <SelectionCheckbox checked={assignGeneratedToMe} onChange={onAssignGeneratedToMe} disabled={!canAssignGeneratedToMe} label={t.assignGeneratedToMe} />
        {canAssignGeneratedToMe ? <JiraUserAvatar name={currentUserLabel} avatarUrl={currentUserAvatarUrl} className="size-7" /> : <span className="grid size-7 place-items-center rounded-full bg-muted text-muted-foreground"><UserRound className="size-4" /></span>}
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{t.assignGeneratedToMe}</span><span className="mt-0.5 block text-xs text-muted-foreground">{canAssignGeneratedToMe ? t.assignGeneratedToMeHint : t.jiraIdentityUnavailable}</span></span>
        {canAssignGeneratedToMe && currentUserLabel ? <Badge variant="secondary" className="max-w-44 truncate">{currentUserLabel}</Badge> : null}
      </label>

      <Card className="qm-editor-card gap-0 py-0 shadow-none">
        <CardHeader className="border-b px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="qm-inline-code-icon"><Code2 className="size-4" /></span>
              <CardTitle className="text-base">{t.jsonEditor}</CardTitle>
              {issueCount ? <Badge variant="secondary" className="qm-issue-count-pill">{issueCount} {t.issues}</Badge> : null}
            </div>
            <Button variant="ghost" size="sm" onClick={onReset}><RefreshCw className="size-3.5" />{t.resetSample}</Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <JsonEditor value={jsonText} onChange={setJsonText} label={t.jsonEditor} />
          <div className="qm-editor-footer mt-3 flex flex-wrap items-center gap-3">
            <span className={cn("qm-valid-indicator", parsedError && "is-error")}>{parsedError ? <XCircle className="size-4" /> : <CheckCircle2 className="size-4" />}{parsedError ? t.jsonInvalid : t.jsonValid}</span>
            {parsedError ? <span className="min-w-0 flex-1 text-xs text-destructive">{parsedError}</span> : <><span className="qm-footer-divider" /><span className="text-sm text-muted-foreground">{t.importReady}</span></>}
            <Button className="ms-auto min-w-36" onClick={onReview} disabled={Boolean(parsedError) || issueCount === 0}>{t.reviewIssues}<ChevronRight className="size-4" /></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StartCard({ icon: Icon, title, description, action, secondaryAction }: { icon: typeof Upload; title: string; description: string; action: () => void; secondaryAction?: () => void }) {
  return (
    <div className="qm-start-card group flex min-h-24 items-stretch rounded-[var(--qm-panel-radius)] border bg-card transition hover:border-primary/30 hover:bg-primary/[0.025]">
      <Button
        variant="ghost"
        onClick={action}
        className="h-auto min-w-0 flex-1 justify-start whitespace-normal rounded-[var(--qm-panel-radius)] p-4 text-start hover:bg-transparent"
      >
        <span className="qm-start-card-icon transition-transform group-hover:scale-105"><Icon className="size-[18px]" /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs text-muted-foreground">{description}</span></span>
        <ChevronRight className="size-4 text-foreground/75" />
      </Button>
      {secondaryAction ? (
        <div className="flex items-center pe-3">
          <Button variant="ghost" size="icon-sm" onClick={secondaryAction} aria-label={description}><Download className="size-3.5" /></Button>
        </div>
      ) : null}
    </div>
  )
}

function JsonEditor({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const gutterRef = useRef<HTMLDivElement>(null)
  const lineCount = Math.max(1, value.split("\n").length)
  return (
    <div className="qm-json-shell">
      <div ref={gutterRef} className="qm-json-gutter" aria-hidden="true">
        {Array.from({ length: lineCount }, (_, index) => <span key={index}>{index + 1}</span>)}
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={(event) => { if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop }}
        className="json-editor qm-json-textarea"
        spellCheck={false}
        aria-label={label}
      />
    </div>
  )
}
