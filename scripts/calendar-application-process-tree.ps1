#requires -Version 7.0
[CmdletBinding(DefaultParameterSetName = 'Stop')]
param(
    [Parameter(Mandatory, ParameterSetName = 'Stop')]
    [ValidateRange(1, 2147483647)]
    [int]$OwnedPid,
    [Parameter(Mandatory, ParameterSetName = 'Check')]
    [switch]$Check
)

# This local helper receives only the launcher's owned PID, never application data.
# PowerShell 7 supplies .NET tree termination without taskkill's unbounded delay.
$ErrorActionPreference = 'Stop'
if (!$IsWindows -or $null -eq [System.Diagnostics.Process].GetMethod('Kill', [type[]]@([bool]))) {
    throw 'Calendar acceptance requires PowerShell 7 tree termination on Windows.'
}
if ($Check) { exit 0 }

try { $owned = [System.Diagnostics.Process]::GetProcessById($OwnedPid) }
catch [System.ArgumentException] { exit 0 } # An already-exited owned PID needs no termination.
try {
    if (!$owned.HasExited) {
        $owned.Kill($true)
        if (!$owned.WaitForExit(2000)) { throw 'Calendar acceptance owned process did not exit.' }
    }
}
finally { $owned.Dispose() }
