#!/usr/bin/env bash
# Prepare a fresh container: Node deps, SciPy for the soundtrack, ffmpeg check.
# Piper TTS is downloaded on first build.
set -euo pipefail
cd "$(dirname "$0")/.."
command -v ffmpeg >/dev/null || { echo "ffmpeg is required"; exit 1; }
[ -d node_modules ] || npm ci --no-audit --no-fund
python3 -c "import numpy, scipy" 2>/dev/null || pip install -q numpy scipy
echo "ready"
