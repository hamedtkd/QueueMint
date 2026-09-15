import { Layers3, Route, SquareKanban, TimerReset } from "lucide-react"

import { BoardSelect, ProjectCombobox, SimpleSelect } from "@/components/jira-controls"
import { Button } from "@/components/ui/button"
import type { AppLocale, JiraBoard, JiraProject, JiraSprint } from "@/types"

export function WorklogContextBar({ locale, projects, projectKey, boards, boardId, sprints, sprintFilter, loading, onProjectChange, onBoardChange, onSprintFilter }: {
  locale: AppLocale
  projects: JiraProject[]
  projectKey?: string
  boards: JiraBoard[]
  boardId: number | null
  sprints: JiraSprint[]
  sprintFilter: string
  loading?: boolean
  onProjectChange: (key: string) => void
  onBoardChange: (id: number) => void
  onSprintFilter: (value: string) => void
}) {
  const isFa = locale === "fa"
  const activeSprint = sprints.find((sprint) => sprint.state === "active")
  const selectedSprint = sprintFilter.startsWith("sprint:") ? sprints.find((item) => item.id === Number(sprintFilter.slice(7))) : undefined
  const scopeLabel = sprintFilter === "backlog" ? "Backlog" : selectedSprint?.name ?? (activeSprint?.name || (isFa ? "کل بورد" : "Whole board"))
  const sprintItems = [
    { value: "all", label: isFa ? "کل بورد" : "Whole board" },
    { value: "backlog", label: "Backlog" },
    ...sprints.map((sprint) => ({ value: `sprint:${sprint.id}`, label: `${sprint.name}${sprint.state === "active" ? ` · ${isFa ? "فعال" : "active"}` : ""}` })),
  ]

  return (
    <section className="qm-worklog-scope">
      <div className="qm-worklog-scope-field is-summary">
        <span className="qm-worklog-scope-label">{isFa ? "محدوده" : "Scope"}</span>
        <div className="qm-worklog-scope-summary"><span className="grid size-7 place-items-center rounded-md bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"><Route className="size-3.5" /></span><span className="truncate text-xs font-semibold">{scopeLabel}</span></div>
      </div>
      <label className="qm-worklog-scope-field"><span className="qm-worklog-scope-label"><Layers3 className="size-3.5" />{isFa ? "پروژه" : "Project"}</span><ProjectCombobox projects={projects} value={projectKey} onValueChange={onProjectChange} placeholder={isFa ? "انتخاب پروژه" : "Choose project"} emptyLabel={isFa ? "پروژه‌ای پیدا نشد" : "No projects found"} disabled={loading} /></label>
      <label className="qm-worklog-scope-field"><span className="qm-worklog-scope-label"><SquareKanban className="size-3.5" />{isFa ? "بورد" : "Board"}</span><BoardSelect boards={boards} value={boardId} onValueChange={onBoardChange} disabled={loading || !boards.length} /></label>
      <label className="qm-worklog-scope-field"><span className="qm-worklog-scope-label"><TimerReset className="size-3.5" />{isFa ? "اسپرینت" : "Sprint"}</span><SimpleSelect value={sprintFilter} items={sprintItems} onValueChange={onSprintFilter} disabled={loading || !boardId} /></label>
      <Button variant="ghost" size="sm" className="self-end text-primary" onClick={() => onSprintFilter("all")} disabled={sprintFilter === "all"}>{isFa ? "پاک کردن" : "Clear"}</Button>
    </section>
  )
}
