@echo off
chcp 65001 > nul
title U.B.R Beverage Pre-Order - Stop Production Server
cd /d "%~dp0"

echo =========================================================
echo    Stopping U.B.R Beverage Pre-Order Services
echo =========================================================
echo.

call pm2 stop ecosystem.config.js
call pm2 status

echo.
echo All services stopped.
pause
