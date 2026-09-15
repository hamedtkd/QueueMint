import { Bolt, CircleHelp, Clock3, FileJson, Layers3, LayoutDashboard, ListChecks, Settings2, Sparkles, SquareKanban } from "lucide-react"

import { cn } from "@/lib/utils"
import type { AppLocale } from "@/types"
import type { Mode } from "@/features/bulk/bulk-utils"
import type { AppCopy } from "./app-copy"

export function WorkspaceSidebar({ mode, setMode, t, locale, onSettings, onProjects, onHelp }: {
  mode: Mode
  setMode: (mode: Mode) => void
  t: AppCopy
  locale: AppLocale
  onSettings: () => void
  onProjects: () => void
  onHelp: () => void
}) {
  const items: Array<{ value: Mode; label: string; icon: typeof Bolt }> = [
    { value: "dashboard", label: t.workspace, icon: LayoutDashboard },
    { value: "quick", label: t.quick, icon: Bolt },
    { value: "bulk", label: t.bulk, icon: FileJson },
    { value: "review", label: t.review, icon: ListChecks },
    { value: "manage", label: t.manage, icon: SquareKanban },
    { value: "worklog", label: locale === "fa" ? "ثبت زمان" : "Worklog", icon: Clock3 },
    { value: "automation", label: locale === "fa" ? "اتوماسیون" : "Automations", icon: Sparkles },
  ]

  return (
    <aside className="qm-sidebar">
      <div className="qm-brand">
        <img src="/brand/queuemint-mark.png" alt="" className="qm-brand-mark" aria-hidden="true" />
        <span className="qm-brand-name">QueueMint</span>
      </div>
      <nav className="qm-sidebar-nav" aria-label="Workspace mode">
        {items.map(({ value, label, icon: Icon }) => (
          <button key={value} type="button" className={cn("qm-sidebar-link", mode === value && "is-active")} onClick={() => setMode(value)} aria-current={mode === value ? "page" : undefined}>
            <Icon className="qm-sidebar-icon" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="qm-sidebar-footer">
        {mode === "bulk" ? <button type="button" className="qm-sidebar-link" onClick={onProjects}><Layers3 className="qm-sidebar-icon" /><span>{t.sidebarProjects}</span></button> : null}
        <button type="button" className="qm-sidebar-link" onClick={onSettings}><Settings2 className="qm-sidebar-icon" /><span>{t.sidebarSettings}</span></button>
        <button type="button" className="qm-sidebar-link" onClick={onHelp}><CircleHelp className="qm-sidebar-icon" /><span>{t.helpSupport}</span></button>
      </div>
    </aside>
  )
}
