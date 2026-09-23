# ==============================================================================
# U.B.R Beverage Pre-Order - Target Server Setup Script (PowerShell)
# เรียกใช้งานบน Server ปลายทางด้วยสิทธิ์ Administrator
# คำสั่ง: powershell -ExecutionPolicy Bypass -File .\setup_target_server.ps1
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  U.B.R Beverage Pre-Order: Target Server Setup" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. ตรวจสอบสิทธิ์ Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[WARNING] สคริปต์นี้ควรทำงานด้วยสิทธิ์ Administrator กรุณาคลิกขวาที่ PowerShell แล้วเลือก 'Run as Administrator'" -ForegroundColor Yellow
}

$deployPath = $PSScriptRoot
if (-not $deployPath) { $deployPath = (Get-Location).Path }
Write-Host "[OK] ตำแหน่งโฟลเดอร์ระบบ: $deployPath" -ForegroundColor Green

# 2. ตรวจสอบ Node.js
Write-Host ""
Write-Host "--- 1. ตรวจสอบ Node.js ---" -ForegroundColor Cyan
try {
    $nodeVer = node -v
    Write-Host "[OK] ตรวจพบ Node.js: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] ไม่พบคำสั่ง node ในระบบ กรุณาติดตั้ง Node.js LTS (v20 หรือ v22) จาก https://nodejs.org" -ForegroundColor Red
}

# 3. ตรวจสอบ Python & ติดตั้ง requirements
Write-Host ""
Write-Host "--- 2. ตรวจสอบ Python & Slip Microservice Packages ---" -ForegroundColor Cyan
try {
    $pyVer = python --version
    Write-Host "[OK] ตรวจพบ Python: $pyVer" -ForegroundColor Green

    $reqFile = Join-Path $deployPath "python-service\requirements.txt"
    if (Test-Path $reqFile) {
        Write-Host "[INFO] กำลังติดตั้ง Python dependencies จาก requirements.txt..." -ForegroundColor Yellow
        python -m pip install --upgrade pip --quiet
        python -m pip install -r $reqFile
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] ติดตั้ง Python dependencies สำเร็จ!" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] มีข้อผิดพลาดระหว่างติดตั้ง pip กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[SKIP] ไม่พบไฟล์ python-service\requirements.txt ในโฟลเดอร์นี้" -ForegroundColor Gray
    }
} catch {
    Write-Host "[ERROR] ไม่พบคำสั่ง python ในระบบ กรุณาติดตั้ง Python (3.10-3.14) และติ๊กถูก 'Add Python to PATH'" -ForegroundColor Red
}

# 4. ตรวจสอบและติดตั้ง PM2
Write-Host ""
Write-Host "--- 3. ตรวจสอบ PM2 Process Manager ---" -ForegroundColor Cyan
try {
    $pm2Ver = pm2 -v
    Write-Host "[OK] ตรวจพบ PM2: v$pm2Ver" -ForegroundColor Green
} catch {
    Write-Host "[INFO] ยังไม่ได้ติดตั้ง PM2 กำลังติดตั้งผ่าน npm..." -ForegroundColor Yellow
    npm install -g pm2
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] ติดตั้ง PM2 สำเร็จ!" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] ไม่สามารถติดตั้ง PM2 ได้ กรุณาติดตั้งด้วยคำสั่ง: npm install -g pm2" -ForegroundColor Red
    }
}

# 5. ตั้งค่าสิทธิ์โฟลเดอร์สำหรับ IIS (IIS_IUSRS & IUSR)
Write-Host ""
Write-Host "--- 4. กำหนดสิทธิ์โฟลเดอร์สำหรับ IIS ---" -ForegroundColor Cyan
try {
    $acl = Get-Acl $deployPath
    $iisIusrRule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS_IUSRS", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow")
    $iusrRule = New-Object System.Security.AccessControl.FileSystemAccessRule("IUSR", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow")
    $acl.AddAccessRule($iisIusrRule)
    $acl.AddAccessRule($iusrRule)
    Set-Acl $deployPath $acl
    Write-Host "[OK] กำหนดสิทธิ์ Read & Execute ให้ IIS_IUSRS และ IUSR เรียบร้อยแล้ว" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] ไม่สามารถตั้งค่าสิทธิ์โฟลเดอร์อัตโนมัติ: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 6. ตรวจสอบการเชื่อมต่อ Database MSSQL
Write-Host ""
Write-Host "--- 5. ตรวจสอบการเชื่อมต่อไปยัง MSSQL Database ---" -ForegroundColor Cyan
$dbHost = "192.168.2.3"
$dbPort = 1433
Write-Host "[INFO] ทดสอบการเชื่อมต่อ: $dbHost พอร์ต $dbPort..." -ForegroundColor Yellow
try {
    $netTest = Test-NetConnection -ComputerName $dbHost -Port $dbPort -WarningAction SilentlyContinue
    if ($netTest.TcpTestSucceeded) {
        Write-Host "[OK] สามารถเชื่อมต่อฐานข้อมูล MSSQL ($dbHost:$dbPort) สำเร็จ!" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] ไม่สามารถเชื่อมต่อไปยัง $dbHost:$dbPort ได้ (ตรวจสอบ Firewall หรือวง LAN)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[INFO] ข้ามการทดสอบ NetConnection" -ForegroundColor Gray
}

# 7. ตรวจสอบเว็บเบราว์เซอร์สำหรับออก PDF
Write-Host ""
Write-Host "--- 6. ตรวจสอบเบราว์เซอร์สำหรับ Purchase Order PDF ---" -ForegroundColor Cyan
$browserPaths = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)
$foundBrowser = $false
foreach ($p in $browserPaths) {
    if (Test-Path $p) {
        Write-Host "[OK] ตรวจพบเบราว์เซอร์สำหรับ PDF Engine: $p" -ForegroundColor Green
        $foundBrowser = $true
        break
    }
}
if (-not $foundBrowser) {
    Write-Host "[WARNING] ไม่พบ Chrome หรือ Edge บนเซิร์ฟเวอร์ กรุณาติดตั้ง Google Chrome หรือ Microsoft Edge เพื่อให้ออกใบสั่งซื้อ PDF ได้" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  การตรวจสอบและเตรียมสภาพแวดล้อมเสร็จสิ้น" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "ขั้นตอนถัดไป:" -ForegroundColor White
Write-Host "  1. หากยังไม่ได้สร้าง IIS Site: รัน .\setup_iis_site.ps1" -ForegroundColor Yellow
Write-Host "  2. เริ่มต้นระบบ Production: รัน .\start_server.bat" -ForegroundColor Yellow
Write-Host ""
