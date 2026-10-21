#!/usr/bin/env bash
# Prepare a fresh container: Node deps, SciPy for the soundtrack, ffmpeg check.
# The Kokoro voice model (and the Piper fallback) are downloaded on first build.
set -euo pipefail
cd "$(dirname "$0")/.."
command -v ffmpeg >/dev/null || { echo "ffmpeg is required"; exit 1; }
[ -d node_modules ] || npm ci --no-audit --no-fund
python3 -c "import numpy, scipy, kokoro_onnx, soundfile" 2>/dev/null || pip install -q numpy scipy kokoro-onnx soundfile
echo "ready"
