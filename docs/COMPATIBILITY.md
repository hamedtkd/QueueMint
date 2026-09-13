# QueueMint compatibility

QueueMint v1.0 is designed for Chromium browsers and Jira deployments that expose the Jira REST API v2 and Jira Software Agile REST API 1.0 endpoints used by QueueMint.

## Browser matrix

| Browser | Status | Notes |
| --- | --- | --- |
| Google Chrome, current stable | Primary target | Manifest V3 extension. Fresh-profile and upgrade smoke tests are required before final v1.0. |
| Microsoft Edge, current stable | Supported target | Chromium extension path. Run the same critical-flow smoke suite before release. |
| Other Chromium browsers | Best effort | May work, but are not part of the v1.0 certification matrix. |
| Firefox / Safari | Not supported | QueueMint currently relies on Chrome extension APIs and a Manifest V3 Chromium package. |

## Jira matrix

QueueMint uses the user's existing authenticated Jira browser session and the following API families:

- `/rest/api/2/*`
- `/rest/agile/1.0/*`

| Jira deployment | v1.0 status | Notes |
| --- | --- | --- |
| Jira Cloud / Jira Software Cloud | Primary compatibility target | Must pass Quick Issue, Capture/Create Bug, Manage Jira, Bulk Edit, Sprint, and attachment smoke tests before final release. |
| Jira Data Center / Server with compatible REST API v2 + Agile API 1.0 | Best effort until explicitly tested | Custom authentication/proxy policies can affect the browser-session bridge. Do not advertise a specific Jira version as certified until it has passed the release matrix. |

## Feature dependencies

- Sprint, backlog, epic, and estimation helpers require Jira Software Agile APIs and relevant Jira permissions.
- Dynamic/custom field support depends on the metadata exposed by the connected Jira project.
- Attachment upload depends on the user's Jira permission to add attachments.
- Delete/move/bulk actions remain subject to Jira permissions and workflow configuration.
- Smart Assistant is optional and requires the user's own OpenAI API access when enabled.

## v1.0 certification rule

Before public release, record the exact browser versions and Jira environments that passed the final smoke run in the release notes. This file should remain conservative and should not claim untested Jira versions.
