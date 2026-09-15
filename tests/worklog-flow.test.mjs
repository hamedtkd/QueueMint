import assert from "node:assert/strict"
import test from "node:test"

import { buildDailyCandidateIssues, worklogStatusCategory } from "../src/features/worklog/worklog-issues.ts"
import { buildWorklogAiPackage, parseWorklogJson } from "../src/features/worklog/worklog-json.ts"

const user = { name: "hamed", displayName: "Hamed Ahmadi" }
const base = { type: "Task", labels: [], placement: "sprint", assignee: "Hamed Ahmadi", assigneeId: "hamed", sprintId: 4, sprintName: "RCRM Sprint 4" }

test("daily candidates use real activity signals instead of the whole board", () => {
  const today = new Date("2026-09-14T12:00:00+03:30")
  const issues = [
    { ...base, id: "1", key: "RCRM-1", summary: "Active", status: "In Progress", statusCategory: "indeterminate", updated: "2026-09-14T08:00:00+0330" },
    { ...base, id: "2", key: "RCRM-2", summary: "Done today", status: "Done", statusCategory: "done", resolutionDate: "2026-09-14T10:00:00+0330" },
    { ...base, id: "3", key: "RCRM-3", summary: "Old done", status: "Done", statusCategory: "done", resolutionDate: "2026-09-10T10:00:00+0330" },
    { ...base, id: "4", key: "RCRM-4", summary: "Todo", status: "To Do", statusCategory: "new" },
  ]
  const candidates = buildDailyCandidateIssues(issues, user, {}, today)
  assert.deepEqual(candidates.map((issue) => issue.key), ["RCRM-1", "RCRM-2"])
  assert.equal(worklogStatusCategory(issues[0]), "indeterminate")
})

test("in-progress status alone is not treated as proof of work today", () => {
  const today = new Date("2026-09-14T12:00:00+03:30")
  const issues = [
    { ...base, id: "1", key: "RCRM-1", summary: "Old active", status: "In Progress", statusCategory: "indeterminate", updated: "2026-09-10T09:00:00+0330" },
    { ...base, id: "2", key: "RCRM-2", summary: "Touched today", status: "In Progress", statusCategory: "indeterminate", updated: "2026-09-14T09:00:00+0330" },
  ]
  assert.deepEqual(buildDailyCandidateIssues(issues, user, {}, today).map((issue) => issue.key), ["RCRM-2"])
})

test("daily candidates prioritize actual worklog evidence and cap the suggestion set", () => {
  const today = new Date("2026-09-14T12:00:00+03:30")
  const issues = Array.from({ length: 12 }, (_, index) => ({ ...base, id: String(index + 1), key: `RCRM-${index + 1}`, summary: `Task ${index + 1}`, status: "In Progress", statusCategory: "indeterminate", updated: "2026-09-14T09:00:00+0330" }))
  const candidates = buildDailyCandidateIssues(issues, user, { "RCRM-10": 30 }, today)
  assert.equal(candidates.length, 8)
  assert.equal(candidates[0].key, "RCRM-10")
})

test("worklog JSON import accepts AI-style worklogs and duration strings", () => {
  const issues = [{ ...base, id: "1", key: "RCRM-60", summary: "Connect mails", status: "Done" }]
  const result = parseWorklogJson(JSON.stringify({ worklogs: [{ issueKey: "RCRM-60", timeSpent: "1h 30m", comment: "Mail integration" }] }), issues)
  assert.equal(result[0].minutes, 90)
  assert.equal(result[0].summary, "Connect mails")
})

test("AI export contains status, sprint, and already logged minutes", () => {
  const issues = [{ ...base, id: "1", key: "RCRM-60", summary: "Connect mails", status: "Done", statusCategory: "done", originalEstimateSeconds: 7200 }]
  const payload = buildWorklogAiPackage(issues, 450, 120, 90, "worked on mail", { "RCRM-60": 30 })
  assert.equal(payload.issues[0].alreadyLoggedTodayMinutes, 30)
  assert.equal(payload.issues[0].sprint, "RCRM Sprint 4")
  assert.equal(payload.remainingDailyMinutes, 330)
  assert.equal(payload.requestedDraftMinutes, 90)
})
