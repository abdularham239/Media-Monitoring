@echo off
TITLE TV Channel Monitoring System
COLOR 0A
CLS

echo ============================================================
echo      TV CHANNEL MONITORING & RECORDING SYSTEM
echo ============================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed on this system!
    echo Please download and install Node.js (v18 or higher) from https://nodejs.org
    echo.
    pause
    exit /b
)

echo [1/3] Checking dependencies...
if not exist "node_modules\" (
    echo Installing required packages (this may take a minute on first run)...
    call npm install
) else (
    echo Dependencies found.
)

echo.
echo [2/3] Building production bundle...
if not exist "dist\" (
    call npm run build
)

echo.
echo [3/3] Launching TV Monitoring Server on http://localhost:3000 ...
echo.

:: Open browser automatically after 2 seconds
start "" "http://localhost:3000"

:: Start Node server
call npm start

pause
