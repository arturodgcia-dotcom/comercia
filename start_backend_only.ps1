param(
  [int]$Port = 8000,
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

$backendVenv = Join-Path $PSScriptRoot "backend\.venv"
$backendPython = Join-Path $backendVenv "Scripts\python.exe"
$requirements = Join-Path $PSScriptRoot "backend\requirements.txt"
$bootstrapEnabled = $Bootstrap -or ($env:COMERCIA_BOOTSTRAP -in @("1", "true", "TRUE", "yes", "YES"))

if (!(Test-Path $backendPython)) {
  if ($bootstrapEnabled) {
    Write-Host "Creando backend/.venv e instalando requirements..." -ForegroundColor Cyan
    if (!(Test-Path $backendVenv)) {
      python -m venv $backendVenv
    }
    & $backendPython -m pip install --upgrade pip
    & $backendPython -m pip install -r $requirements
  } else {
    Write-Host "Falta backend/.venv\Scripts\python.exe" -ForegroundColor Red
    Write-Host "Ejecuta: powershell -ExecutionPolicy Bypass -File .\bootstrap_local.ps1" -ForegroundColor Yellow
    exit 1
  }
}

$multipartCheck = & $backendPython -c "import importlib.util; print('ok' if importlib.util.find_spec('multipart') else 'missing')"
if ($multipartCheck -ne "ok") {
  if ($bootstrapEnabled) {
    Write-Host "Falta dependencia python-multipart. Instalando..." -ForegroundColor Yellow
    & $backendPython -m pip install python-multipart
  } else {
    Write-Host "Falta dependencia python-multipart en backend/.venv" -ForegroundColor Red
    Write-Host "Instala con: backend\.venv\Scripts\python.exe -m pip install python-multipart" -ForegroundColor Yellow
    exit 1
  }
}

if (Test-PortInUse -Port $Port) {
  $nextPort = Get-FreePort -StartPort ($Port + 1)
  Write-Host "Puerto backend $Port ocupado. Iniciando en $nextPort." -ForegroundColor Yellow
  $Port = $nextPort
}

Write-Host "Iniciando backend en http://localhost:$Port" -ForegroundColor Cyan
Set-Location (Join-Path $PSScriptRoot "backend")
& $backendPython -m uvicorn app.main:app --reload --host 0.0.0.0 --port $Port
