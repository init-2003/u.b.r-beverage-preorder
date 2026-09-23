@echo off
chcp 65001 > nul
title U.B.R Beverage Pre-Order - Stop All Services
cd /d "%~dp0"

echo =========================================================
echo    U.B.R Beverage Pre-Order - Stop All Services
echo =========================================================
echo.

REM =========================================================
REM [1/3] อ่าน PORT / SLIP_SERVICE_PORT จากไฟล์ .env
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

echo [1/3] Ports from .env : Next.js=%APP_PORT%  Slip=%SLIP_PORT%
echo.

REM =========================================================
REM [2/3] ปิดทั้งสองพอร์ต
REM =========================================================
echo [2/3] Stopping services...
call :free_port %APP_PORT%
call :free_port %SLIP_PORT%
ping -n 2 127.0.0.1 >nul
echo.

REM =========================================================
REM [3/3] ตรวจสอบผล
REM =========================================================
echo [3/3] Result:
set "CHECK_OK=1"

netstat -ano | findstr LISTENING | findstr ":%APP_PORT% " >nul
if %ERRORLEVEL%==0 (
    echo        [STILL RUNNING] Next.js      : port %APP_PORT%
    set "CHECK_OK=0"
) else (
    echo        [STOPPED]       Next.js      : port %APP_PORT%
)

netstat -ano | findstr LISTENING | findstr ":%SLIP_PORT% " >nul
if %ERRORLEVEL%==0 (
    echo        [STILL RUNNING] Slip Service : port %SLIP_PORT%
    set "CHECK_OK=0"
) else (
    echo        [STOPPED]       Slip Service : port %SLIP_PORT%
)

echo.
if "%CHECK_OK%"=="1" (
    echo    All services stopped.
) else (
    echo    WARNING: some services are still running.
)

pause
goto :eof

REM =========================================================
REM :free_port <port> - บังคับปิด process ที่ listen บนพอร์ตนั้น
REM =========================================================
:free_port
for /f "tokens=5" %%P in ('netstat -ano ^| findstr LISTENING ^| findstr ":%~1 "') do (
    echo        closing port %~1 ^(PID %%P^)...
    taskkill /PID %%P /F /T >nul 2>&1
)
exit /b
