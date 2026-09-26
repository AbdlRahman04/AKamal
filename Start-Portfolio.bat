@echo off
setlocal
title Abdl Rahman Kamal Photography Portfolio

cd /d "%~dp0"

echo.
echo  ================================================
echo   ABDL RAHMAN KAMAL - PHOTOGRAPHY PORTFOLIO
echo  ================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  Node.js is not installed or is not available in PATH.
  echo  Install the current LTS version from https://nodejs.org, then run this file again.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo  npm could not be found. Reinstall Node.js from https://nodejs.org.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo  First launch: installing project dependencies...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo  Installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

echo  Starting your portfolio...

for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$used = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners().Port; foreach ($port in 3000..3010) { if ($used -notcontains $port) { $port; break } }"`) do set "PORT=%%P"

if not defined PORT (
  echo  No available port was found in the range 3000-3010.
  echo  Close an unused local server and run this file again.
  echo.
  pause
  exit /b 1
)

set "URL=http://localhost:%PORT%"
echo  Your browser will open at %URL%
echo.
echo  Keep this window open while viewing the website.
echo  Press Ctrl+C here when you are finished.
echo.

start "" /b powershell -NoProfile -WindowStyle Hidden -Command "$url = '%URL%'; for ($attempt = 0; $attempt -lt 60; $attempt++) { try { $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 $url; if ($response.StatusCode -ge 200) { Start-Process $url; exit 0 } } catch { }; Start-Sleep -Milliseconds 500 }; exit 1"
call npm run dev

endlocal
