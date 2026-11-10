import { useEffect, useState } from "react"
import { ClipboardCopy, Download, LoaderCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { getJiraImageDataUrl, getJiraIssueExportDetails } from "@/lib/jira"
import { downloadJson } from "@/lib/utils"
import type { AppLocale, JiraLiveIssue } from "@/types"
import type { buildWorklogAiPackage } from "./worklog-json"
import { enrichWorklogAiPackage, type ExportProgress } from "./worklog-rich-export"

type PreparedExport = { withImages: boolean; payload: unknown; skipped: number }

export function WorklogExportSheet({ open, onOpenChange, locale, issues, date, buildPackage }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: AppLocale
  issues: JiraLiveIssue[]
  date: Date
  buildPackage: () => ReturnType<typeof buildWorklogAiPackage>
}) {
  const isFa = locale === "fa"
  const [includeImages, setIncludeImages] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const [prepared, setPrepared] = useState<PreparedExport | null>(null)
  const [skipped, setSkipped] = useState(0)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) { setIncludeImages(false); setPrepared(null); setProgress(null); setSkipped(0); setError("") }
  }, [open])

  async function exportData(action: "copy" | "download") {
    if (busy || !issues.length) return
    setBusy(true)
    setError("")
    try {
      let payload: unknown = prepared?.payload
      let missing = prepared?.skipped ?? 0
      if (!prepared || prepared.withImages !== includeImages) {
        const result = await enrichWorklogAiPackage(buildPackage(), {
          includeImages,
          loadDetails: getJiraIssueExportDetails,
          loadImage: getJiraImageDataUrl,
          onProgress: setProgress,
        })
        payload = result.payload
        missing = result.skipped.length
        setPrepared({ withImages: includeImages, payload, skipped: missing })
      }
      if (action === "copy") await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      else {
        const day = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0")
        downloadJson("queuemint-worklog-ai-" + day + ".json", payload)
      }
      setSkipped(missing)
      if (missing) toast.warning(isFa ? "برخی تصاویر در خروجی قرار نگرفتند؛ جزئیات در JSON ثبت شده است." : "Some images were skipped; details are in the JSON.")
      else toast.success(action === "copy" ? (isFa ? "JSON برای AI کپی شد" : "AI JSON copied") : (isFa ? "خروجی JSON آماده شد" : "JSON downloaded"))
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not export Jira issues."
      setError(message)
      toast.error(isFa ? "ساخت خروجی ناموفق بود" : "Could not export Jira issues")
    } finally { setBusy(false); setProgress(null) }
  }

  return (
    <Sheet open={open} onOpenChange={(value) => { if (!busy) onOpenChange(value) }}>
      <SheetContent side={isFa ? "left" : "right"} className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isFa ? "خروجی تسک‌ها برای AI" : "Export Jira issues for AI"}</SheetTitle>
          <SheetDescription>{isFa ? "عنوان، وضعیت و توضیحات کامل هر تسک در خروجی قرار می‌گیرد." : "Export issue metadata and full Jira descriptions. Images are optional."}</SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <p className="text-sm text-muted-foreground">{isFa ? "تعداد تسک‌ها" : "Issues to export"}: <strong className="text-foreground">{issues.length}</strong></p>
          <label className="flex cursor-pointer items-start gap-3 rounded-[var(--qm-panel-radius)] border bg-muted/10 p-4">
            <input type="checkbox" checked={includeImages} disabled={busy} onChange={(event) => { setIncludeImages(event.target.checked); setPrepared(null); setSkipped(0) }} className="qm-selection-checkbox mt-0.5 size-4 shrink-0" />
            <span className="min-w-0 space-y-1">
              <span className="block text-sm font-semibold">{isFa ? "افزودن تصاویر ضمیمه" : "Include attached images"}</span>
              <span className="block text-xs leading-5 text-muted-foreground">{isFa ? "تصاویر در JSON به صورت Base64 قرار می‌گیرند (حداکثر ۲۰ تصویر، هر تصویر ۱٫۵ مگابایت و در مجموع ۱۰ مگابایت)." : "Embed images as Base64 in the JSON (up to 20 images, 1.5 MB each, 10 MB total). This increases the file size."}</span>
            </span>
          </label>
          {includeImages ? <p className="text-xs leading-5 text-muted-foreground">{isFa ? "تصاویر ممکن است اطلاعات حساس داشته باشند. فقط در صورتی که قصد اشتراک‌گذاری دارید آن‌ها را اضافه کنید." : "Images may contain sensitive information. Only enable this when you intend to share them."}</p> : null}
          {progress ? <div role="status" className="flex items-center gap-2 rounded-[var(--qm-control-radius)] border bg-muted/10 px-3 py-2 text-sm"><LoaderCircle className="size-4 animate-spin" />{progress.phase === "details" ? (isFa ? "دریافت توضیحات" : "Loading descriptions") : (isFa ? "دریافت تصاویر" : "Loading images")} {progress.completed}/{progress.total}</div> : null}
          {skipped > 0 ? <p className="text-xs text-warning">{isFa ? "تعداد تصاویر اضافه‌نشده: " : "Skipped images: "}{skipped}</p> : null}
          {error ? <p role="alert" className="rounded-[var(--qm-control-radius)] border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{error}</p> : null}
        </SheetBody>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>{isFa ? "بستن" : "Close"}</Button>
          <Button variant="outline" onClick={() => void exportData("copy")} disabled={busy || !issues.length}><ClipboardCopy className="size-4" />{isFa ? "کپی برای AI" : "Copy for AI"}</Button>
          <Button onClick={() => void exportData("download")} disabled={busy || !issues.length}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}{isFa ? "دانلود JSON" : "Download JSON"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
