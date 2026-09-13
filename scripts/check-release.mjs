import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"))
const packageJson = readJson("package.json")
const manifest = readJson("public/manifest.json")
const failures = []
const notes = []

function fail(message) { failures.push(message) }
function note(message) { notes.push(message) }
function exists(relative) { return fs.existsSync(path.join(root, relative)) }

if (manifest.manifest_version !== 3) fail("public/manifest.json must use Manifest V3.")
const manifestVersion = String(manifest.version ?? "")
if (!/^\d+(?:\.\d+){0,3}$/.test(manifestVersion)) fail("Manifest version must contain one to four dot-separated integers.")
const packageBaseVersion = String(packageJson.version ?? "").split("-")[0]
if (packageBaseVersion !== manifestVersion) fail(`package.json base version ${packageBaseVersion} does not match manifest version ${manifestVersion}.`)
if (String(manifest.description ?? "").length > 132) fail("Manifest description exceeds the 132-character Chrome limit.")

const allowedRequired = new Set(["storage", "activeTab", "scripting", "clipboardWrite"])
for (const permission of manifest.permissions ?? []) if (!allowedRequired.has(permission)) fail(`Unexpected required permission: ${permission}`)
for (const required of allowedRequired) if (!(manifest.permissions ?? []).includes(required)) fail(`Expected required permission is missing: ${required}`)
const forbidden = new Set(["debugger", "webRequest", "webRequestBlocking", "tabs", "history", "cookies", "downloads", "nativeMessaging"])
for (const permission of manifest.permissions ?? []) if (forbidden.has(permission)) fail(`High-risk permission must not be required: ${permission}`)
if (Array.isArray(manifest.host_permissions) && manifest.host_permissions.length) fail("Static host_permissions are not allowed; QueueMint uses optional runtime host access.")

const optionalHosts = new Set(manifest.optional_host_permissions ?? [])
for (const required of ["https://*/*", "http://*/*"]) if (!optionalHosts.has(required)) fail(`Missing runtime-discovered optional host pattern: ${required}`)
if (optionalHosts.has("<all_urls>")) fail("Use scheme-specific optional host patterns instead of <all_urls>.")

const shortcut = manifest.commands?.["open-command-palette"]?.suggested_key?.default
const fallbackShortcut = manifest.commands?.["open-command-palette-fallback"]?.suggested_key?.default
if (shortcut === "Ctrl+K") fail("Ctrl+K is reserved by Chrome; keep the extension command on Ctrl+Shift+K.")
if (shortcut !== "Ctrl+Shift+K") fail("Primary Command Layer shortcut must remain Ctrl+Shift+K for Windows/Linux.")
if (!fallbackShortcut) fail("A fallback Command Layer shortcut is required when Chrome cannot assign the primary shortcut.")
if (!manifest.background?.service_worker || !exists(`public/${manifest.background.service_worker}`)) fail("Manifest background service worker is missing from public/.")

for (const relative of ["PRIVACY.md", "SECURITY.md", "SUPPORT.md", "docs/PERMISSIONS.md", "docs/COMPATIBILITY.md", "docs/PUBLIC-RELEASE-CHECKLIST.md", "store/CHROME-WEB-STORE.md"]) {
  if (!exists(relative)) fail(`Public-release document missing: ${relative}`)
}

function walk(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) return walk(full)
    return /\.(?:ts|tsx|js|mjs|html)$/i.test(entry.name) ? [full] : []
  })
}

const secretPatterns = [
  [/\bsk-[A-Za-z0-9_-]{20,}\b/g, "OpenAI-style API key"],
  [/\bgh[opsu]_[A-Za-z0-9]{20,}\b/g, "GitHub token"],
  [/\bAIza[0-9A-Za-z_-]{30,}\b/g, "Google API key"],
]
for (const file of [...walk(path.join(root, "src")), ...walk(path.join(root, "public"))]) {
  const text = fs.readFileSync(file, "utf8")
  const relative = path.relative(root, file).replaceAll(path.sep, "/")
  for (const [pattern, label] of secretPatterns) if (pattern.test(text)) fail(`${label} appears to be hard-coded in ${relative}.`)
  if (/\beval\s*\(/.test(text) || /new\s+Function\s*\(/.test(text)) fail(`Dynamic code execution found in ${relative}.`)
  if (/\b(?:import|export)\s*(?:\([^)]*)?\s*["']https?:\/\//.test(text)) fail(`Remote code import found in ${relative}.`)
}

note(`Manifest ${manifestVersion}${manifest.version_name ? ` (${manifest.version_name})` : ""}`)
note(`Required permissions: ${(manifest.permissions ?? []).join(", ")}`)
note(`Optional hosts: ${(manifest.optional_host_permissions ?? []).join(", ")}`)

if (failures.length) {
  console.error("Public-release audit failed:\n" + failures.map((item) => `- ${item}`).join("\n"))
  process.exit(1)
}
console.log("Public-release audit passed.")
for (const item of notes) console.log(`- ${item}`)
