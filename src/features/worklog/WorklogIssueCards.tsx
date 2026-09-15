import type { AppLocale, JiraLiveIssue } from "@/types"
import { WorklogIssueMiniCard } from "./WorklogIssueMiniCard"

export function WorklogIssueCards({ locale, issues, selectedKeys, loggedMinutesByIssue, onToggle }: {
  locale: AppLocale
  issues: JiraLiveIssue[]
  selectedKeys: Set<string>
  loggedMinutesByIssue: Record<string, number>
  onToggle: (key: string) => void
}) {
  const isFa = locale === "fa"
  if (!issues.length) return <div className="grid min-h-40 place-items-center px-4 text-sm text-muted-foreground">{isFa ? "تسکی با این فیلتر پیدا نشد." : "No issues match these filters."}</div>
  return (
    <div className="qm-worklog-data-view qm-worklog-cards-scroll qm-worklog-scroll grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-3">
      {issues.map((issue) => <WorklogIssueMiniCard key={issue.key} locale={locale} issue={issue} selected={selectedKeys.has(issue.key)} loggedMinutes={loggedMinutesByIssue[issue.key] ?? 0} onToggle={() => onToggle(issue.key)} />)}
    </div>
  )
}
