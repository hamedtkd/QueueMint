import assert from "node:assert/strict"
import test from "node:test"
import { executeStatusTransitions } from "../src/features/jira-status/jira-status-batch.ts"

test("batch Jira transitions respect three in-flight requests and report partial failures", async () => {
  let active = 0
  let maxActive = 0
  const keys = Array.from({ length: 9 }, (_, i) => "SLID-" + (i + 1))
  const { moved, failed } = await executeStatusTransitions(keys, async (key) => {
    active++
    maxActive = Math.max(maxActive, active)
    try {
      await new Promise((resolve) => setImmediate(resolve))
      if (key === "SLID-4" || key === "SLID-8") throw new Error("Transition unavailable")
    } finally { active-- }
  }, (error) => error.message)
  assert.ok(maxActive <= 3)
  assert.ok(maxActive >= 2)
  assert.deepEqual(moved.sort(), keys.filter((key) => key !== "SLID-4" && key !== "SLID-8").sort())
  assert.deepEqual(failed.map((item) => item.key).sort(), ["SLID-4","SLID-8"])
  assert.ok(failed.every((item) => item.error === "Transition unavailable"))
})

test("empty batch never attempts a Jira mutation", async () => {
  let calls = 0
  const result = await executeStatusTransitions([], async () => { calls++ }, String)
  assert.equal(calls, 0)
  assert.deepEqual(result, { moved: [], failed: [] })
})
