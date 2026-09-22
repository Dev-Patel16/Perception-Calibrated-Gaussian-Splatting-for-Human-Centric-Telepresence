# Aperture Telepresence Platform Launcher
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   APERTURE: Perception-Calibrated 3DGS Telepresence Platform" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

$nodePath = "node"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    if (Test-Path "C:\Users\dev01\node\node.exe") {
        $nodePath = "C:\Users\dev01\node\node.exe"
    }
}

Write-Host "[*] Starting local HTTP server at http://localhost:3000..." -ForegroundColor Green
Start-Process "http://localhost:3000"

& $nodePath server.js
