@echo off
setlocal
set BOOTSTRAP_SWITCH=
if /I "%~1"=="--bootstrap" set BOOTSTRAP_SWITCH=-Bootstrap
if /I "%~1"=="-Bootstrap" set BOOTSTRAP_SWITCH=-Bootstrap
if /I "%COMERCIA_BOOTSTRAP%"=="1" set BOOTSTRAP_SWITCH=-Bootstrap
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_all.ps1" %BOOTSTRAP_SWITCH%
endlocal
