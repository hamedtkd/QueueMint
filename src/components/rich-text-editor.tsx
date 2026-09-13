import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react"
import { Bold, Code2, Italic, Link, List, ListOrdered, Quote } from "lucide-react"

import { Button } from "@/components/ui/button"
import { editorHtmlToJiraWiki, jiraWikiToHtml } from "@/lib/jira-wiki-editor"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: number
  helpText?: string
}

type ToolState = {
  bold: boolean
  italic: boolean
  bullet: boolean
  numbered: boolean
  quote: boolean
  code: boolean
  link: boolean
}

const emptyState: ToolState = { bold: false, italic: false, bullet: false, numbered: false, quote: false, code: false, link: false }

function selectionElement(editor: HTMLElement) {
  const selection = document.getSelection()
  const node = selection?.anchorNode
  if (!node || !editor.contains(node)) return null
  return node instanceof HTMLElement ? node : node.parentElement
}

function queryState(command: string) {
  try { return document.queryCommandState(command) } catch { return false }
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")
}

export function RichTextEditor({ value, onChange, placeholder, className, minHeight = 170, helpText }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const lastEmitted = useRef<string | null>(null)
  const [active, setActive] = useState<ToolState>(emptyState)

  const refreshActiveState = useCallback(() => {
    const editor = ref.current
    if (!editor) return
    const element = selectionElement(editor)
    if (!element) { setActive(emptyState); return }
    setActive({
      bold: queryState("bold"),
      italic: queryState("italic"),
      bullet: queryState("insertUnorderedList"),
      numbered: queryState("insertOrderedList"),
      quote: Boolean(element.closest("blockquote")),
      code: Boolean(element.closest("code")),
      link: Boolean(element.closest("a")),
    })
  }, [])

  useEffect(() => {
    const editor = ref.current
    if (!editor || value === lastEmitted.current) return
    editor.innerHTML = jiraWikiToHtml(value)
    lastEmitted.current = value
  }, [value])

  useEffect(() => {
    document.addEventListener("selectionchange", refreshActiveState)
    return () => document.removeEventListener("selectionchange", refreshActiveState)
  }, [refreshActiveState])

  function syncFromEditor() {
    const editor = ref.current
    if (!editor) return
    const next = editorHtmlToJiraWiki(editor)
    lastEmitted.current = next
    onChange(next)
    window.requestAnimationFrame(refreshActiveState)
  }

  function runCommand(command: string, commandValue?: string) {
    ref.current?.focus()
    document.execCommand(command, false, commandValue)
    syncFromEditor()
  }

  function toggleCode() {
    const editor = ref.current
    if (!editor) return
    const current = selectionElement(editor)?.closest("code")
    if (current && editor.contains(current)) {
      current.replaceWith(...Array.from(current.childNodes))
      syncFromEditor()
      return
    }

    const selection = document.getSelection()
    if (!selection?.rangeCount) return
    const range = selection.getRangeAt(0)
    if (!editor.contains(range.commonAncestorContainer)) return
    const text = selection.toString() || "code"
    document.execCommand("insertHTML", false, `<code>${escapeHtml(text)}</code>`)
    syncFromEditor()
  }

  function toggleLink() {
    const editor = ref.current
    if (!editor) return
    const current = selectionElement(editor)?.closest("a")
    if (current && editor.contains(current)) { runCommand("unlink"); return }

    const selection = document.getSelection()
    if (!selection?.rangeCount) return
    const label = selection.toString() || "link"
    const href = window.prompt("Link URL", "https://")?.trim()
    if (!href || !/^https?:\/\//i.test(href)) return
    if (selection.isCollapsed) document.execCommand("insertHTML", false, `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`)
    else document.execCommand("createLink", false, href)
    syncFromEditor()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const mod = event.ctrlKey || event.metaKey
    if (!mod) return
    const key = event.key.toLowerCase()
    if (key === "b" && !event.shiftKey) { event.preventDefault(); runCommand("bold") }
    else if (key === "i" && !event.shiftKey) { event.preventDefault(); runCommand("italic") }
    else if (event.shiftKey && event.key === "7") { event.preventDefault(); runCommand("insertOrderedList") }
    else if (event.shiftKey && event.key === "8") { event.preventDefault(); runCommand("insertUnorderedList") }
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault()
    document.execCommand("insertText", false, event.clipboardData.getData("text/plain"))
    syncFromEditor()
  }

  function handleBlur() {
    const editor = ref.current
    if (editor && !editorHtmlToJiraWiki(editor)) editor.innerHTML = ""
    window.requestAnimationFrame(refreshActiveState)
  }

  const tools = [
    { id: "bold" as const, label: "Bold (Ctrl/Cmd+B)", icon: Bold, action: () => runCommand("bold") },
    { id: "italic" as const, label: "Italic (Ctrl/Cmd+I)", icon: Italic, action: () => runCommand("italic") },
    { id: "bullet" as const, label: "Bullet list", icon: List, action: () => runCommand("insertUnorderedList") },
    { id: "numbered" as const, label: "Numbered list", icon: ListOrdered, action: () => runCommand("insertOrderedList") },
    { id: "quote" as const, label: "Quote", icon: Quote, action: () => runCommand("formatBlock", active.quote ? "div" : "blockquote") },
    { id: "code" as const, label: "Inline code", icon: Code2, action: toggleCode },
    { id: "link" as const, label: active.link ? "Remove link" : "Add link", icon: Link, action: toggleLink },
  ]

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-background", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/35 p-1.5">
        {tools.map(({ id, label, icon: Icon, action }) => (
          <Button
            key={id}
            variant={active[id] ? "default" : "ghost"}
            size="icon-sm"
            onMouseDown={(event) => event.preventDefault()}
            onClick={action}
            aria-label={label}
            aria-pressed={active[id]}
            title={label}
          >
            <Icon className="size-4" />
          </Button>
        ))}
        {helpText ? <span className="ms-auto hidden px-2 text-[11px] text-muted-foreground sm:inline">{helpText}</span> : null}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder ?? ""}
        onInput={syncFromEditor}
        onKeyDown={handleKeyDown}
        onKeyUp={refreshActiveState}
        onMouseUp={refreshActiveState}
        onPaste={handlePaste}
        onBlur={handleBlur}
        onClick={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault() }}
        className="max-h-[420px] overflow-y-auto px-3 py-3 text-sm leading-7 outline-none empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_blockquote]:border-s-2 [&_blockquote]:ps-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:font-semibold [&_ol]:ms-6 [&_ol]:list-decimal [&_ul]:ms-6 [&_ul]:list-disc"
        style={{ minHeight }}
      />
    </div>
  )
}
