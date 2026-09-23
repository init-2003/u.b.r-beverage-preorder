# ==============================================================================
# U.B.R Beverage Pre-Order - Target Server Setup Script (PowerShell)
# Run as Administrator on Target Windows Server
# Command: powershell -ExecutionPolicy Bypass -File .\setup_target_server.ps1
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  U.B.R Beverage Pre-Order: Target Server Setup" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Administrator Privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[WARNING] Please run this script as Administrator (Right click -> Run as Administrator)" -ForegroundColor Yellow
}

$deployPath = $PSScriptRoot
if (-not $deployPath) { $deployPath = (Get-Location).Path }
Write-Host "[OK] Target Directory: $deployPath" -ForegroundColor Green

# 2. Check Node.js
Write-Host ""
Write-Host "--- 1. Checking Node.js ---" -ForegroundColor Cyan
try {
    $nodeVer = node -v
    Write-Host "[OK] Node.js found: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found. Please install Node.js LTS (v20 or v22) from https://nodejs.org" -ForegroundColor Red
}

# 3. Check Python & Install Dependencies
Write-Host ""
Write-Host "--- 2. Checking Python & Slip Service Dependencies ---" -ForegroundColor Cyan
try {
    $pyVer = python --version
    Write-Host "[OK] Python found: $pyVer" -ForegroundColor Green

    $reqFile = Join-Path $deployPath "python-service\requirements.txt"
    if (Test-Path $reqFile) {
        Write-Host "[INFO] Installing Python packages from requirements.txt..." -ForegroundColor Yellow
        python -m pip install --upgrade pip --quiet
        python -m pip install -r "$reqFile"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Python dependencies installed successfully!" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] pip install had warnings. Please check internet connection." -ForegroundColor Yellow
        }
    } else {
        Write-Host "[SKIP] python-service\requirements.txt not found in this folder." -ForegroundColor Gray
    }
} catch {
    Write-Host "[ERROR] Python command not found. Please install Python (3.10-3.14) and check 'Add Python to PATH'." -ForegroundColor Red
}

# 4. Check & Install PM2
Write-Host ""
Write-Host "--- 3. Checking PM2 Process Manager ---" -ForegroundColor Cyan
try {
    $pm2Ver = pm2 -v
    Write-Host "[OK] PM2 found: v$pm2Ver" -ForegroundColor Green
} catch {
    Write-Host "[INFO] PM2 not found. Installing via npm..." -ForegroundColor Yellow
    npm install -g pm2
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] PM2 installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Could not install PM2 automatically. Run: npm install -g pm2" -ForegroundColor Red
    }
}

# 5. Set IIS Folder Permissions (IIS_IUSRS and IUSR)
Write-Host ""
Write-Host "--- 4. Setting Folder Permissions for IIS ---" -ForegroundColor Cyan
try {
    $acl = Get-Acl $deployPath
    $iisIusrRule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS_IUSRS", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow")
    $iusrRule = New-Object System.Security.AccessControl.FileSystemAccessRule("IUSR", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow")
    $acl.AddAccessRule($iisIusrRule)
    $acl.AddAccessRule($iusrRule)
    Set-Acl $deployPath $acl
    Write-Host "[OK] Granted Read & Execute permissions to IIS_IUSRS and IUSR" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Could not auto-set permissions: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 6. Test MSSQL Connectivity
Write-Host ""
Write-Host "--- 5. Testing MSSQL Database Connection ---" -ForegroundColor Cyan
$dbHost = "192.168.2.3"
$dbPort = 1433
Write-Host "[INFO] Testing connection to ${dbHost}:${dbPort}..." -ForegroundColor Yellow
try {
    $netTest = Test-NetConnection -ComputerName $dbHost -Port $dbPort -WarningAction SilentlyContinue
    if ($netTest.TcpTestSucceeded) {
        Write-Host "[OK] Database connection to ${dbHost}:${dbPort} Succeeded!" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Cannot reach MSSQL at ${dbHost}:${dbPort} (Check Firewall / LAN)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[INFO] Skipped Test-NetConnection" -ForegroundColor Gray
}

# 7. Check PDF Engine Browser (Chrome / Edge)
Write-Host ""
Write-Host "--- 6. Checking Browser for Purchase Order PDF Engine ---" -ForegroundColor Cyan
$browserPaths = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)
$foundBrowser = $false
foreach ($p in $browserPaths) {
    if (Test-Path $p) {
        Write-Host "[OK] PDF Browser found: $p" -ForegroundColor Green
        $foundBrowser = $true
        break
    }
}
if (-not $foundBrowser) {
    Write-Host "[WARNING] Chrome or Edge not found. Please install Google Chrome or Microsoft Edge for PDF generation." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Target Server Setup Checks Complete!" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor White
Write-Host "  1. If you haven't created the IIS Site: run .\setup_iis_site.ps1 (or create it in IIS Manager)" -ForegroundColor Yellow
Write-Host "  2. Start Production Server: run .\start_server.bat" -ForegroundColor Yellow
Write-Host ""
