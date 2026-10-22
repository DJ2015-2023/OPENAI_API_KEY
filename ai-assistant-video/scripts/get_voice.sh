#!/usr/bin/env bash
# Downloads the neural Russian male voice (Piper "denis", packaged by sherpa-onnx).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p models
if [ ! -d models/vits-piper-ru_RU-denis-medium ]; then
  curl -sSL https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-ru_RU-denis-medium.tar.bz2 | tar xj -C models
fi
pip install -q sherpa-onnx numpy scipy
