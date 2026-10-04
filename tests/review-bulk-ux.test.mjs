import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import { buildAiPrompt } from "../src/sample.ts"
import { assigneePresentation, effectiveEstimate, effectiveLabels, effectivePriority, effectiveSprint } from "../src/features/review/review-effective.ts"
import { issueKeyNumber, sortManageIssues } from "../src/features/jira-manager/manage-sorting.ts"
import { sortWorklogIssues } from "../src/features/worklog/worklog-issues.ts"

const read = (path) => readFile(new URL(path, import.meta.url), "utf8")
const issue = (key, updated) => ({ key, updated, labels: [], type: "Task", summary: key, placement: "backlog" })

test("review effective values preserve explicit issue fields and inherit only missing fields", () => {
  const payload = { project: "SLID", defaults: { priority: "Medium", estimate: "3h", assignee: "hamed", sprint: 44, labels: ["batch"] }, issues: [] }
  const explicit = { type: "Task", summary: "Explicit", priority: "High", estimate: "1h", assignee: "saghar", sprint: null, labels: ["issue"] }
  const inherited = { type: "Task", summary: "Inherited" }

  assert.equal(effectivePriority(explicit, payload), "High")
  assert.equal(effectiveEstimate(explicit, payload), "1h")
  assert.equal(effectiveSprint(explicit, payload), null)
  assert.equal(assigneePresentation(explicit, payload, []).identity, "saghar")
  assert.deepEqual(effectiveLabels(explicit, payload), ["batch", "issue"])

  assert.equal(effectivePriority(inherited, payload), "Medium")
  assert.equal(effectiveEstimate(inherited, payload), "3h")
  assert.equal(effectiveSprint(inherited, payload), 44)
  assert.equal(assigneePresentation(inherited, payload, []).identity, "hamed")
  assert.equal(assigneePresentation(inherited, payload, []).inherited, true)
})

test("no batch defaults leave issue values unchanged", () => {
  const payload = { project: "SLID", defaults: {}, issues: [] }
  const draft = { type: "Task", summary: "Keep me", priority: "Highest", estimate: "2h", assignee: "hamed", sprint: 8, labels: ["one"] }
  assert.equal(effectivePriority(draft, payload), "Highest")
  assert.equal(effectiveEstimate(draft, payload), "2h")
  assert.equal(effectiveSprint(draft, payload), 8)
  assert.equal(assigneePresentation(draft, payload, []).identity, "hamed")
  assert.deepEqual(effectiveLabels(draft, payload), ["one"])
})

test("review assignee presentation resolves display name and avatar while keeping exact identity", () => {
  const payload = { project: "SLID", defaults: { assignee: "hamed" }, issues: [] }
  const users = [{ name: "hamed", displayName: "Hamed", avatarUrls: { "32x32": "https://jira/avatar/h" } }]
  const inherited = assigneePresentation({ type: "Task", summary: "A" }, payload, users)
  assert.equal(inherited.identity, "hamed")
  assert.equal(inherited.label, "Hamed")
  assert.equal(inherited.avatarUrl, "https://jira/avatar/h")
  assert.equal(inherited.inherited, true)
})

test("AI prompt assignment toggle uses exact Jira identity only when requested", () => {
  const normal = buildAiPrompt("SLID")
  assert.doesNotMatch(normal, /"assignee": "hamed"/)
  assert.doesNotMatch(normal, /exact Jira identity "hamed"/)

  const assigned = buildAiPrompt("SLID", "hamed")
  assert.match(assigned, /"assignee": "hamed"/)
  assert.match(assigned, /exact Jira identity "hamed"/)
  assert.match(assigned, /Do not guess or replace this identity/)
  assert.doesNotMatch(assigned, /jira-username/)
})

test("issue-number sorting is numeric rather than lexicographic", () => {
  const issues = [issue("SLID-10", "2026-10-02T12:00:00Z"), issue("SLID-2", "2026-10-04T12:00:00Z"), issue("SLID-100", "2026-10-01T12:00:00Z"), issue("SLID-1", "2026-10-03T12:00:00Z")]
  assert.equal(issueKeyNumber("SLID-10")?.number, 10)
  assert.deepEqual(sortManageIssues(issues, "key-asc").map((item) => item.key), ["SLID-1", "SLID-2", "SLID-10", "SLID-100"])
  assert.deepEqual(sortManageIssues(issues, "key-desc").map((item) => item.key), ["SLID-100", "SLID-10", "SLID-2", "SLID-1"])
  assert.deepEqual(sortWorklogIssues(issues, "key-asc").map((item) => item.key), ["SLID-1", "SLID-2", "SLID-10", "SLID-100"])
})

test("updated sorting supports both directions", () => {
  const issues = [issue("SLID-1", "2026-10-01T12:00:00Z"), issue("SLID-2", "2026-10-04T12:00:00Z"), issue("SLID-10", "2026-10-03T12:00:00Z")]
  assert.deepEqual(sortManageIssues(issues, "updated-desc").map((item) => item.key), ["SLID-2", "SLID-10", "SLID-1"])
  assert.deepEqual(sortManageIssues(issues, "updated-asc").map((item) => item.key), ["SLID-1", "SLID-10", "SLID-2"])
  assert.deepEqual(sortWorklogIssues(issues, "updated-desc").map((item) => item.key), ["SLID-2", "SLID-10", "SLID-1"])
})

test("review and bulk-edit UI wire safe defaults, avatars, and Jira issue type visuals", async () => {
  const [sheet, table, board, controls, liveBulk, draft, picker] = await Promise.all([
    read("../src/features/review/ReviewSheets.tsx"),
    read("../src/features/review/ReviewIssueTable.tsx"),
    read("../src/features/review/ReviewIssueBoard.tsx"),
    read("../src/features/jira-controls/ProjectEpicControls.tsx"),
    read("../src/features/jira-manager/LiveBulkEditSheet.tsx"),
    read("../src/features/app-orchestration/useDraftActions.ts"),
    read("../src/features/worklog/WorklogIssuePicker.tsx"),
  ])

  assert.match(sheet, /value=\{placement\}/)
  assert.match(sheet, /value: "keep", label: t\.keepIssueValue/)
  assert.match(sheet, /noDefaultLabel=\{t\.noBatchDefault\}/)
  assert.match(sheet, /checked=\{labelsEnabled\}/)
  assert.match(sheet, /disabled=\{!labelsEnabled\}/)
  assert.match(draft, /delete nextDefaults\[key\]/)

  assert.match(table, /assigneePresentation/)
  assert.match(table, /JiraUserAvatar/)
  assert.match(board, /effectiveLabels/)
  assert.match(board, /JiraUserAvatar/)
  assert.match(board, /t\.unassigned/)

  assert.match(controls, /export function BulkIssueTypeSelect/)
  assert.match(controls, /JiraIssueTypeVisual/)
  assert.match(controls, /__bulk_issue_type_no_change__/)
  assert.match(liveBulk, /<BulkIssueTypeSelect/)
  assert.match(liveBulk, /iconUrl\?: string/)

  assert.match(picker, /Issue number · low to high/)
  assert.match(picker, /setSort\(value as WorklogIssueSort\)/)
})
