# QueueMint Chrome Web Store draft

## Name

QueueMint

## Short description

Capture better Jira bugs, create issues faster, and run safe bulk workflows without rebuilding Jira.

## Single purpose

QueueMint is a productivity companion for Jira. It shortens repetitive Jira workflows such as evidence-rich bug capture, issue creation, safe preview-first bulk changes, reusable actions, and context-aware commands.

## Detailed description

QueueMint helps Jira users move from finding a problem to a useful Jira issue with fewer steps. Capture visible or full-page screenshots, annotate/redact evidence, attach short recordings and files, and keep a durable Capture session even when the extension popup closes.

For day-to-day Jira work, QueueMint adds Quick Issue creation, safe Bulk Edit preview, reusable Saved Actions, Jira Power Tools, filtered Manage Jira views, and a keyboard Command Layer. Jira remains the source of truth and QueueMint reuses Jira permissions rather than creating a separate issue database.

Smart Assistant is optional and disabled by default. Local Smart Draft works without an external AI service. Users who enable OpenAI provide their own API key and choose the data categories included in each request.

## Permission justifications

### storage

Stores QueueMint preferences, connection metadata, reusable workflows, productivity state, and Capture-session pointers locally in the browser.

### activeTab

Provides temporary access to the page the user explicitly invokes QueueMint on so Capture can collect page context and screenshots.

### scripting

Used to install the Jira bridge on the connected Jira tab and lightweight Capture/diagnostics helpers on an explicitly targeted page.

### clipboardWrite

Used only when the user explicitly copies a screenshot or shareable sprint summary. QueueMint does not read the clipboard.

### Optional host access

QueueMint must support Jira Cloud and user-selected self-hosted Jira origins that are not known at install time. Host permissions are optional and requested at runtime for the origin the user chooses. OpenAI host access is requested only if the user enables Smart Assistant and initiates an AI request.

## Data-use disclosure draft

QueueMint can process website content, Jira issue/project data, screenshots/recordings, and optional diagnostics when the user invokes the corresponding workflow. Most state is stored locally. Data is sent to Jira when the user performs a Jira operation. Selected data is sent to OpenAI only when Smart Assistant is enabled and the user starts a request.

QueueMint does not sell user data and does not include advertising or third-party analytics in v1.0.

Canonical privacy policy:
https://github.com/hamedtkd/QueueMint/blob/main/PRIVACY.md

## Screenshot plan

Prepare at least these polished, sanitized screenshots from a test Jira workspace:

1. Workspace / Quick Issue with project context.
2. Capture editor with multiple evidence screenshots and annotations.
3. Create Bug form showing Evidence and privacy-safe diagnostics controls.
4. Manage Jira with selection and Jira Power Tools.
5. Command Layer with Jira actions and favorites.
6. Smart Assistant data-boundary panel with optional categories visible.

Do not include real customer issue text, credentials, API keys, private URLs, or personal data in store screenshots.
