@echo off
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot"
echo Launching Java Swing UI...
call mvn exec:java -Dexec.mainClass="org.trostheide.generativeArt.swing.SwingApp"
if %ERRORLEVEL% NEQ 0 (
    pause
    exit /b %ERRORLEVEL%
)
