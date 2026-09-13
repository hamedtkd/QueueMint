# QueueMint support

## Before reporting a problem

1. Confirm the QueueMint version from the extension details page.
2. Reproduce the problem once with the smallest possible Jira/test-page context.
3. Run the normal local validation commands if you are developing from source:

```bash
npm run check:architecture
npm run typecheck
npm run build
npm run check:release
```

4. If the problem is related to Jira, note whether the affected workflow is Quick Issue, Capture/Create Bug, Manage Jira, Bulk Edit, Automation, or Command Layer.
5. If the problem is related to Capture, say whether the source tab was still open and whether the session had been recovered after popup closure.

## What to include

- QueueMint version.
- Browser and browser version.
- Jira deployment type if known.
- Clear reproduction steps.
- Expected versus actual behavior.
- Sanitized screenshots or logs only when necessary.

## Do not post publicly

Do not post Jira credentials, OpenAI API keys, session cookies, customer data, private issue text, or unsanitized Capture evidence in a public GitHub issue.

For security-sensitive reports, follow `SECURITY.md` and contact the repository owner privately rather than publishing exploit details.

Project issues: https://github.com/hamedtkd/QueueMint/issues
