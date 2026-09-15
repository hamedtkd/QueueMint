import { useEffect, useMemo, useState } from "react"

import { getJiraBoardColumns } from "@/lib/jira"
import type { JiraBoardColumn, JiraLiveIssue } from "@/types"

function fallbackColumns(issues: JiraLiveIssue[]): JiraBoardColumn[] {
  const seen = new Set<string>()
  const result: JiraBoardColumn[] = []
  for (const issue of issues) {
    const name = issue.status?.trim()
    if (!name || seen.has(name)) continue
    seen.add(name)
    result.push({ id: `status:${name}`, name, statusIds: issue.statusId ? [issue.statusId] : [] })
  }
  return result
}

export function useWorklogBoardColumns(boardId: number | null, issues: JiraLiveIssue[]) {
  const [remoteColumns, setRemoteColumns] = useState<JiraBoardColumn[]>([])
  const [source, setSource] = useState<"jira" | "fallback">("fallback")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    if (!boardId) { setRemoteColumns([]); setSource("fallback"); return () => { active = false } }
    setLoading(true)
    void getJiraBoardColumns(boardId)
      .then((columns) => { if (!active) return; setRemoteColumns(columns); setSource(columns.length ? "jira" : "fallback") })
      .catch(() => { if (active) { setRemoteColumns([]); setSource("fallback") } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [boardId])

  const columns = useMemo(() => remoteColumns.length ? remoteColumns : fallbackColumns(issues), [remoteColumns, issues])
  return { columns, source, loading }
}
