$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

$backendPython = Join-Path $PSScriptRoot "backend\.venv\Scripts\python.exe"
if (!(Test-Path $backendPython)) {
  Write-Host "Falta backend\.venv\Scripts\python.exe" -ForegroundColor Red
  Write-Host "Prerequisito: crear backend/.venv e instalar requirements." -ForegroundColor Yellow
  exit 1
}

Write-Host "Iniciando backend en http://localhost:8000" -ForegroundColor Cyan
Set-Location (Join-Path $PSScriptRoot "backend")
& $backendPython -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
