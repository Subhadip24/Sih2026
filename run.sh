#!/usr/bin/env bash
# ThaalTatva AI - 1-Click Launch Script
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

if [ ! -d ".venv" ]; then
    echo "Creating Python Virtual Environment..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install fastapi uvicorn pillow requests pydantic python-multipart google-generativeai
else
    source .venv/bin/activate
fi

echo "=========================================================="
echo " Starting ThaalTatva AI Server on http://127.0.0.1:8000 "
echo "=========================================================="

python3 -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
