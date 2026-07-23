#!/bin/bash
set -euo pipefail

echo "Building Web App..."
cd web
npm install
npm run build

echo "Build successful!"
