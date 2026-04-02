param(
  [switch]$Bootstrap
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

function Show-BackendSetupInstructions {
  Write-Host "" 
  Write-Host "Prepara backend con estos comandos:" -ForegroundColor Yellow
  Write-Host "cd backend"
  Write-Host "python -m venv .venv"
  Write-Host ".\.venv\Scripts\activate"
  Write-Host "pip install -r requirements.txt"
  Write-Host "alembic upgrade head"
  Write-Host ""
  Write-Host "O ejecuta bootstrap automatico:" -ForegroundColor Yellow
  Write-Host "powershell -ExecutionPolicy Bypass -File .\bootstrap_local.ps1"
}

$bootstrapEnabled = $Bootstrap -or ($env:COMERCIA_BOOTSTRAP -in @("1", "true", "TRUE", "yes", "YES"))

$backendVenv = Join-Path $PSScriptRoot "backend\.venv"
$backendPython = Join-Path $backendVenv "Scripts\python.exe"
$backendRequirements = Join-Path $PSScriptRoot "backend\requirements.txt"
$frontendNodeModules = Join-Path $PSScriptRoot "frontend\node_modules"

if (!(Test-Path $backendPython)) {
  if ($bootstrapEnabled) {
    Write-Host "backend/.venv no existe. Ejecutando bootstrap local..." -ForegroundColor Cyan
    powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "bootstrap_local.ps1")
  } else {
    Write-Host "Falta backend/.venv. No se puede iniciar backend." -ForegroundColor Red
    Show-BackendSetupInstructions
    exit 1
  }
}

if (!(Test-Path $frontendNodeModules)) {
  if ($bootstrapEnabled) {
    Write-Host "Faltan dependencias frontend. Ejecutando npm install en frontend..." -ForegroundColor Cyan
    Set-Location (Join-Path $PSScriptRoot "frontend")
    npm install
    Set-Location $PSScriptRoot
  } else {
    Write-Host "Falta frontend/node_modules. Ejecuta npm install en frontend o usa -Bootstrap." -ForegroundColor Red
    exit 1
  }
}

if (!(Test-Path $backendRequirements)) {
  Write-Host "No se encontro backend/requirements.txt" -ForegroundColor Red
  exit 1
}

$backendPort = 8000
$frontendPort = 5175

if (Test-PortInUse -Port $backendPort) {
  $newBackendPort = Get-FreePort -StartPort ($backendPort + 1)
  Write-Host "Puerto backend $backendPort ocupado. Se usara $newBackendPort." -ForegroundColor Yellow
  $backendPort = $newBackendPort
}

if (Test-PortInUse -Port $frontendPort) {
  $newFrontendPort = Get-FreePort -StartPort ($frontendPort + 1)
  Write-Host "Puerto frontend $frontendPort ocupado. Se usara $newFrontendPort." -ForegroundColor Yellow
  $frontendPort = $newFrontendPort
}

$backendScript = Join-Path $PSScriptRoot "start_backend_only.ps1"
$frontendScript = Join-Path $PSScriptRoot "start_frontend_only.ps1"
$backendApiUrl = "http://127.0.0.1:$backendPort"

Write-Host "Iniciando backend y frontend en nuevas ventanas..." -ForegroundColor Cyan
$backendArgs = @("-NoExit", "-ExecutionPolicy", "Bypass", "-File", $backendScript, "-Port", $backendPort)
if ($bootstrapEnabled) {
  $backendArgs += "-Bootstrap"
}
Start-Process powershell -ArgumentList $backendArgs | Out-Null
Start-Sleep -Seconds 1
$frontendArgs = @("-NoExit", "-ExecutionPolicy", "Bypass", "-File", $frontendScript, "-Port", $frontendPort, "-ApiUrl", $backendApiUrl)
Start-Process powershell -ArgumentList $frontendArgs | Out-Null

Write-Host ""
Write-Host "URLs utiles:" -ForegroundColor Yellow
Write-Host "- API docs:             http://127.0.0.1:$backendPort/docs"
Write-Host "- Health:               http://127.0.0.1:$backendPort/health"
Write-Host "- Landing ComerCia:     http://localhost:$frontendPort/comercia"
Write-Host "- Store REINPIA:        http://localhost:$frontendPort/store/reinpia"
Write-Host "- Login admin:          http://localhost:$frontendPort/login"
Write-Host "- Panel REINPIA global: http://localhost:$frontendPort/reinpia/dashboard"
Write-Host "- Backend API URL usada por frontend: $backendApiUrl"
Write-Host ""

Start-Sleep -Seconds 2
$healthUrl = "http://127.0.0.1:$backendPort/health"
$maxAttempts = 12
$attempt = 0
$healthy = $false

while (-not $healthy -and $attempt -lt $maxAttempts) {
  $attempt++
  try {
    $health = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 4
    if ($health.status) {
      Write-Host "Healthcheck backend OK: $($health.status) (intento $attempt/$maxAttempts)" -ForegroundColor Green
    } else {
      Write-Host "Healthcheck backend OK (intento $attempt/$maxAttempts)" -ForegroundColor Green
    }
    $healthy = $true
  } catch {
    if ($attempt -lt $maxAttempts) {
      Write-Host "Backend aun iniciando (intento $attempt/$maxAttempts). Reintentando..." -ForegroundColor DarkYellow
      Start-Sleep -Seconds 2
    }
  }
}

if (-not $healthy) {
  Write-Host "Healthcheck backend no respondio tras $maxAttempts intentos. Revisa la ventana de backend para detalles." -ForegroundColor Yellow
}
