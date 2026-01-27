@echo off
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot"
echo Compiling and launching Swing App...
call mvn clean compile exec:java -Dexec.mainClass="org.trostheide.generativeArt.swing.SwingApp"
if %ERRORLEVEL% NEQ 0 (
    echo Compilation Failed
    pause
    exit /b %ERRORLEVEL%
)
