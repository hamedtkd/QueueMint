import type { ComponentType, ReactNode } from "react"

import { cn } from "@/lib/utils"

type IconType = ComponentType<{ className?: string }>

export function PopupFieldShell({
  icon: Icon,
  label,
  hint,
  children,
  className,
  tone = "neutral",
}: {
  icon: IconType
  label: ReactNode
  hint?: ReactNode
  children: ReactNode
  className?: string
  tone?: "neutral" | "context" | "planning" | "people" | "details"
}) {
  const accessibleLabel = typeof label === "string" ? label : undefined

  // Do not wrap popup controls in a native <label>. RichTextEditor contains
  // toolbar buttons, and a click/mouseup inside a wrapping label can forward a
  // synthetic activation to the first labelable descendant (the Bold button).
  // That made merely selecting description text toggle bold on/off.
  return (
    <div className={cn("qm-popup-field-shell", `is-${tone}`, className)} role="group" aria-label={accessibleLabel}>
      <div className="qm-popup-field-heading">
        <span className="qm-popup-field-icon" aria-hidden="true"><Icon className="size-3.5" /></span>
        <span className="min-w-0">
          <span className="qm-popup-field-label">{label}</span>
          {hint ? <span className="qm-popup-field-hint">{hint}</span> : null}
        </span>
      </div>
      <div className="qm-popup-field-control">{children}</div>
    </div>
  )
}

export function PopupFieldSection({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: IconType
  title: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn("qm-popup-field-section qm-field-span-2", className)}>
      <div className="qm-popup-field-section-title">
        <Icon className="size-3.5" />
        <span>{title}</span>
      </div>
      <div className="qm-popup-field-section-grid">{children}</div>
    </section>
  )
}
