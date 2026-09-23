@echo off
chcp 65001 > nul
cd /d "%~dp0"
title Slip Verification Microservice

REM ============================================================
REM อ่าน SLIP_SERVICE_PORT จากไฟล์ .env (ค่าเริ่มต้น 8000)
REM ============================================================
set "SLIP_PORT=8000"
if exist ".env" (
    for /f "tokens=1,* delims==" %%A in ('findstr /b /c:"SLIP_SERVICE_PORT=" .env') do set "SLIP_PORT=%%B"
)

echo =======================================================
echo    Slip Verification Service (FastAPI)
echo =======================================================
echo.
echo กำลังเริ่มต้นระบบตรวจเช็คสลิป
echo Server: http://127.0.0.1:%SLIP_PORT%
echo Docs:   http://127.0.0.1:%SLIP_PORT%/docs
echo.

set PYTHON_EXE="C:\Users\Windows11\AppData\Local\Programs\Python\Python314\python.exe"

if exist %PYTHON_EXE% (
    %PYTHON_EXE% -m uvicorn python-service.main:app --host 127.0.0.1 --port %SLIP_PORT%
) else (
    echo Python 3.14 ไม่พบที่ตำแหน่งเริ่มต้น กำลังลองใช้คำสั่ง python ปกติ...
    python -m uvicorn python-service.main:app --host 127.0.0.1 --port %SLIP_PORT%
)

pause
