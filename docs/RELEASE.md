# QueueMint release checklist

## Before release

- Confirm the intended product scope in `docs/ROADMAP.md`.
- Update `package.json` version.
- Update `public/manifest.json` version.
- Update README and CHANGELOG.
- Update `docs/CAPABILITIES.md` for current behavior.
- Update `docs/SESSION-HANDOFF.md` so the next session starts with correct context.

## Validation

Run on a normal development machine:

```bash
npm install
npm run check:architecture
npm run typecheck
npm run build
npm run check:release
git diff --check
```

Expected architecture message:

```text
Architecture line-limit check passed. Every production code file is capped at 300 lines.
```

## Manual smoke test

At minimum:

- extension loads from `dist/`
- Jira connection can be established
- popup opens
- English/Persian switch works
- light/dark switch works
- visible screenshot capture works
- full-page capture works on a normal test page
- annotation export works
- multiple evidence screenshots can be selected
- full-screen Capture preserves evidence
- adding a screenshot from full-screen Capture targets the linked source page, not the QueueMint extension tab
- closing the toolbar popup and reopening QueueMint restores the active Capture session
- annotation edits survive Capture-session recovery
- create-bug form fields survive Capture-session recovery
- Capture reset clears the active session and, from full-screen Capture, returns to the source tab when possible
- screen recording can start/stop in full-screen Capture
- optional microphone behavior is understandable
- Capture issue can be created in Jira
- evidence attachments upload
- diagnostics remain opt-in
- Quick Issue creates a Jira issue
- description Ctrl/Cmd+B and Ctrl/Cmd+I produce Jira wiki formatting and the preview renders it
- Smart Assistant descriptions do not leave raw Markdown `**bold**` or backticks after Apply
- Quick Issue Sprint selector does not list Backlog after Sprint placement is chosen
- Manage Jira loads
- Jira Power Tools use the current selection when present and the current filtered scope otherwise
- unassigned ownership Power Tool stages assignment to the connected Jira user without writing before Preview
- missing-estimate and missing-label Power Tools collect the expected issues
- backlog-to-sprint Power Tool requires a target sprint before Preview
- Saved Actions can be composed inside one Bulk Edit draft
- project-bound Saved Actions are blocked in another project
- Bulk Edit preview works
- Bulk Edit preview shows every affected Jira issue key
- Ctrl+Shift+K opens the Command Layer without Chrome focusing the address bar
- Alt+Shift+K opens the Command Layer when the primary shortcut is unavailable/conflicted
- favorite commands persist after reload
- recent project/board commands appear after context switching
- portable backup export/import restores preferences and reusable workflows without exporting the Smart Assistant API key
- active sprint summary copies a short shareable text

## Git release

After merge to main:

```bash
git checkout main
git pull --ff-only
git status
git tag -a v0.27.0 -m "QueueMint v0.27.0 Productivity and Polish"
git push origin main
git push origin v0.27.0
```

Change the version/tag to the actual release.

## Public-release additional checks

Before v1.0 also require:

- browser permission audit
- privacy policy
- supported Jira version matrix
- store listing and screenshots
- automated critical-path tests
- clean fresh-profile install test
- upgrade-from-previous-version test


## Release candidate packaging

The GitHub `Release package` workflow runs on version tags and manual dispatch. It verifies the source, builds QueueMint, zips the contents of `dist/` so `manifest.json` sits at the archive root, uploads the package as a workflow artifact, and attaches it to the matching GitHub Release for tag runs.

For v1.0 candidates, use a semver tag such as `v1.0.0-rc.4`. The extension manifest itself uses numeric `version: 1.0.0` plus `version_name: 1.0.0 RC4`, because Chrome extension version fields accept numeric dot-separated components.

Before final `v1.0.0`, complete `docs/PUBLIC-RELEASE-CHECKLIST.md`.
