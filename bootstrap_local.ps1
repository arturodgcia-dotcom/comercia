$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"
$backendVenv = Join-Path $backendPath ".venv"
$backendPython = Join-Path $backendVenv "Scripts\python.exe"
$requirements = Join-Path $backendPath "requirements.txt"

Write-Host "Preparando entorno local de ComerCia..." -ForegroundColor Cyan

if (!(Test-Path $backendPython)) {
  Write-Host "Creando backend/.venv..." -ForegroundColor Yellow
  python -m venv $backendVenv
}

Write-Host "Instalando dependencias backend..." -ForegroundColor Yellow
& $backendPython -m pip install --upgrade pip
& $backendPython -m pip install -r $requirements

$multipartCheck = & $backendPython -c "import importlib.util; print('ok' if importlib.util.find_spec('multipart') else 'missing')"
if ($multipartCheck -ne "ok") {
  Write-Host "Instalando dependencia faltante python-multipart..." -ForegroundColor Yellow
  & $backendPython -m pip install python-multipart
}

if (!(Test-Path (Join-Path $frontendPath "node_modules"))) {
  Write-Host "Instalando dependencias frontend..." -ForegroundColor Yellow
  Set-Location $frontendPath
  npm install
  Set-Location $PSScriptRoot
}

Write-Host "Entorno local listo." -ForegroundColor Green
Write-Host "Siguiente paso: ./start_all.bat  o  powershell -ExecutionPolicy Bypass -File .\start_all.ps1" -ForegroundColor Green
