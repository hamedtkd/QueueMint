import type { JiraBoardColumn } from "@/types"
import { sendJiraRequest } from "./request"

type BoardColumnConfig = {
  name?: string
  statuses?: Array<{ id?: string }>
}

type BoardConfiguration = {
  columnConfig?: { columns?: BoardColumnConfig[] }
  columns?: BoardColumnConfig[]
}

export async function getJiraBoardColumns(boardId: number): Promise<JiraBoardColumn[]> {
  if (!Number.isInteger(boardId) || boardId <= 0) return []
  const config = await sendJiraRequest<BoardConfiguration>(`/rest/agile/1.0/board/${encodeURIComponent(String(boardId))}/configuration`)
  const source = config?.columnConfig?.columns ?? config?.columns ?? []
  return source.flatMap((column, index) => {
    const name = column.name?.trim()
    if (!name) return []
    const statusIds = (column.statuses ?? []).map((status) => status.id?.trim()).filter((value): value is string => Boolean(value))
    return [{ id: `${index}:${name}`, name, statusIds }]
  })
}
