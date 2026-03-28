@echo off
setlocal
set BOOTSTRAP_SWITCH=
if /I "%~1"=="--bootstrap" set BOOTSTRAP_SWITCH=-Bootstrap
if /I "%~1"=="-Bootstrap" set BOOTSTRAP_SWITCH=-Bootstrap
powershell -ExecutionPolicy Bypass -File "%~dp0start_all.ps1" %BOOTSTRAP_SWITCH%
endlocal
