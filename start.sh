#!/bin/bash

echo "============================================================"
echo "      TV CHANNEL MONITORING & RECORDING SYSTEM"
echo "============================================================"
echo ""

if ! command -v node &> /dev/null
then
    echo "[ERROR] Node.js is not installed! Please install Node.js v18+."
    exit 1
fi

echo "[1/3] Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing required packages..."
    npm install
fi

echo "[2/3] Building production bundle..."
if [ ! -d "dist" ]; then
    npm run build
fi

echo "[3/3] Launching TV Monitoring Server on http://localhost:3000..."
sleep 2

# Open default web browser cross-platform
if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000"
elif command -v open &> /dev/null; then
    open "http://localhost:3000"
fi

npm start
