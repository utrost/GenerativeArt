#!/bin/bash
# Compile and Run the Generative Art Web Control Center

echo "Compiling and launching Swing App..."
mvn clean compile exec:java -Dexec.mainClass="org.trostheide.generativeArt.swing.SwingApp"
if [ $? -ne 0 ]; then
    echo "Compilation Failed"
fi
