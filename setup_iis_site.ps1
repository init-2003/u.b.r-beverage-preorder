# ==============================================================================
# U.B.R Beverage Pre-Order - Automated IIS Web Site & Proxy Setup (PowerShell)
# Run as Administrator on Target Windows Server
# Command: powershell -ExecutionPolicy Bypass -File .\setup_iis_site.ps1
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  U.B.R Beverage Pre-Order: IIS Website Configuration" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Administrator Privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] Administrator privilege is required! Please run PowerShell as Administrator." -ForegroundColor Red
    exit 1
}

$siteName = "UBR-PreOrder"
$appPoolName = "UBR-PreOrder-Pool"
$physicalPath = $PSScriptRoot
if (-not $physicalPath) { $physicalPath = (Get-Location).Path }
$port = 80
$appcmd = "$env:windir\system32\inetsrv\appcmd.exe"

if (-not (Test-Path $appcmd)) {
    Write-Host "[ERROR] IIS not found on this machine. Please install Web Server (IIS) before running this script." -ForegroundColor Red
    exit 1
}

# 2. Import WebAdministration module
Import-Module WebAdministration -ErrorAction SilentlyContinue

# 3. Enable ARR Server Proxy
Write-Host "--- 1. Configuring ARR (Application Request Routing) Proxy ---" -ForegroundColor Cyan
try {
    & $appcmd set config -section:system.webServer/proxy /enabled:True /commit:apphost
    Write-Host "[OK] Enabled ARR Proxy (enabled=True) successfully!" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Could not set ARR Proxy via appcmd. Please verify ARR is installed." -ForegroundColor Yellow
}

# 4. Create / Configure Application Pool (No Managed Code)
Write-Host ""
Write-Host "--- 2. Configuring Application Pool: $appPoolName ---" -ForegroundColor Cyan
if (Test-Path "IIS:\AppPools\$appPoolName") {
    Write-Host "[INFO] AppPool '$appPoolName' already exists. Updating settings..." -ForegroundColor Yellow
} else {
    New-WebAppPool -Name $appPoolName
    Write-Host "[OK] Created Application Pool '$appPoolName'" -ForegroundColor Green
}

# Set No Managed Code for Reverse Proxy
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name "managedRuntimeVersion" -Value ""
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name "startMode" -Value "AlwaysRunning"
Write-Host "[OK] Configured AppPool with 'No Managed Code' and AlwaysRunning" -ForegroundColor Green

# 5. Create / Configure IIS Web Site
Write-Host ""
Write-Host "--- 3. Configuring IIS Web Site: $siteName ---" -ForegroundColor Cyan
if (-not (Test-Path $physicalPath)) {
    New-Item -ItemType Directory -Path $physicalPath -Force | Out-Null
}

if (Test-Path "IIS:\Sites\$siteName") {
    Write-Host "[INFO] Web Site '$siteName' already exists. Updating Physical Path and AppPool..." -ForegroundColor Yellow
    Set-ItemProperty "IIS:\Sites\$siteName" -Name "physicalPath" -Value $physicalPath
    Set-ItemProperty "IIS:\Sites\$siteName" -Name "applicationPool" -Value $appPoolName
} else {
    # Check if port 80 is used by Default Web Site
    if (Test-Path "IIS:\Sites\Default Web Site") {
        Write-Host "[INFO] Stopping 'Default Web Site' on Port 80 to prevent conflict..." -ForegroundColor Yellow
        Stop-WebSite -Name "Default Web Site" -ErrorAction SilentlyContinue
        Set-WebBinding -Name "Default Web Site" -BindingInformation "*:80:" -PropertyName "Port" -Value 8080 -ErrorAction SilentlyContinue
    }

    New-Website -Name $siteName -Port $port -PhysicalPath $physicalPath -ApplicationPool $appPoolName
    Write-Host "[OK] Created IIS Web Site '$siteName' on port $port pointing to $physicalPath" -ForegroundColor Green
}

# Start AppPool and Site
Start-WebAppPool -Name $appPoolName -ErrorAction SilentlyContinue
Start-WebSite -Name $siteName -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  IIS Setup for $siteName Completed Successfully!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "URL: http://localhost:$port or http://[SERVER_IP]" -ForegroundColor White
Write-Host ""
