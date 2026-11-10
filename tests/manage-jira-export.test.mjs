import assert from "node:assert/strict"
import test from "node:test"
import { buildManageJiraAiPackage } from "../src/features/jira-manager/manage-export.ts"
import { enrichWorklogAiPackage } from "../src/features/worklog/worklog-rich-export.ts"

test("Manage Jira export retains its own schema and includes descriptions", async () => {
  const base = buildManageJiraAiPackage([{ id:"1", key:"SLID-191", summary:"Search", type:"Bug", priority:"High", status:"To Do", labels:["ui"], placement:"sprint" }], "SLID", 7)
  const {payload} = await enrichWorklogAiPackage(base, {
    includeImages: false,
    loadDetails: async () => ({description:"A Jira description", attachments: []}),
    loadImage: async () => { throw Error("Image fetch must be opt-in") },
  })
  assert.equal(payload.schema, "queuemint-jira-issues-v1")
  assert.equal(payload.boardId, 7)
  assert.equal(payload.issues[0].description, "A Jira description")
  assert.deepEqual(payload.issues[0].labels, ["ui"])
  assert.equal("images" in payload.issues[0], false)
})
