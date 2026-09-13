import { useEffect, useState } from "react"
import { ChevronDown, Command, LoaderCircle, Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AppLocale, AppTheme, JiraConnectionStatus, JiraMetadata } from "@/types"
import type { AppCopy } from "./app-copy"
import { AppearanceQuickControls } from "./AppearanceQuickControls"

export function AppHeader({
  t,
  metadata,
  connectionStatus,
  loadingConnection,
  locale,
  theme,
  onLocale,
  onTheme,
  onReconnect,
  onConnection,
  onSettings,
  onCommands,
}: {
  t: AppCopy
  metadata: JiraMetadata | null
  connectionStatus: JiraConnectionStatus | null
  loadingConnection: boolean
  locale: AppLocale
  theme: AppTheme
  onLocale: () => void
  onTheme: () => void
  onReconnect: () => void
  onConnection: () => void
  onSettings: () => void
  onCommands: () => void
}) {
  const [commandShortcut, setCommandShortcut] = useState("Ctrl/⌘ Shift K")
  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.commands?.getAll) return
    void chrome.commands.getAll().then((commands) => {
      const primary = commands.find((item) => item.name === "open-command-palette")?.shortcut
      const fallback = commands.find((item) => item.name === "open-command-palette-fallback")?.shortcut
      setCommandShortcut(primary || fallback || "Click to open")
    }).catch(() => undefined)
  }, [])

  const initials = metadata?.user?.displayName
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "JD"

  return (
    <header className="qm-topbar">
      <div className="qm-topbar-inner app-container">
        <p className="qm-topbar-tagline">{t.appTagline}</p>
        <div className="qm-topbar-actions">
          <button
            type="button"
            className={cn("qm-connection-pill", metadata ? "is-connected" : "is-disconnected")}
            onClick={onReconnect}
            disabled={loadingConnection}
            title={connectionStatus?.selectedTab?.title ?? connectionStatus?.origin}
          >
            {loadingConnection ? <LoaderCircle className="size-3 animate-spin" /> : <span className="qm-status-dot" />}
            <span>{metadata ? t.connected : t.disconnected}</span>
          </button>
          <Button variant="ghost" size="sm" className="qm-topbar-command hidden gap-2 md:inline-flex" onClick={onCommands} aria-label={t.openCommandPalette} title={t.openCommandPalette}><Command className="size-[17px]" /><span className="text-xs">{commandShortcut}</span></Button>
          <Button variant="ghost" size="icon" className="qm-topbar-icon md:hidden" onClick={onCommands} aria-label={t.openCommandPalette} title={t.openCommandPalette}><Command className="size-[18px]" /></Button>
          <AppearanceQuickControls locale={locale} theme={theme} themeLabel={t.theme} languageLabel={t.language} onTheme={onTheme} onLocale={onLocale} />
          <Button variant="ghost" size="icon" className="qm-topbar-icon" onClick={onSettings} aria-label={t.settings} title={t.settings}><Settings2 className="size-[18px]" /></Button>
          <span className="qm-topbar-divider" aria-hidden="true" />
          <button type="button" className="qm-user-menu" onClick={onConnection} aria-label={t.chooseJiraTab}>
            <span className="qm-user-avatar">{initials}</span>
            <ChevronDown className="size-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
