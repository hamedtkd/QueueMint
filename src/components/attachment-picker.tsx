import { useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { Paperclip, Plus, Trash2, UploadCloud } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface LocalAttachment {
  id: string
  file: File
  previewUrl?: string
}

interface AttachmentPickerProps {
  files: LocalAttachment[]
  onChange: (files: LocalAttachment[]) => void
  label: string
  helper: string
  addLabel: string
  dropLabel?: string
  dropActiveLabel?: string
  formatHint?: string
  className?: string
}

const MAX_FILES = 10
const MAX_FILE_BYTES = 12 * 1024 * 1024
const MAX_TOTAL_BYTES = 20 * 1024 * 1024
const FILE_HINT = "PNG, JPG, WEBP, PDF, WEBM, TXT, LOG, JSON · max 12 MB each"
const SUPPORTED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "video/webm",
  "text/plain",
  "application/json",
])
const SUPPORTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".pdf", ".webm", ".txt", ".log", ".json"]

function isSupportedFile(file: File) {
  const name = file.name.toLowerCase()
  return SUPPORTED_MIME.has(file.type.toLowerCase()) || SUPPORTED_EXTENSIONS.some((extension) => name.endsWith(extension))
}

function fileFingerprint(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`
}

export function AttachmentPicker({ files, onChange, label, helper, addLabel, dropLabel, dropActiveLabel, formatHint, className }: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dragDepthRef = useRef(0)
  const [dragActive, setDragActive] = useState(false)

  function appendFiles(list: FileList | File[]) {
    let remainingBytes = Math.max(0, MAX_TOTAL_BYTES - files.reduce((sum, item) => sum + item.file.size, 0))
    const existing = new Set(files.map((item) => fileFingerprint(item.file)))
    const accepted = Array.from(list).filter((file) => {
      if (!isSupportedFile(file) || existing.has(fileFingerprint(file))) return false
      if (file.size > MAX_FILE_BYTES || file.size > remainingBytes) return false
      remainingBytes -= file.size
      existing.add(fileFingerprint(file))
      return true
    }).slice(0, Math.max(0, MAX_FILES - files.length))
    const next = accepted.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }))
    if (next.length) onChange([...files, ...next])
  }

  function remove(id: string) {
    const target = files.find((item) => item.id === id)
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
    onChange(files.filter((item) => item.id !== id))
  }

  function beginDrag(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) return
    event.preventDefault()
    dragDepthRef.current += 1
    setDragActive(true)
  }

  function continueDrag(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }

  function endDrag(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) return
    event.preventDefault()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) setDragActive(false)
  }

  function dropFiles(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) return
    event.preventDefault()
    dragDepthRef.current = 0
    setDragActive(false)
    appendFiles(event.dataTransfer.files)
  }

  return (
    <div
      className={cn("space-y-3 rounded-xl transition-[background-color,border-color,box-shadow]", dragActive && "bg-primary/5 ring-2 ring-primary/25", className)}
      onDragEnter={beginDrag}
      onDragOver={continueDrag}
      onDragLeave={endDrag}
      onDrop={dropFiles}
    >
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="mt-1 text-xs leading-5 text-muted-foreground">{helper}</div>
      </div>

      {files.length ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {files.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-lg border bg-muted/30">
              <div className="aspect-[4/3] overflow-hidden bg-muted/40">
                {item.previewUrl ? (
                  <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground"><Paperclip className="size-5" /></div>
                )}
              </div>
              <div className="min-w-0 px-2 py-1.5">
                <div className="truncate text-[11px] font-medium">{item.file.name}</div>
                <div className="text-[10px] text-muted-foreground">{(item.file.size / 1024 / 1024).toFixed(1)} MB</div>
              </div>
              <Button
                variant="destructive"
                size="icon-sm"
                className="absolute end-1.5 top-1.5 size-7 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={() => remove(item.id)}
                aria-label={`Remove ${item.file.name}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        className={cn(
          "min-h-24 h-auto w-full cursor-pointer justify-start whitespace-normal border-dashed bg-muted/15 px-4 text-muted-foreground transition-colors hover:border-primary/45 hover:bg-primary/5 hover:text-foreground",
          dragActive && "border-primary bg-primary/10 text-foreground",
        )}
        data-drag-active={dragActive ? "true" : undefined}
        onClick={() => inputRef.current?.click()}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-background shadow-xs"><UploadCloud className="size-4" /></span>
        <span className="min-w-0 text-start">
          <span className="block font-medium text-foreground">{dragActive ? dropActiveLabel ?? "Drop to attach" : dropLabel ?? addLabel}</span>
          <span className="mt-0.5 block text-xs">{formatHint ?? FILE_HINT}</span>
        </span>
        <Plus className="ms-auto size-4 shrink-0" />
      </Button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        accept="image/png,image/jpeg,image/webp,application/pdf,video/webm,text/plain,application/json,.log"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          if (event.target.files) appendFiles(event.target.files)
          event.target.value = ""
        }}
      />
    </div>
  )
}
