import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close

function SheetContent({ className, children, side = "right", showClose = true, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: "right" | "left" | "bottom"; showClose?: boolean }) {
  const sideClass = side === "bottom"
    ? "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-2xl border-t"
    : side === "left"
      ? "inset-y-0 left-0 h-dvh w-[min(94vw,430px)] border-r"
      : "inset-y-0 right-0 h-dvh w-[min(94vw,430px)] border-l"

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="sheet-overlay"
        className="fixed inset-0 z-[200] bg-slate-950/35 backdrop-blur-[2px]"
      />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-[210] flex flex-col overflow-hidden bg-background text-foreground shadow-2xl outline-none will-change-transform",
          sideClass,
          className,
        )}
        {...props}
      >
        {showClose ? (
          <DialogPrimitive.Close aria-label="Close" className="absolute end-3 top-3 z-10 grid size-9 place-items-center rounded-lg border border-transparent text-muted-foreground outline-none transition hover:border-border hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25">
            <X className="size-4" />
          </DialogPrimitive.Close>
        ) : null}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("shrink-0 border-b bg-card/40 px-5 py-4 pe-14", className)} {...props} />
}

function SheetTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-base font-semibold tracking-tight", className)} {...props} />
}

function SheetDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("mt-1 text-sm leading-6 text-muted-foreground", className)} {...props} />
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-body" className={cn("min-h-0 flex-1 overflow-y-auto p-5", className)} {...props} />
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-auto flex shrink-0 flex-wrap items-center gap-2 border-t bg-background/96 px-5 py-4 backdrop-blur", className)} {...props} />
}

export { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger }
