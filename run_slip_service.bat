@echo off
chcp 65001 > nul
title Slip Verification Microservice

echo =======================================================
echo    Slip Verification Service (FastAPI)
echo =======================================================
echo.
echo กำลังเริ่มต้นระบบตรวจเช็คสลิป
echo Server: http://127.0.0.1:8000
echo Docs:   http://127.0.0.1:8000/docs
echo.

set PYTHON_EXE="C:\Users\Windows11\AppData\Local\Programs\Python\Python314\python.exe"

if exist %PYTHON_EXE% (
    %PYTHON_EXE% -m uvicorn python-service.main:app --host 127.0.0.1 --port 8000
) else (
    echo Python 3.14 ไม่พบที่ตำแหน่งเริ่มต้น กำลังลองใช้คำสั่ง python ปกติ...
    python -m uvicorn python-service.main:app --host 127.0.0.1 --port 8000
)

pause
