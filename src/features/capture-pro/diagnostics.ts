import type { QueueMintPageDiagnostics } from "./types"

const MAX_ERRORS = 30
const MAX_NETWORK = 50
const MAX_DIAGNOSTIC_URL_LENGTH = 600
const MAX_DIAGNOSTIC_MESSAGE_LENGTH = 1200
const COLLECTOR_KEY = "__QUEUEMINT_DIAGNOSTICS_V3__"
const MESSAGE_TYPE = "__QUEUEMINT_DIAGNOSTIC_EVENT_V1__"

export function sanitizeDiagnosticUrl(value: string) {
  const input = value.trim()
  if (!input) return ""
  if (input.startsWith("data:")) return "data:[redacted]"
  try {
    const url = new URL(input)
    if (url.protocol === "http:" || url.protocol === "https:") {
      return `${url.origin}${url.pathname}`.slice(0, MAX_DIAGNOSTIC_URL_LENGTH)
    }
    if (url.protocol === "blob:") return `blob:${url.origin}/[redacted]`
    return `${url.protocol}[redacted]`
  } catch {
    return input.split(/[?#]/, 1)[0].slice(0, MAX_DIAGNOSTIC_URL_LENGTH)
  }
}

export function sanitizeDiagnosticText(value: string) {
  return value
    .slice(0, MAX_DIAGNOSTIC_MESSAGE_LENGTH)
    .replace(/https?:\/\/[^\s<>"']+/gi, (match) => sanitizeDiagnosticUrl(match))
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, "Bearer [redacted]")
    .replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, "sk-[redacted]")
    .replace(/\bgh[opsu]_[A-Za-z0-9]{12,}\b/g, "github-token-[redacted]")
    .replace(/\b(api[_-]?key|access[_-]?token|refresh[_-]?token|token|secret|password|signature|sig|authorization)\s*[:=]\s*([^\s,;]+)/gi, "$1=[redacted]")
}

function makeNonce() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export async function installPageDiagnostics(tabId: number) {
  if (!chrome.scripting?.executeScript) return
  const nonce = makeNonce()
  try {
    const initialized = await chrome.scripting.executeScript({
      target: { tabId },
      func: (collectorKey: string, messageType: string, channelNonce: string) => {
        const root = window as unknown as Record<string, unknown>
        if (root[collectorKey]) return false
        const state = { startedAt: new Date().toISOString(), errors: [] as Array<Record<string, unknown>> }
        const sanitizeUrl = (value: string) => {
          const input = value.trim()
          if (!input) return ""
          if (input.startsWith("data:")) return "data:[redacted]"
          try {
            const url = new URL(input)
            if (url.protocol === "http:" || url.protocol === "https:") return `${url.origin}${url.pathname}`.slice(0, 600)
            if (url.protocol === "blob:") return `blob:${url.origin}/[redacted]`
            return `${url.protocol}[redacted]`
          } catch {
            return input.split(/[?#]/, 1)[0].slice(0, 600)
          }
        }
        const sanitizeText = (value: string) => value
          .slice(0, 1200)
          .replace(/https?:\/\/[^\s<>"']+/gi, (match) => sanitizeUrl(match))
          .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, "Bearer [redacted]")
          .replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, "sk-[redacted]")
          .replace(/\bgh[opsu]_[A-Za-z0-9]{12,}\b/g, "github-token-[redacted]")
          .replace(/\b(api[_-]?key|access[_-]?token|refresh[_-]?token|token|secret|password|signature|sig|authorization)\s*[:=]\s*([^\s,;]+)/gi, "$1=[redacted]")
        const push = (raw: Record<string, unknown>) => {
          const kind = raw.kind === "runtime" || raw.kind === "resource" || raw.kind === "promise" ? raw.kind : null
          if (!kind) return
          const source = typeof raw.source === "string" ? sanitizeUrl(raw.source) : undefined
          const line = typeof raw.line === "number" && Number.isFinite(raw.line) ? raw.line : undefined
          const column = typeof raw.column === "number" && Number.isFinite(raw.column) ? raw.column : undefined
          state.errors.push({
            kind,
            message: sanitizeText(typeof raw.message === "string" ? raw.message : "Runtime error"),
            source,
            line,
            column,
            capturedAt: typeof raw.capturedAt === "string" ? raw.capturedAt : new Date().toISOString(),
          })
          if (state.errors.length > 60) state.errors.splice(0, state.errors.length - 60)
        }
        window.addEventListener("message", (event) => {
          if (event.source !== window) return
          const payload = event.data as { type?: unknown; nonce?: unknown; entry?: unknown } | null
          if (!payload || payload.type !== messageType || payload.nonce !== channelNonce || !payload.entry || typeof payload.entry !== "object") return
          push(payload.entry as Record<string, unknown>)
        })
        root[collectorKey] = state
        return true
      },
      args: [COLLECTOR_KEY, MESSAGE_TYPE, nonce],
    })
    if (!initialized[0]?.result) return

    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: (messageType: string, channelNonce: string) => {
          const send = (entry: Record<string, unknown>) => {
            window.postMessage({ type: messageType, nonce: channelNonce, entry }, "*")
          }
          window.addEventListener("error", (event) => {
            const target = event.target
            if (target instanceof HTMLImageElement || target instanceof HTMLScriptElement || target instanceof HTMLLinkElement || target instanceof HTMLMediaElement) {
              let source = ""
              if (target instanceof HTMLLinkElement) source = target.href
              else if (target instanceof HTMLScriptElement) source = target.src
              else source = target.currentSrc || target.src || ""
              send({ kind: "resource", message: "Resource failed to load", source, capturedAt: new Date().toISOString() })
              return
            }
            send({
              kind: "runtime",
              message: event.message || "Runtime error",
              source: event.filename || "",
              line: event.lineno || undefined,
              column: event.colno || undefined,
              capturedAt: new Date().toISOString(),
            })
          }, true)
          window.addEventListener("unhandledrejection", (event) => {
            const reason = event.reason instanceof Error ? event.reason.message : String(event.reason ?? "Unhandled promise rejection")
            send({ kind: "promise", message: reason, capturedAt: new Date().toISOString() })
          })
        },
        args: [MESSAGE_TYPE, nonce],
      })
    } catch {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (collectorKey: string) => {
          const root = window as unknown as Record<string, unknown>
          delete root[collectorKey]
        },
        args: [COLLECTOR_KEY],
      }).catch(() => undefined)
      throw new Error("Could not install main-world diagnostics")
    }
  } catch {
    // Restricted pages can reject injection. Capture still works without diagnostics.
  }
}

export async function collectPageDiagnostics(tabId: number): Promise<QueueMintPageDiagnostics | null> {
  if (!chrome.scripting?.executeScript) return null
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: (collectorKey: string) => {
        const root = window as unknown as Record<string, unknown>
        const state = root[collectorKey] as { startedAt?: string; errors?: Array<Record<string, unknown>> } | undefined
        const sanitizeUrl = (value: string) => {
          const input = value.trim()
          if (!input) return ""
          if (input.startsWith("data:")) return "data:[redacted]"
          try {
            const url = new URL(input)
            if (url.protocol === "http:" || url.protocol === "https:") return `${url.origin}${url.pathname}`.slice(0, 600)
            if (url.protocol === "blob:") return `blob:${url.origin}/[redacted]`
            return `${url.protocol}[redacted]`
          } catch {
            return input.split(/[?#]/, 1)[0].slice(0, 600)
          }
        }
        const resources = performance.getEntriesByType("resource").slice(-80).map((entry) => {
          const resource = entry as PerformanceResourceTiming & { responseStatus?: number }
          return {
            name: sanitizeUrl(resource.name),
            initiatorType: resource.initiatorType || "resource",
            durationMs: Math.round(resource.duration),
            transferSize: resource.transferSize || undefined,
            responseStatus: typeof resource.responseStatus === "number" && resource.responseStatus > 0 ? resource.responseStatus : undefined,
          }
        })
        const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
        return {
          collectedAt: new Date().toISOString(),
          collectorStartedAt: state?.startedAt,
          errors: state?.errors ?? [],
          network: resources,
          navigation: navigation ? {
            type: navigation.type,
            domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
            loadMs: Math.round(navigation.loadEventEnd),
            transferSize: navigation.transferSize || undefined,
          } : undefined,
        }
      },
      args: [COLLECTOR_KEY],
    })
    const value = results[0]?.result as QueueMintPageDiagnostics | undefined
    if (!value) return null
    return {
      ...value,
      errors: value.errors.slice(-MAX_ERRORS).map((item) => {
        const source = item.source ? sanitizeDiagnosticUrl(item.source) : undefined
        return {
          ...item,
          source,
          message: item.kind === "resource" && source
            ? `Resource failed to load: ${source}`
            : sanitizeDiagnosticText(item.message),
        }
      }),
      network: value.network.slice(-MAX_NETWORK).map((item) => ({
        ...item,
        name: sanitizeDiagnosticUrl(item.name),
      })),
    }
  } catch {
    return null
  }
}

export function diagnosticsSummary(value: QueueMintPageDiagnostics | null) {
  if (!value) return { errors: 0, failedRequests: 0, requests: 0 }
  return {
    errors: value.errors.length,
    failedRequests: value.network.filter((item) => typeof item.responseStatus === "number" && item.responseStatus >= 400).length,
    requests: value.network.length,
  }
}

export function formatDiagnosticsText(value: QueueMintPageDiagnostics) {
  const rows: string[] = ["QueueMint diagnostics", `Collected: ${new Date(value.collectedAt).toLocaleString()}`]
  if (value.navigation) {
    rows.push(`Navigation: ${value.navigation.type ?? "navigate"}, DOM ${value.navigation.domContentLoadedMs ?? "?"}ms, load ${value.navigation.loadMs ?? "?"}ms`)
  }
  if (value.errors.length) {
    rows.push("", `Runtime/resource errors (${value.errors.length}):`)
    for (const item of value.errors.slice(-12)) {
      const source = item.source ? sanitizeDiagnosticUrl(item.source) : ""
      rows.push(`- [${item.kind}] ${sanitizeDiagnosticText(item.message)}${source ? ` (${source})` : ""}`)
    }
  }
  const failed = value.network.filter((item) => typeof item.responseStatus === "number" && item.responseStatus >= 400)
  if (failed.length) {
    rows.push("", `Failed network entries (${failed.length}):`)
    for (const item of failed.slice(-12)) rows.push(`- ${item.responseStatus} ${item.initiatorType}: ${sanitizeDiagnosticUrl(item.name)}`)
  } else {
    rows.push("", `Recent network entries captured: ${value.network.length}`)
  }
  return rows.join("\n")
}
