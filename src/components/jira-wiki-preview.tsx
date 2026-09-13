import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

function inlineNodes(value: string): ReactNode[] {
  const pattern = /(\{\{[^}\n]+\}\}|\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_|\[[^|\]\n]+\|https?:\/\/[^\]\n]+\])/g
  const nodes: ReactNode[] = []
  let cursor = 0
  for (const match of value.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > cursor) nodes.push(value.slice(cursor, index))
    const token = match[0]
    if (token.startsWith("{{")) nodes.push(<code key={`${index}-${token}`} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">{token.slice(2, -2)}</code>)
    else if (token.startsWith("**") || token.startsWith("__")) nodes.push(<strong key={`${index}-${token}`}>{token.slice(2, -2)}</strong>)
    else if (token.startsWith("*")) nodes.push(<strong key={`${index}-${token}`}>{token.slice(1, -1)}</strong>)
    else if (token.startsWith("_")) nodes.push(<em key={`${index}-${token}`}>{token.slice(1, -1)}</em>)
    else {
      const [label, href] = token.slice(1, -1).split("|")
      nodes.push(<span key={`${index}-${token}`} className="font-medium text-primary underline underline-offset-2">{label || href}</span>)
    }
    cursor = index + token.length
  }
  if (cursor < value.length) nodes.push(value.slice(cursor))
  return nodes
}

export function JiraWikiPreview({ value, className }: { value: string; className?: string }) {
  const lines = value.split("\n")
  let orderedIndex = 0
  return (
    <div className={cn("space-y-1.5 text-sm leading-6 text-foreground", className)}>
      {lines.map((line, index) => {
        if (!line.trim()) { orderedIndex = 0; return <div key={index} className="h-2" aria-hidden="true" /> }
        const heading = /^h([1-6])\.\s+(.+)$/.exec(line)
        if (heading) { orderedIndex = 0; return <div key={index} className={cn("font-semibold", heading[1] === "1" ? "text-lg" : heading[1] === "2" ? "text-base" : "text-sm")}>{inlineNodes(heading[2])}</div> }
        if (line.startsWith("* ")) { orderedIndex = 0; return <div key={index} className="flex gap-2"><span className="select-none text-muted-foreground">•</span><span>{inlineNodes(line.slice(2))}</span></div> }
        if (line.startsWith("# ")) { orderedIndex += 1; return <div key={index} className="flex gap-2"><span className="min-w-5 select-none text-end text-muted-foreground">{orderedIndex}.</span><span>{inlineNodes(line.slice(2))}</span></div> }
        orderedIndex = 0
        if (line.startsWith("bq. ")) return <blockquote key={index} className="border-s-2 ps-3 italic text-muted-foreground">{inlineNodes(line.slice(4))}</blockquote>
        return <div key={index}>{inlineNodes(line)}</div>
      })}
    </div>
  )
}
