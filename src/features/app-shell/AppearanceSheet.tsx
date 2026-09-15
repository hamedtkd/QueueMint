import { ArrowLeftRight, Grid2X2, Grid3X3, Languages, Palette, RotateCcw, ScanLine, Sun } from "lucide-react"
import type { ChangeEvent, ComponentType, ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ACCENT_PRESETS } from "@/features/bulk/bulk-utils"
import { cn } from "@/lib/utils"
import type { AppLocale, AppTheme, DensityMode, RadiusMode, ReviewLayout } from "@/types"
import type { AppCopy } from "./app-copy"
import { SmartAssistantSettingsPanel } from "./SmartAssistantSettings"
import { ProductivitySettingsPanel } from "@/features/productivity/ProductivitySettings"

type IconType = ComponentType<{ className?: string }>

export function AppearanceSheet({ open, onOpenChange, locale, t, theme, setTheme, setLocale, accentColor, setAccentColor, reviewLayout, setReviewLayout, gridColumns, setGridColumns, density, setDensity, radius, setRadius }: {
  open: boolean; onOpenChange: (open: boolean) => void; locale: AppLocale; t: AppCopy; theme: AppTheme; setTheme: (theme: AppTheme) => void; setLocale: (locale: AppLocale) => void
  accentColor: string; setAccentColor: (color: string) => void; reviewLayout: ReviewLayout; setReviewLayout: (layout: ReviewLayout) => void; gridColumns: 2 | 3 | 4; setGridColumns: (columns: 2 | 3 | 4) => void
  density: DensityMode; setDensity: (density: DensityMode) => void; radius: RadiusMode; setRadius: (radius: RadiusMode) => void
}) {
  const labels = locale === "fa"
    ? { radius: "گردی گوشه ها", none: "بدون گردی", small: "کم", medium: "متوسط", large: "زیاد", reset: "بازنشانی ظاهر", hint: "رنگ، فاصله و گردی به صورت زنده روی کل QueueMint اعمال می شوند." }
    : { radius: "Corner radius", none: "None", small: "Small", medium: "Medium", large: "Large", reset: "Reset appearance", hint: "Color, density, and radius update the whole QueueMint interface live." }

  function resetAppearance() { setTheme("system"); setAccentColor("#0f766e"); setDensity("comfortable"); setRadius("medium") }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={locale === "fa" ? "left" : "right"}>
        <SheetHeader><SheetTitle>{t.settings}</SheetTitle><SheetDescription>{labels.hint}</SheetDescription></SheetHeader>
        <SheetBody className="space-y-6">
          <SettingGroup title={t.theme} icon={Sun}><Segmented values={[{ value: "light", label: t.light }, { value: "dark", label: t.dark }, { value: "system", label: t.system }]} value={theme} onChange={(value) => setTheme(value as AppTheme)} /></SettingGroup>
          <SettingGroup title={t.language} icon={Languages}><Segmented values={[{ value: "en", label: "English" }, { value: "fa", label: "فارسی" }]} value={locale} onChange={(value) => setLocale(value as AppLocale)} /></SettingGroup>
          <SettingGroup title={t.accent} icon={Palette}>
            <div className="flex flex-wrap items-center gap-2">
              {ACCENT_PRESETS.map((color) => <Button key={color} variant="ghost" size="icon" aria-label={color} aria-pressed={accentColor.toLowerCase() === color} className={cn("size-10 rounded-full border-4 border-background p-0 shadow-sm outline outline-1 outline-border transition-transform hover:scale-105 hover:bg-transparent focus-visible:ring-[3px] focus-visible:ring-ring/30", accentColor.toLowerCase() === color && "ring-[3px] ring-ring/25")} style={{ background: color }} onClick={() => setAccentColor(color)} />)}
              <Input type="color" value={accentColor} onChange={(event: ChangeEvent<HTMLInputElement>) => setAccentColor(event.target.value)} className="h-10 w-14 cursor-pointer p-1" aria-label={t.accent} />
            </div>
          </SettingGroup>
          <SettingGroup title={labels.radius} icon={ScanLine}><Segmented values={[{ value: "none", label: labels.none }, { value: "small", label: labels.small }, { value: "medium", label: labels.medium }, { value: "large", label: labels.large }]} value={radius} onChange={(value) => setRadius(value as RadiusMode)} /></SettingGroup>
          <SettingGroup title={t.density} icon={ArrowLeftRight}><Segmented values={[{ value: "compact", label: t.compact }, { value: "comfortable", label: t.comfortable }, { value: "spacious", label: t.spacious }]} value={density} onChange={(value) => setDensity(value as DensityMode)} /></SettingGroup>
          <SettingGroup title={t.layout} icon={Grid2X2}><Segmented values={[{ value: "board", label: t.boardView }, { value: "grid", label: t.grid }, { value: "list", label: t.list }]} value={reviewLayout} onChange={(value) => setReviewLayout(value as ReviewLayout)} /></SettingGroup>
          {reviewLayout === "grid" ? <SettingGroup title={t.columns} icon={Grid3X3}><Segmented values={[2, 3, 4].map((value) => ({ value: String(value), label: String(value) }))} value={String(gridColumns)} onChange={(value) => setGridColumns(Number(value) as 2 | 3 | 4)} /></SettingGroup> : null}
          <SmartAssistantSettingsPanel locale={locale} />
          <ProductivitySettingsPanel locale={locale} />
        </SheetBody>
        <SheetFooter className="justify-between"><Button variant="ghost" onClick={resetAppearance}><RotateCcw className="size-4" />{labels.reset}</Button><Button className="min-w-24" onClick={() => onOpenChange(false)}>{t.done}</Button></SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function SettingGroup({ title, icon: Icon, children }: { title: string; icon: IconType; children: ReactNode }) {
  return <section><div className="mb-2 flex items-center gap-2 text-sm font-medium"><Icon className="size-4 text-muted-foreground" />{title}</div>{children}</section>
}

function Segmented({ values, value, onChange }: { values: Array<{ value: string; label: string }>; value: string; onChange: (value: string) => void }) {
  return <div className="grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-1 rounded-[var(--qm-control-radius)] border bg-muted/25 p-1">{values.map((item) => <Button key={item.value} variant={value === item.value ? "secondary" : "ghost"} size="sm" onClick={() => onChange(item.value)} aria-pressed={value === item.value}>{item.label}</Button>)}</div>
}
