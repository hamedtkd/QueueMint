import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(path, import.meta.url), "utf8")

test("direct issue move uses Jira Cloud bulk move and resolves the new key by stable issue id", async () => {
  const move = await read("../src/lib/jira/move-issue.ts")
  assert.match(move, /\/rest\/api\/3\/bulk\/issues\/move/)
  assert.match(move, /targetToSourcesMapping/)
  assert.match(move, /inferFieldDefaults: true/)
  assert.match(move, /\/rest\/api\/3\/bulk\/queue\/\$\{encodeURIComponent\(taskId\)\}/)
  assert.match(move, /\/rest\/api\/2\/issue\/\$\{encodeURIComponent\(issueId\)\}/)
  assert.doesNotMatch(move, /DELETE/)
  assert.doesNotMatch(move, /cloneJiraIssue/)
})

test("move issue supports board, sprint and backlog placement without bypassing Jira", async () => {
  const [move, panel, detail] = await Promise.all([
    read("../src/lib/jira/move-issue.ts"),
    read("../src/features/jira-manager/IssueMovePanel.tsx"),
    read("../src/features/jira-manager/IssueDetailSheet.tsx"),
  ])
  assert.match(move, /\/rest\/agile\/1\.0\/sprint\/\$\{encodeURIComponent\(String\(options\.targetSprintId\)\)\}\/issue/)
  assert.match(move, /\/rest\/agile\/1\.0\/board\/\$\{encodeURIComponent\(String\(options\.targetBoardId\)\)\}\/issue/)
  assert.match(move, /\/rest\/agile\/1\.0\/backlog\/\$\{encodeURIComponent\(String\(options\.targetBoardId\)\)\}\/issue/)
  assert.match(panel, /getBoardsForProject\(projectKey\)/)
  assert.match(panel, /getSprintsForBoard\(selectedBoard\.id\)/)
  assert.match(panel, /Project only \/ no placement/)
  assert.match(panel, /Same-project board placement keeps the current issue type/)
  assert.match(detail, /<IssueMovePanel/)
  assert.match(panel, /Jira native move/)
})
