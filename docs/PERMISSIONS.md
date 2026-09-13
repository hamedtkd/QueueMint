# QueueMint browser permission audit

This document records the v1.0 release permission boundary. New permissions are product/security changes and must be reviewed before release.

## Required permissions

| Permission | Why QueueMint needs it | User-visible boundary |
| --- | --- | --- |
| `storage` | Saves preferences, connection metadata, reusable workflows, productivity state, and the active Capture-session pointer. | Local extension storage only. Capture image payloads are stored in IndexedDB. |
| `activeTab` | Gives temporary access to the page the user explicitly invokes QueueMint on. | Access follows a user gesture and is used for Capture/page context. |
| `scripting` | Injects the Jira bridge and lightweight Capture/diagnostics helpers into an authorized tab. | Used only for the connected Jira/source page and user-triggered Capture workflows. |
| `clipboardWrite` | Copies the active screenshot or sprint summary when the user clicks a copy action. | QueueMint writes only. It does not request clipboard-read permission. |

QueueMint intentionally does not require `debugger`, `history`, `cookies`, `webRequest`, `downloads`, `nativeMessaging`, or static `tabs` permission.

## Optional host permissions

The manifest declares:

```json
[
  "https://*/*",
  "http://*/*"
]
```

These are optional patterns, not install-time host access. QueueMint discovers the user's Jira origin at runtime and requests only that origin when the user connects it. The broad optional patterns are necessary because Jira Cloud and self-hosted Jira origins cannot be known before installation.

`http://*/*` exists for explicitly chosen local/self-hosted Jira environments. Public production Jira should use HTTPS whenever possible.

OpenAI-backed Smart Assistant requests the specific `https://api.openai.com/*` origin only when the user starts an AI request. AI is disabled by default.

## Capture boundary

`activeTab` and `scripting` must not be replaced with broad required host access just to simplify Capture. The persistent Capture-session/source-tab architecture exists so evidence can survive popup closure without silently granting access to every page.

## Diagnostics boundary

QueueMint diagnostics remain lightweight and opt-in. Do not add Chrome `debugger` permission for normal diagnostics. If a future feature truly requires a higher-risk permission, document the workflow, alternatives considered, data exposure, and opt-out path before implementation.

## Release gate

`npm run check:release` verifies the intended required permission set, rejects static `host_permissions`, rejects selected high-risk permissions, and verifies that the public privacy/security documents exist.
