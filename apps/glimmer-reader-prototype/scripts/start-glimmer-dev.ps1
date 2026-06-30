$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$NodePath = (Get-Command node.exe -ErrorAction Stop).Source
$ViteEntry = Join-Path $ProjectRoot "node_modules\vite\bin\vite.js"
$LogDir = Join-Path $ProjectRoot "tmp"
$OutLog = Join-Path $LogDir "dev-server.out"
$ErrLog = Join-Path $LogDir "dev-server.err"
$HostName = "127.0.0.1"
$Port = 3002

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Test-GlimmerDevServer {
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $connect = $client.BeginConnect($HostName, $Port, $null, $null)
    $connected = $connect.AsyncWaitHandle.WaitOne(1000, $false)
    if ($connected) {
      $client.EndConnect($connect)
      $client.Close()
      return $true
    }
    $client.Close()
  } catch {
    return $false
  }

  return $false
}

if (Test-GlimmerDevServer) {
  Write-Host "Glimmer Reader dev server is already running at http://$HostName`:$Port/"
  exit 0
}

if (!(Test-Path $ViteEntry)) {
  throw "Vite entry was not found at $ViteEntry. Run npm install in $ProjectRoot first."
}

$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = $NodePath
$processInfo.Arguments = "`"$ViteEntry`" --host $HostName --port $Port --strictPort"
$processInfo.WorkingDirectory = $ProjectRoot
$processInfo.UseShellExecute = $false
$processInfo.CreateNoWindow = $true
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true

$seenEnvKeys = @{}
foreach ($key in @($processInfo.EnvironmentVariables.Keys)) {
  $lowerKey = $key.ToLowerInvariant()
  if ($seenEnvKeys.ContainsKey($lowerKey)) {
    $processInfo.EnvironmentVariables.Remove($key)
  } else {
    $seenEnvKeys[$lowerKey] = $true
  }
}

$process = [System.Diagnostics.Process]::Start($processInfo)

Register-ObjectEvent -InputObject $process -EventName OutputDataReceived -Action {
  if ($EventArgs.Data) {
    Add-Content -LiteralPath $Event.MessageData -Value $EventArgs.Data
  }
} -MessageData $OutLog | Out-Null

Register-ObjectEvent -InputObject $process -EventName ErrorDataReceived -Action {
  if ($EventArgs.Data) {
    Add-Content -LiteralPath $Event.MessageData -Value $EventArgs.Data
  }
} -MessageData $ErrLog | Out-Null

$process.BeginOutputReadLine()
$process.BeginErrorReadLine()

for ($attempt = 1; $attempt -le 20; $attempt++) {
  Start-Sleep -Milliseconds 500

  if ($process.HasExited) {
    $errorText = if (Test-Path $ErrLog) { Get-Content -LiteralPath $ErrLog -Raw } else { "" }
    throw "Glimmer Reader dev server exited early. $errorText"
  }

  if (Test-GlimmerDevServer) {
    Write-Host "Glimmer Reader dev server started at http://$HostName`:$Port/"
    exit 0
  }
}

throw "Glimmer Reader dev server did not become ready on http://$HostName`:$Port/."
