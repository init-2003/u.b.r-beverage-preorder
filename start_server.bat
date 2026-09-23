@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo =========================================================
echo    Starting U.B.R Beverage Pre-Order Services
echo =========================================================
echo.

REM ตรวจสอบว่ามี pm2 หรือไม่
where pm2 >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] ไม่พบคำสั่ง pm2 ในระบบ กรุณาติดตั้งด้วยคำสั่ง:
    echo        npm install -g pm2
    pause
    exit /b 1
)

echo [1/3] Starting PM2 processes from ecosystem.config.js...
call pm2 start ecosystem.config.js

echo.
echo [2/3] Saving PM2 state for auto-recovery...
call pm2 save

echo.
echo [3/3] Current Services Status:
call pm2 status

echo.
echo =========================================================
echo    Services Started Successfully!
echo =========================================================
echo    IIS Website        : http://localhost (Port 80)
echo    Ports Configured in: .env.production
echo =========================================================
echo.
pause
