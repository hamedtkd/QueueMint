import { useState } from "react"
import { toast } from "sonner"

import type { AppLocale, JiraBoardColumn, JiraBulkStatusResult, JiraLiveIssue } from "@/types"
import { eligibleStatusMoveKeys } from "./jira-status-selection"

export type StatusMoveRequest = { keys: string[]; target: Pick<JiraBoardColumn, "name" | "statusIds"> }

export function useJiraStatusMove(locale: AppLocale, issues: JiraLiveIssue[], apply?: (keys: string[], target: StatusMoveRequest["target"]) => Promise<JiraBulkStatusResult>) {
  const [pending, setPending] = useState<StatusMoveRequest | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [lastResult, setLastResult] = useState<JiraBulkStatusResult | null>(null)

  function request(keys: readonly string[], target: StatusMoveRequest["target"]) {
    if (!apply) return
    const eligible = eligibleStatusMoveKeys(issues, keys, target)
    if (!eligible.length) {
      toast.info(locale === "fa" ? "تسک قابل انتقالی برای این ستون وجود ندارد." : "No selected issues need this status.")
      return
    }
    setLastResult(null)
    setError("")
    setPending({ keys: eligible, target })
  }

  function close() {
    if (busy) return
    setPending(null)
    setError("")
    setLastResult(null)
  }

  async function confirm() {
    if (!pending || !apply || busy) return
    setBusy(true)
    setError("")
    try {
      const result = await apply(pending.keys, pending.target)
      setLastResult(result)
      if (result.failed.length) setPending({ ...pending, keys: result.failed.map((item) => item.key) })
      else setPending(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Jira status move failed.")
    } finally { setBusy(false) }
  }

  return { pending, busy, error, lastResult, request, close, confirm }
}
