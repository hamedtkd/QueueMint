function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function inlineToHtml(value: string) {
  const pattern = /(\{\{[^}\n]*\}\}|\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_|\[[^|\]\n]+\|https?:\/\/[^\]\n]+\])/g
  let html = ""
  let cursor = 0

  for (const match of value.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > cursor) html += escapeHtml(value.slice(cursor, index))
    const token = match[0]
    if (token.startsWith("{{")) html += `<code>${escapeHtml(token.slice(2, -2))}</code>`
    else if (token.startsWith("**") || token.startsWith("__")) html += `<strong>${escapeHtml(token.slice(2, -2))}</strong>`
    else if (token.startsWith("*")) html += `<strong>${escapeHtml(token.slice(1, -1))}</strong>`
    else if (token.startsWith("_")) html += `<em>${escapeHtml(token.slice(1, -1))}</em>`
    else {
      const [label, href] = token.slice(1, -1).split("|")
      html += `<a href="${escapeHtml(href)}">${escapeHtml(label || href)}</a>`
    }
    cursor = index + token.length
  }

  if (cursor < value.length) html += escapeHtml(value.slice(cursor))
  return html || "<br>"
}

export function jiraWikiToHtml(value: string) {
  if (!value.trim()) return ""
  const lines = value.replaceAll("\r\n", "\n").split("\n")
  const blocks: string[] = []

  for (let index = 0; index < lines.length;) {
    const line = lines[index]
    if (!line.trim()) {
      blocks.push("<div><br></div>")
      index += 1
      continue
    }

    const heading = /^h([1-6])\.\s+(.+)$/.exec(line)
    if (heading) {
      blocks.push(`<h${heading[1]}>${inlineToHtml(heading[2])}</h${heading[1]}>`)
      index += 1
      continue
    }

    if (line.startsWith("* ") || line.startsWith("# ")) {
      const ordered = line.startsWith("# ")
      const marker = ordered ? "# " : "* "
      const tag = ordered ? "ol" : "ul"
      const items: string[] = []
      while (index < lines.length && lines[index].startsWith(marker)) {
        items.push(`<li>${inlineToHtml(lines[index].slice(2))}</li>`)
        index += 1
      }
      blocks.push(`<${tag}>${items.join("")}</${tag}>`)
      continue
    }

    if (line.startsWith("bq. ")) {
      blocks.push(`<blockquote>${inlineToHtml(line.slice(4))}</blockquote>`)
      index += 1
      continue
    }

    blocks.push(`<div>${inlineToHtml(line)}</div>`)
    index += 1
  }

  return blocks.join("")
}

function textValue(node: Node) {
  return (node.textContent ?? "").replaceAll("\u00a0", " ")
}

function serializeInline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return textValue(node)
  if (!(node instanceof HTMLElement)) return ""

  const tag = node.tagName.toLowerCase()
  if (tag === "br") return "\n"
  if (tag === "strong" || tag === "b") return `*${serializeChildren(node)}*`
  if (tag === "em" || tag === "i") return `_${serializeChildren(node)}_`
  if (tag === "code") return `{{${textValue(node)}}}`
  if (tag === "a") {
    const href = node.getAttribute("href") ?? ""
    const label = serializeChildren(node).replaceAll("\n", " ") || href
    return /^https?:\/\//i.test(href) ? `[${label}|${href}]` : label
  }
  if (tag === "div" || tag === "p") return serializeChildren(node)
  return serializeChildren(node)
}

function serializeChildren(node: Node) {
  return Array.from(node.childNodes).map(serializeInline).join("")
}

function serializeList(node: HTMLElement, marker: string) {
  return Array.from(node.children)
    .filter((child) => child.tagName.toLowerCase() === "li")
    .map((child) => `${marker} ${serializeChildren(child).replaceAll("\n", " ").trimEnd()}`)
}

function serializeBlock(node: Node): string[] {
  if (node.nodeType === Node.TEXT_NODE) return textValue(node).trim() ? [textValue(node)] : []
  if (!(node instanceof HTMLElement)) return []
  const tag = node.tagName.toLowerCase()

  if (tag === "ul") return serializeList(node, "*")
  if (tag === "ol") return serializeList(node, "#")
  if (tag === "blockquote") return [`bq. ${serializeChildren(node).replaceAll("\n", " ").trimEnd()}`]
  if (/^h[1-6]$/.test(tag)) return [`${tag}. ${serializeChildren(node).replaceAll("\n", " ").trimEnd()}`]
  if (tag === "pre") return [`{code}\n${textValue(node)}\n{code}`]
  if (tag === "br") return [""]

  const content = serializeChildren(node)
  return content.split("\n")
}

export function editorHtmlToJiraWiki(root: HTMLElement) {
  const lines = Array.from(root.childNodes).flatMap(serializeBlock)
  while (lines.length && !lines[0].trim()) lines.shift()
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop()
  return lines.join("\n").replace(/\n{3,}/g, "\n\n")
}
