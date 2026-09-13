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
stop the comparison. Audit commands must also produce empty stderr, required
audit contract properties must exist with their exact JSON types, and cleanup
removes the bounded temporary checkout without replacing an earlier failure.

```powershell
$ErrorActionPreference = 'Stop'
$subject = 'f10773c7c94c9db9e4059a82dd45c5195fb83dc9'
$subjectTree = '78b1b769413053bfb798038e31a6b4a21e8a52b9'
$runId = [guid]::NewGuid().ToString('N')
$checkoutName = "atmoshaper-round-18-$runId"
$tempRoot = [IO.Path]::GetFullPath(
  (Resolve-Path -LiteralPath ([IO.Path]::GetTempPath()) -ErrorAction Stop).Path
).TrimEnd(
  [IO.Path]::DirectorySeparatorChar,
  [IO.Path]::AltDirectorySeparatorChar
)
$checkout = [IO.Path]::GetFullPath((Join-Path $tempRoot $checkoutName))
$checkoutPrefix = $tempRoot + [IO.Path]::DirectorySeparatorChar
if (
  -not $checkout.StartsWith($checkoutPrefix, [StringComparison]::OrdinalIgnoreCase) -or
  [IO.Path]::GetFileName($checkout) -cne $checkoutName
) {
  throw 'Refusing unsafe temporary checkout path'
}
$captureDirectory = Join-Path $checkout '.round-18-receipt-output'
$locationPushed = $false
$runError = $null

try {
  git clone https://github.com/dsbowersock/atmoshaper.git $checkout
  if ($LASTEXITCODE -ne 0) { throw 'git clone failed' }
  git -C $checkout checkout --detach $subject
  if ($LASTEXITCODE -ne 0) { throw 'git checkout failed' }
  New-Item -ItemType Directory -Force -Path $captureDirectory | Out-Null

  Push-Location $checkout
  $locationPushed = $true
  npm ci --ignore-scripts
  if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' }

  function Invoke-CrlfCapture {
    param(
      [Parameter(Mandatory)] [string] $ScriptName,
      [Parameter(Mandatory)] [string] $OutputName
    )

    $stderrPath = Join-Path $captureDirectory "$OutputName.stderr"
    $lines = @(& npm run --silent $ScriptName 2> $stderrPath)
    $exitCode = $LASTEXITCODE
    $stderrLength = (Get-Item -LiteralPath $stderrPath).Length
    if ($exitCode -ne 0) { throw "$ScriptName failed" }
    if ($stderrLength -ne 0) { throw "$ScriptName wrote to stderr" }
    $serialized = ($lines -join "`r`n") + "`r`n"
    $outputPath = Join-Path $captureDirectory $OutputName
    [IO.File]::WriteAllText($outputPath, $serialized, [Text.UTF8Encoding]::new($false))
    [pscustomobject]@{
      Json = (($lines -join "`n") | ConvertFrom-Json)
      OutputSha256 = (Get-FileHash -LiteralPath $outputPath -Algorithm SHA256).Hash.ToLowerInvariant()
    }
  }

  function Get-RequiredJsonProperty {
    param(
      [Parameter(Mandatory)] [psobject] $InputObject,
      [Parameter(Mandatory)] [string] $PropertyName,
      [Parameter(Mandatory)] [type] $ExpectedType,
      [Parameter(Mandatory)] [string] $Context
    )

    $property = $InputObject.PSObject.Properties[$PropertyName]
    if ($null -eq $property) {
      throw "$Context is missing required property $PropertyName"
    }
    $value = $property.Value
    if ($null -eq $value -or $value.GetType() -ne $ExpectedType) {
      throw "$Context property $PropertyName has the wrong JSON type"
    }
    $value
  }

  $inventory = Invoke-CrlfCapture 'repository:inventory' 'inventory.json'
  $dead = Invoke-CrlfCapture 'dead-code:audit' 'dead-code.json'
  $dependency = Invoke-CrlfCapture 'dependency:audit' 'dependency.json'
  $asset = Invoke-CrlfCapture 'asset:audit' 'asset.json'
  $environment = Invoke-CrlfCapture 'env:audit' 'environment.json'
  $brand = Invoke-CrlfCapture 'brand:audit' 'brand.json'

  $trackedFileCount = Get-RequiredJsonProperty $inventory.Json 'trackedFileCount' ([long]) 'inventory'
  $totalTrackedBytes = Get-RequiredJsonProperty $inventory.Json 'totalTrackedBytes' ([long]) 'inventory'
  $inventorySha256 = Get-RequiredJsonProperty $inventory.Json 'inventorySha256' ([string]) 'inventory'
  $forbiddenTrackedPaths = Get-RequiredJsonProperty $inventory.Json 'forbiddenTrackedPaths' ([object[]]) 'inventory'
  $deadSummary = Get-RequiredJsonProperty $dead.Json 'summary' ([System.Management.Automation.PSCustomObject]) 'dead-code audit'
  $deadInventorySha256 = Get-RequiredJsonProperty $dead.Json 'inventorySha256' ([string]) 'dead-code audit'
  $deadDeletionAuthority = Get-RequiredJsonProperty $dead.Json 'deletionAuthority' ([bool]) 'dead-code audit'
  $deadFindingCount = Get-RequiredJsonProperty $deadSummary 'findingCount' ([long]) 'dead-code audit summary'
  $deadUncertaintyCount = Get-RequiredJsonProperty $deadSummary 'uncertaintyCount' ([long]) 'dead-code audit summary'
  $dependencySummary = Get-RequiredJsonProperty $dependency.Json 'summary' ([System.Management.Automation.PSCustomObject]) 'dependency audit'
  $dependencyInventorySha256 = Get-RequiredJsonProperty $dependency.Json 'inventorySha256' ([string]) 'dependency audit'
  $dependencyDeletionAuthority = Get-RequiredJsonProperty $dependency.Json 'deletionAuthority' ([bool]) 'dependency audit'
  $dependencyFindingCount = Get-RequiredJsonProperty $dependencySummary 'findingCount' ([long]) 'dependency audit summary'
  $dependencyUncertaintyCount = Get-RequiredJsonProperty $dependencySummary 'uncertaintyCount' ([long]) 'dependency audit summary'
  $assetSummary = Get-RequiredJsonProperty $asset.Json 'summary' ([System.Management.Automation.PSCustomObject]) 'asset audit'
  $assetInventorySha256 = Get-RequiredJsonProperty $asset.Json 'inventorySha256' ([string]) 'asset audit'
  $assetDeletionAuthority = Get-RequiredJsonProperty $asset.Json 'deletionAuthority' ([bool]) 'asset audit'
  $assetFindingCount = Get-RequiredJsonProperty $assetSummary 'findingCount' ([long]) 'asset audit summary'
  $assetUncertaintyCount = Get-RequiredJsonProperty $assetSummary 'uncertaintyCount' ([long]) 'asset audit summary'
  $environmentSummary = Get-RequiredJsonProperty $environment.Json 'summary' ([System.Management.Automation.PSCustomObject]) 'environment audit'
  $environmentInventorySha256 = Get-RequiredJsonProperty $environment.Json 'inventorySha256' ([string]) 'environment audit'
  $environmentDeletionAuthority = Get-RequiredJsonProperty $environment.Json 'deletionAuthority' ([bool]) 'environment audit'
  $environmentFindingCount = Get-RequiredJsonProperty $environmentSummary 'findingCount' ([long]) 'environment audit summary'
  $environmentUncertaintyCount = Get-RequiredJsonProperty $environmentSummary 'uncertaintyCount' ([long]) 'environment audit summary'
  $brandMissing = Get-RequiredJsonProperty $brand.Json 'missing' ([object[]]) 'brand audit'
  $brandUnclassified = Get-RequiredJsonProperty $brand.Json 'unclassified' ([object[]]) 'brand audit'

  $auditInventoryHashes = @(
    $deadInventorySha256
    $dependencyInventorySha256
    $assetInventorySha256
    $environmentInventorySha256
  ) | Sort-Object -Unique

  $actual = [ordered]@{
    SubjectCommit = (git rev-parse HEAD).Trim()
    SubjectTree = (git rev-parse 'HEAD^{tree}').Trim()
    TrackedFileCount = $trackedFileCount
    TotalTrackedBytes = $totalTrackedBytes
    InventorySha256 = $inventorySha256
    InventoryOutputSha256 = $inventory.OutputSha256
    ForbiddenTrackedPathCount = $forbiddenTrackedPaths.Count
    AuditInventorySha256 = if ($auditInventoryHashes.Count -eq 1) { $auditInventoryHashes[0] } else { $auditInventoryHashes -join ',' }
    DeadFindingCount = $deadFindingCount
    DeadUncertaintyCount = $deadUncertaintyCount
    DeadOutputSha256 = $dead.OutputSha256
    DeadDeletionAuthority = $deadDeletionAuthority
    DependencyFindingCount = $dependencyFindingCount
    DependencyUncertaintyCount = $dependencyUncertaintyCount
    DependencyOutputSha256 = $dependency.OutputSha256
    DependencyDeletionAuthority = $dependencyDeletionAuthority
    AssetFindingCount = $assetFindingCount
    AssetUncertaintyCount = $assetUncertaintyCount
    AssetOutputSha256 = $asset.OutputSha256
    AssetDeletionAuthority = $assetDeletionAuthority
    EnvironmentFindingCount = $environmentFindingCount
    EnvironmentUncertaintyCount = $environmentUncertaintyCount
    EnvironmentOutputSha256 = $environment.OutputSha256
    EnvironmentDeletionAuthority = $environmentDeletionAuthority
    BrandMissingCount = $brandMissing.Count
    BrandUnclassifiedCount = $brandUnclassified.Count
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
} catch {
  $runError = $_
} finally {
  $cleanupErrors = [Collections.Generic.List[object]]::new()
  if ($locationPushed) {
    try {
      Pop-Location
      $locationPushed = $false
    } catch {
      [void] $cleanupErrors.Add($_)
    }
  }
  try {
    $checkoutExists = Test-Path -LiteralPath $checkout -ErrorAction Stop
    if ($checkoutExists) {
      if (-not (Test-Path -LiteralPath $checkout -PathType Container -ErrorAction Stop)) {
        throw 'Refusing non-directory temporary checkout removal'
      }
      $resolvedCheckout = [IO.Path]::GetFullPath(
        (Resolve-Path -LiteralPath $checkout -ErrorAction Stop).Path
      )
      if (
        -not $resolvedCheckout.StartsWith(
          $checkoutPrefix,
          [StringComparison]::OrdinalIgnoreCase
        ) -or
        [IO.Path]::GetFileName($resolvedCheckout) -cne $checkoutName
      ) {
        throw 'Refusing unsafe temporary checkout removal'
      }
      Remove-Item -LiteralPath $resolvedCheckout -Recurse -Force -ErrorAction Stop
    }
  } catch {
    [void] $cleanupErrors.Add($_)
  }
  if ($cleanupErrors.Count -gt 0) {
    if ($null -eq $runError) {
      $runError = $cleanupErrors[0]
    } else {
      foreach ($cleanupError in $cleanupErrors) {
        $cleanupMessage =
          "Temporary checkout cleanup also failed: $($cleanupError.Exception.Message)"
        Write-Warning -Message $cleanupMessage -WarningAction Continue
      }
    }
  }
}
if ($null -ne $runError) { throw $runError }
```

## Self-reference boundary

This successor receipt does not and cannot attest its own tree. Repository
inventory identity covers every tracked blob, including this receipt and the
documents that link it; adding their hashes to themselves would change the tree
being described. The immutable subject commit and tree above remain reproducible,
while any later successor tree requires its own separately created attestation.
