param(
  [int]$Port = 5173,
  [string]$ApiUrl = "http://localhost:8000"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Test-PortInUse {
  param([int]$Port)
  $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
  return $null -ne $listener
}

function Get-FreePort {
  param([int]$StartPort)
  $port = $StartPort
  while (Test-PortInUse -Port $port) {
    $port++
  }
  return $port
}

$frontendPath = Join-Path $PSScriptRoot "frontend"
$nodeModules = Join-Path $frontendPath "node_modules"

if (!(Test-Path $nodeModules)) {
  Write-Host "Faltan dependencias frontend (frontend/node_modules)." -ForegroundColor Red
  Write-Host "Ejecuta: powershell -ExecutionPolicy Bypass -File .\bootstrap_local.ps1" -ForegroundColor Yellow
  exit 1
}

if (Test-PortInUse -Port $Port) {
  $nextPort = Get-FreePort -StartPort ($Port + 1)
  Write-Host "Puerto frontend $Port ocupado. Iniciando en $nextPort." -ForegroundColor Yellow
  $Port = $nextPort
}

Write-Host "Iniciando frontend en http://localhost:$Port" -ForegroundColor Green
Write-Host "API backend configurada en $ApiUrl" -ForegroundColor Cyan
Set-Location $frontendPath
if ($ApiUrl) {
  $env:VITE_API_URL = $ApiUrl
}
& npm run dev -- --host 0.0.0.0 --port $Port
