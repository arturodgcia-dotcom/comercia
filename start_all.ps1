param(
  [switch]$Bootstrap
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$backendScript = Join-Path $PSScriptRoot "start_backend_only.ps1"
$frontendScript = Join-Path $PSScriptRoot "start_frontend_only.ps1"
$backendVenv = Join-Path $PSScriptRoot "backend\.venv"
$backendPython = Join-Path $backendVenv "Scripts\python.exe"
$requirements = Join-Path $PSScriptRoot "backend\requirements.txt"

if (!(Test-Path $backendScript) -or !(Test-Path $frontendScript)) {
  Write-Host "No se encontraron scripts de arranque requeridos." -ForegroundColor Red
  exit 1
}

$bootstrapEnabled = $Bootstrap -or ($env:COMERCIA_BOOTSTRAP -in @("1", "true", "TRUE", "yes", "YES"))

if (!(Test-Path $backendPython)) {
  if ($bootstrapEnabled) {
    Write-Host "Modo bootstrap activo: creando backend/.venv e instalando requirements..." -ForegroundColor Cyan
    if (!(Test-Path $backendVenv)) {
      python -m venv $backendVenv
    }
    & $backendPython -m pip install --upgrade pip
    & $backendPython -m pip install -r $requirements
  } else {
    Write-Host "Falta backend/.venv (backend\.venv\Scripts\python.exe)." -ForegroundColor Red
    Write-Host ""
    Write-Host "Prepara backend exactamente con estos comandos:" -ForegroundColor Yellow
    Write-Host "cd backend"
    Write-Host "python -m venv .venv"
    Write-Host ".\.venv\Scripts\activate"
    Write-Host "pip install -r requirements.txt"
    Write-Host "alembic upgrade head"
    Write-Host ""
    Write-Host "Opcional para auto-bootstrap en start_all:" -ForegroundColor Yellow
    Write-Host "powershell -ExecutionPolicy Bypass -File .\start_all.ps1 -Bootstrap"
    Write-Host "o"
    Write-Host "set COMERCIA_BOOTSTRAP=1"
    Write-Host "powershell -ExecutionPolicy Bypass -File .\start_all.ps1"
    exit 1
  }
}

Write-Host "Lanzando backend y frontend en terminales separadas..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $backendScript | Out-Null
Start-Sleep -Seconds 1
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $frontendScript | Out-Null

Write-Host ""
Write-Host "URLs utiles:" -ForegroundColor Yellow
Write-Host "- API docs: http://localhost:8000/docs"
Write-Host "- Health:   http://localhost:8000/health"
Write-Host "- Landing:  http://localhost:5173/comercia"
Write-Host "- REINPIA:  http://localhost:5173/store/reinpia"
Write-Host "- Panel RG: http://localhost:5173/reinpia/dashboard"
Write-Host ""

Start-Sleep -Seconds 2
try {
  $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 3
  Write-Host "Healthcheck backend OK: $($health.status)" -ForegroundColor Green
} catch {
  Write-Host "Healthcheck backend aun no responde. Espera unos segundos y reintenta /health." -ForegroundColor Yellow
}
