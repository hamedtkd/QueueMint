# QueueMint Privacy Policy

Last updated: 13 September 2026

QueueMint is a browser extension that helps users work faster with Jira. It connects to Jira through the Jira session already open in the user's browser. QueueMint does not require the user to store a Jira password or Jira API token in the extension.

## Data QueueMint can access

QueueMint only accesses data needed for features the user chooses to use. Depending on the workflow, this can include:

- Jira workspace metadata such as projects, boards, sprints, issue fields, assignees, issue summaries, and issue details.
- Jira issue content the user creates or edits through QueueMint.
- The active browser page when the user explicitly starts Capture, including the page URL/title, selected text, screenshots, and page dimensions.
- Short screen/window/tab recordings selected through the browser's native picker.
- Optional Capture diagnostics such as runtime errors, failed resource loads, navigation timing, and recent resource timing entries.
- Local QueueMint preferences, Saved Views, Saved Actions, automation rules, favorite commands, recent project/board context, and compact activity entries.

QueueMint does not continuously inspect every page the user visits. Page access is tied to user actions and runtime permissions.

## Jira data flow

Jira remains the source of truth. QueueMint sends Jira requests to the Jira origin the user explicitly connects and authorizes. Issue creation, editing, movement, deletion, and evidence upload happen only as part of user-initiated QueueMint workflows.

Capture evidence remains local until the user chooses to create a Jira issue, save/copy evidence, or otherwise explicitly uses it.

## Smart Assistant and OpenAI

Smart Assistant is optional and disabled by default. Local Smart Draft features do not require an external AI service.

If the user enables OpenAI-backed Smart Assistant:

- the user provides their own OpenAI API key;
- the key is stored in this extension's `chrome.storage.local` storage so it can persist across browser restarts;
- the key is excluded from QueueMint portable backups;
- QueueMint requests the OpenAI host permission only when the user initiates an AI request;
- before each request, the UI lets the user choose which data categories may be sent;
- disabled categories are omitted from the request;
- QueueMint sends requests with `store: false`;
- AI output is only a suggestion and never writes directly to Jira.

The optional data categories are current draft text, page context, active screenshot, diagnostics, Jira metadata, and recent issue titles used for duplicate suggestions.

When OpenAI is used, the selected data is transmitted to OpenAI and is subject to the user's OpenAI account and applicable OpenAI terms and policies.

## Local storage and retention

QueueMint uses browser-local extension storage and IndexedDB for product state and durable Capture sessions. This data stays on the user's browser profile unless the user exports a portable QueueMint backup.

Local data may remain until the user resets the relevant feature, clears extension data, or uninstalls QueueMint. Jira data written to Jira follows the retention and access controls of the connected Jira instance.

Portable backups intentionally exclude Smart Assistant API keys, activity history, last-created issue state, and working issue/Capture drafts.

## Data sharing, sale, and advertising

QueueMint does not sell user data. QueueMint does not include advertising or third-party analytics in the current release.

Data is shared externally only when required by a user-initiated workflow, for example:

- with the Jira instance the user connected;
- with OpenAI when the user explicitly enables Smart Assistant and starts a request.

## Browser permissions

QueueMint uses required browser permissions for local storage, user-initiated tab capture/scripting, and explicit clipboard writes. Jira/OpenAI host access is requested at runtime as optional host permission rather than granted for every site at install time.

See `docs/PERMISSIONS.md` for the permission-by-permission explanation.

## User controls

Users can:

- disconnect or change the Jira workspace;
- reset an active Capture session;
- disable Smart Assistant by choosing Local only;
- clear the stored OpenAI API key;
- choose the data categories included in each AI request;
- export/import only the supported portable preference/workflow backup;
- remove QueueMint and its local extension storage through the browser.

## Security and support

Do not include credentials, private Jira data, or customer screenshots in a public bug report. See `SECURITY.md` and `SUPPORT.md` for reporting guidance.

Project home: https://github.com/hamedtkd/QueueMint
