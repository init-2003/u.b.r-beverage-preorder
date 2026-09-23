@echo off
chcp 65001 > nul
title U.B.R Beverage Pre-Order - Setup IIS Site
cd /d "%~dp0"

echo =========================================================
echo    U.B.R Beverage Pre-Order: Configuring IIS Web Site
echo =========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup_iis_site.ps1"

echo.
pause
