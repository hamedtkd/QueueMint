# Worklog Assistant

QueueMint v1.1 introduces a preview-first Jira worklog workflow. It is designed to reduce daily logging friction without treating estimates as actual work or silently submitting a timesheet.

## Core rules

- Jira remains the source of truth.
- Daily target defaults to 7h 30m and is stored locally.
- Status and estimate are context, not proof that work happened.
- AI suggestions never write directly to Jira.
- Every duration and comment is editable before submit.
- No background daily auto-submit is included in this candidate.

## Reading the selected day

QueueMint does not trust one zero-result query by itself. The current-user daily sync uses several compatible paths and merges results by issue/worklog id:

1. Jira JQL for today's worklogs by `currentUser()`.
2. Data Center-friendly explicit user identities when available.
3. Full paginated issue worklogs when Jira search embeds only part of a worklog list.
4. A bounded author-only Jira fallback that checks the actual `started` date locally, avoiding `worklogDate` index/time-zone edge cases.
5. An optional Tempo Data Center worklog search when that endpoint is available.
6. A direct scan of the currently loaded board, merged with the global result.

The summary shows the daily target, global logged time, current-board logged time, remaining time, and current draft. If the board scan contributes records that the global search missed, the source label makes that fallback visible.

## Worklog screen flow

The screen uses a compact four-step rail: Choose scope, Select issues, Distribute time, and Review & submit. A date toolbar above the workflow provides previous/next-day navigation plus a calendar picker. The selected date drives the Jira/Tempo read, AI context, and final Jira worklog timestamp.

### 1. Choose scope and select issues

Scope controls:

- Project
- Board
- Whole board / Backlog / Sprint

Issue filters:

- search by key, summary, status, assignee, or label
- Assignee: all, only me, unassigned, or a specific visible assignee
- Status
- Issue Type
- Activity: all, relevant today, active, updated today, done today, logged today, or no worklog today
- Estimate: any, estimated, or unestimated

Active filters are displayed as chips. Worklog supports Table, Board, and Cards views. Table view includes a select-all checkbox in the header, while each row/card keeps its own selection control. Assignees render with Jira avatars where available. The Board view reads the selected Jira board configuration so a three-column board and a ten-column board keep their own Jira-defined columns; if that configuration cannot be read, QueueMint falls back to exact Jira status groups. Selection is local to Worklog and stays visible in the sticky Worklog draft sidebar even while the issue browser is filtered. Manage Jira can explicitly send a selection into Worklog, but normal Worklog navigation starts clean.

### Relevant today

This is a filter, not an automatic timesheet. QueueMint only ranks issues assigned to the current user when there is evidence from today:

- a worklog already exists today, or
- the issue was updated today, or
- the issue was completed today.

In Progress status by itself is not enough. Old Done issues and untouched active issues are not pulled in just because of their status. The ranked set is capped at eight issues. Estimate contributes only a tiny tie-breaker and never determines which issue was worked on.

The filter does not auto-select anything. The user still chooses the rows/cards to log. In Table view, the header checkbox can select or clear all currently visible rows.

### 2. Distribute time

The sticky draft sidebar keeps the selected issues, editable duration inputs, total time, distribution method, optional common comment, and final submit action in one place. Its header and submit action stay stable while the sidebar body scrolls internally, so a long draft never pushes the submit controls below the viewport. Estimate weighting remains the default suggestion, while manual, equal, and AI-assisted allocation are still available. Estimate changes proportions only after the issue set is chosen. Daily target settings stay collapsible at the bottom of the scrollable draft body so configuration does not compete with the daily task.

### Estimate display

Worklog intentionally distinguishes Jira's original estimate from its remaining estimate. If a 3h estimate has 30m remaining, issue views show `30m left` and retain the 3h original estimate as context. If worklogging reduces the remaining estimate to zero, QueueMint still shows `0m left` plus the original estimate instead of rendering the issue as if it never had an estimate. This is display context only; QueueMint does not infer actual time worked from an estimate.

### 3. Review and submit

The draft sidebar keeps every selected issue visible with its editable human-readable duration. Rows can be removed before submit, and a common optional comment fills entries that do not already have their own comment. Jira is written only after the final confirmation for the date shown in the date picker.

## AI export and JSON import

QueueMint can export the selected issue set, or the currently visible filtered set when nothing is selected, as JSON for any external AI assistant. The package includes issue metadata, today's already-logged time, the daily target, remaining time, and the user's optional note.

Expected AI output can be an array, `worklogs[]`, or `assignments[]`, for example:

```json
{
  "worklogs": [
    { "issueKey": "RCRM-60", "minutes": 120, "comment": "Worked on mail integration" },
    { "issueKey": "RCRM-61", "timeSpent": "1h 30m", "comment": "Prepared demo files" }
  ]
}
```

Use **Import worklog JSON** to paste or upload that response. QueueMint validates it and sends it to the normal review table. Import never writes directly to Jira.

## Direct AI suggestion

The built-in AI path is optional and uses the existing user-provided OpenAI configuration. It receives only the explicitly selected issues, the user's note, and disclosed issue context. QueueMint instructs the model not to invent completed work and not to duplicate time already logged today.

## Bulk JSON create + worklog

Bulk Import can optionally include a reviewed worklog on a new issue:

```json
{
  "type": "Task",
  "summary": "Implement login validation",
  "estimate": "3h",
  "worklog": {
    "minutes": 90,
    "comment": "Implemented the first working slice"
  }
}
```

QueueMint creates the Jira issue first and only then creates the worklog. A worklog failure never turns a successfully created issue into a failed issue creation.

## Jira requirements

The connected user must be able to view the relevant issues and have Jira permission to log work. QueueMint reuses the authenticated Jira browser session and does not store Jira credentials.

## Candidate smoke test

Before v1.1 is released:

1. Log time in Jira/Tempo, open Worklog, press Sync, and verify the global total matches the report.
2. Verify current-board time is shown separately from the global daily total.
3. Change Project, Board, Sprint, Assignee, Status, Type, Activity, and Estimate filters and verify the visible issues match the filter chips. Switch Table / Board / Cards views; confirm Table header select-all affects only visible rows and the Board view uses the selected Jira board column configuration.
4. Confirm an untouched old In Progress issue is not included by the Relevant today filter.
5. Confirm Updated today, Done today, and already-logged-today issues can appear when assigned to the current user.
6. Select rows inside Worklog, press Distribute time, verify the page scrolls to step 2, and confirm estimate weighting is selected by default. Check that equal and estimate-weighted splits preserve the requested total.
7. Export AI JSON and verify status, sprint, assignee, estimate, and already-logged-today values are present.
8. Import AI worklog JSON and verify it opens as an editable review draft.
9. Edit/remove draft rows and submit. Verify Jira matches the reviewed values.
10. Force one worklog failure and verify successful rows remain successful while the failed row stays retryable.
11. Run architecture, typecheck, tests, build, and release audit before tagging.
