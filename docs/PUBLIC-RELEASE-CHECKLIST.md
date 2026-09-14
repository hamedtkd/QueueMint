# QueueMint v1.0 public release checklist

## Automated gates

```bash
npm ci
npm run check:architecture
npm run typecheck
npm test
npm run build
npm run check:release
npm run security:audit
git diff --check
```

CI must pass on the release branch and the final pull request. The scheduled Security Audit workflow must also be green.

## Fresh-profile test

Use a new Chrome/Edge profile with no previous QueueMint storage:

- install the release package
- confirm first-run Jira connection guidance appears
- connect a real test Jira origin and verify the runtime permission prompt is understandable
- create one Quick Issue
- capture one visible screenshot and create a Bug with evidence
- close/reopen the popup and verify Capture recovery
- open Manage Jira and perform a preview-first bulk action
- open Command Layer with Ctrl+Shift+K / Command+Shift+K
- with another QueueMint build holding the primary shortcut, verify Alt+Shift+K opens the RC Command Layer
- confirm local Smart Draft works with AI disabled
- enable OpenAI Smart Assistant in a test profile, save a disposable test key, and confirm persistent `chrome.storage.local` does not contain that key
- fully exit the browser, reopen it, and confirm the OpenAI key must be entered again

## Diagnostics regression test

On a test page under your control:

- start Capture so diagnostics are installed
- trigger a main-page JavaScript error and an unhandled promise rejection
- confirm both are visible in QueueMint diagnostics
- load a test resource whose URL contains a fake query token and fragment
- confirm the stored/formatted diagnostic URL contains only origin + path
- put a fake bearer/token value in a test error message and confirm it is redacted
- confirm QueueMint still does not request Chrome `debugger`

## Upgrade test

From the last public candidate or v0.27 development package:

- install/seed Saved Views, Saved Actions, Automation rules, favorites, recent context, and an active Capture draft
- if testing migration from an older Smart Assistant build, seed only a disposable fake API key
- upgrade without clearing extension storage
- verify preferences/reusable workflows survive
- verify the active Capture session can still resume
- verify a legacy Smart Assistant API key is moved to session storage and removed from persistent local settings
- verify no new required permission prompt appears unexpectedly

## Privacy/security review

- compare `public/manifest.json` to `docs/PERMISSIONS.md`
- confirm no `debugger`, `webRequest`, `cookies`, `history`, or static host permission was added
- confirm Smart Assistant is off by default
- confirm Smart Assistant API keys are session-only and excluded from portable backups
- confirm no secrets exist in tracked source or release artifacts
- confirm diagnostics remain opt-in
- confirm Jira writes still require the normal user action/preview path
- confirm `LICENSE` reflects the redistribution policy you actually want

## Store package

- build from a clean checkout
- zip the contents of `dist/`, not the repository root
- open the zip and confirm `manifest.json` is at the zip root
- install the exact packaged artifact in a clean browser profile before uploading it
- verify icon assets and both `index.html` and `popup.html` load from the package

## Store listing

Complete the Chrome Web Store listing and privacy tabs before publishing. Use `store/CHROME-WEB-STORE.md` as the canonical draft for listing copy, single-purpose explanation, permission justifications, and screenshot requirements.

## Release decision

Do not publish a maintenance release until automated gates, fresh install, upgrade, diagnostics redaction, permission/privacy audit, and critical Jira/Capture smoke tests are recorded as passed.

Public maturity cannot be created by a checklist. Record real pilot environments, browser/Jira versions, regressions, and user reports over time instead of claiming unearned certification.

## RC3 editor/routing regression checks

- Quick Issue and Capture descriptions show formatted content directly in one editable visual surface, with no raw wiki pane plus separate preview.
- Ctrl/Cmd+B and Ctrl/Cmd+I work and the corresponding toolbar button becomes active while the caret/selection is formatted.
- Bullet/numbered list, quote, inline-code, and link controls round-trip through Jira wiki serialization.
- Smart Assistant Apply converts common Markdown formatting to Jira wiki formatting before the visual editor renders it.
- Quick Issue Sprint selector contains sprints only; Backlog remains available through Placement.

## RC4 attachment regression checks

- Quick Issue accepts supported images/files by both click-to-browse and desktop drag-and-drop.
- Dragging over the attachment surface shows a visible active drop state before the file is added.
- Review and Capture evidence attachment surfaces keep the same shared drag-and-drop behavior.
- Dropped files use the same allowlist as the picker: PNG, JPG/JPEG, WEBP, PDF, WEBM, TXT, LOG, and JSON.
- Unsupported, duplicate, oversized, over-count, or over-total-limit dropped files are not added.
- Image drops render a preview and removing an attachment does not affect the remaining files.
- Created Jira issues receive dropped files through the existing attachment upload path.
