# QueueMint v1.0 public release checklist

## Automated gates

```bash
npm install
npm run check:architecture
npm run typecheck
npm run build
npm run check:release
git diff --check
```

CI must pass on the release branch and the final pull request.

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
- confirm local Smart Draft works with AI disabled

## Upgrade test

From the last public candidate or v0.27 development package:

- install/seed Saved Views, Saved Actions, Automation rules, favorites, recent context, and an active Capture draft
- upgrade to the v1.0 package without clearing extension storage
- verify preferences/reusable workflows survive
- verify the active Capture session can still resume
- verify Smart Assistant remains local-only unless previously configured
- verify no new required permission prompt appears unexpectedly

## Privacy/security review

- compare `public/manifest.json` to `docs/PERMISSIONS.md`
- confirm no `debugger`, `webRequest`, `cookies`, `history`, or static host permission was added
- confirm Smart Assistant is off by default and the API key is excluded from portable backups
- confirm no secrets exist in tracked source or release artifacts
- confirm diagnostics remain opt-in
- confirm Jira writes still require the normal user action/preview path

## Store package

- build from a clean checkout
- zip the contents of `dist/`, not the repository root
- open the zip and confirm `manifest.json` is at the zip root
- install the exact packaged artifact in a clean browser profile before uploading it
- verify icon assets and both `index.html` and `popup.html` load from the package

## Store listing

Complete the Chrome Web Store listing and privacy tabs before publishing. Use `store/CHROME-WEB-STORE.md` as the canonical draft for listing copy, single-purpose explanation, permission justifications, and screenshot requirements.

## Release decision

Do not tag final `v1.0.0` until the fresh install, upgrade test, permission/privacy audit, and critical Jira/Capture smoke tests are recorded as passed.
