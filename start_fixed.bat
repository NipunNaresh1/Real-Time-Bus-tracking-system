@echo off
echo Starting Real-Time Bus Tracker...
echo.

echo Starting Server on port 4600...
start "Server" cmd /k "cd /d C:\Users\NIPUN\OneDrive\Desktop\sih final\server && C:\Program Files\nodejs\node.exe index.js"

timeout /t 3 /nobreak >nul

echo Starting Client on port 3001...
start "Client" cmd /k "cd /d C:\Users\NIPUN\OneDrive\Desktop\sih final\client && set PORT=3001 && C:\Program Files\nodejs\npm.cmd start"

echo.
echo Both services are starting...
echo Server: http://localhost:4600
echo Client: http://localhost:3001
echo.
pause
