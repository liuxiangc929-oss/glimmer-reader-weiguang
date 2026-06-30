$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$StartScript = Join-Path $ProjectRoot "scripts\start-glimmer-dev.ps1"
$TaskName = "GlimmerReaderDevServer"
$PowerShellPath = (Get-Command powershell.exe -ErrorAction Stop).Source

if (!(Test-Path $StartScript)) {
  throw "Startup script was not found at $StartScript."
}

function Install-StartupFolderFallback {
  $startupFolder = [Environment]::GetFolderPath("Startup")
  $startupCommand = Join-Path $startupFolder "$TaskName.cmd"
  $content = "@echo off`r`npowershell -NoProfile -ExecutionPolicy Bypass -File `"$StartScript`"`r`n"

  Set-Content -LiteralPath $startupCommand -Value $content -Encoding ASCII
  Write-Host "Installed Windows Startup folder fallback: $startupCommand"
}

try {
  $action = New-ScheduledTaskAction `
    -Execute $PowerShellPath `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$StartScript`"" `
    -WorkingDirectory $ProjectRoot

  $trigger = New-ScheduledTaskTrigger -AtLogOn
  $settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Hours 12) `
    -MultipleInstances IgnoreNew

  Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "Starts the Glimmer Reader V0.1 prototype dev server on http://127.0.0.1:3002/ after Windows logon." `
    -Force | Out-Null

  Write-Host "Installed Windows logon autostart task: $TaskName"
} catch {
  Write-Warning "Scheduled Task install failed, using Startup folder fallback. $($_.Exception.Message)"
  Install-StartupFolderFallback
}
