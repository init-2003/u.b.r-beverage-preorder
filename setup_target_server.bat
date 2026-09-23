@echo off
chcp 65001 > nul
title U.B.R Beverage Pre-Order - Setup Target Server
cd /d "%~dp0"

echo =========================================================
echo    U.B.R Beverage Pre-Order: Setting Up Target Server
echo =========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup_target_server.ps1"

echo.
pause
