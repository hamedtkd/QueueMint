# QueueMint security

## Security model

QueueMint is a browser extension that operates against the user's already authenticated Jira browser session. Jira remains the source of truth. QueueMint does not require a Jira password/token to be stored in extension code.

## Jira access

- Jira host access is requested as optional host permission for the configured Jira origin.
- The background worker only forwards approved HTTP methods and safe Jira REST paths to the connected Jira tab.
- Jira attachment uploads validate issue keys, filenames, MIME metadata, and base64 payload size before forwarding.
- QueueMint does not send Jira or Capture data to an AI service unless the user explicitly configures Smart Assistant and clicks Generate. Each request has visible data-category switches.

## Capture and evidence

- Screenshot capture uses Chrome tab/scripting APIs granted to the extension.
- Full-page capture temporarily scrolls the target page and restores the prior position.
- Screen recording uses the browser's native `getDisplayMedia` picker. The user chooses the screen/window/tab each time.
- Microphone recording is optional and subject to the browser's media permission prompt.
- Capture evidence remains local until the user creates the Jira issue or manually saves/copies it.
- Active Capture-session evidence and draft form state are persisted locally in the extension's IndexedDB so the browser-action popup can close without losing the report.
- `chrome.storage.local` stores the active Capture-session identifier, not the screenshot payload itself.
- Full-screen Capture temporarily activates the linked source tab when the user explicitly adds another screenshot, then restores the previous editor tab.
- Recording is constrained to short evidence clips and local attachment size limits.

## Diagnostics privacy

QueueMint Capture can collect lightweight page diagnostics to help reproduce bugs:

- runtime errors observed after diagnostics are installed
- unhandled promise rejections observed after installation
- failed resource loads observed after installation
- navigation timing and recent Resource Timing entries

Diagnostics are not appended to Jira unless the user explicitly selects the diagnostics option in the issue form.

QueueMint intentionally does **not** request Chrome `debugger` permission for this feature and does not monkey-patch the page's console methods.


## Smart Assistant privacy

- AI is disabled by default.
- The user can keep QueueMint in local-only mode.
- Before an AI request, the UI exposes switches for current draft text, page context, active screenshot, diagnostics, Jira metadata, and recent issue titles. Disabled categories are omitted from the request.
- The OpenAI host permission is optional and requested only when an AI request is initiated.
- Requests set `store: false`.
- Screenshots selected for AI are downscaled before transmission to reduce unnecessary data.
- Recent Jira issue titles are only sent when semantic duplicate comparison is enabled for that request.
- AI output is treated as a suggestion. It never bypasses QueueMint preview/form controls or directly mutates Jira.

## Clipboard permission

v0.23.x uses `clipboardWrite` so the user can explicitly copy the active screenshot. QueueMint does not read clipboard contents.

## Stored local data

QueueMint may store local extension preferences and workflow data such as selected project/board context, Saved Views, Saved Actions, automation rules, compact activity entries, appearance preferences, and temporary Capture drafts.

Smart Assistant may store an OpenAI API key in `chrome.storage.local` when the user explicitly configures it. The key is never bundled in source, Jira payloads, logs, or documentation. Do not place other secrets or passwords in QueueMint configuration.

## Reporting a security issue

Do not publish sensitive exploit details, customer Jira data, credentials, or private screenshots in a public issue. Contact the repository owner privately and include the minimum sanitized reproduction information needed to investigate.

## Permission changes

New Chrome permissions should be treated as product/security changes. Any future permission addition should document:

- the user workflow that requires it
- why a lower-privilege approach is insufficient
- what data becomes accessible
- whether the permission is optional
- how the user can avoid the feature

## Portable backup boundary

QueueMint portable backups intentionally exclude the Smart Assistant API key, activity history, working issue drafts, and last-created issue state. Backup import accepts only the QueueMint portable-backup schema and writes only the preference/workflow fields intended for transfer between installations.


## v1.0 release guard

`npm run check:release` is an automated policy gate. It verifies the intended required permission set, rejects static host permissions and selected high-risk permissions, checks the Manifest V3/version/description contract, scans production source for obvious committed credential patterns and dynamic code execution, and requires the public privacy/permission/support documents.

This guard is defense in depth. It does not replace manual review of Jira endpoints, browser permission prompts, Store privacy disclosures, or the clean-profile/upgrade smoke tests.
