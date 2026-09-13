# QueueMint

QueueMint is a Chrome/Edge companion for Jira. It makes the work around Jira faster without trying to rebuild Jira itself.

The product focuses on workflows that are slow, repetitive, fragmented, or awkward in the native Jira UI: evidence-rich bug capture, fast issue creation, safe bulk actions, reusable macros, command-driven actions, and personal productivity shortcuts.

Current release candidate: **v1.0.0 RC3**.

## Product principle

QueueMint is not a second issue tracker.

Before adding a feature, ask:

> Does Jira already solve this well?

If yes, QueueMint should usually not rebuild it. If Jira can do it but the path is slow, repetitive, or hard to discover, QueueMint can provide a faster layer on top.

See [Product direction](docs/PRODUCT.md) and [Roadmap](docs/ROADMAP.md).

## Highlights

- Capture visible or full-page screenshots from the current browser tab.
- Annotate screenshots with crop, drawing, highlighting, text, blur/redaction, undo, and redo.
- Keep multiple screenshots in one evidence session and move the full session into the full-screen editor.
- Record a screen/window/tab clip in the full-screen Capture workspace, with optional microphone audio.
- Attach images, recordings, PDFs, text/log files, and JSON evidence to the Jira issue.
- Optionally include page URL, viewport, browser information, selected text, runtime/resource errors, and recent failed network entries.
- Create Jira issues with Project, Board, Sprint, Epic, Assignee, Priority, Estimate, Story Points, Labels, Components, Fix Versions, Due Date, and discovered custom fields.
- Detect likely duplicates locally, with optional semantic duplicate suggestions when AI access is explicitly enabled.
- Use local Smart Draft suggestions without sending data externally, or optionally enable Smart Assistant with explicit per-request data controls.
- Review and create issue batches safely before writing to Jira.
- Manage Jira issues with filters, Saved Views, issue detail inspection, safe clone/move helpers, and bulk edit preview.
- Reuse Saved Actions and safe Automation rules/macros through the same preview-first bulk-edit path.
- Use the Ctrl+Shift+K Command Layer for navigation, selected-issue actions, sprint moves, Saved Actions, filtered Jira views, and project/board switching. Alt+Shift+K is the fallback when Chrome cannot assign the primary shortcut.
- Switch English/Persian and light/dark theme in the main workspace and Capture surfaces.

The complete current feature inventory is in [docs/CAPABILITIES.md](docs/CAPABILITIES.md).

## v0.27.0 - Productivity and Polish

The Command Layer uses **Ctrl+Shift+K** on Windows/Linux and **Command+Shift+K** on macOS because Chrome reserves Ctrl+K for the address bar. QueueMint also registers **Alt+Shift+K** as a fallback for fresh installs where another extension already owns the primary shortcut.

Daily-use polish now includes persistent favorite commands, recent project/board context, a compact active-sprint summary that can be copied for Slack or meetings, and portable backup/restore for QueueMint preferences and reusable workflows. Backup files intentionally exclude the Smart Assistant API key and working data. Command navigation also skips disabled commands and supports Home/End in addition to arrows and Enter.

## v1.0 RC3 - Visual Jira description editor

RC3 replaces the split raw-text plus preview description experience with one editable visual surface. Bold, italic, lists, quote, inline code, and links render directly while editing, toolbar buttons expose active formatting state, and Ctrl/Cmd+B plus Ctrl/Cmd+I keep Jira-like keyboard behavior. The stored value is still serialized to Jira wiki markup before QueueMint sends it through existing Jira creation flows.

RC2 tightened global Command Layer shortcut conflicts, Smart Assistant formatting normalization, and Sprint/Backlog routing semantics. Quick Issue no longer shows Backlog inside a Sprint-only selector because Backlog is a placement choice, not a sprint.

## v1.0 RC1 - Public release hardening

The release branch adds a checked privacy/permission boundary, public privacy/support documents, a conservative browser/Jira compatibility matrix, a Chrome Web Store listing draft, and an automated release audit. Tagged builds can produce a GitHub release ZIP from the exact `dist/` contents.

Run `npm run check:release` in addition to the normal architecture/typecheck/build gates before a public candidate is accepted.

## v0.26.0 - Command Layer

In v0.26 the palette became a context-aware command interface instead of only a navigation menu. The browser-safe shortcut is now Ctrl+Shift+K as of v0.27. Commands reuse the existing QueueMint actions for assigning the current selection, opening or inspecting one selected issue, moving selected issues to backlog or an available sprint, applying Saved Actions, refreshing Jira context, and switching project or board.

The command layer can also open a real Manage Jira filtered view such as unassigned Bugs. That filter is applied through the existing Manage Jira model rather than maintaining a second hidden issue query or mutation system. Search now matches multiple tokens and commands are grouped by navigation, Jira actions, Saved Actions, context, and utilities.

## v0.25.0 - Jira Power Tools

Manage Jira now includes preview-first cleanup tools that operate on the current selection, or the current filtered scope when nothing is selected. QueueMint can stage unassigned issues for assignment to the current Jira user, collect missing estimates, collect unlabeled issues, and prepare backlog issues for sprint placement. These tools reuse the existing Bulk Edit flow and never write to Jira before the normal preview/confirm step.

Saved Actions can also be composed inside Bulk Edit. Adding another Saved Action only layers the fields configured by that action onto the current draft, so reusable macros can be combined without creating a second mutation path. Bulk Preview now lists the exact Jira issue keys that are about to change in addition to the before/after field summary.

## v0.24.0 - Smart Assistant

QueueMint can now optionally use OpenAI to turn rough issue text and selected evidence into a structured Jira draft. AI is disabled by default. The user chooses exactly which data categories may be sent for each request: current form text, page context, active screenshot, diagnostics, Jira metadata, and recent issue titles for semantic duplicate comparison. The existing local Smart Draft remains available without an external service.

Quick Issue also includes a searchable Project selector, so the project can be changed directly while creating a single issue and the header/context follows the selected project.

## v0.23.2 - Capture Pro reliability and Quick Issue polish

This release keeps Capture as an evidence session and adds durable session recovery between the toolbar popup, the source page, and the full-screen editor.

### Evidence sessions

- Multiple visible/full-page screenshots can be collected before creating the bug.
- The active screenshot remains editable and can be switched from the evidence strip.
- Evidence is preserved when moving from the popup into the full-screen Capture workspace.
- Capture sessions survive popup closure and reconnect when QueueMint is opened again.
- Full-screen Capture keeps the original source tab linked, so adding evidence captures the tested page instead of the extension tab.
- Screenshot annotations are persisted with the active evidence item.
- Issue-form draft fields are restored with the active Capture session.
- A reset action clears the active Capture session explicitly.
- Retake replaces the active evidence item, and even the final screenshot can be removed without destroying the Capture session.
- If a stored source-tab id becomes stale, reopening QueueMint from the toolbar on the intended page can reconnect the same session.
- The active screenshot can be copied directly to the clipboard or saved as PNG.
- Quick Issue context reflects the selected assignee and current project instead of showing the connected Jira user as the issue assignee.

### Screen recording

- Full-screen Capture can record a screen, window, or tab selected through the browser's native picker.
- Microphone capture is optional.
- Recording is intentionally limited to short bug evidence clips, currently up to 60 seconds and 12 MB.
- Recordings are attached to Jira as WebM evidence.

### Diagnostics

- QueueMint installs a lightweight page diagnostics collector after Capture is opened.
- Runtime errors, unhandled promise rejections, failed resource loads, navigation timing, and recent Resource Timing entries can be collected.
- Diagnostics are opt-in at issue creation time.
- QueueMint does not request Chrome `debugger` permission and does not silently intercept the page's console API.

### Evidence attachments

- Capture issues can include local images, PDFs, WebM recordings, text/log files, and JSON.
- Files are uploaded after the Jira issue is created, one attachment request at a time so one failed file does not invalidate the issue itself.

## Install for development

Requirements:

- Node.js 22.12 or newer
- Chrome or Edge
- A Jira instance you can access in the browser

```bash
npm install
npm run check:architecture
npm run build
```

Then load the generated `dist/` folder as an unpacked extension:

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select the QueueMint `dist/` directory.
5. Open Jira in a normal browser tab and connect it from QueueMint.

More details: [Development guide](docs/DEVELOPMENT.md).

## Architecture contract

Every production `.ts`, `.tsx`, `.js`, `.mjs`, and `.css` file under `src`, `public`, and `scripts` must stay at or below **300 lines**.

There are no legacy exceptions.

```bash
npm run check:architecture
```

The production build runs this guard before TypeScript and Vite.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Repository documents

- Privacy policy: `PRIVACY.md`
- Support guide: `SUPPORT.md`
- Permission audit: `docs/PERMISSIONS.md`
- Compatibility matrix: `docs/COMPATIBILITY.md`
- Public release checklist: `docs/PUBLIC-RELEASE-CHECKLIST.md`
- Chrome Web Store draft: `store/CHROME-WEB-STORE.md`

- [Capabilities](docs/CAPABILITIES.md): what QueueMint does today.
- [Product direction](docs/PRODUCT.md): what QueueMint is and is not.
- [Roadmap](docs/ROADMAP.md): agreed future phases.
- [Session handoff](docs/SESSION-HANDOFF.md): current context for a new ChatGPT/agent session.
- [Architecture](docs/ARCHITECTURE.md): code boundaries and the 300-line rule.
- [Development](docs/DEVELOPMENT.md): local setup, extension loading, Git workflow, and validation.
- [Release guide](docs/RELEASE.md): release checklist and tagging.
- [Security](SECURITY.md): browser/Jira trust boundaries and reporting guidance.
- [Changelog](CHANGELOG.md): release history.

## Git readiness

Before pushing a release candidate:

```bash
npm install
npm run check:architecture
npm run typecheck
npm run build
git status
```

For a new repository:

```bash
git init
git add .
git commit -m "fix: persist QueueMint Capture Pro sessions"
git branch -M main
git remote add origin <YOUR_REPOSITORY_URL>
git push -u origin main
```

Do not commit `node_modules/`, `dist/`, local logs, secrets, or private Jira data.

## Status

The large architecture refactor is complete. All production source files are under the 300-line limit. The product roadmap has now returned to user-facing capability work, with Capture Pro as the first post-refactor phase.

Latest completed phase: **v0.27 Productivity & Polish**. Next planned phase: **v1.0 Public Release**.
