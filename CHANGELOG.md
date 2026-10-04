# Changelog

## 1.4.0 - Direct Jira Move and Popup Editor Fix

- Fixed the popup Description editor root cause: popup field shells no longer use a native `<label>` around interactive children. Browser label activation could forward a click from text selection to the editor's first toolbar button, making selection alone toggle Bold on and off. Popup fields now use a non-activating grouped container while preserving the existing visual design.
- Added a direct **Move issue** workflow to Jira issue details. Users can choose a destination project, destination issue type, destination board, and for Scrum boards a target Sprint or Backlog placement without leaving QueueMint.
- Cross-project moves use Jira Cloud's official asynchronous Bulk Move API and resolve the issue by its stable Jira ID after completion so QueueMint can continue with the new issue key.
- Same-project board placement uses Jira Software Agile APIs for Sprint, board-specific Scrum Backlog, and Kanban board placement. Because Jira boards are filter-based, QueueMint treats board selection as placement rather than pretending an issue has exclusive board ownership.
- Jira Data Center/Server keeps the Jira-native Move fallback for cross-project moves, and Jira Cloud move failures also leave that fallback available.
- Added regression coverage for the popup selection/Bold bug and the direct project/board move wiring.

## 1.3.4 - Popup Jira Parity and Rich Text Selection Fix

- Fixed the extension popup Description toolbar so text selection is preserved before formatting commands run. Toolbar state is now derived from the editor DOM instead of the deprecated global `queryCommandState`, preventing selection/focus changes from making Bold/Italic/List state jump unexpectedly.
- Preserved the selected text across toolbar clicks and link prompts so formatting applies to the intended range instead of a collapsed or stale caret.
- Replaced the popup Labels free-text field with the same Jira-backed searchable multi-select used by the main Quick Issue flow. Existing labels are loaded from Jira, remote suggestions are queried while searching, and new labels can still be created inline.
- Reused Jira label options in popup Smart Assistant metadata and added regression coverage for popup label parity and rich-text selection preservation.

## 1.3.2 - Jira Create Safety, Calendar and Evidence UX

- Added Jira Data Center create-screen capability checks through REST API v2 create metadata. QueueMint now filters optional fields against the selected project and issue type before creating an issue instead of assuming every discovered Jira field is writable everywhere.
- Added a defensive create retry for Jira field-screen mismatches. If Jira still rejects one optional field, QueueMint removes that field, retries the issue creation, and reports the skipped field after success instead of failing the whole issue.
- Capture now hides optional create fields such as Story Points, Labels, Due Date, Components, and Fix Versions when Jira create metadata says they are unavailable for the selected issue type.
- Added Jira issue-type visuals, priority visuals, and selected-assignee avatars across the issue creation controls so fields are easier to scan and identify.
- Rebalanced the full-screen Capture issue form. Assignee now sits with the classification controls, the oversized empty Ownership panel is gone, and Description uses the full form width for easier editing.
- Added regression coverage for REST v2 create metadata, rejected optional-field recovery, create-field gating, visual Jira selectors, and Capture form alignment.

- Replaced browser-native date inputs with QueueMint's shared calendar for Capture due dates and dynamic Jira date fields, including previous/next month, previous/next year, Today, and Clear controls.
- Kept Jira date values timezone-safe by converting calendar selections to local `YYYY-MM-DD` values instead of UTC-derived strings.
- Rebuilt the shared evidence upload control as a stable responsive grid so its icon, copy, format hint, and add action no longer overlap or escape the drop zone in narrow extension layouts.
- Improved attachment previews with readable file sizes, meaningful image alt text, a visible file count, and touch-accessible remove controls.
- Added regression coverage for shared calendar adoption and responsive attachment layout.

## 1.3.1 - Manage Jira Filter UX and Overlay Reliability

- Fixed Select, Combobox, and Popover overlays opened inside QueueMint Sheets. Nested overlays now stay inside the active Sheet interaction layer, close normally on outside interaction, and keep their own scroll area usable.
- Upgraded Manage Jira Type, Priority, Status, Assignee, Sprint, and Label filters to multi-select controls. Values inside one filter are OR conditions while different filter groups remain AND conditions.
- Added a persistent Active filters band with removable filter chips, Jira assignee avatars, priority visuals, and clearer filter icons so saved or complex views remain visible at a glance.
- Preserved existing Saved Views and command presets by accepting both legacy single filter values and the new multi-value arrays.
- Removed implicit Manage Jira selection of the most recently created batch. Created-batch context remains available as a scope without making Jira mutations one click away.
- Added confirmation before direct Assign to me and Move selected mutations. Bulk Edit, Worklog, and Delete continue through their existing review or confirmation paths.
- Added regression coverage for multi-value filtering, Sheet overlay portals, mutation confirmation wiring, and the removal of automatic Manage Jira selection.

## 1.3.0 - Worklog Board Sync

- Worklog submissions no longer create blank Jira descriptions. Per-issue text wins first, the shared draft description is used second, and a blank entry falls back to `Worked on ISSUE-KEY: issue summary`; the low-level Jira writer also guarantees a non-empty issue-key fallback.
- Renamed the shared Worklog note to a default worklog description and made the automatic fallback visible in the UI/review flow so users know what Jira will receive before submit.
- Hardened Estimate only synchronization around the actual selected issue keys and estimate values rather than relying on Set identity. Adding, removing, or refreshing a selected issue now rebuilds the draft immediately without re-clicking the distribution method.
- Added the selected worklog date to the draft sidebar and kept the active selection/draft intact when the date changes, so a prepared set can be moved to yesterday or another day without starting over.
- Raised the responsive collapse point for the Worklog draft column and added a viewport fallback. Medium/constrained layouts now switch to the floating Draft action and side sheet before a four-column board can be squeezed or covered.
- Added drag-and-drop status movement to the Worklog Board. Dropping a card onto another Jira board column uses an available direct Jira workflow transition, refreshes the board after success, and reports unavailable transitions without faking a local move.
- Updated estimate-weighted distribution to prefer Jira remaining estimates where available while retaining original estimates as fallback context.
- Fixed Bulk Edit Original/Remaining Estimate persistence. QueueMint now sends time-tracking changes through Jira's dedicated `timetracking` edit shape, verifies the saved seconds after each write, retries the alternate edit form when needed, and applies Remaining Estimate last when both estimates are changed.
- Bulk Edit no longer reports estimate updates as successful just because Jira returned a successful HTTP response. Partial per-issue failures are surfaced with the first Jira verification error and the board is refreshed from Jira afterward.
- Bulk Edit now checks Jira edit metadata for every selected issue before Review. Fields that are not editable across the whole selection are disabled, Remaining Estimate is blocked when Time Tracking is missing from any selected issue's Edit screen, and dynamic field operations/options are intersected across the selection instead of assuming one issue represents the batch.
- Added a centralized Jira error layer for authentication, permissions, stale/missing issues, rate limits, browser-bridge failures, network failures, conflicts, and field-screen restrictions. Partial updates/deletes keep actionable failed items available for retry instead of reporting a vague success.
- Hardened Worklog reads so per-issue failures no longer silently undercount daily totals; partial reads surface a warning while successful data remains usable. Jira board-column fallback now reports why the real board configuration could not be loaded.
- Audited remaining Jira-facing fallbacks: popup board/assignee/epic/sprint metadata now degrades with a visible warning instead of silently becoming empty, clone target metadata failures are shown inline, browser-bridge exceptions are normalized centrally, and placement-only Bulk Edit remains usable when optional edit metadata is unavailable.
- Added regression coverage for estimate-only live synchronization, constrained-width draft access, Jira board transition matching, and verified bulk time-tracking updates.

## 1.2.1 - Worklog board and estimate UX fixes

- Fixed Worklog Board and Table wheel trapping by allowing vertical wheel events to chain to the document while keeping their horizontal scrolling local.
- Made the Worklog draft column itself sticky on desktop so the right sidebar stays visible while the page scrolls, with the draft body remaining internally scrollable when needed.
- Removed the duplicate plus/check action from Worklog issue cards. Selection now has one explicit checkbox control across Board, Cards, and Table views.
- Added an `Estimate only` distribution mode that uses each issue's Jira remaining estimate as the worklog duration and never stretches the selected issues to the daily target. Original estimate is used only when Jira does not provide a remaining estimate.
- Kept the existing equal and estimate-weighted modes for users who intentionally want to distribute a chosen target duration.

## 1.2.0 - Appearance Studio

- Added on-demand delivery for every shadcn/create font exposed by Appearance Studio, plus Persian/Arabic web-font sources. Google Fonts serves the shadcn families, Vazirmatn, Noto Naskh Arabic, and Lalezar; Samim, Shabnam, Sahel, and Mikhak use commit-pinned jsDelivr/GitHub resources. Local/system stacks remain the offline fallback.
- Kept extension JavaScript fully local. The Manifest V3 CSP explicitly blocks remote scripts while allowing only the font stylesheet/font hosts needed by Appearance Studio. Privacy and Chrome Web Store disclosures now describe these optional font requests.
- Completed a repository-wide theme audit. Non-semantic fixed radius utilities and fixed pixel corner radii now use QueueMint radius tokens across screens, overlays, popup surfaces, boards, cards, controls, and uploaders. Intentional circles such as avatars, status dots, and progress pills remain circular.
- Replaced remaining non-semantic fixed UI palette colors with QueueMint primary, muted, success, warning, and destructive tokens. Jira priority colors and neutral modal backdrops remain intentionally semantic/infrastructure-specific.
- Extended surface-style coverage so flat, bordered, and raised modes consistently control panel borders and shadows after the radius migration.
- Added regression checks for radius-token compliance, semantic color-token compliance, font-source coverage, CSP safety, and the Rounded typography preset.
- Removed the obsolete manual Samim installer now that font delivery is handled directly by Appearance Studio.

## 1.1.0 candidate - Appearance Studio V5.3 alignment and tone library

- Made Worklog draft status chips, step icons, method cards, empty pickers, placement toggles, and other non-semantic shape containers follow the active Appearance Studio radius. True status dots and avatars remain circular where the shape carries meaning.
- Aligned the Worklog date picker, previous/next controls, and refresh action to one density-aware toolbar height, and normalized Review/Manage filter and action rows to the same control sizing rules.
- Reworked Quick Issue backlog layout so Epic and Labels share the row while Assignee moves below at full width, eliminating the large empty column created when Sprint is absent.
- Expanded Neutral tone presets from four to eight with Zinc, Gray, Neutral, and Sand alongside Mist, Slate, Stone, and Paper, including matching dark-mode palettes and portable backup/preset support.
- Redesigned the Appearance Studio accent picker into compact themed color tiles plus a dedicated custom-color row instead of the previous loose circular swatches.
- Added regression coverage for V5.3 shape/alignment contracts and the expanded neutral-tone sanitizer.

## 1.1.0 candidate - Appearance Studio V5.2 selection/theme consistency

- Moved Review list/table select-all into the table header, matching Worklog, while keeping the explicit Select all/Clear selection action only in Cards and Board views.
- Fixed Review select-all to operate on the currently visible filtered issues without dropping hidden selections, and added regression coverage for select/clear behavior.
- Added a shared themed selection checkbox used by Worklog and Review, and made Jira manager/review selection boxes follow the active corner-radius token instead of retaining fixed rounded corners.
- Moved Button, Input, Textarea, Card, Select, Combobox, and Badge radius defaults onto the shared Appearance Studio radius variables so page CSS has fewer opportunities to drift from the active theme.
- Added pointer cursors to enabled buttons, links, checkboxes, radios, select items, and other interactive controls.
- Made the shared attachment uploader/drop zone follow radius, surface, border, hover, and accent tokens, removing the remaining fixed 9px upload radius overrides.

## 1.1.0 candidate - Appearance Studio V5.1 build hotfix

- Fixed the Appearance Studio heading-font option contract so the legacy Humanist heading choice is represented in the sanitizer and TypeScript build.
- Re-synchronized `package-lock.json` with the dependency versions already merged into `main`, including Radix Select 2.3.7, Lucide 1.45.0, Vite 8.3.0, and the matching transitive lock entries.
- Added a regression test that verifies every exact direct dependency in `package.json` matches its installed-package entry in `package-lock.json`, preventing another partially updated lockfile from reaching a source bundle.

## 1.1.0 candidate - Appearance Studio V5

- Fixed Workspace Quick Actions under Compact/Comfortable/Spacious density. Density no longer forces a fixed button height onto multi-line action cards, so descriptions cannot overlap neighboring actions.
- Made Jira manager/review board lanes, issue cards, Worklog lanes/cards, Jira connection cards, shared controls, overlays, and review actions follow the selected corner-radius tokens. Semantic circles/pills stay circular where shape communicates meaning.
- Hardened Review Validate/Create styling so both buttons derive radius, border, hover, and primary color from the active Appearance Studio theme instead of page-local fixed values.
- Extended Tailwind/shadcn radius tokens through QueueMint's shared `--qm-control-radius` and `--qm-panel-radius` values, reducing page-specific theme drift.
- Added the complete shadcn/create font menu families as body and heading choices, grouped into Sans, Mono, and Serif, while preserving QueueMint presets and Persian/Arabic choices. Font stacks remain local-first so QueueMint does not silently contact a third-party font CDN.
- Kept Appearance Studio hover isolated to the live preview and retained explicit Apply/Discard behavior.

## 1.1.0 candidate - Appearance Studio V4

- Fixed the Appearance Studio hover-preview regression by isolating hover state inside the live preview instead of mutating the document root while the pointer is moving through a menu. The settings rail no longer shifts, flickers, or loses the hovered option.
- Converted Theme, Neutral tone, typography, Corner radius, Density, Menu style, Menu accent, Surface style, default issue view, and card columns to the same shadcn-inspired dropdown pattern. Only one appearance menu stays open at a time.
- Changed Appearance Studio selection behavior so draft choices stay inside the live preview until Apply is pressed. Discard leaves the active QueueMint interface untouched.
- Expanded Persian/Arabic-oriented local font stacks with Vazirmatn/Vazir, Mikhak, Samim, Shabnam, Sahel, Arabic Naskh, and Lalezar for headings. QueueMint does not bundle third-party font binaries and falls back safely when a family is not installed locally.
- Extended semantic appearance coverage across the top header, workspace/automation surfaces, import cards, Jira manager surfaces, Worklog structural surfaces, shared corner radius, density, and Flat/Bordered/Raised surface modes.
- Made the top header derive its tint, borders, text, hover states, and surface depth from the same QueueMint theme tokens.

## 1.1.0 candidate - Appearance Studio V2

- Changed Appearance Studio to a staged workflow: choices preview immediately, but persistent QueueMint settings only change after Apply. Discard restores the last saved appearance.
- Added hover preview for appearance controls and shadcn-inspired popover menus for typography, neutral tone, sidebar style, and surface style.
- Expanded body and heading typography with System, Humanist, Geometric, Rounded, Serif, Mono, and Display choices where appropriate, using resilient local/system font stacks.
- Audited Worklog accent usage so active steps, selection, KPI accents, context controls, and primary actions derive from the selected QueueMint accent instead of fixed blue or violet values.
- Kept semantic success, warning, destructive, Jira status, and issue-type colors distinct where color communicates meaning.
- Updated the compact settings sheet to preview changes first and expose explicit Apply and Cancel actions.

## 1.1.0 candidate - Appearance Studio V1

- Added a dedicated Appearance Studio page inspired by shadcn-style live theming, with a compact control rail and a live QueueMint dashboard preview.
- Added persisted neutral tone, body font, heading font, sidebar style, sidebar accent, and surface style tokens alongside theme, accent, density, radius, and default issue view.
- Added Reset and Shuffle actions plus portable Appearance Preset JSON download/import and copyable preset codes.
- Applied the new semantic appearance tokens to the main workspace and extension popup without adding a runtime theme dependency.
- Kept advanced settings, Smart Assistant, productivity backup, and existing Jira workflows available through the secondary settings sheet.
- Added regression tests for preset sanitization and import/export round trips.

## 1.1.0 candidate - Customizable UI and page-scroll recovery V9

- Restored normal document scrolling for Worklog while keeping the draft sidebar sticky and internally scrollable on desktop. Board and table views now use local horizontal scrolling without creating a second vertical workspace scrollbar.
- Added a semantic, low-contrast 7px scrollbar treatment for the document, Worklog surfaces, sheets, selects, and board scrollers.
- Made Compact / Comfortable / Spacious density modes affect controls, page spacing, navigation, Worklog cards, filters, steps, and draft rows instead of only a few issue cards.
- Added live, persisted corner-radius customization (`None`, `Small`, `Medium`, `Large`) alongside theme, accent, and density, using the existing semantic CSS-variable system.
- Added an appearance reset action and included radius in portable QueueMint backup/restore.
- Kept the V7/V8 Worklog layout and code-splitting architecture without adding a new runtime UI/theme dependency.

## 1.1.0 candidate - Worklog scroll and estimate clarity V8

- Kept the accepted V7 Worklog layout while making the right draft sidebar a bounded internal scroll surface with a persistent submit footer, so long selections and comments remain reachable without stretching the whole page.
- Converted desktop Worklog into a viewport-contained workspace: the issue browser and draft use local scroll areas instead of forcing a full-page scrollbar. Narrow layouts still fall back to normal document scrolling.
- Added restrained thin scrollbars that stay visually quiet until the user interacts with a Worklog scroll surface.
- Improved estimate semantics in Worklog views. Partial estimates now show remaining time with the original estimate available for context, and an estimate that reaches zero remains visibly represented as `0m left` instead of looking unestimated.
- Preserved Jira's distinction between original estimate, remaining estimate, and actual worklog time.

## 1.1.0 candidate - Worklog reference redesign V7

- Rebuilt Worklog around the supplied dense SaaS reference: compact KPI cards, a four-step rail, explicit Jira scope, a real-board-first issue browser, and a sticky draft sidebar.
- Added a composed Date Picker (Popover + Calendar) with previous/next-day navigation so worklogs can be reviewed and submitted for a chosen past date without adding a heavy date library.
- Kept Jira board columns dynamic per selected board and retained Table, Board, and Cards issue views plus AI/JSON handoff.
- Made the draft sidebar the persistent action surface for selected issues, estimate/equal/manual distribution, comments, daily-target settings, and final submit.
- Added a route-level lazy import for Worklog so the new feature ships as its own application chunk instead of inflating the initial QueueMint bundle.
- Kept selected-date context in AI worklog suggestions and Jira submit timestamps.

## 1.1.0 candidate - Worklog UX refinement V6

- Fixed duplicate filter visuals in select triggers by rendering the selected avatar/icon once instead of replaying the full selected item content.
- Made the compact three-step workflow rail sticky below the QueueMint top bar so the current step stays visible while scrolling.
- Restored Select visible and Clear selection only for Board and Cards views; Table view keeps its header select-all checkbox.
- Realigned the Distribute time controls into one stable desktop grid and moved strategy help below the row so labels, segmented options, and Build review no longer drift vertically.
- Increased scroll offsets for step navigation so sticky top navigation does not cover the destination section.

## 1.1.0 candidate - Worklog UX refinement V5

- Replaced the repeated tall step headers with one compact three-step workflow rail and progressive disclosure: time distribution appears after selection, and review appears only after a draft exists.
- Removed Select visible and Clear selection action buttons. Table view now uses a native select-all checkbox in the table header.
- Added Table, Board, and Cards views for Worklog issue selection.
- Board view loads the selected Jira board configuration and renders its real workflow columns, so different Jira boards can expose different column counts and status mappings. If board configuration is unavailable, QueueMint falls back to grouping by Jira status.
- Added assignee avatars and familiar status/type/activity/estimate icons to filters and issue views.
- Made estimate/equal/AI distribution a joined segmented button group because the three options are mutually exclusive strategies.
- Compressed the summary and Jira scope surfaces and strengthened the Daily target settings surface without mixing settings into the time-distribution task.
- Worklog selection now drops issues hidden by the current filters to avoid submitting time against invisible rows.

## 1.1.0 candidate - Worklog UX refinement

- Reworked Worklog into a clear select -> distribute -> review flow with full-width aligned steps.
- Made JSON import secondary so it cannot visually compete with the normal Worklog flow.
- Added a primary Distribute time action after issue selection that scrolls to the distribution step.
- Defaulted the distribution strategy to estimate-weighted splitting while keeping equal and AI modes explicit.
- Moved Daily target settings out of the distribution task and into a separate settings section below the workflow.
- Aligned editable minutes with their human-readable duration in the review table.


## 1.1.0 - Worklog Assistant (unreleased)

- Reworked today's logged-time sync so QueueMint merges the global Jira/Tempo read with a direct current-board worklog scan instead of silently trusting a zero-result global query.
- Added Jira Data Center fallbacks for current-user worklogs: day JQL, explicit user identities, paginated full issue worklogs, and a bounded author-only fallback that filters actual `started` dates locally.
- Redesigned Worklog as an explicit three-step flow: filter/select issues, prepare time, then review before Jira writes.
- Added visible Project, Board, Sprint/Backlog, Assignee, Status, Issue Type, Activity, Estimate, and search filters directly inside Worklog.
- Added active-filter chips and a table-style issue browser showing status, assignee, sprint, estimate, today's logged time, and last update.
- Tightened the relevant-today filter: status alone is never proof of work. Candidates require a real today signal such as a worklog, update, or completion today, are limited to eight ranked issues, and estimates never choose tasks.
- Decoupled Worklog selection from Manage Jira while keeping explicit entry points that can send a Manage Jira selection into Worklog.
- Added AI handoff JSON export plus paste/upload Worklog JSON import that always lands in the editable review table before submit.
- Added equal and estimate-weighted time distribution while keeping Estimate separate from actual work logged.
- Added optional OpenAI worklog suggestions from the user's selected issues and explicit work note. AI remains suggestion-only and never writes directly to Jira.
- Added optional `worklog` objects to bulk JSON creation. QueueMint creates the issue first, then adds the reviewed worklog and reports/retries worklog failures separately.
- Kept all worklog writes preview-first. QueueMint does not silently auto-submit a daily timesheet in this candidate.

## 1.0.2 - Capture Reliability

- Fixed Capture sessions staying bound to the previous browser tab.
- Opening QueueMint from another tab now rebinds the active Capture source to that tab.
- Existing screenshots, annotations, and issue drafts remain intact while moving between tabs.
- Completed Jira issues now retire their Capture session instead of being restored later.
- Added regression tests for cross-tab capture source switching.

## 1.0.1 - Security & Reliability

- Redacted sensitive query strings, fragments, credentials, and tokens from Capture diagnostics.
- Improved page runtime diagnostics by collecting page errors from the MAIN world.
- Moved OpenAI API key storage from persistent local storage to browser session storage.
- Added secure migration and cleanup for previously stored API keys.
- Added automated security regression tests.
- Added production dependency security auditing.
- Added scheduled security checks and Dependabot.
- Strengthened public release security validation.

## 1.0.0-rc.4 - Attachment drag and drop

- Added drag-and-drop attachment intake for images and supported evidence files in Quick Issue, Review, and Capture evidence flows.
- Added a clear drop-zone state so users can drag files from the desktop or click the same surface to browse.
- Dragged files now use the same type, per-file size, total-size, count, duplicate, preview, removal, and Jira upload path as picked files.
- Explicitly validates drag-and-drop file types because the browser file-input `accept` filter does not protect dropped files.

## 1.0.0-rc.3 - Visual description editing

- Replaced the split raw Jira-wiki textarea plus preview with a single editable visual description surface in every flow that uses `RichTextEditor`.
- Bold, italic, bullet lists, numbered lists, quote, inline code, and links now render directly while the user edits.
- Formatting toolbar buttons expose active state from the current caret/selection, so selected bold/italic/list/etc. state is visible like a normal rich-text editor.
- Kept Ctrl/Cmd+B and Ctrl/Cmd+I plus list keyboard shortcuts while serializing the visual DOM back to Jira wiki markup for the existing Jira transport.
- Plain-text paste is enforced so unsupported external HTML does not leak into Jira descriptions.

## 1.0.0-rc.2 - Editor and shortcut reliability

- Added a second Command Layer shortcut, `Alt+Shift+K`, so a fresh QueueMint install still has a working global shortcut when Chrome cannot assign `Ctrl+Shift+K` because another extension profile/install already owns it.
- Global Command Layer shortcuts now focus/open the QueueMint workspace before revealing the palette, while the in-app listener supports both primary and fallback shortcuts.
- Added Jira wiki formatting preview plus `Ctrl/Cmd+B` and `Ctrl/Cmd+I` editor shortcuts for issue descriptions.
- Smart Assistant now requests Jira wiki formatting and normalizes common Markdown bold, heading, list, and inline-code syntax before applying a suggestion.
- Capture issue descriptions now use the same rich description editor as Quick Issue.
- Removed Backlog from the Quick Issue Sprint selector because placement is already chosen separately; the Capture form labels its combined control as Sprint / Backlog instead.

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
