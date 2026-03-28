$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

$backendScript = Join-Path $PSScriptRoot "start_backend_only.ps1"
$frontendScript = Join-Path $PSScriptRoot "start_frontend_only.ps1"

if (!(Test-Path $backendScript) -or !(Test-Path $frontendScript)) {
  Write-Host "No se encontraron scripts de arranque requeridos." -ForegroundColor Red
  exit 1
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
