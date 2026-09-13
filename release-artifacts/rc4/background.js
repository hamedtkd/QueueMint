importScripts("background-commands.js")
const CONNECTION_KEY = "queuemint-jira-connection-v1"
const CANDIDATE_KEY = "queuemint-jira-last-candidate-v1"
const LEGACY_CONNECTION_KEY = "raadco-jira-connection-v1"
const LEGACY_CANDIDATE_KEY = "raadco-jira-last-candidate-v1"
const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "DELETE"])
chrome.action.onClicked.addListener(async (tab) => {
  if (typeof tab?.id === "number" && typeof tab.url === "string" && /^https?:\/\//i.test(tab.url)) {
    await chrome.storage.local.set({
      [CANDIDATE_KEY]: { tabId: tab.id, url: tab.url, title: tab.title ?? "" },
    })
    try { await chrome.runtime.sendMessage({ type: "QUEUEMINT_JIRA_CANDIDATE_CHANGED" }) } catch { /* options page may not be open */ }
  }
  await chrome.runtime.openOptionsPage()
})
function normalizeOrigin(value) {
  if (typeof value !== "string" || value.length > 2048) return null
  try {
    const url = new URL(value)
    if (url.protocol !== "https:" && url.protocol !== "http:") return null
    return url.origin
  } catch {
    return null
  }
}
function hostPermissionPattern(origin) {
  const url = new URL(origin)
  return `${url.protocol}//${url.hostname}/*`
}
async function loadConnection() {
  const stored = await chrome.storage.local.get([CONNECTION_KEY, LEGACY_CONNECTION_KEY])
  let value = stored?.[CONNECTION_KEY]
  if (!value && stored?.[LEGACY_CONNECTION_KEY]) {
    value = stored[LEGACY_CONNECTION_KEY]
    await chrome.storage.local.set({ [CONNECTION_KEY]: value })
  }
  const origin = normalizeOrigin(value?.origin)
  if (!origin) return null
  return { origin, tabId: Number.isInteger(value?.tabId) ? value.tabId : null }
}
async function saveConnection(connection) {
  await chrome.storage.local.set({ [CONNECTION_KEY]: connection })
}
function isSafeRestPath(path, origin) {
  if (typeof path !== "string" || path.length > 2000) return false
  if (!path.startsWith("/rest/")) return false
  if (path.includes("\\") || path.includes("\0")) return false
  try {
    const url = new URL(path, origin)
    return url.origin === origin && url.pathname.startsWith("/rest/")
  } catch {
    return false
  }
}
function isSafeSameOriginAssetUrl(value, origin) {
  if (typeof value !== "string" || value.length > 4096) return false
  try {
    const url = new URL(value, origin)
    return url.origin === origin && (url.protocol === "https:" || url.protocol === "http:")
  } catch {
    return false
  }
}
function isSafeIssueKey(value) {
  return typeof value === "string" && /^[A-Z][A-Z0-9_]*-\d+$/i.test(value)
}
function validateAttachments(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 10) return false
  let totalBase64Length = 0
  for (const item of value) {
    if (!item || typeof item !== "object") return false
    if (typeof item.name !== "string" || !item.name || item.name.length > 255) return false
    if (typeof item.type !== "string" || item.type.length > 120) return false
    if (typeof item.base64 !== "string" || !item.base64) return false
    totalBase64Length += item.base64.length
  }
  return totalBase64Length <= 32 * 1024 * 1024
}
async function findJiraTabs(origin) {
  const tabs = await chrome.tabs.query({ url: hostPermissionPattern(origin) })
  return tabs
    .filter((tab) => typeof tab.id === "number" && normalizeOrigin(tab.url) === origin)
    .sort((a, b) => {
      if (Boolean(a.active) !== Boolean(b.active)) return a.active ? -1 : 1
      return (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0)
    })
}
function summarizeTab(tab) {
  return {
    id: tab.id,
    title: tab.title ?? "Jira",
    url: tab.url ?? "",
    active: Boolean(tab.active),
    lastAccessed: tab.lastAccessed ?? 0,
  }
}
function parseTabContext(urlValue) {
  try {
    const url = new URL(urlValue)
    const selectedIssue = url.searchParams.get("selectedIssue") || url.searchParams.get("issueKey") || ""
    const browse = /\/browse\/([A-Z][A-Z0-9_]*)-(\d+)/i.exec(url.pathname)
    const projectPath = /\/(?:projects?|plugins\/servlet\/project-config)\/([A-Z][A-Z0-9_]*)/i.exec(url.pathname)
    const issueKey = browse ? `${browse[1].toUpperCase()}-${browse[2]}` : (/^[A-Z][A-Z0-9_]*-\d+$/i.test(selectedIssue) ? selectedIssue.toUpperCase() : undefined)
    const issueProject = issueKey?.split("-")[0]
    const projectKey = (url.searchParams.get("projectKey") || issueProject || projectPath?.[1] || "").toUpperCase() || undefined
    const rapidView = Number(url.searchParams.get("rapidView") || url.searchParams.get("rapidViewId") || "")
    const boardId = Number.isInteger(rapidView) && rapidView > 0 ? rapidView : undefined
    return { projectKey, boardId, issueKey, url: url.toString() }
  } catch {
    return { url: String(urlValue ?? "") }
  }
}
async function ensureBridge(tabId) {
  try {
    const ping = await chrome.tabs.sendMessage(tabId, { type: "QUEUEMINT_JIRA_PING_V2" })
    if (ping?.ok) return true
  } catch {
    // Inject below.
  }
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["jira-bridge.js"] })
    const ping = await chrome.tabs.sendMessage(tabId, { type: "QUEUEMINT_JIRA_PING_V2" })
    return ping?.ok === true
  } catch {
    return false
  }
}
async function resolveJiraTab(connection) {
  const tabs = await findJiraTabs(connection.origin)
  if (!tabs.length) return { tab: null, tabs }
  const storedCandidate = await chrome.storage.local.get([CANDIDATE_KEY, LEGACY_CANDIDATE_KEY])
  const candidate = storedCandidate?.[CANDIDATE_KEY] ?? storedCandidate?.[LEGACY_CANDIDATE_KEY]
  const candidateOrigin = normalizeOrigin(candidate?.url)
  const fromAction = candidateOrigin === connection.origin
    ? tabs.find((tab) => tab.id === candidate?.tabId)
    : null
  const requested = tabs.find((tab) => tab.id === connection.tabId)
  const tab = fromAction ?? requested ?? tabs[0]
  if (tab?.id !== connection.tabId) await saveConnection({ ...connection, tabId: tab.id })
  return { tab, tabs }
}
async function connectionStatus() {
  const candidateStored = await chrome.storage.local.get([CANDIDATE_KEY, LEGACY_CANDIDATE_KEY])
  const candidate = candidateStored?.[CANDIDATE_KEY] ?? candidateStored?.[LEGACY_CANDIDATE_KEY] ?? null
  if (!candidateStored?.[CANDIDATE_KEY] && candidate) await chrome.storage.local.set({ [CANDIDATE_KEY]: candidate })
  const connection = await loadConnection()
  if (!connection) {
    return { configured: false, candidate, tabs: [] }
  }
  const { tab, tabs } = await resolveJiraTab(connection)
  return {
    configured: true,
    origin: connection.origin,
    selectedTabId: tab?.id ?? null,
    selectedTab: tab ? summarizeTab(tab) : null,
    tabs: tabs.map(summarizeTab),
    context: tab?.url ? parseTabContext(tab.url) : null,
    candidate,
  }
}
async function forwardToJiraTab(message) {
  const connection = await loadConnection()
  if (!connection) {
    return { ok: false, error: { code: "JIRA_NOT_CONFIGURED", message: "Connect a Jira site first." } }
  }
  const { tab, tabs } = await resolveJiraTab(connection)
  if (!tab?.id) {
    return {
      ok: false,
      error: {
        code: "NO_JIRA_TAB",
        message: `Open ${connection.origin} in a tab and sign in, then retry.`,
      },
      meta: { tabCount: tabs.length },
    }
  }
  if (!(await ensureBridge(tab.id))) {
    return {
      ok: false,
      error: {
        code: "BRIDGE_UNAVAILABLE",
        message: "The Jira tab could not be connected. Reload that Jira tab, then retry.",
      },
    }
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, message)
    return { ...response, meta: { ...(response?.meta ?? {}), tabId: tab.id, tabCount: tabs.length, tabTitle: tab.title ?? "Jira" } }
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "BRIDGE_UNAVAILABLE",
        message: error instanceof Error ? error.message : "Jira bridge is not available. Reload the Jira tab and retry.",
      },
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || sender.id !== chrome.runtime.id) return undefined

  if (message.type === "QUEUEMINT_SET_ACTIVE_CANDIDATE") {
    const candidate = message.candidate ?? {}
    const origin = normalizeOrigin(candidate.url)
    if (!origin || !Number.isInteger(candidate.tabId)) {
      sendResponse({ ok: false, error: { code: "INVALID_CANDIDATE", message: "Invalid active tab candidate." } })
      return false
    }
    chrome.storage.local.set({
      [CANDIDATE_KEY]: { tabId: candidate.tabId, url: candidate.url, title: typeof candidate.title === "string" ? candidate.title : "" },
    }).then(() => sendResponse({ ok: true }))
    return true
  }

  if (message.type === "QUEUEMINT_JIRA_GET_STATUS") {
    connectionStatus().then(sendResponse)
    return true
  }

  if (message.type === "QUEUEMINT_JIRA_CONFIGURE") {
    const origin = normalizeOrigin(message.origin)
    if (!origin) {
      sendResponse({ ok: false, error: { code: "INVALID_ORIGIN", message: "Enter a valid Jira URL." } })
      return false
    }
    chrome.permissions.contains({ origins: [hostPermissionPattern(origin)] }).then(async (allowed) => {
      if (!allowed) return { ok: false, error: { code: "HOST_PERMISSION_REQUIRED", message: "Jira site permission has not been granted." } }
      await saveConnection({ origin, tabId: Number.isInteger(message.tabId) ? message.tabId : null })
      return { ok: true, status: await connectionStatus() }
    }).then(sendResponse)
    return true
  }

  if (message.type === "QUEUEMINT_JIRA_SELECT_TAB") {
    loadConnection().then(async (connection) => {
      if (!connection) return { ok: false, error: { code: "JIRA_NOT_CONFIGURED", message: "Connect Jira first." } }
      const tabs = await findJiraTabs(connection.origin)
      const tab = tabs.find((candidate) => candidate.id === message.tabId)
      if (!tab?.id) return { ok: false, error: { code: "TAB_NOT_FOUND", message: "That Jira tab is no longer open." } }
      await saveConnection({ ...connection, tabId: tab.id })
      await chrome.storage.local.set({ [CANDIDATE_KEY]: { tabId: tab.id, url: tab.url ?? connection.origin, title: tab.title ?? "Jira" } })
      return { ok: true, status: await connectionStatus() }
    }).then(sendResponse)
    return true
  }

  if (message.type === "QUEUEMINT_JIRA_REQUEST") {
    loadConnection().then((connection) => {
      const request = message.request ?? {}
      const method = String(request.method ?? "GET").toUpperCase()
      if (!connection || !ALLOWED_METHODS.has(method) || !isSafeRestPath(request.path, connection.origin)) {
        return { ok: false, error: { code: "INVALID_REQUEST", message: "Only approved Jira REST requests are allowed." } }
      }
      return forwardToJiraTab({ type: "QUEUEMINT_JIRA_FETCH", request: { path: request.path, method, body: request.body ?? null } })
    }).then(sendResponse)
    return true
  }

  if (message.type === "QUEUEMINT_JIRA_FETCH_AVATAR") {
    loadConnection().then((connection) => {
      if (!connection || !isSafeSameOriginAssetUrl(message.url, connection.origin)) {
        return { ok: false, error: { code: "INVALID_AVATAR_URL", message: "Blocked invalid Jira avatar URL." } }
      }
      return forwardToJiraTab({ type: "QUEUEMINT_JIRA_FETCH_AVATAR", url: message.url })
    }).then(sendResponse)
    return true
  }

  if (message.type === "QUEUEMINT_JIRA_UPLOAD_ATTACHMENTS") {
    const request = message.request ?? {}
    if (!isSafeIssueKey(request.issueKey) || !validateAttachments(request.attachments)) {
      sendResponse({ ok: false, error: { code: "INVALID_ATTACHMENT_REQUEST", message: "Blocked invalid Jira attachment upload request." } })
      return false
    }
    forwardToJiraTab({ type: "QUEUEMINT_JIRA_UPLOAD_ATTACHMENTS", request: { issueKey: request.issueKey, attachments: request.attachments } }).then(sendResponse)
    return true
  }

  if (message.type === "QUEUEMINT_OPEN_JIRA") {
    loadConnection().then(async (connection) => {
      if (!connection) return { ok: false, error: { code: "JIRA_NOT_CONFIGURED", message: "Connect Jira first." } }
      await chrome.tabs.create({ url: `${connection.origin}/secure/Dashboard.jspa` })
      return { ok: true }
    }).then(sendResponse)
    return true
  }

  return undefined
})
