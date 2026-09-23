@echo off
chcp 65001 > nul
title U.B.R Beverage Pre-Order - Production Deploy

echo =========================================================
echo    U.B.R Beverage Pre-Order - Production Build ^& Deploy
echo =========================================================
echo.

set DEPLOY_DIR=C:\inetpub\ubr-preorder
set PROJECT_DIR=%~dp0

echo [1/6] Building Next.js production (standalone)...
echo.
cd /d "%PROJECT_DIR%"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo *** BUILD FAILED! กรุณาแก้ไข errors ก่อน deploy ***
    pause
    exit /b 1
)

echo.
echo [2/6] Preparing deployment directory: %DEPLOY_DIR%
if not exist "%DEPLOY_DIR%" mkdir "%DEPLOY_DIR%"
if not exist "%DEPLOY_DIR%\logs" mkdir "%DEPLOY_DIR%\logs"

echo.
echo [3/6] Copying standalone server files...
xcopy /E /Y /I "%PROJECT_DIR%.next\standalone\*" "%DEPLOY_DIR%\" > nul

echo [4/6] Copying static assets and public files...
if not exist "%DEPLOY_DIR%\.next\static" mkdir "%DEPLOY_DIR%\.next\static"
xcopy /E /Y /I "%PROJECT_DIR%.next\static\*" "%DEPLOY_DIR%\.next\static\" > nul
xcopy /E /Y /I "%PROJECT_DIR%public\*" "%DEPLOY_DIR%\public\" > nul

echo [5/6] Copying configuration and service files...
copy /Y "%PROJECT_DIR%.env.production" "%DEPLOY_DIR%\.env.production" > nul
copy /Y "%PROJECT_DIR%ecosystem.config.js" "%DEPLOY_DIR%\ecosystem.config.js" > nul
copy /Y "%PROJECT_DIR%web.config" "%DEPLOY_DIR%\web.config" > nul

REM Copy Python slip verification service
if not exist "%DEPLOY_DIR%\python-service" mkdir "%DEPLOY_DIR%\python-service"
xcopy /E /Y /I "%PROJECT_DIR%python-service\*" "%DEPLOY_DIR%\python-service\" > nul

REM Copy OCR trained data files
if exist "%PROJECT_DIR%eng.traineddata" copy /Y "%PROJECT_DIR%eng.traineddata" "%DEPLOY_DIR%\" > nul
if exist "%PROJECT_DIR%tha.traineddata" copy /Y "%PROJECT_DIR%tha.traineddata" "%DEPLOY_DIR%\" > nul

echo.
echo [6/6] Starting PM2 processes...
cd /d "%DEPLOY_DIR%"

REM Stop existing processes if running
pm2 delete ubr-preorder 2>nul
pm2 delete ubr-slip-service 2>nul

REM Start fresh
pm2 start ecosystem.config.js
pm2 save

echo.
echo =========================================================
echo    Deploy สำเร็จ!
echo =========================================================
echo.
echo    Next.js Server : http://localhost:3001
echo    Slip Service   : http://127.0.0.1:8000
echo    IIS Proxy      : http://localhost (or your domain)
echo.
echo    PM2 Commands:
echo      pm2 status          - ดูสถานะ
echo      pm2 logs            - ดู logs
echo      pm2 restart all     - restart ทั้งหมด
echo      pm2 monit           - monitor resources
echo.

pause
