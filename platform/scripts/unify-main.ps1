param(
  [string[]]$Branches = @(
    'sprint/0.1-enterprise-shell',
    'sprint/0.2-shell-wiring-ux',
    'sprint/0.3-jornada-form-integration',
    'sprint/1.5-consolidacao',
    'fix/freshchat-support',
    'fix/supabase-deploy-workflow'
  ),
  [string]$Remote = 'origin',
  [string]$BaseBranch = 'main',
  [switch]$Push,
  [switch]$RunTests,
  [switch]$SkipFetch,
  [switch]$AllowDirty,
  [switch]$Resume,
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'

function Write-Log {
  param(
    [string]$Message,
    [string]$Level = 'INFO'
  )

  $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  $line = "[$timestamp] [$Level] $Message"
  Write-Host $line
  Add-Content -Path $script:LogFile -Value $line
}

function Invoke-Git {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments,
    [switch]$AllowFailure,
    [switch]$Capture
  )

  $cmdText = 'git ' + ($Arguments -join ' ')
  Write-Log "EXEC $cmdText"

  if ($WhatIf) {
    return [pscustomobject]@{
      ExitCode = 0
      Output = @('[WhatIf] command not executed')
    }
  }

  $output = & git @Arguments 2>&1
  $exitCode = $LASTEXITCODE

  if ($output) {
    foreach ($line in $output) {
      Add-Content -Path $script:LogFile -Value ("    " + $line)
    }
  }

  if (-not $AllowFailure -and $exitCode -ne 0) {
    throw "Git command failed ($exitCode): $cmdText`n$($output -join "`n")"
  }

  return [pscustomobject]@{
    ExitCode = $exitCode
    Output = @($output)
  }
}

function Save-Checkpoint {
  param(
    [string]$Stage,
    [string]$CurrentBranch,
    [string[]]$MergedBranches,
    [hashtable]$Extra = @{}
  )

  $payload = [ordered]@{
    timestamp = (Get-Date).ToString('o')
    stage = $Stage
    baseBranch = $BaseBranch
    currentBranch = $CurrentBranch
    mergedBranches = $MergedBranches
    remainingBranches = @($Branches | Where-Object { $_ -notin $MergedBranches })
    logFile = $script:LogFile
    whatIf = [bool]$WhatIf
  }

  foreach ($key in $Extra.Keys) {
    $payload[$key] = $Extra[$key]
  }

  $json = $payload | ConvertTo-Json -Depth 6
  Set-Content -Path $script:CheckpointFile -Value $json
  Write-Log "CHECKPOINT saved: $Stage"
}

function Read-Checkpoint {
  if (-not (Test-Path $script:CheckpointFile)) {
    return $null
  }

  try {
    return Get-Content -Path $script:CheckpointFile -Raw | ConvertFrom-Json
  } catch {
    Write-Log "Could not parse checkpoint file, starting from scratch" 'WARN'
    return $null
  }
}

function Ensure-CleanTree {
  $status = Invoke-Git -Arguments @('status', '--short') -Capture
  $dirty = @($status.Output | Where-Object { $_ -and $_.Trim() })
  if ($dirty.Count -gt 0 -and -not $AllowDirty) {
    throw "Working tree is dirty. Commit or stash changes before running the unification script, or pass -AllowDirty explicitly."
  }

  if ($dirty.Count -gt 0) {
    Write-Log 'Working tree has local changes, but proceeding because -AllowDirty was provided.' 'WARN'
  }
}

function Ensure-BranchExists {
  param([string]$BranchName)

  $local = Invoke-Git -Arguments @('show-ref', '--verify', '--quiet', "refs/heads/$BranchName") -AllowFailure
  if ($local.ExitCode -eq 0) {
    return $BranchName
  }

  $remoteRef = "refs/remotes/$Remote/$BranchName"
  $remoteCheck = Invoke-Git -Arguments @('show-ref', '--verify', '--quiet', $remoteRef) -AllowFailure
  if ($remoteCheck.ExitCode -ne 0) {
    throw "Branch '$BranchName' was not found locally or on $Remote."
  }

  Write-Log "Creating local tracking branch for $BranchName"
  Invoke-Git -Arguments @('branch', '--track', $BranchName, "$Remote/$BranchName")
  return $BranchName
}

function New-SafetyBackup {
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $backupBranch = "backup/unify-$BaseBranch-$stamp"
  $backupTag = "checkpoint/unify-$BaseBranch-$stamp"

  Invoke-Git -Arguments @('branch', $backupBranch, 'HEAD')
  Invoke-Git -Arguments @('tag', $backupTag, 'HEAD')

  Write-Log "Safety backup branch created: $backupBranch"
  Write-Log "Safety checkpoint tag created: $backupTag"

  return [ordered]@{
    backupBranch = $backupBranch
    backupTag = $backupTag
  }
}

function Merge-Branch {
  param(
    [string]$BranchName,
    [string[]]$MergedBranches
  )

  Write-Log "Starting merge for $BranchName"
  $branchToMerge = Ensure-BranchExists -BranchName $BranchName
  $divergence = Invoke-Git -Arguments @('rev-list', '--left-right', '--count', "$BaseBranch...$branchToMerge") -Capture
  if ($divergence.Output.Count -gt 0) {
    Write-Log "Divergence $BaseBranch...$branchToMerge => $($divergence.Output[0])"
  }

  Save-Checkpoint -Stage "before-merge:$BranchName" -CurrentBranch $BaseBranch -MergedBranches $MergedBranches -Extra @{ targetBranch = $BranchName }
  $merge = Invoke-Git -Arguments @('merge', '--no-ff', $branchToMerge, '-m', "Merge branch '$BranchName' into $BaseBranch") -AllowFailure -Capture

  if ($merge.ExitCode -ne 0) {
    Save-Checkpoint -Stage "merge-conflict:$BranchName" -CurrentBranch $BaseBranch -MergedBranches $MergedBranches -Extra @{
      targetBranch = $BranchName
      mergeOutput = $merge.Output
    }
    throw "Merge conflict or failure while merging '$BranchName'. Check the checkpoint and log before proceeding."
  }

  Save-Checkpoint -Stage "after-merge:$BranchName" -CurrentBranch $BaseBranch -MergedBranches ($MergedBranches + $BranchName) -Extra @{ targetBranch = $BranchName }
}

function Invoke-Validation {
  if (-not $RunTests) {
    Write-Log 'Skipping validation because -RunTests was not provided.'
    return
  }

  if (-not (Test-Path 'package.json')) {
    Write-Log 'package.json not found, skipping npm-based validation.' 'WARN'
    return
  }

  Write-Log 'Running portal validation suite'
  if ($WhatIf) {
    Write-Log '[WhatIf] npm test not executed'
    return
  }

  $output = & npm test 2>&1
  $exitCode = $LASTEXITCODE
  foreach ($line in $output) {
    Add-Content -Path $script:LogFile -Value ("    " + $line)
  }

  if ($exitCode -ne 0) {
    Save-Checkpoint -Stage 'validation-failed' -CurrentBranch $BaseBranch -MergedBranches $script:MergedBranches -Extra @{ validationCommand = 'npm test' }
    throw "Validation failed after merge sequence. Inspect $script:LogFile for details."
  }

  Write-Log 'Validation completed successfully'
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $repoRoot

$logsDir = Join-Path $repoRoot 'platform\logging\git-unify'
if (-not (Test-Path $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$script:LogFile = Join-Path $logsDir "unify-$runId.log"
$script:CheckpointFile = Join-Path $logsDir "unify-$BaseBranch.checkpoint.json"
$script:MergedBranches = @()

Write-Log "Starting branch unification into $BaseBranch"
Write-Log "Repository root: $repoRoot"

$checkpoint = if ($Resume) { Read-Checkpoint } else { $null }
if ($checkpoint) {
  $script:MergedBranches = @($checkpoint.mergedBranches)
  Write-Log "Resuming from checkpoint stage '$($checkpoint.stage)'"
}

Ensure-CleanTree

if (-not $SkipFetch) {
  Invoke-Git -Arguments @('fetch', '--all', '--prune')
}

Invoke-Git -Arguments @('checkout', $BaseBranch)
Invoke-Git -Arguments @('pull', '--ff-only', $Remote, $BaseBranch)

if (-not $Resume) {
  $backup = New-SafetyBackup
  Save-Checkpoint -Stage 'baseline-ready' -CurrentBranch $BaseBranch -MergedBranches @() -Extra $backup
}

foreach ($branch in $Branches) {
  if ($branch -in $script:MergedBranches) {
    Write-Log "Skipping already merged branch from checkpoint: $branch"
    continue
  }

  Merge-Branch -BranchName $branch -MergedBranches $script:MergedBranches
  $script:MergedBranches += $branch
}

Invoke-Validation

if ($Push) {
  Save-Checkpoint -Stage 'before-push' -CurrentBranch $BaseBranch -MergedBranches $script:MergedBranches
  Invoke-Git -Arguments @('push', $Remote, $BaseBranch)
  Write-Log "Pushed $BaseBranch to $Remote"
}

Save-Checkpoint -Stage 'completed' -CurrentBranch $BaseBranch -MergedBranches $script:MergedBranches
Write-Log 'Branch unification completed successfully'
