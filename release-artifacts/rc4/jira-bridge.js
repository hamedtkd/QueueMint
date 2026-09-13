(() => {
  const BRIDGE_GUARD = "__QUEUEMINT_JIRA_BRIDGE_V2__"
  if (globalThis[BRIDGE_GUARD]) return
  globalThis[BRIDGE_GUARD] = true

  const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "DELETE"])

  function safeRestUrl(path) {
    if (typeof path !== "string" || path.length > 2000 || !path.startsWith("/rest/")) return null
    if (path.includes("\\") || path.includes("\0")) return null
    try {
      const url = new URL(path, window.location.origin)
      if (url.origin !== window.location.origin || !url.pathname.startsWith("/rest/")) return null
      return url
    } catch {
      return null
    }
  }

  function safeSameOriginAssetUrl(value) {
    if (typeof value !== "string" || value.length > 4096) return null
    try {
      const url = new URL(value, window.location.origin)
      if (url.origin !== window.location.origin || (url.protocol !== "https:" && url.protocol !== "http:")) return null
      return url
    } catch {
      return null
    }
  }

  async function readAvatarResponse(response) {
    if (response.redirected || /login\.jsp|login\.action/i.test(response.url)) {
      return { ok: false, status: 401, error: { code: "AUTH_REQUIRED", message: "Your Jira session is not authenticated. Sign in to Jira and retry." } }
    }
    if (!response.ok) return { ok: false, status: response.status, error: { code: `JIRA_${response.status}`, message: `Jira avatar request failed with HTTP ${response.status}.` } }
    const contentType = response.headers.get("content-type") ?? ""
    if (!contentType.toLowerCase().startsWith("image/")) return { ok: false, status: 415, error: { code: "INVALID_AVATAR_RESPONSE", message: "Jira did not return an image for this avatar." } }
    const buffer = await response.arrayBuffer()
    if (buffer.byteLength > 1536 * 1024) return { ok: false, status: 413, error: { code: "AVATAR_TOO_LARGE", message: "Jira avatar image is too large." } }
    const bytes = new Uint8Array(buffer)
    let binary = ""
    for (let offset = 0; offset < bytes.length; offset += 8192) {
      binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 8192, bytes.length)))
    }
    return { ok: true, status: response.status, data: { dataUrl: `data:${contentType};base64,${btoa(binary)}` } }
  }

  function isSafeIssueKey(value) {
    return typeof value === "string" && /^[A-Z][A-Z0-9_]*-\d+$/i.test(value)
  }

  async function readResponse(response) {
    const contentType = response.headers.get("content-type") ?? ""
    const text = await response.text()
    if (response.redirected || /login\.jsp|login\.action/i.test(response.url)) {
      return { ok: false, status: 401, error: { code: "AUTH_REQUIRED", message: "Your Jira session is not authenticated. Sign in to Jira and retry." } }
    }
    let data = null
    if (text) {
      if (contentType.includes("application/json") || text.trim().startsWith("{") || text.trim().startsWith("[")) {
        try { data = JSON.parse(text) } catch { data = text }
      } else data = text
    }
    if (!response.ok) {
      const jiraMessage = data && typeof data === "object"
        ? [
            ...(Array.isArray(data.errorMessages) ? data.errorMessages : []),
            ...Object.entries(data.errors ?? {}).map(([field, message]) => `${field}: ${message}`),
          ].filter(Boolean).join(" • ")
        : ""
      return { ok: false, status: response.status, data, error: { code: `JIRA_${response.status}`, message: jiraMessage || `Jira request failed with HTTP ${response.status}.` } }
    }
    return { ok: true, status: response.status, data }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || sender.id !== chrome.runtime.id) return undefined

    if (message.type === "QUEUEMINT_JIRA_PING" || message.type === "QUEUEMINT_JIRA_PING_V2") {
      sendResponse({ ok: true, bridgeVersion: 2, origin: window.location.origin, url: window.location.href, title: document.title })
      return false
    }

    if (message.type === "QUEUEMINT_JIRA_FETCH") {
      const request = message.request ?? {}
      const method = String(request.method ?? "GET").toUpperCase()
      const url = safeRestUrl(request.path)
      if (!url || !ALLOWED_METHODS.has(method)) {
        sendResponse({ ok: false, error: { code: "INVALID_REQUEST", message: "Blocked unsafe Jira REST request." } })
        return false
      }
      const init = {
        method,
        credentials: "include",
        redirect: "follow",
        headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
      }
      if (method !== "GET" && request.body !== null && request.body !== undefined) {
        init.headers["Content-Type"] = "application/json"
        init.body = JSON.stringify(request.body)
      }
      fetch(url.toString(), init)
        .then(readResponse)
        .then(sendResponse)
        .catch((error) => sendResponse({ ok: false, error: { code: "NETWORK_ERROR", message: error instanceof Error ? error.message : "Unable to reach Jira." } }))
      return true
    }

    if (message.type === "QUEUEMINT_JIRA_FETCH_AVATAR") {
      const url = safeSameOriginAssetUrl(message.url)
      if (!url) {
        sendResponse({ ok: false, error: { code: "INVALID_AVATAR_URL", message: "Blocked unsafe Jira avatar URL." } })
        return false
      }
      fetch(url.toString(), {
        method: "GET",
        credentials: "include",
        redirect: "follow",
        headers: { Accept: "image/*", "X-Requested-With": "XMLHttpRequest" },
      })
        .then(readAvatarResponse)
        .then(sendResponse)
        .catch((error) => sendResponse({ ok: false, error: { code: "NETWORK_ERROR", message: error instanceof Error ? error.message : "Unable to load Jira avatar." } }))
      return true
    }

    if (message.type === "QUEUEMINT_JIRA_UPLOAD_ATTACHMENTS") {
      const request = message.request ?? {}
      if (!isSafeIssueKey(request.issueKey) || !Array.isArray(request.attachments) || request.attachments.length === 0) {
        sendResponse({ ok: false, error: { code: "INVALID_ATTACHMENT_REQUEST", message: "Blocked unsafe attachment upload." } })
        return false
      }
      const url = safeRestUrl(`/rest/api/2/issue/${encodeURIComponent(request.issueKey)}/attachments`)
      if (!url) {
        sendResponse({ ok: false, error: { code: "INVALID_ATTACHMENT_URL", message: "Blocked unsafe attachment URL." } })
        return false
      }
      try {
        const form = new FormData()
        for (const item of request.attachments) {
          const binary = atob(item.base64)
          const bytes = new Uint8Array(binary.length)
          for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
          const blob = new Blob([bytes], { type: item.type || "application/octet-stream" })
          form.append("file", blob, item.name)
        }
        fetch(url.toString(), {
          method: "POST",
          credentials: "include",
          redirect: "follow",
          headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest", "X-Atlassian-Token": "no-check" },
          body: form,
        })
          .then(readResponse)
          .then(sendResponse)
          .catch((error) => sendResponse({ ok: false, error: { code: "NETWORK_ERROR", message: error instanceof Error ? error.message : "Unable to upload Jira attachment." } }))
      } catch (error) {
        sendResponse({ ok: false, error: { code: "ATTACHMENT_ENCODING_ERROR", message: error instanceof Error ? error.message : "Unable to prepare Jira attachment." } })
      }
      return true
    }

    return undefined
  })
})()
