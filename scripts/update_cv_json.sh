#!/usr/bin/env bash

# Script to update the CV JSON file from the markdown CV
# Author: Yuan Chen

set -euo pipefail

# Set the base directory to the repository root
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Define file paths
CV_MARKDOWN="$BASE_DIR/_pages/cv.md"
CV_JSON="$BASE_DIR/_data/cv.json"
CONFIG_FILE="$BASE_DIR/_config.yml"

PYTHON_SCRIPT="$BASE_DIR/scripts/cv_markdown_to_json.py"

for required_file in "$PYTHON_SCRIPT" "$CV_MARKDOWN" "$CONFIG_FILE"; do
  if [[ ! -f "$required_file" ]]; then
    echo "Error: required file not found: $required_file" >&2
    exit 1
  fi
done

echo "Converting Markdown CV to JSON..."
python3 "$PYTHON_SCRIPT" \
  --input "$CV_MARKDOWN" \
  --output "$CV_JSON" \
  --config "$CONFIG_FILE"
echo "Updated $CV_JSON"

if [[ "${1:-}" == "--build" ]]; then
  cd "$BASE_DIR"
  bundle exec jekyll build
elif [[ $# -gt 0 ]]; then
  echo "Usage: $0 [--build]" >&2
  exit 2
fi
