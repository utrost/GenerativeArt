#!/bin/bash
echo "Building Java App..."
mvn clean compile
if [ $? -ne 0 ]; then
    echo "Java Compilation Failed"
    exit 1
fi

echo "Building Web App..."
cd web
npm install
npm run build
if [ $? -ne 0 ]; then
    echo "Web Build Failed"
    exit 1
fi

echo "Build successful!"
