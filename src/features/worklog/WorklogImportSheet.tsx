import { useRef, useState, type ChangeEvent } from "react"
import { FileJson2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import type { AppLocale, JiraLiveIssue, WorklogDraftEntry } from "@/types"
import { parseWorklogJson } from "./worklog-json"

const SAMPLE = `{
  "worklogs": [
    { "issueKey": "RCRM-60", "minutes": 120, "comment": "Worked on mail integration" },
    { "issueKey": "RCRM-61", "minutes": 90, "comment": "Prepared demo files" }
  ]
}`

export function WorklogImportSheet({ open, onOpenChange, locale, issues, onImport }: {
  open: boolean
  onOpenChange: (value: boolean) => void
  locale: AppLocale
  issues: JiraLiveIssue[]
  onImport: (entries: WorklogDraftEntry[]) => void
}) {
  const isFa = locale === "fa"
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function parse() {
    try {
      const entries = parseWorklogJson(text, issues)
      onImport(entries); setError(null); onOpenChange(false)
      toast.success(isFa ? "JSON به مرحله Review اضافه شد" : "JSON added to worklog review")
    } catch (value) { setError(value instanceof Error ? value.message : "Invalid JSON") }
  }
  async function fileChanged(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ""
    if (!file) return
    try { setText(await file.text()); setError(null) }
    catch { setError(isFa ? "فایل خوانده نشد" : "Could not read the file") }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:w-[620px] sm:max-w-none">
        <SheetHeader><SheetTitle>{isFa ? "Import Worklog JSON" : "Import worklog JSON"}</SheetTitle><SheetDescription>{isFa ? "JSON خروجی AI یا فایل خودت را وارد کن. هیچ چیزی تا مرحله Review در Jira ثبت نمیشه." : "Paste AI output or upload JSON. Nothing is written to Jira until you review and confirm."}</SheetDescription></SheetHeader>
        <SheetBody className="space-y-4">
          <div className="rounded-xl border bg-muted/15 p-3 text-xs leading-5 text-muted-foreground">
            <div className="font-medium text-foreground">{isFa ? "فرمت پیشنهادی" : "Suggested format"}</div>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-[11px]">{SAMPLE}</pre>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="size-4" />{isFa ? "انتخاب فایل JSON" : "Choose JSON file"}</Button>
            <Button variant="ghost" onClick={() => { setText(SAMPLE); setError(null) }}><FileJson2 className="size-4" />{isFa ? "نمونه" : "Use sample"}</Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void fileChanged(event)} />
          </div>
          <Textarea value={text} onChange={(event) => { setText(event.target.value); setError(null) }} rows={18} spellCheck={false} className="font-mono text-xs" placeholder={SAMPLE} />
          {error ? <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div> : null}
        </SheetBody>
        <SheetFooter><Button variant="outline" onClick={() => onOpenChange(false)}>{isFa ? "بستن" : "Cancel"}</Button><Button className="ms-auto" onClick={parse} disabled={!text.trim()}>{isFa ? "رفتن به Review" : "Import to review"}</Button></SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
