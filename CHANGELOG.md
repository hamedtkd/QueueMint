# Changelog

## 1.0.0-rc.1 - Public release hardening

- Added a public privacy policy and support guide.
- Added a least-privilege browser permission audit and conservative browser/Jira compatibility matrix.
- Added `npm run check:release` to validate the Manifest V3/version contract, required permission boundary, public release docs, obvious committed secrets, and dynamic-code hazards.
- Added CI coverage for release branches and a tag-driven GitHub release ZIP workflow built from the exact `dist/` contents.
- Added a Chrome Web Store listing, privacy disclosure, permission justification, and screenshot-plan draft.
- Added a clean-profile/upgrade/public-release checklist.
- Shortened the manifest description to fit Chrome's public manifest description limit and added release-candidate `version_name` plus project homepage metadata.

## 0.27.0 - Productivity and Polish

- Replaced the browser-reserved Ctrl+K shortcut with Ctrl+Shift+K / Command+Shift+K and registered a Chrome extension command so the browser no longer steals the palette shortcut.
- Added persistent favorite commands with one-click star toggles and a Favorites section at the top of the Command Layer.
- Added recent project and recent board context to the Command Layer for faster daily switching.
- Added a focused active-sprint summary command for Slack/meeting sharing without introducing a reporting subsystem.
- Added portable backup/restore for appearance preferences, Saved Views, Saved Actions, Automation rules, favorite commands, and recent context.
- Portable backups intentionally exclude Smart Assistant API keys, activity history, last-created issue state, and working drafts.
- Improved Command Layer keyboard accessibility with disabled-item skipping plus Home/End navigation and clearer listbox semantics.
- Preserved the strict 300-line production-file limit and existing Jira mutation paths.

## 0.26.0 - Command Layer

- Expanded Ctrl+K from navigation into a context-aware Jira command layer.
- Added commands to assign selected issues to the current user, open Bulk Edit, inspect one selected issue, and open it directly in Jira.
- Added dynamic move commands for backlog and every non-closed sprint using the existing Jira move path.
- Added a real "Show unassigned bugs" command that opens Manage Jira with the corresponding visible filters applied.
- Added project and board switch commands that reuse the existing context loaders instead of duplicating metadata logic.
- Saved Action commands are now project-safe and require an active issue selection.
- Added grouped command sections and multi-token command search for faster phrase-style discovery.
- Preserved the strict 300-line production-file limit and existing mutation paths.

## 0.25.0 - Jira Power Tools

- Added preview-first Power Tools in Manage Jira for unassigned ownership, missing estimates, missing labels, and backlog-to-sprint preparation.
- Power Tools use the current issue selection when present, otherwise the current filtered Manage Jira scope.
- Kept all Power Tool execution on the existing Bulk Edit preview/confirm mutation path.
- Added Saved Action composition inside Bulk Edit so reusable macros can be layered into one draft.
- Added a project-safety guard that blocks project-bound Saved Actions from being applied to another Jira project.
- Bulk Preview now lists the exact Jira issue keys that will change before confirmation.
- Preserved the strict 300-line production-file limit.

## 0.24.1 - Smart Assistant typecheck hotfix

- Fixed the `SmartAssistantDataOptions` normalization so TypeScript 7 can verify all required data-boundary fields without an unsafe `Object.fromEntries` assertion.
- Preserved the exact per-source availability gating for current draft, page context, screenshot, diagnostics, Jira metadata, and duplicate candidates.
- No Smart Assistant behavior or privacy defaults changed.

## 0.24.0 - Smart Assistant

- Added optional OpenAI-backed Smart Assistant for Quick Issue and Capture issue creation.
- Added explicit per-request data boundaries for current draft text, page context, active screenshot, diagnostics, Jira metadata, and recent issue titles.
- Added structured AI suggestions for Summary, Description, Steps to reproduce, Expected result, Actual result, Issue Type, Priority, Component, Labels, Epic, and Assignee.
- Added semantic duplicate suggestions when the user explicitly allows recent Jira issue titles to be sent for comparison.
- Kept the existing local Smart Draft and local duplicate detection as no-external-AI fallbacks.
- Added Smart Assistant settings with local-only mode, configurable OpenAI model, and locally stored API key.
- OpenAI requests use the Responses API with structured output and `store: false`.
- Quick Issue now has a searchable Project selector and keeps the context header synchronized when the project changes.
- Kept the strict 300-line production-file limit intact.

## 0.23.2 - Capture and Quick Issue polish

- Retake now replaces the active screenshot instead of adding a duplicate evidence item.
- Capture sessions store their linked source tab separately from screenshot evidence, so the source survives deleting every screenshot.
- A stale or closed source-tab id can reconnect to the current normal page when QueueMint is opened from the toolbar there.
- The final screenshot can now be removed, leaving a usable empty evidence session with clear capture actions.
- Quick Issue now shows the selected assignee in the context header instead of always showing the connected Jira user.
- Quick Issue project context avoids stale project names during project switches and clears project-scoped assignee, epic, and sprint state when the project changes.
- Kept the strict 300-line production-file limit intact.

## 0.23.1 - Capture session reliability

- Persisted the active Capture session across browser-action popup closure.
- Linked full-screen Capture to the original source tab so adding evidence captures the tested page instead of the extension page.
- Reused/focused an existing full-screen Capture tab instead of opening duplicate editor tabs.
- Persisted per-shot annotation state for reliable edit recovery.
- Restored the create-bug form draft and evidence files when an active session is reopened.
- Added screenshot capture controls to the create-bug Evidence section.
- Added an explicit Capture-session reset action.
- Kept the strict 300-line production-file limit intact.

## 0.23.0 - Capture Pro

- Added multi-screenshot evidence sessions.
- Preserved evidence when opening full-screen Capture.
- Added screenshot clipboard copy.
- Added full-screen screen/window/tab recording with optional microphone.
- Added short evidence recording limits.
- Added Capture evidence file attachments for images, PDFs, WebM, logs/text, and JSON.
- Added opt-in page runtime/resource/network diagnostics without Chrome debugger permission.
- Added multi-evidence Jira attachment upload after issue creation.
- Added product, capabilities, roadmap, handoff, development, release, and contribution documentation.
- Added GitHub CI and PR/issue templates.

## 0.22.0 - Orchestration refactor

- Reduced `App.tsx` to a small composition/controller layer.
- Removed the final architecture baseline exception.
- Enforced the 300-line production code limit for every production source file.

## 0.21.0 - Review and Jira Manager refactor

- Extracted Review/Create and Manage Jira screens, models, preview/history, detail, filter, and bulk-edit responsibilities from the old App monolith.

## 0.20.0 - App screen refactor

- Extracted onboarding, connection, Workspace, Quick Issue, import, avatars, placement, duplicate, estimate, and smart-assignment UI into focused features.

## 0.19.0 - Capture shell refactor

- Restored full-screen Capture theme/language controls.
- Improved Capture form proportions and responsive layout.
- Continued App decomposition.

## 0.18.x - Capture UX and build fixes

- Added distinct field icons/sections and reusable Capture field shells.
- Split Jira services, controls, Capture editor, and styles.
- Fixed TypeScript build regressions from the refactor.

## 0.17.0 - Architecture refactor phase 1

- Decomposed Popup and Automation.
- Added architecture line-limit guard and temporary frozen baseline.
- Added Automation quick-start actions.

## 0.16.0 - Automation and intelligence

- Added preview-first Automation Center.
- Added persistent QueueMint activity history.
- Added smart assignee suggestions.
- Added local duplicate detection.

## 0.15.x - Issue focus and Saved Views

- Added Saved Views.
- Added Issue Detail inspector.
- Added safe clone helpers and native Jira move routing.
- Improved scope/filter safety in Manage Jira.

## 0.14.x - Workspace

- Added Workspace dashboard/context switching.
- Added Saved Actions and Command Palette flows.

## 0.13.x - Smart Jira creation

- Added richer Capture/Smart Draft behavior and popup-safe Jira controls.

## 0.12.x - Capture

- Added screenshot Capture, full-page capture, annotation, and Capture routing.

## 0.11.x - Bulk management

- Added bulk Jira workflows and review/preview foundations.

## 0.10.x - Early QueueMint foundation

- Added Jira connection, issue creation, profile/board context, theme/font/UI foundations, and initial bulk-edit work.

For older detailed notes, see `docs/HISTORY-v0.22.md`.
