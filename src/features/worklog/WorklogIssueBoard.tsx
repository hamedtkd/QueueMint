import { Columns3, LoaderCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AppLocale, JiraBoardColumn, JiraLiveIssue } from "@/types"
import { WorklogIssueMiniCard } from "./WorklogIssueMiniCard"

function issuesForColumn(column: JiraBoardColumn, issues: JiraLiveIssue[]) {
  return issues.filter((issue) => column.statusIds.length ? Boolean(issue.statusId && column.statusIds.includes(issue.statusId)) : issue.status === column.name)
}

function laneTone(name: string) {
  const value = name.toLowerCase()
  if (/done|closed|resolved|complete|release/.test(value)) return "green"
  if (/review|qa|test|verify|approval/.test(value)) return "amber"
  if (/progress|doing|develop|implement|active/.test(value)) return "blue"
  if (/block|hold|reject/.test(value)) return "red"
  return "slate"
}

export function WorklogIssueBoard({ locale, issues, columns, columnsSource, columnsLoading, selectedKeys, loggedMinutesByIssue, onToggle }: {
  locale: AppLocale
  issues: JiraLiveIssue[]
  columns: JiraBoardColumn[]
  columnsSource: "jira" | "fallback"
  columnsLoading: boolean
  selectedKeys: Set<string>
  loggedMinutesByIssue: Record<string, number>
  onToggle: (key: string) => void
}) {
  const isFa = locale === "fa"
  const matched = new Set(columns.flatMap((column) => issuesForColumn(column, issues).map((issue) => issue.key)))
  const unmatched = issues.filter((issue) => !matched.has(issue.key))
  const lanes = unmatched.length ? [...columns, { id: "other", name: isFa ? "سایر" : "Other", statusIds: [] }] : columns
  if (!issues.length) return <div className="grid min-h-52 place-items-center px-4 text-sm text-muted-foreground">{isFa ? "تسکی با این فیلتر پیدا نشد." : "No issues match these filters."}</div>
  return (
    <div className="qm-worklog-board-wrap">
      <div className="flex items-center gap-2 border-b px-3 py-2 text-[11px] text-muted-foreground"><Columns3 className="size-3.5" />{columnsLoading ? <><LoaderCircle className="size-3.5 animate-spin" />{isFa ? "خواندن ستون های Jira..." : "Reading Jira board columns..."}</> : <><span>{columnsSource === "jira" ? (isFa ? "ستون ها از تنظیمات همین Jira board" : "Columns from Jira board configuration") : (isFa ? "گروه بندی براساس Status" : "Fallback grouped by Jira status")}</span><Badge variant="outline" className="ms-auto bg-background px-1.5 py-0 text-[10px]">{lanes.length} {isFa ? "ستون" : "columns"}</Badge></>}</div>
      <div className="qm-worklog-board-scroll qm-worklog-scroll">
        <div className="qm-worklog-board-grid">
          {lanes.map((column) => {
            const laneIssues = column.id === "other" ? unmatched : issuesForColumn(column, issues)
            const tone = laneTone(column.name)
            return <section key={column.id} className="qm-worklog-lane">
              <div className={cn("qm-worklog-lane-head", `is-${tone}`)}><span className="qm-worklog-lane-dot" /><span className="min-w-0 flex-1 truncate text-xs font-semibold">{column.name}</span><span className="rounded-md bg-background/70 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">{laneIssues.length}</span></div>
              <div className="qm-worklog-lane-body">{laneIssues.length ? laneIssues.map((issue) => <WorklogIssueMiniCard key={issue.key} compact locale={locale} issue={issue} selected={selectedKeys.has(issue.key)} loggedMinutes={loggedMinutesByIssue[issue.key] ?? 0} onToggle={() => onToggle(issue.key)} />) : <div className="grid min-h-28 place-items-center rounded-lg border border-dashed bg-background/55 px-4 text-center text-[11px] text-muted-foreground">{isFa ? "تسکی در این ستون نیست" : "No issues in this column"}</div>}</div>
            </section>
          })}
        </div>
      </div>
    </div>
  )
}
