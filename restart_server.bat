@echo off
chcp 65001 > nul
title U.B.R Beverage Pre-Order - Restart Production Server
cd /d "%~dp0"

echo =========================================================
echo    Restarting U.B.R Beverage Pre-Order Services
echo =========================================================
echo.

call pm2 restart ecosystem.config.js
call pm2 save
call pm2 status

echo.
echo All services restarted successfully!
pause
