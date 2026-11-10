import { useRef, useState } from "react"
import { AlertTriangle, ArrowLeft, ArrowRight, Columns3, LoaderCircle, Move } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AppLocale, JiraBoardColumn, JiraLiveIssue } from "@/types"
import { dragSelection, eligibleStatusMoveKeys } from "@/features/jira-status/jira-status-selection"
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

export function WorklogIssueBoard({ locale, issues, columns, columnsSource, columnsLoading, columnsError, selectedKeys, loggedMinutesByIssue, onToggle, onSelectRange, onMoveIssueStatus, onStatusMoveRequest }: {
  locale: AppLocale
  issues: JiraLiveIssue[]
  columns: JiraBoardColumn[]
  columnsSource: "jira" | "fallback"
  columnsLoading: boolean
  columnsError?: string | null
  selectedKeys: Set<string>
  loggedMinutesByIssue: Record<string, number>
  onToggle: (key: string) => void
  onSelectRange?: (key: string, order: string[]) => void
  onMoveIssueStatus?: (issueKey: string, target: Pick<JiraBoardColumn, "name" | "statusIds">) => Promise<boolean>
  onStatusMoveRequest?: (keys: string[], target: Pick<JiraBoardColumn, "name" | "statusIds">) => void
}) {
  const isFa = locale === "fa"
  const [dragKeys, setDragKeys] = useState<string[]>([])
  const [overColumnId, setOverColumnId] = useState<string | null>(null)
  const [movingKey, setMovingKey] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const matched = new Set(columns.flatMap((column) => issuesForColumn(column, issues).map((issue) => issue.key)))
  const unmatched = issues.filter((issue) => !matched.has(issue.key))
  const lanes = unmatched.length ? [...columns, { id: "other", name: isFa ? "سایر" : "Other", statusIds: [] }] : columns
  const laneIssues = (column: JiraBoardColumn) => column.id === "other" ? unmatched : issuesForColumn(column, issues)
  const displayOrder = lanes.flatMap((column) => laneIssues(column).map((issue) => issue.key))

  function canDrop(column: JiraBoardColumn) {
    return Boolean((onMoveIssueStatus || onStatusMoveRequest) && column.id !== "other" && eligibleStatusMoveKeys(issues, dragKeys, column).length)
  }

  async function dropInto(column: JiraBoardColumn) {
    const moving = eligibleStatusMoveKeys(issues, dragKeys, column)
    setDragKeys([])
    setOverColumnId(null)
    if (!moving.length) return
    if (dragKeys.length > 1 && onStatusMoveRequest) {
      onStatusMoveRequest(moving, { name: column.name, statusIds: column.statusIds })
      return
    }
    if (!onMoveIssueStatus && onStatusMoveRequest) {
      onStatusMoveRequest(moving, { name: column.name, statusIds: column.statusIds })
      return
    }
    if (!onMoveIssueStatus) return
    setMovingKey(moving[0])
    try { await onMoveIssueStatus(moving[0], { name: column.name, statusIds: column.statusIds }) }
    finally { setMovingKey(null) }
  }

  if (!issues.length) return <div className="grid min-h-52 place-items-center px-4 text-sm text-muted-foreground">{isFa ? "تسکی با این فیلتر پیدا نشد." : "No issues match these filters."}</div>
  return (
    <div className="qm-worklog-board-wrap">
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2 text-[11px] text-muted-foreground">
        <Columns3 className="size-3.5" />
        {columnsLoading ? <><LoaderCircle className="size-3.5 animate-spin" />{isFa ? "خواندن ستون های Jira..." : "Reading Jira board columns..."}</> : <>
          <span>{columnsSource === "jira" ? (isFa ? "ستون‌ها از تنظیمات بورد Jira" : "Jira board columns") : (isFa ? "گروه‌بندی بر اساس وضعیت" : "Grouped by Jira status")}</span>
          {columnsError ? <span className="inline-flex min-w-0 items-center gap-1 text-warning" title={columnsError}><AlertTriangle className="size-3 shrink-0" /><span className="truncate">{isFa ? "ستون‌های Jira در دسترس نیست" : "Jira columns unavailable"}</span></span> : null}
          {onMoveIssueStatus ? <span className="hidden items-center gap-1 xl:inline-flex"><Move className="size-3" />{isFa ? "تسک‌های انتخاب‌شده را با هم بکشید" : "Drag selected cards together · Shift/Ctrl to select"}</span> : null}
          <Badge variant="outline" className="ms-auto bg-background px-1.5 py-0 text-[10px]">{lanes.length} {isFa ? "ستون" : "columns"}</Badge>
          <div className="flex shrink-0 items-center gap-1" role="group" aria-label={isFa ? "پیمایش ستون‌ها" : "Scroll board columns"}>
            <Button variant="outline" size="icon-sm" aria-label={isFa ? "ستون‌های سمت چپ" : "Scroll columns left"} onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" })}><ArrowLeft className="size-3.5" /></Button>
            <Button variant="outline" size="icon-sm" aria-label={isFa ? "ستون‌های سمت راست" : "Scroll columns right"} onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" })}><ArrowRight className="size-3.5" /></Button>
          </div>
        </>}
      </div>
      <div ref={scrollRef} className="qm-worklog-board-scroll qm-worklog-scroll" tabIndex={0} aria-label={isFa ? "ستون‌های Jira؛ پیمایش افقی" : "Jira board, horizontally scrollable"}>
        <div className="qm-worklog-board-grid">
          {lanes.map((column) => {
            const items = laneIssues(column)
            const tone = laneTone(column.name)
            const droppable = canDrop(column)
            return <section
              key={column.id}
              className={cn("qm-worklog-lane", !items.length && "is-empty", overColumnId === column.id && droppable && "is-drop-target")}
              onDragOver={(event) => { if (!droppable) return; event.preventDefault(); event.dataTransfer.dropEffect = "move"; if (overColumnId !== column.id) setOverColumnId(column.id) }}
              onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOverColumnId((current) => current === column.id ? null : current) }}
              onDrop={(event) => { if (!droppable) return; event.preventDefault(); void dropInto(column) }}
            >
              <div className={cn("qm-worklog-lane-head", "is-" + tone)}><span className="qm-worklog-lane-dot" /><span className="min-w-0 flex-1 truncate text-xs font-semibold" title={column.name}>{column.name}</span><span className="rounded-[var(--qm-control-radius)] bg-background/70 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">{items.length}</span></div>
              <div className="qm-worklog-lane-body">{items.length ? items.map((issue) => <div
                key={issue.key}
                draggable={Boolean(onMoveIssueStatus || onStatusMoveRequest) && movingKey !== issue.key}
                className={cn("qm-worklog-drag-card relative", dragKeys.includes(issue.key) && "is-dragging", movingKey === issue.key && "is-moving")}
                onClick={(event) => {
                  if (!(event.ctrlKey || event.metaKey || event.shiftKey)) return
                  if ((event.target as HTMLElement).closest("input,button,a")) return
                  event.preventDefault()
                  if (event.shiftKey && onSelectRange) onSelectRange(issue.key, displayOrder)
                  else onToggle(issue.key)
                }}
                onDragStart={(event) => {
                  const keys = dragSelection(issues, selectedKeys, issue.key)
                  setDragKeys(keys)
                  event.dataTransfer.effectAllowed = "move"
                  event.dataTransfer.setData("text/plain", keys.join(","))
                }}
                onDragEnd={() => { setDragKeys([]); setOverColumnId(null) }}
              >
                {dragKeys.length > 1 && dragKeys[0] === issue.key ? <span className="qm-worklog-drag-count">{dragKeys.length} {isFa ? "تسک" : "issues"}</span> : null}
                <WorklogIssueMiniCard compact locale={locale} issue={issue} selected={selectedKeys.has(issue.key)} loggedMinutes={loggedMinutesByIssue[issue.key] ?? 0} onToggle={() => onToggle(issue.key)} />
              </div>) : <div className={cn("grid min-h-24 place-items-center rounded-[var(--qm-control-radius)] border border-dashed bg-background/55 px-2 text-center text-[11px] text-muted-foreground", overColumnId === column.id && droppable && "border-primary/45 bg-primary/[0.04] text-primary")}>{overColumnId === column.id && droppable ? (isFa ? "برای انتقال اینجا رها کن" : "Drop to move") : (isFa ? "بدون تسک" : "Empty")}</div>}</div>
            </section>
          })}
        </div>
      </div>
    </div>
  )
}
