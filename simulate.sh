#!/bin/bash

# Configuration
# Path to source relative to project root
SRC_ROOT="src/main/java"
PACKAGE_PATH="org/trostheide/generativeArt"
JAVA_FILE="${SRC_ROOT}/${PACKAGE_PATH}/ReactionDiffusionSVG.java"
CLASS_NAME="org.trostheide.generativeArt.ReactionDiffusionSVG"
BUILD_DIR="bin"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 0. Sanity Check
if [ ! -f "$JAVA_FILE" ]; then
    echo -e "${RED}Error: Source file not found at expected location:${NC}"
    echo "  $JAVA_FILE"
    echo ""
    echo "Attempting to locate it..."

    # Try to find it in root or weird places and move it if found (Self-repair)
    FOUND=$(find . -name "ReactionDiffusionSVG.java" | head -n 1)
    if [ -n "$FOUND" ] && [ "$FOUND" != "./$JAVA_FILE" ]; then
        echo -e "${GREEN}Found at $FOUND. Moving to correct structure...${NC}"
        mkdir -p "$(dirname "$JAVA_FILE")"
        mv "$FOUND" "$JAVA_FILE"
    else
        echo -e "${RED}Could not find ReactionDiffusionSVG.java.${NC}"
        echo "Please ensure the file is generated."
        exit 1
    fi
fi

# 1. Clean & Prepare Build Directory
mkdir -p "$BUILD_DIR"

# 2. Compile
# We assume we are in the project root.
# -sourcepath points to src/main/java so javac can resolve the package structure
echo -e "${GREEN}Compiling...${NC}"
if ! javac -d "$BUILD_DIR" -sourcepath "$SRC_ROOT" "$JAVA_FILE"; then
    echo -e "${RED}Compilation failed.${NC}"
    exit 1
fi

# 3. Run
echo -e "${GREEN}Running ${CLASS_NAME}...${NC}"
java -cp "$BUILD_DIR" "$CLASS_NAME" "$@"

# 4. Notification
LATEST_SVG=$(ls -t pattern_*.svg 2>/dev/null | head -n1)
if [ -n "$LATEST_SVG" ]; then
    echo -e "${GREEN}Done. Output: $LATEST_SVG${NC}"
fi