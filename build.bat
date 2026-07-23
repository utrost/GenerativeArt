@echo off
echo Building Web App...
cd web
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Web dependency install failed
    exit /b %ERRORLEVEL%
)
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Web build failed
    exit /b %ERRORLEVEL%
)
echo Build successful!
