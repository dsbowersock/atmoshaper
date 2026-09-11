# Phase 4 Round 18 Immutable-Subject Successor Receipt

Verified: 2026-09-11

This tracked successor receipt attests the completed Round 18 subject, not the
later commit that adds this file. It makes the final subject evidence available
from a fresh checkout without treating a mutable working tree or ignored handoff
as the only authority.

## Immutable subject

- Commit: `f10773c7c94c9db9e4059a82dd45c5195fb83dc9`
- Tree: `78b1b769413053bfb798038e31a6b4a21e8a52b9`

## Final subject results

The repository inventory reported 1,925 tracked files, 47,585,417 Git blob
bytes, inventory SHA-256
`602f6515f067ce17c1a9aa9941202192dd9b5f445732944b61ff42d89849e2da`,
zero forbidden tracked paths, and CRLF-serialized output SHA-256
`5965e5c4f18645d917543dcfc5ea2707475191216fff88531749cec09933a32f`.

| Audit | Findings | Uncertainties | CRLF-serialized output SHA-256 | Deletion authority |
| --- | ---: | ---: | --- | --- |
| Dead code | 1,570 | 211 | `59f165de4b30ecf2b12445f6d717275fbccb1b602fd1d42cd61a7bbb70f62258` | `false` |
| Dependency | 2,868 | 21 | `71bde6570458599dd4dd8edf2aa79f6fccb22aff7ca1e224244874bb7fcaa146` | `false` |
| Asset | 561 | 11,314 | `7a61321fdc1d4e2a171c858fe84db7833435855ec4dac817e5efbe169a775deb` | `false` |
| Environment | 587 | 252 | `ca938f5a87a09cb685401c4983d9d4ec7255939d5307b92f348941a7a2157605` | `false` |

The brand audit reported zero missing and zero unclassified references, with
CRLF-serialized output SHA-256
`50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`.
Every cleanup report retained `deletionAuthority: false`.

## Fresh-checkout reproduction

Run the following in PowerShell 7. It checks out the immutable subject, installs
the locked dependencies without lifecycle scripts, preserves every stdout line
boundary while serializing it as UTF-8 without a BOM and CRLF line endings, and
compares the resulting values with this attestation. Native-command failures
stop the comparison.

```powershell
$ErrorActionPreference = 'Stop'
$subject = 'f10773c7c94c9db9e4059a82dd45c5195fb83dc9'
$subjectTree = '78b1b769413053bfb798038e31a6b4a21e8a52b9'
$runId = [guid]::NewGuid().ToString('N')
$checkout = Join-Path ([IO.Path]::GetTempPath()) "atmoshaper-round-18-$runId"
$captureDirectory = Join-Path $checkout '.round-18-receipt-output'

git clone https://github.com/dsbowersock/atmoshaper.git $checkout
if ($LASTEXITCODE -ne 0) { throw 'git clone failed' }
git -C $checkout checkout --detach $subject
if ($LASTEXITCODE -ne 0) { throw 'git checkout failed' }
New-Item -ItemType Directory -Force -Path $captureDirectory | Out-Null

Push-Location $checkout
try {
  npm ci --ignore-scripts
  if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' }

  function Invoke-CrlfCapture {
    param(
      [Parameter(Mandatory)] [string] $ScriptName,
      [Parameter(Mandatory)] [string] $OutputName
    )

    $lines = @(& npm run --silent $ScriptName)
    if ($LASTEXITCODE -ne 0) { throw "$ScriptName failed" }
    $serialized = ($lines -join "`r`n") + "`r`n"
    $outputPath = Join-Path $captureDirectory $OutputName
    [IO.File]::WriteAllText($outputPath, $serialized, [Text.UTF8Encoding]::new($false))
    [pscustomobject]@{
      Json = (($lines -join "`n") | ConvertFrom-Json)
      OutputSha256 = (Get-FileHash -LiteralPath $outputPath -Algorithm SHA256).Hash.ToLowerInvariant()
    }
  }

  $inventory = Invoke-CrlfCapture 'repository:inventory' 'inventory.json'
  $dead = Invoke-CrlfCapture 'dead-code:audit' 'dead-code.json'
  $dependency = Invoke-CrlfCapture 'dependency:audit' 'dependency.json'
  $asset = Invoke-CrlfCapture 'asset:audit' 'asset.json'
  $environment = Invoke-CrlfCapture 'env:audit' 'environment.json'
  $brand = Invoke-CrlfCapture 'brand:audit' 'brand.json'

  $auditInventoryHashes = @(
    $dead.Json.inventorySha256
    $dependency.Json.inventorySha256
    $asset.Json.inventorySha256
    $environment.Json.inventorySha256
  ) | Sort-Object -Unique

  $actual = [ordered]@{
    SubjectCommit = (git rev-parse HEAD).Trim()
    SubjectTree = (git rev-parse 'HEAD^{tree}').Trim()
    TrackedFileCount = [int] $inventory.Json.trackedFileCount
    TotalTrackedBytes = [int64] $inventory.Json.totalTrackedBytes
    InventorySha256 = [string] $inventory.Json.inventorySha256
    InventoryOutputSha256 = $inventory.OutputSha256
    ForbiddenTrackedPathCount = @($inventory.Json.forbiddenTrackedPaths).Count
    AuditInventorySha256 = if ($auditInventoryHashes.Count -eq 1) { $auditInventoryHashes[0] } else { $auditInventoryHashes -join ',' }
    DeadFindingCount = [int] $dead.Json.summary.findingCount
    DeadUncertaintyCount = [int] $dead.Json.summary.uncertaintyCount
    DeadOutputSha256 = $dead.OutputSha256
    DeadDeletionAuthority = [bool] $dead.Json.deletionAuthority
    DependencyFindingCount = [int] $dependency.Json.summary.findingCount
    DependencyUncertaintyCount = [int] $dependency.Json.summary.uncertaintyCount
    DependencyOutputSha256 = $dependency.OutputSha256
    DependencyDeletionAuthority = [bool] $dependency.Json.deletionAuthority
    AssetFindingCount = [int] $asset.Json.summary.findingCount
    AssetUncertaintyCount = [int] $asset.Json.summary.uncertaintyCount
    AssetOutputSha256 = $asset.OutputSha256
    AssetDeletionAuthority = [bool] $asset.Json.deletionAuthority
    EnvironmentFindingCount = [int] $environment.Json.summary.findingCount
    EnvironmentUncertaintyCount = [int] $environment.Json.summary.uncertaintyCount
    EnvironmentOutputSha256 = $environment.OutputSha256
    EnvironmentDeletionAuthority = [bool] $environment.Json.deletionAuthority
    BrandMissingCount = @($brand.Json.missing).Count
    BrandUnclassifiedCount = @($brand.Json.unclassified).Count
    BrandOutputSha256 = $brand.OutputSha256
  }

  $expected = [ordered]@{
    SubjectCommit = $subject
    SubjectTree = $subjectTree
    TrackedFileCount = 1925
    TotalTrackedBytes = 47585417
    InventorySha256 = '602f6515f067ce17c1a9aa9941202192dd9b5f445732944b61ff42d89849e2da'
    InventoryOutputSha256 = '5965e5c4f18645d917543dcfc5ea2707475191216fff88531749cec09933a32f'
    ForbiddenTrackedPathCount = 0
    AuditInventorySha256 = '602f6515f067ce17c1a9aa9941202192dd9b5f445732944b61ff42d89849e2da'
    DeadFindingCount = 1570
    DeadUncertaintyCount = 211
    DeadOutputSha256 = '59f165de4b30ecf2b12445f6d717275fbccb1b602fd1d42cd61a7bbb70f62258'
    DeadDeletionAuthority = $false
    DependencyFindingCount = 2868
    DependencyUncertaintyCount = 21
    DependencyOutputSha256 = '71bde6570458599dd4dd8edf2aa79f6fccb22aff7ca1e224244874bb7fcaa146'
    DependencyDeletionAuthority = $false
    AssetFindingCount = 561
    AssetUncertaintyCount = 11314
    AssetOutputSha256 = '7a61321fdc1d4e2a171c858fe84db7833435855ec4dac817e5efbe169a775deb'
    AssetDeletionAuthority = $false
    EnvironmentFindingCount = 587
    EnvironmentUncertaintyCount = 252
    EnvironmentOutputSha256 = 'ca938f5a87a09cb685401c4983d9d4ec7255939d5307b92f348941a7a2157605'
    EnvironmentDeletionAuthority = $false
    BrandMissingCount = 0
    BrandUnclassifiedCount = 0
    BrandOutputSha256 = '50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b'
  }

  $actualJson = $actual | ConvertTo-Json -Compress
  $expectedJson = $expected | ConvertTo-Json -Compress
  if (-not $actualJson.Equals($expectedJson, [StringComparison]::Ordinal)) {
    [pscustomobject]@{ Expected = $expected; Actual = $actual } | ConvertTo-Json -Depth 5
    throw 'Round 18 successor attestation mismatch'
  }
  $actual | Format-List
} finally {
  Pop-Location
}
```

## Self-reference boundary

This successor receipt does not and cannot attest its own tree. Repository
inventory identity covers every tracked blob, including this receipt and the
documents that link it; adding their hashes to themselves would change the tree
being described. The immutable subject commit and tree above remain reproducible,
while any later successor tree requires its own separately created attestation.
