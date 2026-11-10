import { ArrowLeftRight, LoaderCircle, ShieldCheck } from "lucide-react"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import type { AppLocale } from "@/types"
import type { useJiraStatusMove } from "./useJiraStatusMove"

type MoveState = ReturnType<typeof useJiraStatusMove>

export function JiraStatusMoveDialog({ locale, state }: { locale: AppLocale; state: MoveState }) {
  const isFa = locale === "fa"
  const { pending, busy, error, lastResult, close, confirm } = state
  return (
    <AlertDialog open={Boolean(pending)} onOpenChange={(value) => { if (!value) close() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isFa ? "انتقال تسک‌ها به وضعیت جدید؟" : "Move selected issues to this status?"}</AlertDialogTitle>
          <AlertDialogDescription>{isFa ? "تغییرات مستقیماً در Jira اعمال می‌شوند. هر تسک باید انتقال مجاز در Workflow خودش داشته باشد." : "Each issue is transitioned through its own Jira workflow. Unsupported transitions are reported individually."}</AlertDialogDescription>
        </AlertDialogHeader>
        {pending ? <div className="mt-3 rounded-[var(--qm-panel-radius)] border bg-muted/15 p-3">
          <div className="flex items-center gap-2 text-sm"><ArrowLeftRight className="size-4 text-primary" /><strong>{pending.keys.length}</strong><span>{isFa ? "تسک به" : "issues to"}</span><strong className="truncate">{pending.target.name}</strong></div>
          <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{pending.keys.slice(0, 8).join(", ")}{pending.keys.length > 8 ? " +" + (pending.keys.length - 8) : ""}</p>
        </div> : null}
        {lastResult?.failed.length ? <div role="alert" className="mt-2 rounded-[var(--qm-control-radius)] border border-warning/30 bg-warning/10 p-3 text-xs">
          <strong>{isFa ? "موفق" : "Moved"}: {lastResult.moved.length} · {isFa ? "ناموفق" : "Failed"}: {lastResult.failed.length}</strong>
          {lastResult.failed.slice(0, 3).map((item) => <p key={item.key} className="mt-1 break-words">{item.key}: {item.error}</p>)}
        </div> : null}
        {error ? <p role="alert" className="mt-2 rounded-[var(--qm-control-radius)] border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{error}</p> : null}
        <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />{isFa ? "تسک‌ها فقط بعد از موفقیت پاسخ Jira تغییر وضعیت می‌دهند." : "Statuses update only after Jira confirms each transition. Failed issues can be retried."}</p>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy} onClick={close}>{isFa ? "انصراف" : "Cancel"}</AlertDialogCancel>
          <Button disabled={busy} onClick={() => void confirm()}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : null}{lastResult?.failed.length ? (isFa ? "تلاش دوباره موارد ناموفق" : "Retry failed issues") : (isFa ? "تأیید انتقال" : "Confirm move")}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
