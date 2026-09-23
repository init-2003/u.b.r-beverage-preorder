# ==============================================================================
# U.B.R Beverage Pre-Order - Automated IIS Web Site & Proxy Setup (PowerShell)
# เรียกใช้งานบน Server ปลายทางด้วยสิทธิ์ Administrator
# คำสั่ง: powershell -ExecutionPolicy Bypass -File .\setup_iis_site.ps1
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  U.B.R Beverage Pre-Order: IIS Website Configuration" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# ตรวจสอบสิทธิ์ Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] จำเป็นต้องรันด้วยสิทธิ์ Administrator เท่านั้น!" -ForegroundColor Red
    exit 1
}

$siteName = "UBR-PreOrder"
$appPoolName = "UBR-PreOrder-Pool"
$physicalPath = $PSScriptRoot
if (-not $physicalPath) { $physicalPath = (Get-Location).Path }
$port = 80
$appcmd = "$env:windir\system32\inetsrv\appcmd.exe"

if (-not (Test-Path $appcmd)) {
    Write-Host "[ERROR] ไม่พบ IIS ในเครื่อง กรุณาติดตั้ง Web Server (IIS) ก่อนรันสคริปต์นี้" -ForegroundColor Red
    exit 1
}

# 1. นำเข้าโมดูล WebAdministration
Import-Module WebAdministration -ErrorAction SilentlyContinue

# 2. เปิดใช้งาน ARR Server Proxy (Application Request Routing)
Write-Host "--- 1. ตั้งค่า Application Request Routing (ARR) Proxy ---" -ForegroundColor Cyan
try {
    & $appcmd set config -section:system.webServer/proxy /enabled:True /commit:apphost
    Write-Host "[OK] เปิดใช้งาน ARR Proxy (enabled=True) สำเร็จ!" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] ไม่สามารถตั้งค่า ARR Proxy ผ่าน appcmd กรุณาเปิด IIS Manager -> Application Request Routing Cache -> Server Proxy Settings -> ติ๊ก 'Enable proxy'" -ForegroundColor Yellow
}

# 3. สร้าง / ปรับแต่ง Application Pool (No Managed Code)
Write-Host ""
Write-Host "--- 2. สร้าง Application Pool: $appPoolName ---" -ForegroundColor Cyan
if (Test-Path "IIS:\AppPools\$appPoolName") {
    Write-Host "[INFO] พบ Application Pool '$appPoolName' อยู่แล้ว ปรับค่าให้เหมาะสม..." -ForegroundColor Yellow
} else {
    New-WebAppPool -Name $appPoolName
    Write-Host "[OK] สร้าง Application Pool '$appPoolName' เรียบร้อย" -ForegroundColor Green
}

# ตั้งค่าเป็น No Managed Code สำหรับ Reverse Proxy
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name "managedRuntimeVersion" -Value ""
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name "startMode" -Value "AlwaysRunning"
Write-Host "[OK] ตั้งค่า AppPool เป็น 'No Managed Code' และ AlwaysRunning สำเร็จ" -ForegroundColor Green

# 4. สร้าง / ปรับแต่ง IIS Web Site
Write-Host ""
Write-Host "--- 3. สร้าง IIS Web Site: $siteName ---" -ForegroundColor Cyan
if (-not (Test-Path $physicalPath)) {
    New-Item -ItemType Directory -Path $physicalPath -Force | Out-Null
}

# ตรวจสอบว่ามีเว็บไซต์ชื่อนี้อยู่แล้วหรือไม่
if (Test-Path "IIS:\Sites\$siteName") {
    Write-Host "[INFO] พบเว็บไซต์ '$siteName' ในระบบแล้ว ปรับปรุง Physical Path และ AppPool..." -ForegroundColor Yellow
    Set-ItemProperty "IIS:\Sites\$siteName" -Name "physicalPath" -Value $physicalPath
    Set-ItemProperty "IIS:\Sites\$siteName" -Name "applicationPool" -Value $appPoolName
} else {
    # ตรวจสอบว่าพอร์ต 80 ถูก Default Web Site ใช้อยู่หรือไม่
    if (Test-Path "IIS:\Sites\Default Web Site") {
        Write-Host "[INFO] ตรวจพบ 'Default Web Site' กำลังหยุดและเปลี่ยนพอร์ตเพื่อไม่ให้ชนกัน..." -ForegroundColor Yellow
        Stop-WebSite -Name "Default Web Site" -ErrorAction SilentlyContinue
        # หรือเปลี่ยน binding ของ Default Web Site
        Set-WebBinding -Name "Default Web Site" -BindingInformation "*:80:" -PropertyName "Port" -Value 8080 -ErrorAction SilentlyContinue
    }

    New-Website -Name $siteName -Port $port -PhysicalPath $physicalPath -ApplicationPool $appPoolName
    Write-Host "[OK] สร้าง IIS Website '$siteName' บนพอร์ต $port ชี้ไปยัง $physicalPath สำเร็จ!" -ForegroundColor Green
}

# เริ่มต้นเว็บไซต์
Start-WebAppPool -Name $appPoolName -ErrorAction SilentlyContinue
Start-WebSite -Name $siteName -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ตั้งค่า IIS สำหรับ $siteName สำเร็จเรียบร้อยแล้ว!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "URL: http://localhost:$port หรือ http://[IP_ของเซิร์ฟเวอร์]" -ForegroundColor White
Write-Host ""
