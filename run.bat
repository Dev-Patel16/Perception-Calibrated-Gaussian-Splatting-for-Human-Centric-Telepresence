@echo off
setlocal
title Aperture Telepresence Platform
echo ======================================================================
echo    APERTURE: Perception-Calibrated 3D Gaussian Splatting Telepresence
echo ======================================================================
echo.

set "NODE_BIN=node"
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Users\dev01\node\node.exe" (
        set "NODE_BIN=C:\Users\dev01\node\node.exe"
    )
)

echo [*] Launching Aperture Telepresence Server...
echo [*] Server URL: http://localhost:3000
echo.

start "" "http://localhost:3000"
"%NODE_BIN%" server.js
pause
