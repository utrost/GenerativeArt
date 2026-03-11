@echo off
echo Starting Web UI Development Server...
cd web
call npm run dev
if %ERRORLEVEL% NEQ 0 (
    pause
    exit /b %ERRORLEVEL%
)
