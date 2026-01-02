#!/bin/bash
# Compile and Run the Generative Art Web Control Center

# 1. Compile
echo "Compiling..."
mkdir -p bin
javac -d bin -sourcepath src/main/java src/main/java/org/trostheide/generativeArt/app/App.java

# 2. Run
if [ $? -eq 0 ]; then
    echo "Starting Server..."
    java -cp bin org.trostheide.generativeArt.app.App
else
    echo "Compilation Failed"
fi
