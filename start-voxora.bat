@echo off
title VOXORA AI Studio
echo ========================================================
echo           VOXORA AI Studio (Localhost Edition)
echo ========================================================
echo.
echo Starting Next.js Dev Server on http://localhost:3000...
echo.

cd /d "%~dp0"
set "PATH=C:\Users\Lenovo\nodejs;%PATH%"

:: Automatically open browser after 2 seconds
timeout /t 2 /nobreak >nul
start http://localhost:3000

:: Start dev server
npm run dev

pause
