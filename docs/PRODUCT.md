# QueueMint product direction

## One-sentence definition

QueueMint is a fast, safe power layer on top of Jira for capture, repetitive issue operations, reusable shortcuts, and personal Jira productivity.

## The central rule

QueueMint must not become another Jira.

For every proposed feature, evaluate these questions in order:

1. Does Jira already provide this capability?
2. If yes, is Jira's existing experience already good enough for the target user?
3. If yes again, do not build a duplicate QueueMint implementation.
4. If Jira supports it but the workflow is slow, repetitive, hidden, or requires too many screens, QueueMint may provide a shortcut or assistant layer.
5. Keep Jira as the source of truth. QueueMint should not invent a second issue database.

## What QueueMint should excel at

### Capture into Jira

Turn the page a tester is looking at into a high-quality Jira bug with screenshots, short recording evidence, annotations, page context, optional diagnostics, relevant Jira placement fields, and duplicate warnings.

### Jira power tools

Make repetitive Jira operations faster and safer through selection, previews, reusable actions, validation, and undo-friendly local history where possible.

### Contextual commands

Let a user express the action they want without hunting through Jira screens, for example assigning selected issues, moving work into a sprint, opening issue details, or launching Capture.

### Personal productivity

Remember the user's own Saved Views, Saved Actions, recent context, capture drafts, and preferred shortcuts without attempting to replace Jira's team/project configuration.

### Worklog assistance

Reduce the daily friction of Jira time logging by showing what the current user has already logged, preparing the remaining daily target across relevant or explicitly selected issues, and keeping every proposed duration reviewable before submit. Estimates may help weight a suggestion, but they must never be treated as evidence that the same amount of work was actually performed.

AI may suggest a worklog allocation only from user-provided notes and visible Jira context, with the outbound data disclosed at the point of use. QueueMint should not silently fabricate or auto-submit timesheets.

### Smart assistance

Use intelligence to reduce typing and searching, but keep the user in control before writing to Jira. External AI must remain optional, show what data will be sent, and only populate a reviewable draft rather than mutating Jira directly.

## Explicit non-goals

QueueMint should not build its own full versions of:

- Jira reporting and dashboard engines
- sprint/backlog planning UI
- release/version management
- workflow administration
- permission administration
- project administration
- a general issue database
- a second comments/activity system
- a full Jira Automation clone

A small summary or shortcut is acceptable when it helps a specific workflow. For example, "Copy sprint summary for Slack" is aligned. Rebuilding Jira's reporting dashboard is not.

## Automation position

QueueMint automation is best treated as reusable macros and safe workflow shortcuts.

Good examples:

- Ready for QA
- Assign missing ownership
- Apply common labels and priority
- Prepare selected issues for a sprint

Rules should continue to favor review and preview before Jira mutation. Background automation should only be introduced for a use case Jira Automation does not already handle well.

## Data ownership

Jira remains the system of record for Jira issues. QueueMint may store local preferences, drafts, Saved Views, Saved Actions, activity summaries, and capture evidence temporarily to make the browser workflow better.

## UX principles

- Fast path first.
- Preview destructive or multi-issue writes.
- Avoid hidden scope changes.
- Keep controls visually distinct and scannable.
- Do not make the user configure data QueueMint can discover from Jira.
- Prefer contextual defaults, but show what will be written.
- Treat browser permissions as product cost, not as free implementation detail.
