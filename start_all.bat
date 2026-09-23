@echo off
chcp 65001 > nul
title U.B.R Beverage Pre-Order - Start All Services
cd /d "%~dp0"

echo =========================================================
echo    U.B.R Beverage Pre-Order - Start All Services
echo =========================================================
echo.

REM =========================================================
REM [1/4] อ่าน PORT / SLIP_SERVICE_PORT จากไฟล์ .env
REM =========================================================
set "APP_PORT=3001"
set "SLIP_PORT=8000"

if not exist ".env" (
    echo [WARN] ไม่พบไฟล์ .env - ใช้ค่าเริ่มต้น Next.js=%APP_PORT% Slip=%SLIP_PORT%
) else (
    for /f "tokens=1,* delims==" %%A in ('findstr /b /c:"PORT=" /c:"SLIP_SERVICE_PORT=" .env') do (
        if /i "%%A"=="PORT"          set "APP_PORT=%%B"
        if /i "%%A"=="SLIP_SERVICE_PORT" set "SLIP_PORT=%%B"
    )
)

echo [1/4] Ports from .env
echo        Next.js      : %APP_PORT%
echo        Slip Service : %SLIP_PORT%
echo.

REM =========================================================
REM [2/4] ปิด instance เก่าที่ค้างอยู่บนพอร์ตเหล่านี้
REM =========================================================
echo [2/4] Checking ports...
call :free_port %APP_PORT%
call :free_port %SLIP_PORT%
ping -n 2 127.0.0.1 >nul
echo.

REM =========================================================
REM [3/4] Start Slip Verification Service (FastAPI) - window แยก
REM =========================================================
echo [3/4] Starting Slip Verification Service...

set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python314\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE=python"

start "Slip Verification Service" cmd /k ""%PYTHON_EXE%" -m uvicorn python-service.main:app --host 127.0.0.1 --port %SLIP_PORT%"

echo        Slip Service   : http://127.0.0.1:%SLIP_PORT%   [opened in new window]
echo.

REM =========================================================
REM [4/4] Start Next.js dev - รันในหน้าต่างนี้ (log แสดงเต็ม)
REM =========================================================
echo [4/4] Starting Next.js dev server...
echo        Web : http://localhost:%APP_PORT%
echo.
echo ---------------------------------------------------------
echo  กด Ctrl+C ในหน้าต่างนี้เพื่อหยุด Next.js
echo  (Slip Service ยังทำงานในหน้าต่างของตัวเอง)
echo ---------------------------------------------------------
echo.

call npm run dev

goto :eof

REM =========================================================
REM :free_port <port> - บังคับปิด process ที่ listen บนพอร์ตนั้น
REM =========================================================
:free_port
for /f "tokens=5" %%P in ('netstat -ano ^| findstr LISTENING ^| findstr ":%~1 "') do (
    echo        freeing port %~1 ^(PID %%P^)...
    taskkill /PID %%P /F /T >nul 2>&1
)
exit /b
