$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot
Set-Location (Join-Path $PSScriptRoot "frontend")

Write-Host "Iniciando frontend en http://localhost:5173" -ForegroundColor Green
& npm run dev
