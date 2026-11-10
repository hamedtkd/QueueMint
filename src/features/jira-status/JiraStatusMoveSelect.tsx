import { useState } from "react"
import { SimpleSelect } from "@/components/jira-controls"
import type { AppLocale, JiraBoardColumn } from "@/types"

export function JiraStatusMoveSelect({ locale, columns, keys, disabled, onRequest }: {
  locale: AppLocale
  columns: JiraBoardColumn[]
  keys: string[]
  disabled?: boolean
  onRequest: (keys: string[], target: Pick<JiraBoardColumn, "name" | "statusIds">) => void
}) {
  const [resetKey, setResetKey] = useState(0)
  const isFa = locale === "fa"
  return (
    <SimpleSelect
      key={resetKey}
      value=""
      ariaLabel={isFa ? "انتقال تسک‌های انتخاب‌شده به وضعیت" : "Move selected Jira issues to status"}
      placeholder={isFa ? "انتقال به وضعیت…" : "Move to status…"}
      disabled={disabled || !keys.length || !columns.length}
      className="h-9 min-w-[172px]"
      items={columns.map((column) => ({ value: column.id, label: column.name }))}
      onValueChange={(value) => {
        const destination = columns.find((column) => column.id === value)
        setResetKey((current) => current + 1)
        if (destination) onRequest(keys, destination)
      }}
    />
  )
}
