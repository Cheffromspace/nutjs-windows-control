#!/bin/bash

# Get absolute path to this script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Ensure MCPControl is built
if [ ! -f "$PROJECT_ROOT/build/index.js" ]; then
  echo "MCPControl not built. Building now..."
  cd "$PROJECT_ROOT" && npm run build
fi

# Ensure MCP client is built
if [ ! -d "$SCRIPT_DIR/dist" ]; then
  echo "MCP client not built. Building now..."
  cd "$SCRIPT_DIR" && npm install && npm run build
fi

# Check if a script file is provided
if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <script.json>"
  exit 1
fi

SCRIPT_PATH="$1"
if [ ! -f "$SCRIPT_PATH" ]; then
  echo "Script file not found: $SCRIPT_PATH"
  exit 1
fi

# Run the MCP client with the main MCPControl server
echo "Running MCP client with script: $SCRIPT_PATH"
node "$SCRIPT_DIR/dist/index.js" "$PROJECT_ROOT/build/index.js" "$SCRIPT_PATH"