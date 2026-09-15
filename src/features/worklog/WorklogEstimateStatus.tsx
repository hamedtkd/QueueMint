import { CheckCircle2, Clock3 } from "lucide-react"

import { cn } from "@/lib/utils"
import type { AppLocale, JiraLiveIssue } from "@/types"

function formatSeconds(seconds: number) {
  const safe = Math.max(0, Math.round(seconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  if (hours && minutes) return `${hours}h ${minutes}m`
  if (hours) return `${hours}h`
  return `${minutes}m`
}

export function WorklogEstimateStatus({ issue, locale, compact = false, className }: {
  issue: JiraLiveIssue
  locale: AppLocale
  compact?: boolean
  className?: string
}) {
  const isFa = locale === "fa"
  if (typeof issue.storyPoints === "number") {
    return <span className={cn("inline-flex items-center gap-1 text-xs font-medium tabular-nums", className)}><Clock3 className="size-3" />{issue.storyPoints} SP</span>
  }

  const original = issue.originalEstimateSeconds
  const remaining = issue.remainingEstimateSeconds
  const hasOriginal = typeof original === "number" && original > 0
  const hasRemaining = typeof remaining === "number" && remaining > 0

  if (!hasOriginal && !hasRemaining) return <span className={cn("text-xs text-muted-foreground", className)}>—</span>

  if (hasOriginal && typeof remaining === "number" && remaining <= 0) {
    const originalText = formatSeconds(original)
    return compact ? (
      <span
        className={cn("inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300", className)}
        title={isFa ? `Estimate اولیه ${originalText} بود و زمان باقی مانده صفر شده.` : `Original estimate was ${originalText}; remaining estimate is now zero.`}
      >
        <CheckCircle2 className="size-3" />{isFa ? "0m باقی" : "0m left"}
      </span>
    ) : (
      <span className={cn("grid gap-0.5", className)}>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="size-3.5" />{isFa ? "0m باقی" : "0m left"}</span>
        <span className="text-[10px] text-muted-foreground">{originalText} {isFa ? "Estimate اولیه" : "original"}</span>
      </span>
    )
  }

  if (hasOriginal && hasRemaining && remaining < original) {
    const remainingText = formatSeconds(remaining)
    const originalText = formatSeconds(original)
    return compact ? (
      <span
        className={cn("inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300", className)}
        title={isFa ? `از Estimate اولیه ${originalText}، ${remainingText} باقی مانده.` : `${remainingText} remaining from an original estimate of ${originalText}.`}
      >
        <Clock3 className="size-3" />{remainingText} {isFa ? "باقی" : "left"}
      </span>
    ) : (
      <span className={cn("grid gap-0.5", className)}>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300"><Clock3 className="size-3.5" />{remainingText} {isFa ? "باقی" : "left"}</span>
        <span className="text-[10px] text-muted-foreground">{originalText} {isFa ? "Estimate اولیه" : "original"}</span>
      </span>
    )
  }

  const seconds = typeof remaining === "number" && remaining > 0
    ? remaining
    : typeof original === "number"
      ? original
      : 0
  const text = formatSeconds(seconds)
  return <span className={cn("inline-flex shrink-0 items-center gap-1 text-xs font-medium tabular-nums text-foreground/80", className)}><Clock3 className="size-3" />{text}</span>
}
