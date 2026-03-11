@echo off
echo Building Java App...
call mvn clean compile
if %ERRORLEVEL% NEQ 0 (
    echo Java Compilation Failed
    exit /b %ERRORLEVEL%
)

echo Building Web App...
cd web
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Web Build Failed
    cd ..
    exit /b %ERRORLEVEL%
)

cd ..
echo Build successful!
