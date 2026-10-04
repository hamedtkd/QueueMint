$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repo = "hamedtkd/QueueMint"
$baseVersion = "1.4.2"
$version = "1.5.0"
$tag = "v$version"
$branch = "release/$tag"
$title = "release: QueueMint $tag"
$versionName = "$version Review Bulk UX & Jira Sorting"

function Run {
    param(
        [Parameter(Mandatory = $true)][string]$Exe,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    Write-Host ""
    Write-Host "> $Exe $($Arguments -join ' ')" -ForegroundColor DarkGray
    & $Exe @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code $LASTEXITCODE : $Exe $($Arguments -join ' ')"
    }
}

function Capture {
    param(
        [Parameter(Mandatory = $true)][string]$Exe,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    $output = & $Exe @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        $text = ($output | Out-String).Trim()
        throw "Command failed with exit code $LASTEXITCODE : $Exe $($Arguments -join ' ')`n$text"
    }
    return (($output | Out-String).Trim())
}

function Write-Utf8NoBom {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )

    $normalized = $Content -replace "`r`n", "`n"
    $normalized = $normalized.TrimEnd("`r", "`n") + "`n"
    $encoding = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText([System.IO.Path]::GetFullPath($Path), $normalized, $encoding)
}

function Has-RemoteRef {
    param([string]$Ref)
    $result = @(& git ls-remote origin $Ref)
    if ($LASTEXITCODE -ne 0) { throw "Could not query remote ref: $Ref" }
    return $result.Count -gt 0
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "QueueMint $tag safe release" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

Run "gh" @("auth", "status")
Run "git" @("rev-parse", "--is-inside-work-tree")

$repoRoot = Capture "git" @("rev-parse", "--show-toplevel")
Set-Location $repoRoot

$remoteUrl = Capture "git" @("remote", "get-url", "origin")
if ($remoteUrl -notmatch 'github\.com[:/]hamedtkd/QueueMint(?:\.git)?$') {
    throw "Unexpected origin remote: $remoteUrl"
}

$currentBranch = Capture "git" @("branch", "--show-current")
if ($currentBranch -ne "main") {
    throw "Start from local main after restoring QueueMint-updated-source.zip. Current branch: $currentBranch"
}

Run "git" @("fetch", "origin", "--prune", "--tags")

$localHead = Capture "git" @("rev-parse", "HEAD")
$remoteMain = Capture "git" @("rev-parse", "origin/main")
if ($localHead -ne $remoteMain) {
    throw "Local main HEAD does not match origin/main. Local=$localHead Remote=$remoteMain"
}

# The previous failed attempt may have created a local v1.5.0 tag on the old main.
if (Has-RemoteRef "refs/tags/$tag") {
    throw "Remote tag $tag already exists. Stop and inspect GitHub before doing anything else."
}

$localTag = @(& git tag --list $tag)
if ($localTag.Count -gt 0) {
    Write-Host "Removing stale LOCAL tag $tag from the failed attempt..." -ForegroundColor Yellow
    Run "git" @("tag", "-d", $tag)
}

if (Has-RemoteRef "refs/heads/$branch") {
    throw "Remote branch $branch already exists. Stop and inspect it first."
}

$localReleaseBranch = @(& git branch --list $branch)
if ($localReleaseBranch.Count -gt 0) {
    Write-Host "Removing stale LOCAL branch $branch from the failed attempt..." -ForegroundColor Yellow
    Run "git" @("branch", "-D", $branch)
}

$requiredNewFiles = @(
    "src/features/jira-manager/manage-sorting.ts",
    "src/features/review/review-effective.ts",
    "tests/review-bulk-ux.test.mjs"
)

foreach ($path in $requiredNewFiles) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Updated source has not been restored. Missing: $path"
    }
}

$badRootFiles = @(
    Get-ChildItem -LiteralPath "." -File |
    Where-Object {
        $_.Name -eq "tVersion = (" -or
        $_.Name -eq "witch main" -or
        $_.Name -like "*Merging release PR*" -or
        $_.Name -like "*Running GitHub required checks*"
    }
)
if ($badRootFiles.Count -gt 0) {
    $badRootFiles | ForEach-Object { Write-Host "Unexpected file: [$($_.Name)]" }
    throw "Accidental root files detected."
}

$currentPackageVersion = Capture "node" @("-p", "require('./package.json').version")
$currentManifestVersion = Capture "node" @("-p", "require('./public/manifest.json').version")
if ($currentPackageVersion -ne $baseVersion -or $currentManifestVersion -ne $baseVersion) {
    throw "Expected restored source at $baseVersion. package=$currentPackageVersion manifest=$currentManifestVersion"
}

$statusBefore = @(& git status --porcelain)
if ($statusBefore.Count -eq 0) {
    throw "No feature changes detected. Restore QueueMint-updated-source.zip over the clone before running this script."
}

Write-Host ""
Write-Host "Feature changes detected. Creating release branch..." -ForegroundColor Green
Run "git" @("switch", "-c", $branch)

# Update package.json, package-lock.json and manifest with Node.
# We intentionally do not use `npm version` because this release starts from a dirty working tree containing the feature changes.
$versionScript = @'
const fs = require("fs");
const version = process.argv[1];
const versionName = process.argv[2];
function read(path) { return JSON.parse(fs.readFileSync(path, "utf8")); }
function write(path, value) { fs.writeFileSync(path, JSON.stringify(value, null, 2) + "\n", "utf8"); }
const pkg = read("package.json");
pkg.version = version;
write("package.json", pkg);
const lock = read("package-lock.json");
lock.version = version;
if (!lock.packages || !lock.packages[""]) throw new Error("package-lock root package entry is missing");
lock.packages[""].version = version;
write("package-lock.json", lock);
const manifest = read("public/manifest.json");
manifest.version = version;
manifest.version_name = versionName;
write("public/manifest.json", manifest);
'@
Run "node" @("--input-type=commonjs", "-e", $versionScript, $version, $versionName)

$readmePath = "README.md"
$readme = [System.IO.File]::ReadAllText([System.IO.Path]::GetFullPath($readmePath))
$readme = [regex]::Replace($readme, 'Current stable release: \*\*v[0-9]+\.[0-9]+\.[0-9]+\*\*\.', "Current stable release: **$tag**.")
$readme = [regex]::Replace($readme, 'Current release line: \*\*[^*\r\n]+\*\*\.', "Current release line: **$tag Review Bulk UX & Jira Sorting**.")
$readme = [regex]::Replace($readme, 'Current release: \*\*v[0-9]+\.[0-9]+\.[0-9]+\*\*\.[^\r\n]*', "Current release: **$tag**. Safe Review batch defaults, effective assignee previews, assign-to-me AI prompts, Jira issue sorting, and issue-type visuals are part of the supported release line.")
if (-not $readme.Contains("Current stable release: **$tag**.")) {
    throw "README release metadata was not updated."
}
Write-Utf8NoBom $readmePath $readme

$changelogPath = "CHANGELOG.md"
$changelog = [System.IO.File]::ReadAllText([System.IO.Path]::GetFullPath($changelogPath))
if ($changelog -notmatch "##\s+$([regex]::Escape($version))\b") {
    $entry = @"
## $version - Review Bulk UX and Jira Sorting

- Added safe No change / No batch default behavior to Review batch settings.
- Fixed effective assignee previews with Jira display names, avatars, inheritance indicators, and explicit Unassigned states.
- Aligned effective label previews with Jira creation behavior.
- Added Assign generated issues to me for AI bulk prompts using the exact authenticated Jira identity.
- Added configurable sorting by updated time and numeric Jira issue number.
- Applied sorting before pagination and consistently inside board lanes.
- Added Jira issue-type icons to Manage Jira Bulk Edit while preserving No change.
- Added regression coverage for batch defaults, effective assignees, AI prompt assignment, sorting, pagination, board ordering, and issue-type visuals.
"@
    $changelog = [regex]::Replace($changelog, '\A# Changelog\s*', "# Changelog`n`n$entry`n`n", 1)
    Write-Utf8NoBom $changelogPath $changelog
}

# Validate versions WITHOUT PowerShell ConvertFrom-Json on package-lock.json.
$packageVersion = Capture "node" @("-p", "require('./package.json').version")
$lockVersion = Capture "node" @("-p", "require('./package-lock.json').version")
$lockRootVersion = Capture "node" @("-p", "require('./package-lock.json').packages[''].version")
$manifestVersion = Capture "node" @("-p", "require('./public/manifest.json').version")
$manifestVersionName = Capture "node" @("-p", "require('./public/manifest.json').version_name")

if ($packageVersion -ne $version) { throw "package.json version mismatch: $packageVersion" }
if ($lockVersion -ne $version) { throw "package-lock.json version mismatch: $lockVersion" }
if ($lockRootVersion -ne $version) { throw "package-lock root version mismatch: $lockRootVersion" }
if ($manifestVersion -ne $version) { throw "manifest version mismatch: $manifestVersion" }
if (-not $manifestVersionName.StartsWith("$version ")) { throw "manifest version_name mismatch: $manifestVersionName" }

Write-Host ""
Write-Host "Running clean install and full verification..." -ForegroundColor Cyan
Run "npm" @("ci")
Run "npm" @("run", "verify")

# Do not commit TypeScript incremental build output if it changed during verification.
$trackedBuildInfo = @(& git ls-files "tsconfig.app.tsbuildinfo")
if ($trackedBuildInfo.Count -gt 0) {
    Run "git" @("restore", "--source=origin/main", "--", "tsconfig.app.tsbuildinfo")
}

Run "git" @("add", "-A")
Run "git" @("diff", "--cached", "--check")

$staged = @(& git diff --cached --name-only)
if ($staged.Count -eq 0) {
    throw "Nothing is staged. The release cannot continue."
}

Write-Host ""
Write-Host "Release diff:" -ForegroundColor Cyan
Run "git" @("diff", "--cached", "--stat")
Run "git" @("diff", "--cached", "--name-status")

Run "git" @("commit", "-m", $title)

$dirtyAfterCommit = @(& git status --porcelain)
if ($dirtyAfterCommit.Count -gt 0) {
    $dirtyAfterCommit | ForEach-Object { Write-Host "  $_" }
    throw "Working tree is not clean after commit."
}

Run "git" @("push", "-u", "origin", $branch)

$prBody = @"
QueueMint $tag feature release.

## Included

- Safe No change / No batch default behavior in Review batch settings.
- Correct effective assignee preview using issue assignee or batch default.
- Jira avatars and display names in Review cards and tables.
- Effective label preview aligned with Jira creation behavior.
- Assign generated issues to me option for AI bulk prompts.
- Manage Jira sorting by updated time or numeric issue number.
- Sorting before pagination and within board lanes.
- Jira issue-type icons in Manage Jira Bulk Edit.
- Regression tests for the new Review, AI prompt, sorting, and issue-type behavior.

## Validation

- npm ci
- npm run verify
- architecture check
- TypeScript typecheck
- regression tests
- production build
- public release audit
"@

$prUrl = Capture "gh" @("pr", "create", "--repo", $repo, "--base", "main", "--head", $branch, "--title", $title, "--body", $prBody)
if (-not $prUrl) { throw "PR creation returned no URL." }
Write-Host "PR created: $prUrl" -ForegroundColor Green

$prNumber = Capture "gh" @("pr", "view", $prUrl, "--repo", $repo, "--json", "number", "--jq", ".number")
if (-not $prNumber) { throw "Could not resolve PR number." }

Write-Host ""
Write-Host "Waiting for PR checks..." -ForegroundColor Cyan
Start-Sleep -Seconds 8
Run "gh" @("pr", "checks", $prNumber, "--repo", $repo, "--watch", "--interval", "10")

Write-Host ""
Write-Host "Merging PR #$prNumber..." -ForegroundColor Cyan
Run "gh" @("pr", "merge", $prNumber, "--repo", $repo, "--merge")

Run "git" @("fetch", "origin", "--prune")
Run "git" @("switch", "main")
Run "git" @("reset", "--hard", "origin/main")

$mergeSha = Capture "git" @("rev-parse", "HEAD")
$originMainSha = Capture "git" @("rev-parse", "origin/main")
if ($mergeSha -ne $originMainSha) { throw "Local main is not synchronized with origin/main." }

$mergedVersion = Capture "node" @("-p", "require('./package.json').version")
$mergedManifestVersion = Capture "node" @("-p", "require('./public/manifest.json').version")
if ($mergedVersion -ne $version -or $mergedManifestVersion -ne $version) {
    throw "Merged main does not contain version $version."
}
foreach ($path in $requiredNewFiles) {
    if (-not (Test-Path -LiteralPath $path)) { throw "Merged main is missing $path" }
}

# Remove local release branch if it still exists. Remote cleanup is best-effort after merge.
& git push origin --delete $branch 2>$null
$localReleaseBranchAfterMerge = @(& git branch --list $branch)
if ($localReleaseBranchAfterMerge.Count -gt 0) {
    Run "git" @("branch", "-D", $branch)
}

if (Has-RemoteRef "refs/tags/$tag") {
    throw "Remote tag $tag unexpectedly already exists after merge."
}

Run "git" @("tag", "-a", $tag, "-m", "QueueMint $tag")
Run "git" @("push", "origin", $tag)

Write-Host ""
Write-Host "Waiting for release.yml..." -ForegroundColor Cyan
$releaseRun = $null
for ($i = 0; $i -lt 60; $i++) {
    $runsText = Capture "gh" @("run", "list", "--repo", $repo, "--workflow", "release.yml", "--event", "push", "--limit", "20", "--json", "databaseId,headSha,status,conclusion,url,createdAt")
    if ($runsText) {
        $runs = @($runsText | ConvertFrom-Json)
        $releaseRun = $runs |
            Where-Object { $_.headSha -eq $mergeSha } |
            Sort-Object createdAt -Descending |
            Select-Object -First 1
        if ($releaseRun) { break }
    }
    Start-Sleep -Seconds 3
}
if (-not $releaseRun) { throw "Release workflow did not appear for commit $mergeSha." }

Write-Host "Release workflow: $($releaseRun.url)" -ForegroundColor Green
Run "gh" @("run", "watch", ([string]$releaseRun.databaseId), "--repo", $repo, "--exit-status")

$releaseText = Capture "gh" @("release", "view", $tag, "--repo", $repo, "--json", "tagName,name,url,assets")
$release = $releaseText | ConvertFrom-Json
$assetNames = @($release.assets | ForEach-Object { $_.name })
$expectedAssets = @("QueueMint-extension.zip", "queuemint-$tag.zip")
foreach ($asset in $expectedAssets) {
    if ($assetNames -notcontains $asset) { throw "Missing release asset: $asset" }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "QueueMint $tag RELEASE COMPLETE" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "PR:      $prUrl"
Write-Host "Commit:  $mergeSha"
Write-Host "Tag:     $tag"
Write-Host "Release: $($release.url)"
Write-Host "Assets:"
$assetNames | ForEach-Object { Write-Host "  - $_" }
