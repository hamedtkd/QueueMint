# QueueMint roadmap

This roadmap reflects the current product decision: QueueMint is a Jira companion, not a Jira replacement.

## Completed foundation

### v0.10 through v0.16

The product grew from Jira issue creation into Capture, bulk management, Workspace context, Saved Views, Issue Detail, safe clone/move helpers, Saved Actions, Command Palette, local intelligence, safe Automation rules, and persistent activity history.

### v0.17 through v0.22

A full architecture cleanup decomposed the original monolithic Popup and App. Jira transport, Capture, Review, Manage Jira, Workspace, Automation, shell, and orchestration are now feature modules. Every production code file is capped at 300 lines with no exceptions.

## v0.23 - Capture Pro - completed

Goal: make QueueMint the fastest path from "I found a bug" to a useful Jira issue.

Delivered in this phase:

- multiple screenshot evidence in one capture session
- visible and full-page evidence shots
- annotations and existing crop/redaction workflow retained
- evidence preserved into full-screen Capture
- screen/window/tab recording in full-screen Capture
- optional microphone audio
- short recording limits suitable for bug evidence
- local evidence attachments including WebM, logs, JSON, PDFs, and images
- clipboard copy for the active screenshot
- optional runtime/resource/network diagnostics without Chrome debugger permission
- multi-evidence Jira attachment upload
- v0.23.1 tester follow-up: persistent Capture sessions across popup closure
- v0.23.2 tester follow-up: retake reliability, removable final evidence, stale source reconnection, and Quick Issue context/assignee polish
- source-tab linkage while the full-screen editor is active
- recovery of screenshot edits and create-bug draft state
- explicit Capture-session reset

Possible small follow-ups inside the Capture area should continue to be driven by actual tester feedback, not by copying dedicated screen-recording products.

## v0.24 - Smart Assistant - completed

Goal: reduce the work needed to turn evidence into a useful Jira issue without giving AI control over Jira writes.

Delivered:

- optional OpenAI-backed Summary and Description drafting
- structured Steps to reproduce, Expected result, and Actual result
- suggested Issue Type, Priority, Component, Labels, Epic, and Assignee
- semantic duplicate suggestions using recent issue titles only when explicitly enabled
- visible per-request data boundaries for draft text, page context, screenshot, diagnostics, Jira metadata, and duplicate candidates
- AI disabled by default with local-only mode and the existing local Smart Draft retained
- explicit preview/apply step before AI suggestions change issue fields
- Quick Issue project switching directly in the single-issue form

Not included: autonomous Jira creation or hidden background AI calls.

## v0.25 - Jira Power Tools - completed

Goal: make common high-friction Jira operations fast while Jira remains the source of truth.

Delivered:

- Power Tools over the current selection or filtered Manage Jira scope.
- one-click preparation for unassigned ownership cleanup.
- one-click collection of missing estimates and missing labels.
- one-click preparation of backlog issues for sprint placement.
- all Power Tools reuse the existing Bulk Edit preview/confirm path.
- Saved Action composition inside an active Bulk Edit draft.
- project-safety guard for Saved Actions created in another project.
- Bulk Preview now lists exact affected issue keys in addition to field before/after summaries.
- existing cross-project clone helper remains portable-field-first with minimal-field fallback rather than emulating Jira move behavior.

Selection rule: only build tools where QueueMint materially reduces Jira friction.

## v0.26 - Command Layer - completed

Goal: make the command palette a genuine command interface over the user's current Jira context.

Delivered:

- assign selected issues to the current Jira user through the existing assignment action.
- open Bulk Edit, inspect the selected issue, or open one selected issue directly in Jira.
- dynamic move commands for Backlog and every non-closed sprint using the existing move action.
- show unassigned Bugs by applying the normal Manage Jira filters.
- project-safe Saved Action commands over the current selection.
- switch project and board context through the existing project/board loaders.
- grouped command sections and multi-token phrase-style search.
- context-aware disabled states when selection, current user, board, sprint, or matching issues are unavailable.

The Command Layer deliberately calls existing QueueMint feature APIs and filter models instead of creating a second implementation path. Capture-from-page remains owned by the browser-action Capture flow because its source-tab permission/lifecycle is different from the full workspace.

## v0.27 - Productivity and polish - completed

Goal: make QueueMint comfortable for daily use without adding a second reporting or state-management product.

Delivered:

- Chrome-safe Command Layer shortcut: Ctrl+Shift+K on Windows/Linux and Command+Shift+K on macOS.
- registered extension command plus in-app key handling so Chrome's reserved Ctrl+K address-bar shortcut is no longer used.
- persistent favorite commands surfaced first in the Command Layer.
- recent project and board context for faster switching.
- portable backup/restore for appearance preferences, Saved Views, Saved Actions, Automation rules, favorites, and recent context.
- API keys, activity history, last-created issue state, and working drafts are deliberately excluded from portable backups.
- focused active-sprint summary copy for Slack/meeting use, not a reporting engine.
- keyboard/accessibility improvements in the Command Layer, including disabled-item skipping and Home/End navigation.
- Capture draft recovery remains owned by the durable v0.23 Capture Session architecture and did not need a parallel recovery system.

Performance work in this phase stayed conservative: no new runtime dependency was added and existing feature paths were reused. Broader automated bundle budgets belong with the v1.0 release pipeline.

## v1.0 - Public release - in progress

Goal: publish a stable Jira-agnostic QueueMint release for broader Chrome/Edge use.

RC1-RC3 hardening delivered:

- clean-profile Command Layer fallback shortcut and workspace focus behavior.
- Jira visual description editing with active formatting controls, keyboard shortcuts, and Jira wiki serialization behind the visual surface.
- Smart Assistant Markdown-to-Jira-wiki normalization before Apply.
- Sprint/Backlog routing semantics cleanup in Quick Issue and Capture.

- documented conservative browser/Jira compatibility matrix
- least-privilege browser permission audit and automated permission guard
- public privacy policy, support guide, and data-boundary documentation
- Chrome Web Store listing/permission-justification draft
- release-source audit for manifest/version, risky permissions, obvious committed secrets, dynamic code execution, and required public docs
- CI coverage for `release/**` branches
- tag-driven GitHub release packaging of the exact built `dist/` directory

Still required before final v1.0.0:

- clean-profile Chrome and Edge install tests
- upgrade test from v0.27.x with real persisted state
- recorded critical Jira bridge, Capture, attachment, Bulk Edit, Command Layer, and optional Smart Assistant smoke tests
- final store screenshots/assets and Developer Dashboard privacy disclosure
- final security review and signed-off support matrix

## Permanently avoid unless product strategy changes

- full Jira reporting replacement
- full dashboard builder
- full sprint planning replacement
- full release management replacement
- Jira workflow administration clone
- Jira permissions/project administration clone
- full Jira Automation engine clone
- independent issue tracking database
