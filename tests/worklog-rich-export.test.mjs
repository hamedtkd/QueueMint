import assert from "node:assert/strict"
import test from "node:test"
import { enrichWorklogAiPackage } from "../src/features/worklog/worklog-rich-export.ts"

const original = { schema: "queuemint-worklog-v1", issues: [{ issueKey: "SLID-191", summary: "Search focus", status: "To Do" }, { issueKey: "SLID-190", summary: "Card hover" }] }
const image = { id: "12", filename: "screenshot.png", mimeType: "image/png", size: 4, content: "https://jira.example/secure/attachment/12/screenshot.png" }
const details = async (key) => ({ description: "Description for " + key, attachments: [image, { id: "13", filename: "report.pdf", mimeType: "application/pdf", content: "https://jira.example/13" }] })
const encoded = "data:image/png;base64,YWJjZA=="

test("export always includes Jira descriptions without fetching images by default", async () => {
  let fetches = 0
  const { payload, skipped } = await enrichWorklogAiPackage(original, { includeImages: false, loadDetails: details, loadImage: async () => { fetches++; return encoded } })
  assert.equal(fetches, 0)
  assert.equal(payload.schema, original.schema)
  assert.equal(payload.issues[0].status, "To Do")
  assert.equal(payload.issues[0].description, "Description for SLID-191")
  assert.equal(payload.issues[1].description, "Description for SLID-190")
  assert.ok(!("images" in payload.issues[0]))
  assert.ok(!("imageExport" in payload))
  assert.deepEqual(skipped, [])
})

test("opt-in embeds image bytes and ignores non-image attachments", async () => {
  const { payload } = await enrichWorklogAiPackage(original, { includeImages: true, loadDetails: details, loadImage: async () => encoded })
  assert.equal(payload.issues[0].images[0].filename, "screenshot.png")
  assert.equal(payload.issues[0].images[0].dataUrl, encoded)
  assert.equal(payload.issues[0].images[0].sizeBytes, 4)
  assert.equal(payload.issues[0].images.length, 1)
  assert.equal(payload.imageExport.included, 2)
})

test("too-large and inaccessible image files are reported without losing description", async () => {
  const { payload, skipped } = await enrichWorklogAiPackage({ issues: [original.issues[0]] }, {
    includeImages: true,
    loadDetails: async () => ({ description: "Important", attachments: [{ ...image, size: 3 * 1024 * 1024 }, { ...image, id: "15", filename: "other.png", size: 8 }] }),
    loadImage: async () => null,
  })
  assert.equal(payload.issues[0].description, "Important")
  assert.deepEqual(skipped.map((item) => item.reason), ["size-limit", "unavailable"])
  assert.equal(payload.imageExport.included, 0)
})

test("image selection is globally bounded to 20 files", async () => {
  const { payload, skipped } = await enrichWorklogAiPackage({ issues: [original.issues[0]] }, {
    includeImages: true,
    loadDetails: async () => ({ description: "Many photos", attachments: Array.from({ length: 23 }, (_, i) => ({ ...image, id: String(i), filename: "image-" + i + ".png" })) }),
    loadImage: async () => encoded,
  })
  assert.equal(payload.issues[0].images.length, 20)
  assert.equal(skipped.length, 3)
  assert.ok(skipped.every((item) => item.reason === "count-limit"))
})

test("failed Jira issue detail reads reject the export rather than shipping incomplete context", async () => {
  await assert.rejects(() => enrichWorklogAiPackage(original, { includeImages: false, loadDetails: async () => { throw new Error("Jira 403") }, loadImage: async () => null }), /SLID-19\d description: Jira 403/)
})

test("zero issues never contact Jira", async () => {
  const { payload } = await enrichWorklogAiPackage({ issues: [] }, { includeImages: true, loadDetails: async () => { throw new Error("should not run") }, loadImage: async () => { throw new Error("should not run") } })
  assert.deepEqual(payload.issues, [])
})
