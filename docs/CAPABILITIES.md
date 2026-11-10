# QueueMint capabilities

Current stable release: v1.0.2.

Current release line: v1.3.2. Appearance Studio, Worklog Board Sync, Manage Jira Filter UX, Jira Create Safety, Calendar, and Evidence Upload UX are included in the supported release.

This document describes what is implemented today. It intentionally separates current capability from the future roadmap.

## Jira connection

- Connects to an already authenticated Jira browser session.
- Supports selecting among matching Jira tabs.
- Uses a Jira page bridge and approved Jira REST request paths rather than storing Jira credentials in QueueMint.
- Uses optional host permissions for the Jira origin.
- Discovers projects, issue types, priorities, boards, sprints, epics, assignees, labels, components, versions, estimation fields, and supported editable fields.
- Uses Jira Data Center style `/rest/api/2` and `/rest/agile/1.0` endpoints in the current implementation.

## Capture Pro

### Screenshot capture

- Visible-area screenshot.
- Full-page screenshot assembled from safe viewport tiles.
- Full-page size safeguards to avoid excessively large canvases.
- Multiple screenshots can be retained in one evidence session.
- Evidence survives transfer into the full-screen Capture workspace.
- The active Capture session persists in extension IndexedDB and reconnects after the browser-action popup closes.
- The source browser tab remains linked to the session, including while the full-screen Capture editor is active.
- Source linkage is stored independently from evidence, so all screenshots can be deleted while keeping the Capture session ready for another shot.
- Additional screenshots from full-screen Capture temporarily activate the linked source tab, capture it, and return the user to the editor tab.
- Annotation state for the active screenshot is persisted so reopening QueueMint does not discard edits.
- The create-bug form keeps its local draft with the Capture session, including selected Jira fields and local evidence files.
- Capture can be explicitly reset from the header.
- Active evidence can be copied to the clipboard or saved as PNG.
- Retake replaces the selected screenshot. If the original source-tab id is stale, the session can reconnect when QueueMint is opened from the toolbar on the intended normal page.

### Annotation

- Crop.
- Drawing.
- Highlighting.
- Text annotation.
- Blur/redaction.
- Undo and redo.
- PNG export.

### Screen recording

- Available from full-screen Capture.
- Uses the browser's native screen/window/tab picker.
- Optional microphone audio.
- Can include audio offered by the chosen display source.
- Recording is WebM.
- Current safety limit is 60 seconds and 12 MB per recording.

### Evidence files

- Images: PNG, JPEG, WEBP.
- PDF.
- WebM recording.
- text and `.log` evidence.
- JSON evidence.
- Local picker supports up to 10 files, 12 MB each, with a 20 MB local selection budget.
- Jira uploads are performed one evidence file at a time after the issue exists.

### Page context

When available, QueueMint can include:

- URL
- page title
- hostname
- capture time
- viewport dimensions
- document dimensions
- scroll position
- device pixel ratio
- selected text
- browser user agent

### Diagnostics

QueueMint can opt-in include:

- runtime JavaScript errors observed after the collector is installed
- unhandled promise rejections observed after the collector is installed
- failed page resource loads observed after collector installation
- navigation timing
- recent browser Resource Timing entries
- response status where the browser exposes it
- recent failed network entries based on available Resource Timing data

QueueMint does not request the Chrome `debugger` permission for Capture diagnostics and does not monkey-patch/intercept the page's console methods.

## Issue creation

- Quick Issue from popup.
- Quick Issue context header reflects the selected project and selected assignee. Project changes clear project-scoped Quick Issue assignee, epic, and sprint state before loading the new context.
- Capture-to-bug flow.
- Bulk issue creation.
- Review before create.
- Project selection, including direct project switching inside Quick Issue.
- Issue Type.
- Priority.
- Board context.
- Sprint placement.
- Epic link.
- Assignee.
- Original estimate.
- Story Points when detected.
- Labels.
- Component.
- Fix Version.
- Due Date.
- additional supported field data through discovered field mappings.
- Create-time field capability checks use Jira Data Center REST API v2 create metadata for the selected project and issue type. Optional fields that Jira does not expose on that Create screen are not sent.
- If Jira still rejects an optional create field because screen or field configuration changed, QueueMint can remove that rejected field, retry the create request, and surface the skipped field as a warning after the issue is created.
- Capture hides optional create controls that are unavailable for the selected project and issue type instead of inviting input that Jira will reject.
- Issue Type controls show Jira's own icon when available with a local fallback, Priority uses its visual indicator, and selected Assignees show Jira avatars where available.
- attachment upload after issue creation.
- Description editors use one editable visual surface rather than separate raw markup and preview panes. Bold, italic, lists, quote, inline code, and links render while editing; active toolbar buttons are highlighted; Ctrl/Cmd+B and Ctrl/Cmd+I are supported. The form value remains Jira wiki markup for the existing Jira create flows.
- Smart Assistant output is normalized to Jira wiki formatting before it is applied to an issue description.
- Quick Issue treats Backlog as a placement choice rather than a Sprint option; when Sprint placement is selected, the Sprint selector contains sprints only.

## Smart Draft and Smart Assistant

- Local rule/template-based Smart Draft remains available with no external AI service.
- Frontend/UI, regression, backend/API, performance, and auto-detect local templates.
- Local duplicate similarity against already loaded board/project issues.
- Project duplicate search before issue creation.
- Optional OpenAI-backed Smart Assistant in Quick Issue and Capture issue creation.
- AI is disabled by default and must be enabled/configured by the user.
- Per-request controls show and gate the data categories that may be sent: current draft, page context, active screenshot, diagnostics, Jira metadata, and recent issue titles.
- Structured suggestions can include Summary, Description, Steps to reproduce, Expected result, Actual result, Issue Type, Priority, Component, Labels, Epic, and Assignee.
- Semantic duplicate suggestions are available only when the user enables sending recent issue titles for that request.
- AI suggestions are previewed and require an explicit Apply action before they change the form. QueueMint never creates a Jira issue automatically from an AI response.

## Review and bulk creation

- Review issue drafts before writing them to Jira.
- Board/list/grid review layouts.
- Draft selection.
- Validation.
- Drag/drop placement where supported by the review flow.
- Batch-level defaults.
- JSON editing/import flow.
- Attachments per draft.
- Creation results with partial success handling.
- Sprint and estimate assignment after create where Jira requires separate operations.

## Workspace

- Project context switching.
- Board context switching.
- Live board issue metrics.
- Active sprint, backlog, unassigned, and unestimated counts.
- Quick actions into major QueueMint workflows.
- Current selection and recent created-batch context.

QueueMint does not intend to replace Jira's dashboard/reporting system.

## Manage Jira

- Live issue board/list view.
- Created-batch or whole-board scope.
- Scope and filters work independently.
- Search.
- My Issues toggle.
- Type, Priority, Status, Assignee, Sprint, Label, and Estimate filters. Type, Priority, Status, Assignee, Sprint, and Label support multiple selected values. Values inside the same filter use OR while different filter groups combine with AND.
- Active filters stay visible as removable chips, with Jira assignee avatars and priority visuals where available.
- Saved Views scoped to project/board context. Older single-value Saved Views remain readable after the multi-select filter upgrade.
- Entering Manage Jira does not implicitly select the last created batch. Created-batch context is a scope only until the user explicitly selects issues.
- Direct Assign to me and Move selected actions require confirmation before Jira is mutated.
- Hidden filtered issues are removed from active bulk selection to avoid accidental edits.
- Issue detail inspector.
- Jira user avatars.
- Comments/attachments/detail reads where Jira exposes them.
- safe clone helper.
- cross-project portable clone fields.
- native Jira move workflow launch rather than destructive emulation.

## Bulk edit

- Multi-issue selection.
- Preview before write.
- Priority.
- Assignee/unassign.
- Issue Type where supported.
- Epic link.
- Labels.
- Original estimate.
- Remaining estimate.
- Original/Remaining time-tracking writes are verified against Jira after update. When both are changed, Remaining Estimate is applied last if Jira requires separate writes, and partial per-issue failures are surfaced instead of being treated as success.
- QueueMint preflights Jira edit metadata for every selected issue before Review. A field must be editable across the full selection before it can be applied; Remaining Estimate requires Time Tracking on every selected issue's Edit screen. Dynamic field operations and allowed values are intersected across the selection.
- Jira failures are normalized into actionable messages for authentication, permissions, rate limits, conflicts, missing issues, browser-bridge/network problems, and screen/field restrictions. Partial delete/update failures remain identifiable for retry.
- Optional Jira metadata used by the popup and clone flow degrades transparently: available controls remain usable, failed option sources show a warning, and unsafe clone actions stay disabled until target-project metadata loads. Placement-only Bulk Edit does not depend on edit metadata.
- Story Points.
- supported dynamic Jira fields.
- short-lived undo/history snapshots for QueueMint bulk operations.

## Worklog Assistant

QueueMint includes a preview-first time logging workflow while keeping Jira worklogs as the system of record.

- Configurable daily target stored locally in QueueMint, defaulting to 7h 30m.
- Reads current-user worklogs for today through Jira worklog JQL, explicit Data Center user identities, paginated issue worklogs, an optional Tempo Data Center read, and a direct current-board scan merged by issue/worklog id.
- Scope worklog reads use settled per-issue requests. If only some issues fail, QueueMint keeps the successful data but warns that the total may be incomplete instead of silently treating failures as zero.
- Global daily time and current-board daily time are shown separately so scope is visible.
- Project, Board, Sprint/Backlog, Assignee, Status, Issue Type, Activity, Estimate, and key/summary search filters live directly in Worklog.
- Worklog issue selection supports Table, Cards, and Board views. The Board view reads the selected Jira board configuration so each board keeps its own workflow columns, with exact-status fallback when that configuration is unavailable. Board cards can be dragged to another status column when Jira exposes a valid direct transition; QueueMint refreshes from Jira after a successful move and does not fake unsupported transitions locally.
- Review before Jira mirrors the same selection model: List/Table keeps select-all inside the table header with an indeterminate state, while Cards and Board expose the explicit Select all/Clear selection action. Select-all follows the current visible filter set.
- Assignee avatars and familiar type/status/filter icons are reused across Worklog filters and issue views.
- Active filters are shown as visible chips rather than hidden selection rules.
- Worklog selection is independent from Manage Jira; explicit Manage Jira and Command Layer actions can copy a current selection into Worklog when desired.
- The selected worklog date is available in both the top toolbar and the draft sidebar. Changing only the date preserves the current selection and draft instead of resetting the workflow.
- Estimate only continuously recomputes from the actual selected issue keys and their Jira remaining/original estimate values as selection changes or Jira data refreshes. At medium or constrained work-area widths the desktop draft column collapses early into an always-available side sheet so it cannot squeeze or overlap Board/Table content.
- The relevant-today filter requires evidence from today: an existing worklog, an update today, or completion today. In Progress by itself is not enough. At most eight issues are ranked.
- Estimates never decide what the user worked on. After selection, they can either weight a chosen target duration or be used exactly through Estimate only mode, which uses Jira remaining estimate and does not stretch worklogs to the daily target.
- Each issue row exposes status, assignee, sprint/backlog, estimate, time already logged today, and last update.
- Manage Jira and Worklog both export selected/visible issues as AI-ready JSON with full Jira descriptions and optional Base64 screenshots. Worklog additionally includes already-logged time. Images are opt-in, embedded as Base64 from Jira attachments only on explicit export, with 20-image, 1.5 MiB/image, and 10 MiB total caps; skipped images are reported in the JSON and UI.
- Worklog descriptions never submit blank: per-issue descriptions override the shared draft description, and otherwise QueueMint generates `Worked on ISSUE-KEY: issue summary` with a final issue-key-only fallback in the Jira writer.
- AI-produced JSON can be pasted or uploaded and is converted into the same editable review table before any Jira write.
- Optional OpenAI allocation uses only the explicit selected issue set plus the user's work note and disclosed context.
- Every prepared entry exposes editable minutes and an optional worklog comment before submit.
- Confirmed worklogs are written sequentially through Jira's issue worklog REST path with remaining-estimate adjustment disabled.
- Partial failure keeps failed entries in the draft for correction/retry and records successful QueueMint activity locally.
- Bulk JSON issue creation accepts an optional `worklog` object. QueueMint creates the Jira issue first, then applies the worklog so worklog failure does not roll back issue creation.
- QueueMint does not silently auto-submit a daily target.

## Jira Power Tools

Power Tools are preparation shortcuts over the normal Bulk Edit path. They do not maintain a separate Jira mutation engine.

- operate on the current selection when issues are selected, otherwise the current filtered Manage Jira scope.
- collect unassigned issues and stage assignment to the current Jira user.
- collect issues with no time/story-point estimate for estimate cleanup.
- collect issues with no labels for label cleanup.
- collect backlog issues and stage sprint placement.
- always route into Bulk Edit and the normal preview/confirm step before Jira writes.
- Bulk Preview shows the exact issue keys that will be affected as well as field-level before/after summaries.

## Saved Actions and macros

- Save commonly reused bulk-edit configurations.
- Reapply them from Workspace/Manage Jira/Command Palette flows.
- Compose multiple Saved Actions inside a single Bulk Edit draft. Only fields explicitly configured by the added action override the current draft.
- Project-bound Saved Actions are blocked from being applied to another project.
- Automation rules reuse the same Saved Action system instead of maintaining a separate mutation engine.

## Automation Center

Current QueueMint automation is intentionally preview-first and macro-oriented.

- conditions for unassigned, missing estimate, backlog, Priority, Status, Issue Type, or Label.
- board/project-scoped rules.
- enable/disable.
- match review.
- action reuse through Saved Actions.
- matching issues are selected and routed through normal Bulk Edit preview before Jira mutation.
- activity entries for automation-driven bulk edits.

QueueMint does not currently run a full background Jira Automation replacement.

## Activity history

Local compact activity entries can record:

- issue creation
- partial batch creation
- move operations
- assign-to-me
- bulk edits
- automation-driven edits
- undo operations
- delete operations

This is a QueueMint workflow trace, not a replacement for Jira issue history.

## Command Layer

Ctrl+Shift+K is the primary context-aware command interface over the same QueueMint actions used by the visible UI. Alt+Shift+K is a fallback for Chrome profiles where the primary extension shortcut cannot be assigned. Both routes open/focus the QueueMint workspace and reuse the same command actions; the Command Layer does not maintain a second Jira mutation engine.

Current commands include:

- navigate to Workspace, Quick Issue, Bulk Import, Review, Manage Jira, and Automations.
- assign the current Jira selection to the connected user.
- open Bulk Edit for the current selection.
- inspect one selected issue or open it directly in Jira.
- move the current selection to Backlog or any non-closed sprint.
- show unassigned Bugs as a real Manage Jira filtered view.
- apply project-compatible Saved Actions to the current selection.
- switch Jira project or board context using the existing context loaders.
- refresh Jira data, open history, settings, and batch context settings.

Command search supports multiple words, and the palette groups results into navigation, Jira actions, Saved Actions, context, and utilities. Commands enable or disable based on the current selection and Jira context.

## Appearance and localization

- English and Persian with RTL support where relevant.
- Light, Dark, and System theme modes.
- A dedicated Appearance Studio with staged live preview, one-open-menu-at-a-time controls, hover previews isolated to the preview panel, and explicit Apply/Discard.
- Live accent color presets plus a custom color input.
- Neutral tone presets: Mist, Slate, Zinc, Gray, Neutral, Stone, Sand, and Paper, each with light and dark token sets.
- Independent body and heading typography choices. The selector includes QueueMint presets plus the complete shadcn/create Sans, Mono, and Serif family list, and Persian/Arabic choices such as Vazirmatn/Vazir, Mikhak, Samim, Shabnam, Sahel, Arabic Naskh, and Lalezar headings. Selected web fonts load only when needed from Google Fonts or commit-pinned jsDelivr resources, while local/system stacks remain the offline fallback. Remote JavaScript is not used for font delivery.
- Compact, Comfortable, and Spacious density modes.
- None, Small, Medium, and Large shared corner-radius modes. Radius tokens cover shared shadcn controls plus Jira/review boards, Worklog lanes/cards, connection cards, and other custom QueueMint surfaces.
- Soft, Solid, and Outline sidebar styles with Subtle or Filled active accents.
- Flat, Bordered, and Raised surface styles.
- Board, Cards, and List default issue views, including card column count.
- Reset and Shuffle actions plus portable appearance preset JSON import/export and a copyable preset code.
- Appearance values persist in extension storage, participate in portable QueueMint backup/restore, and apply to the header, workspace, import, Jira manager, automation, Worklog, and extension popup through shared semantic tokens.
- Existing full-screen Capture appearance controls remain available.

## Architecture and quality constraints

- React + TypeScript + Vite extension UI.
- Chrome Manifest V3.
- Every production TypeScript, TSX, JavaScript, MJS, and CSS file under `src`, `public`, and `scripts` is limited to 300 lines.
- `npm run build` runs the architecture guard before TypeScript/Vite.
- feature-oriented folders keep workflows separated.
- Jira transport is kept outside visual components.
- destructive or large mutations favor preview and explicit user confirmation.


## Public release hardening

The v1.0 release branch adds release-time validation and public documentation rather than new Jira business features: a permission audit, privacy/support docs, compatibility matrix, Store listing draft, and GitHub release-package workflow. Runtime product behavior remains the v0.27 capability set until final v1.0 smoke tests are complete.
