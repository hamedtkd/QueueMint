import assert from "node:assert/strict"
import test from "node:test"

import {
  loadSmartAssistantSettings,
  saveSmartAssistantSettings,
} from "../src/lib/smart-assistant.ts"

function storageArea(initial = {}) {
  const data = { ...initial }
  return {
    data,
    async get(key) {
      if (typeof key === "string") return { [key]: data[key] }
      return { ...data }
    },
    async set(values) {
      Object.assign(data, values)
    },
    async remove(key) {
      for (const item of Array.isArray(key) ? key : [key]) delete data[item]
    },
  }
}

function installChrome(local, session) {
  const previousChrome = globalThis.chrome
  globalThis.chrome = { storage: { local, session } }
  return () => {
    if (previousChrome === undefined) delete globalThis.chrome
    else globalThis.chrome = previousChrome
  }
}

test("saving Smart Assistant keeps API key out of persistent local storage", async () => {
  const local = storageArea()
  const session = storageArea()
  const restore = installChrome(local, session)
  try {
    await saveSmartAssistantSettings({ provider: "openai", model: "gpt-test", apiKey: "sk-test-secret" })
    const stored = local.data["queuemint-smart-assistant-v1"]
    assert.deepEqual(stored, { provider: "openai", model: "gpt-test" })
    assert.equal(Object.prototype.hasOwnProperty.call(stored, "apiKey"), false)
    assert.equal(session.data["queuemint-smart-assistant-api-key-v1"], "sk-test-secret")
  } finally {
    restore()
  }
})

test("legacy persistent API key is migrated to session storage and scrubbed", async () => {
  const local = storageArea({
    "queuemint-smart-assistant-v1": {
      provider: "openai",
      model: "gpt-test",
      apiKey: "sk-legacy-secret",
    },
  })
  const session = storageArea()
  const restore = installChrome(local, session)
  try {
    const loaded = await loadSmartAssistantSettings()
    assert.equal(loaded.apiKey, "sk-legacy-secret")
    assert.equal(session.data["queuemint-smart-assistant-api-key-v1"], "sk-legacy-secret")
    assert.deepEqual(local.data["queuemint-smart-assistant-v1"], { provider: "openai", model: "gpt-test" })
  } finally {
    restore()
  }
})

test("clearing the key removes it from session storage", async () => {
  const local = storageArea()
  const session = storageArea({ "queuemint-smart-assistant-api-key-v1": "sk-old-secret" })
  const restore = installChrome(local, session)
  try {
    await saveSmartAssistantSettings({ provider: "local", model: "gpt-test", apiKey: "" })
    assert.equal(session.data["queuemint-smart-assistant-api-key-v1"], undefined)
  } finally {
    restore()
  }
})
