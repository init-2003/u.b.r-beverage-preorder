# ==============================================================================
# U.B.R Beverage Pre-Order - Package Production Release (PowerShell)
# รวบรวมไฟล์สำหรับนำขึ้น Production บน IIS
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  U.B.R Beverage Pre-Order: Packaging Production Release" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$projectDir = $PSScriptRoot
if (-not $projectDir) { $projectDir = Get-Location.Path }
$distDir = Join-Path $projectDir "dist_release"
$zipFile = Join-Path $projectDir "ubr-preorder-release.zip"

Set-Location $projectDir

# 1. Build Next.js Production Standalone
Write-Host "[1/5] Building Next.js Standalone Production..." -ForegroundColor Yellow
$buildProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run build" -NoNewWindow -Wait -PassThru
if ($buildProc.ExitCode -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Build failed! กรุณาตรวจสอบและแก้ไขข้อผิดพลาดก่อนสร้างแพ็กเกจ" -ForegroundColor Red
    exit 1
}

# 2. เตรียมโฟลเดอร์ dist_release
Write-Host ""
Write-Host "[2/5] เตรียมโฟลเดอร์สำหรับแพ็กเกจ: $distDir" -ForegroundColor Yellow
if (Test-Path $distDir) {
    Remove-Item -Path $distDir -Recurse -Force
}
New-Item -ItemType Directory -Path $distDir -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $distDir "logs") -Force | Out-Null

# 3. คัดลอกไฟล์ Standalone และ Node Dependencies
Write-Host ""
Write-Host "[3/5] คัดลอกไฟล์ Standalone server..." -ForegroundColor Yellow
$standaloneSrc = Join-Path $projectDir ".next\standalone"
if (Test-Path $standaloneSrc) {
    robocopy "$standaloneSrc" "$distDir" /E /R:1 /W:1 /NFL /NDL /NJH /NJS | Out-Null
}

# 4. คัดลอก Static, Public, Python Service และโมเดล OCR
Write-Host "[4/5] คัดลอก Static assets, Public, Python service และ Configs..." -ForegroundColor Yellow
$staticSrc = Join-Path $projectDir ".next\static"
$staticDst = Join-Path $distDir ".next\static"
if (Test-Path $staticSrc) {
    robocopy "$staticSrc" "$staticDst" /E /R:1 /W:1 /NFL /NDL /NJH /NJS | Out-Null
}

$publicSrc = Join-Path $projectDir "public"
$publicDst = Join-Path $distDir "public"
if (Test-Path $publicSrc) {
    robocopy "$publicSrc" "$publicDst" /E /R:1 /W:1 /NFL /NDL /NJH /NJS | Out-Null
}

$pythonSrc = Join-Path $projectDir "python-service"
$pythonDst = Join-Path $distDir "python-service"
if (Test-Path $pythonSrc) {
    robocopy "$pythonSrc" "$pythonDst" /E /XD __pycache__ /XF *.pyc /R:1 /W:1 /NFL /NDL /NJH /NJS | Out-Null
}

# OCR Data
$engOcr = Join-Path $projectDir "eng.traineddata"
$thaOcr = Join-Path $projectDir "tha.traineddata"
if (Test-Path $engOcr) { Copy-Item -Path $engOcr -Destination $distDir -Force }
if (Test-Path $thaOcr) { Copy-Item -Path $thaOcr -Destination $distDir -Force }

# Configs & Environments
Copy-Item -Path (Join-Path $projectDir ".env.production") -Destination (Join-Path $distDir ".env.production") -Force
Copy-Item -Path (Join-Path $projectDir ".env.production") -Destination (Join-Path $distDir ".env") -Force
Copy-Item -Path (Join-Path $projectDir "web.config") -Destination (Join-Path $distDir "web.config") -Force
Copy-Item -Path (Join-Path $projectDir "ecosystem.config.js") -Destination (Join-Path $distDir "ecosystem.config.js") -Force

# Scripts & Guides
Copy-Item -Path (Join-Path $projectDir "setup_target_server.ps1") -Destination $distDir -Force
Copy-Item -Path (Join-Path $projectDir "setup_target_server.bat") -Destination $distDir -Force
Copy-Item -Path (Join-Path $projectDir "setup_iis_site.ps1") -Destination $distDir -Force
Copy-Item -Path (Join-Path $projectDir "setup_iis_site.bat") -Destination $distDir -Force
Copy-Item -Path (Join-Path $projectDir "start_server.bat") -Destination $distDir -Force
Copy-Item -Path (Join-Path $projectDir "stop_server.bat") -Destination $distDir -Force
Copy-Item -Path (Join-Path $projectDir "restart_server.bat") -Destination $distDir -Force
Copy-Item -Path (Join-Path $projectDir "IIS_PRODUCTION_GUIDE.md") -Destination $distDir -Force
Copy-Item -Path (Join-Path $projectDir "IIS_PRODUCTION_GUIDE.txt") -Destination $distDir -Force

# 5. บีบอัดเป็น Zip archive
Write-Host ""
Write-Host "[5/5] บีบอัดไฟล์เป็น: $zipFile ..." -ForegroundColor Yellow
if (Test-Path $zipFile) {
    Remove-Item -Path $zipFile -Force
}
Compress-Archive -Path "$distDir\*" -DestinationPath $zipFile -CompressionLevel Optimal

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  สร้างแพ็กเกจ Release สำเร็จเรียบร้อยแล้ว!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "1. โฟลเดอร์ Release: $distDir" -ForegroundColor White
Write-Host "2. ไฟล์ ZIP         : $zipFile" -ForegroundColor White
Write-Host ""
Write-Host "ขั้นตอนถัดไป:" -ForegroundColor Cyan
Write-Host "  - ก๊อปปี้ไฟล์ ubr-preorder-release.zip ไปยัง Server ปลายทาง"
Write-Host "  - แตกไฟล์ไปที่ C:\inetpub\ubr-preorder"
Write-Host "  - ศึกษาขั้นตอนการติดตั้งในไฟล์: IIS_PRODUCTION_GUIDE.md"
Write-Host ""
