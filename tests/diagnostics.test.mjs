import assert from "node:assert/strict"
import test from "node:test"

import {
  installPageDiagnostics,
  sanitizeDiagnosticText,
  sanitizeDiagnosticUrl,
} from "../src/features/capture-pro/diagnostics.ts"

test("diagnostic URLs drop query strings and fragments", () => {
  assert.equal(
    sanitizeDiagnosticUrl("https://example.com/file.png?token=secret#preview"),
    "https://example.com/file.png",
  )
  assert.equal(sanitizeDiagnosticUrl("data:image/png;base64,AAAA"), "data:[redacted]")
  assert.equal(sanitizeDiagnosticUrl("blob:https://example.com/1234"), "blob:https://example.com/[redacted]")
})

test("diagnostic messages redact URL and credential-like values", () => {
  const value = sanitizeDiagnosticText(
    "GET https://example.com/api?access_token=secret failed Authorization=abcd Bearer abcdefghijklmnop sk-proj-secretsecret",
  )
  assert.equal(value.includes("access_token=secret"), false)
  assert.equal(value.includes("Authorization=abcd"), false)
  assert.equal(value.includes("abcdefghijklmnop"), false)
  assert.equal(value.includes("sk-proj-secretsecret"), false)
  assert.equal(value.includes("https://example.com/api"), true)
})

test("runtime listeners are installed in the page MAIN world", async () => {
  const calls = []
  const previousChrome = globalThis.chrome
  globalThis.chrome = {
    scripting: {
      executeScript: async (options) => {
        calls.push(options)
        return calls.length === 1 ? [{ result: true }] : [{ result: undefined }]
      },
    },
  }

  try {
    await installPageDiagnostics(42)
    assert.equal(calls.length, 2)
    assert.equal(calls[0].world, undefined)
    assert.equal(calls[1].world, "MAIN")
    assert.deepEqual(calls[1].target, { tabId: 42 })
  } finally {
    if (previousChrome === undefined) delete globalThis.chrome
    else globalThis.chrome = previousChrome
  }
})
