$port = 5174
$maxRetries = 4
$delayMs = 200
$ErrorActionPreference = 'Stop'

function Get-PortPids([int]$targetPort) {
  $lines = netstat -ano | findstr ":$targetPort"
  if (-not $lines) { return @() }

  $pids = @()
  foreach ($line in $lines) {
    $trimmed = ($line -replace '^\s+', '')
    $parts = $trimmed -split '\s+'
    if ($parts.Length -ge 5) {
      $procId = $parts[$parts.Length - 1]
      if ($procId -match '^\d+$') {
        $pids += [int]$procId
      }
    }
  }

  return $pids | Sort-Object -Unique
}

try {
  Write-Host "Freeing port $port..."

  $initialPids = Get-PortPids -targetPort $port
  if (-not $initialPids -or $initialPids.Count -eq 0) {
    Write-Host "No process was using port $port."
    Write-Host "Port $port is ready."
    exit 0
  }

  for ($attempt = 1; $attempt -le $maxRetries; $attempt++) {
    $pids = Get-PortPids -targetPort $port
    if (-not $pids -or $pids.Count -eq 0) {
      break
    }

    foreach ($procId in $pids) {
      & taskkill /PID $procId /F | Out-Null
      if ($LASTEXITCODE -eq 0) {
        Write-Host "Killed process with PID $procId"
      }
    }

    Start-Sleep -Milliseconds $delayMs
  }

  $remaining = Get-PortPids -targetPort $port
  if ($remaining -and $remaining.Count -gt 0) {
    Write-Host "Port $port is still in use by PID(s): $($remaining -join ', ')"
    exit 1
  }

  Write-Host "Port $port was freed."
  Write-Host "Port $port is ready."
  exit 0
}
catch {
  Write-Host "Error freeing port $port"
  Write-Host $_
  exit 1
}
