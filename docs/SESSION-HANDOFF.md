# QueueMint session handoff

Use this file when starting a new ChatGPT, coding-agent, or developer session. Read it before proposing new architecture or product phases.

## Current state

Current release branch candidate: **v1.0.0 RC4**, based on the completed v0.27.0 product feature set.

The architecture refactor is complete. The strict 300-line production code limit has no exceptions. `App.tsx` and `Popup.tsx` are orchestration/composition layers rather than monoliths.

Capture Pro, Smart Assistant, Jira Power Tools, and Command Layer are complete. The product feature set through **v0.27 Productivity & Polish** is complete. The current work is v1.0 public-release hardening: permissions/privacy, compatibility, packaging/CI, clean-profile and upgrade validation, store preparation, and final security review.

## Product definition

QueueMint is a Jira companion and power layer. It is not intended to become another Jira.

Primary jobs:

1. Capture a bug from the page being tested and turn it into a useful Jira issue quickly.
2. Make repetitive or multi-step Jira actions faster and safer.
3. Provide reusable personal macros, commands, and local productivity shortcuts.
4. Add intelligence where it reduces typing/searching while keeping the user in control.

Before adding a feature, check whether Jira already solves it well. Do not rebuild native Jira reporting, sprint planning, release management, workflow administration, project administration, permissions, or a full automation engine.

## What has already been built

- Jira browser-session connection and bridge.
- Quick Issue and bulk issue creation.
- Review before create.
- Dynamic Jira metadata and fields.
- visible/full-page Capture.
- screenshot annotation and redaction.
- multiple screenshot evidence session.
- full-screen Capture workspace.
- short WebM screen/window/tab recording with optional microphone.
- evidence file attachments.
- opt-in page diagnostics without debugger permission.
- local Smart Draft.
- duplicate detection.
- Workspace project/board context.
- Manage Jira filters and Saved Views.
- Issue Detail.
- clone helper and native move flow.
- bulk edit preview and short-lived undo/history.
- Saved Actions.
- Command Palette.
- safe preview-first Automation rules/macros.
- persistent compact activity history.
- smart assignee suggestions.
- optional Smart Assistant with structured issue drafting and semantic duplicate suggestions.
- English/Persian and light/dark appearance.

For exact current detail, read `docs/CAPABILITIES.md`.

## v0.23 Capture Pro implementation notes

- Screen recording intentionally runs in the full-screen Capture workspace because popup lifetime is not reliable for long media operations.
- Recording uses `navigator.mediaDevices.getDisplayMedia` and the browser's native picker.
- Microphone is optional through `getUserMedia`.
- Recording currently caps itself around 60 seconds and rejects evidence clips above 12 MB.
- Capture diagnostics observe runtime/resource errors after collector installation and read recent Resource Timing data.
- QueueMint does not request `chrome.debugger` for diagnostics.
- Diagnostics are opt-in when the issue is created.
- Evidence uploads occur after issue creation. Attachment failure should warn rather than pretend issue creation failed.
- Capture sessions are durable across popup closure. `src/lib/capture-draft.ts` stores the active session in IndexedDB and keeps an active-session pointer in `chrome.storage.local`.
- Every Capture session remains linked to its original source tab. Full-screen evidence capture must target that source tab, not `popup.html`. Source linkage is stored independently from screenshot evidence so deleting the last screenshot does not lose the source.
- If the browser-action popup is reopened while a session is active, it resumes the same evidence and create-bug draft instead of starting over.
- Screenshot annotation state is stored per evidence shot. Switching shots may flatten the previous active edit into its PNG, while the active shot keeps editable state for recovery.
- The create-bug form draft is persisted with the Capture session.
- The Capture header contains an explicit reset action. In full-screen Capture, reset returns focus to the source tab and closes the editor tab when possible.
- Retake replaces the active evidence screenshot rather than adding another item.
- The last screenshot can be deleted. The session remains active in an empty-evidence state so the user can capture again without losing the session.
- If the stored source tab no longer exists, opening QueueMint from the toolbar on the intended normal page allows the session to rebind to that page on the next capture.
- Quick Issue context must reflect the actual selected assignee and current project. Do not use the connected Jira account name as a substitute for issue ownership.


## v0.24 Smart Assistant implementation notes

- AI is off by default. `src/lib/smart-assistant.ts` owns provider settings, request shaping, structured output parsing, image downscaling, and description formatting.
- `src/features/intelligence/useSmartAssistant.ts` owns request state and optional recent-Jira-issue retrieval for semantic duplicate comparison.
- `SmartAssistantPanel.tsx` is the user-visible privacy boundary. Do not bypass its per-request data switches.
- The OpenAI API key is stored only in `chrome.storage.local` under the Smart Assistant settings key. Never hard-code or commit it.
- OpenAI calls request the specific optional host permission at the moment the user clicks Generate.
- Requests use `store: false` and structured JSON output.
- AI output never writes to Jira directly. It can only populate form fields after the user clicks Apply, and normal QueueMint Create/Review flows remain authoritative.
- Local Smart Draft and local duplicate detection remain available without AI.
- Quick Issue now exposes a Project selector directly in the form. Existing project-change lifecycle cleanup must remain in place so assignee, epic, and sprint context cannot leak across projects.

## v0.25 Jira Power Tools implementation notes

- `src/features/jira-manager/ManagePowerTools.tsx` derives common cleanup candidates from the visible Manage Jira scope, or from the current selection when one exists.
- Power Tools only prepare selections and Bulk Edit draft values. They must not bypass `useBulkEditFlow` or the normal preview/confirm sequence.
- Ownership cleanup stages assignment to the currently connected Jira user. Missing-estimate and missing-label tools collect the right issues and let the existing Bulk Edit controls decide the actual values.
- Backlog-to-sprint preparation stages placement as Sprint but requires the user to choose a target sprint before Preview can proceed.
- `SavedActionComposer.tsx` layers Saved Actions into the current Bulk Edit draft. Only fields explicitly present in the added action override the existing draft.
- Project-bound Saved Actions must not be applied or composed in a different project. Board-specific sprint placement may be dropped when the board context does not match.
- Bulk Preview now exposes the exact affected issue keys as well as aggregated field before/after values.

## v0.26 Command Layer implementation notes

- `src/features/app-orchestration/useAppCommandItems.tsx` builds context-aware commands from the current selection, project, board, sprints, and Saved Actions.
- Command items must call existing action groups such as `useLiveBoardOperations`, `useProjectContext`, and `useWorkspaceAutomation`. Do not put Jira transport or a second mutation path into the palette.
- Dynamic sprint commands only target non-closed sprints and reuse `moveLiveIssues`.
- Project and board commands reuse `chooseProject` and `chooseBoard`.
- The unassigned-Bug command applies a `ManageCommandPreset` to the normal Manage Jira model. The manager owns the actual filter state and also exposes Unassigned as a normal assignee filter option.
- Saved Action command items are filtered to the current project and remain dependent on a current issue selection.
- Command search is multi-token and grouped, but it is still deterministic local matching. There is no AI or autonomous command execution.
- Capture-from-page continues to live in the browser-action popup/Capture session because the full workspace cannot safely assume the active browser tab is the original source page.

## v0.27 Productivity and Polish implementation notes

- Do not restore Ctrl+K as the primary shortcut. Chrome owns it for the omnibox. QueueMint uses Ctrl+Shift+K / Command+Shift+K and also registers `open-command-palette` in the extension manifest.
- `src/features/productivity/useProductivityState.ts` owns persistent favorite-command ids plus recent project/board context. Storage is isolated under `queuemint-productivity-v1`.
- Favorite commands are decoration only. They do not create alternate execution paths; command items still call the same existing QueueMint actions.
- Portable backup/restore lives in `src/features/productivity/productivity-storage.ts`. It intentionally excludes Smart Assistant API keys, activity history, last-created issue state, and working drafts.
- The active-sprint share helper is a compact clipboard summary. Do not grow it into a reporting/dashboard engine.
- Durable Capture recovery was already solved by the persistent Capture Session architecture. Do not create a second draft-recovery store for the same data.
- Command Palette keyboard behavior must continue to skip disabled commands and keep Escape/Arrow/Home/End/Enter navigation accessible.


## v1.0 RC3/RC4 release-candidate fixes

- Keep `Ctrl+Shift+K` / `Command+Shift+K` as the primary Command Layer shortcut, but also keep `Alt+Shift+K` as a fallback. Chrome can leave a suggested extension shortcut unassigned when another installed QueueMint build or extension already owns it.
- The background command now opens/focuses QueueMint before sending the palette message, so a global shortcut is useful even when the workspace tab is not already focused.
- `RichTextEditor` is now a visual content-editable surface. Users do not edit raw Jira wiki markers directly. Formatting is rendered in place, active toolbar controls are highlighted from the current selection, and the editor serializes back to Jira wiki markup before passing the value into existing Jira flows. Ctrl/Cmd+B and Ctrl/Cmd+I remain supported.
- Smart Assistant must request Jira wiki formatting and normalize common Markdown before Apply. Do not send raw `**bold**`/backtick Markdown into Jira descriptions.
- Backlog is a placement, not a sprint. Quick Issue already has a Placement control, so its Sprint selector must not contain Backlog. Capture has one combined routing control, so its label explicitly says Sprint / Backlog.
- Desktop drag-and-drop for attachments is handled by the shared `AttachmentPicker`. Keep dropped files on the same allowlist, size/count limits, preview, duplicate guard, and Jira upload path as files chosen through the picker.

## Architecture rules

- No production code file over 300 lines.
- Run `npm run check:architecture` before claiming a phase is complete.
- Split by responsibility, not by arbitrary line slicing.
- Feature state belongs in hooks/controllers.
- Visual components receive data/callbacks.
- Jira/browser transport does not belong in deeply nested visual components.
- Reuse existing QueueMint mutation paths. Do not create parallel hidden mutation engines.

## Validation commands

```bash
npm install
npm run check:architecture
npm run typecheck
npm run build
```

A phase should not be considered complete until these pass on a normal development machine.

## Agreed future direction

Current phase:

- **v1.0 Public Release**: RC4 keeps the RC1-RC3 hardening and adds shared attachment drag-and-drop without changing the Jira upload path. Remaining work is final clean-profile/upgrade validation, recorded critical-flow smoke tests, Store assets/privacy form, and final security review.

Read `docs/ROADMAP.md` for the full reasoning and non-goals.

## If a new agent proposes a large new feature

Ask:

- Does Jira already do this well?
- Does the feature reduce steps or improve safety?
- Can the feature use an existing QueueMint flow instead of creating a parallel system?
- Does it keep Jira as the source of truth?
- What new browser/Jira permissions does it require?
- Will it keep all production files within 300 lines?

## Git/release state

The repository contains GitHub CI configuration, contribution guidance, release guidance, changelog, product direction, capabilities, architecture, and roadmap documentation. `dist/` and `node_modules/` remain ignored and should not be committed.


## v1.0 RC1 hardening notes

- `scripts/check-release.mjs` is now a required release gate in addition to the 300-line architecture check, TypeScript, and Vite build.
- Required Chrome permissions remain `storage`, `activeTab`, `scripting`, and `clipboardWrite`. Jira/OpenAI host access remains optional runtime access.
- `PRIVACY.md`, `SUPPORT.md`, `docs/PERMISSIONS.md`, `docs/COMPATIBILITY.md`, and `docs/PUBLIC-RELEASE-CHECKLIST.md` are part of the public release contract.
- `store/CHROME-WEB-STORE.md` is the canonical Store listing/privacy/permission-justification draft.
- `.github/workflows/release.yml` creates the exact `dist/` ZIP for version tags. It does not publish to the Chrome Web Store automatically.
- Do not tag final `v1.0.0` until clean-profile Chrome/Edge and upgrade-from-v0.27 validation have been recorded.
