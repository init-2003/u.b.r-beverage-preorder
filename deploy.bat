@echo off
chcp 65001 > nul
title U.B.R Beverage Pre-Order - Production Deploy

echo =========================================================
echo    U.B.R Beverage Pre-Order - Production Build ^& Deploy
echo =========================================================
echo.

REM ============================================================
REM  PROJECT_DIR = โฟลเดอร์ที่สคริปต์นี้อยู่ (มี \ ท้ายเสมอ จาก %~dp0)
REM  DEPLOY_DIR  = หาอัตโนมัติผ่าน scripts\resolve-deploy-dir.js ลำดับ:
REM                  1. env UBR_DEPLOY_DIR ( override เอง )
REM                  2. physicalPath ของ IIS site "UBR-PreOrder"
REM                  3. โฟลเดอร์โปรเจกต์ ( deploy in-place )
REM  ถ้า DEPLOY_DIR = PROJECT_DIR -> โหมด IN-PLACE (ไม่ copy ไฟล์)
REM ============================================================
set "PROJECT_DIR=%~dp0"

set "DEPLOY_DIR="
for /f "usebackq delims=" %%A in (`node "%PROJECT_DIR%scripts\resolve-deploy-dir.js"`) do set "DEPLOY_DIR=%%A"
if not defined DEPLOY_DIR set "DEPLOY_DIR=%PROJECT_DIR%"

set "INPLACE=0"
set "PDIR=%PROJECT_DIR:~0,-1%"
set "DDIR=%DEPLOY_DIR%"
if "%DDIR:~-1%"=="\" set "DDIR=%DDIR:~0,-1%"
if /i "%PDIR%"=="%DDIR%" set "INPLACE=1"

echo [1/5] Deploy path ^(auto^)
echo        PROJECT_DIR = %PDIR%
echo        DEPLOY_DIR  = %DDIR%
if "%INPLACE%"=="1" echo        MODE        = IN-PLACE ^(build แล้วรันจากโฟลเดอร์เดิม ไม่ copy ไฟล์^)
if "%INPLACE%"=="0" echo        MODE        = COPY ^(คัดลอก standalone ไปที่ DEPLOY_DIR^)
echo.

echo [2/5] Stopping PM2 ^(ปลด lock .next\standalone ก่อน build กัน EBUSY^)...
where pm2 >nul 2>&1
if errorlevel 1 (
    echo        [SKIP] ไม่พบ pm2 ใน PATH
) else (
    pm2 stop all >nul 2>&1
    pm2 delete all >nul 2>&1
    echo        [OK] pm2 stop all ^& delete all แล้ว
)
echo.

echo [3/5] Building Next.js production ^(standalone + postbuild assets^)...
cd /d "%PROJECT_DIR%"
call npm run build
if errorlevel 1 (
    echo.
    echo *** BUILD FAILED! กรุณาแก้ไข errors ก่อน deploy ***
    pause
    exit /b 1
)
echo.

if "%INPLACE%"=="1" goto :skip_copy

echo [4/5] Copying files to %DDIR%...
if not exist "%DEPLOY_DIR%" mkdir "%DEPLOY_DIR%"
if not exist "%DEPLOY_DIR%\logs" mkdir "%DEPLOY_DIR%\logs"

xcopy /E /Y /I "%PROJECT_DIR%.next\standalone\*" "%DEPLOY_DIR%\" > nul

if not exist "%DEPLOY_DIR%\.next\static" mkdir "%DEPLOY_DIR%\.next\static"
xcopy /E /Y /I "%PROJECT_DIR%.next\static\*" "%DEPLOY_DIR%\.next\static\" > nul
xcopy /E /Y /I "%PROJECT_DIR%public\*" "%DEPLOY_DIR%\public\" > nul

copy /Y "%PROJECT_DIR%.env" "%DEPLOY_DIR%\.env" > nul
copy /Y "%PROJECT_DIR%.env.production" "%DEPLOY_DIR%\.env.production" > nul
copy /Y "%PROJECT_DIR%ecosystem.config.js" "%DEPLOY_DIR%\ecosystem.config.js" > nul
copy /Y "%PROJECT_DIR%web.config" "%DEPLOY_DIR%\web.config" > nul

REM scripts\ ต้องไปด้วย เพื่อให้ `npm run start` ในโฟลเดอร์ deploy ใช้ได้
xcopy /E /Y /I "%PROJECT_DIR%scripts\*" "%DEPLOY_DIR%\scripts\" > nul

REM Python slip verification service
if not exist "%DEPLOY_DIR%\python-service" mkdir "%DEPLOY_DIR%\python-service"
xcopy /E /Y /I "%PROJECT_DIR%python-service\*" "%DEPLOY_DIR%\python-service\" > nul

REM OCR trained data
if exist "%PROJECT_DIR%eng.traineddata" copy /Y "%PROJECT_DIR%eng.traineddata" "%DEPLOY_DIR%\" > nul
if exist "%PROJECT_DIR%tha.traineddata" copy /Y "%PROJECT_DIR%tha.traineddata" "%DEPLOY_DIR%\" > nul
echo.
goto :start_pm2

:skip_copy
echo [4/5] Copy files     : ข้าม (IN-PLACE - postbuild วาง public + .next\static ใน standalone แล้ว)
echo.

:start_pm2
echo [5/5] Starting PM2 processes from %DDIR%...
cd /d "%DDIR%"

where pm2 >nul 2>&1
if errorlevel 1 (
    echo        [SKIP] ไม่พบ pm2 ใน PATH - เริ่มเองด้วย "npm run start" หรือ start_all.bat
    goto :done
)

pm2 delete ubr-preorder 2>nul
pm2 delete ubr-slip-service 2>nul
pm2 start ecosystem.config.js
pm2 save

:done
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
