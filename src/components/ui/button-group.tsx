import * as React from "react"

import { cn } from "@/lib/utils"

function ButtonGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="group"
      data-slot="button-group"
      className={cn("inline-flex overflow-hidden rounded-lg border bg-background [&>*]:rounded-none [&>*]:border-0 [&>*]:border-e [&>*:last-child]:border-e-0", className)}
      {...props}
    />
  )
}

export { ButtonGroup }
