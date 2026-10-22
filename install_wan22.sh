#!/usr/bin/env bash
# Install Wan-Video/Wan2.2 (https://github.com/Wan-Video/Wan2.2).
#
# Usage:
#   ./install_wan22.sh [install_dir]
#
# Environment variables:
#   MODEL=<name>         also download weights for one model, e.g. TI2V-5B (~32 GB, runs on a
#                        24 GB GPU), T2V-A14B, I2V-A14B, S2V-14B or Animate-14B (A14B/14B need ~80 GB VRAM).
#   S2V=1                also install the speech-to-video (CosyVoice) extras.
set -euo pipefail

INSTALL_DIR="${1:-$HOME/Wan2.2}"
MODEL="${MODEL:-}"
S2V="${S2V:-0}"

if ! command -v uv >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi

if [ ! -d "$INSTALL_DIR/.git" ]; then
  git clone --depth 1 https://github.com/Wan-Video/Wan2.2.git "$INSTALL_DIR"
fi
cd "$INSTALL_DIR"

uv venv --python 3.11 .venv
# shellcheck disable=SC1091
source .venv/bin/activate

# torch 2.8.0 from PyPI (CUDA 12.8 build) has a prebuilt flash-attn 2.8.3 wheel, so no
# CUDA toolkit or compile step is needed.
uv pip install torch==2.8.0 torchvision==0.23.0 torchaudio==2.8.0
# Upstream requirements are unpinned; newer diffusers / huggingface_hub releases break
# imports, so constrain them. flash_attn is installed last, as upstream recommends.
grep -v '^flash_attn' requirements.txt > .requirements-no-flash.txt
uv pip install -r .requirements-no-flash.txt "diffusers>=0.31,<0.35" "huggingface_hub[cli]<1.0"
rm .requirements-no-flash.txt
uv pip install ninja packaging psutil wheel setuptools
uv pip install flash_attn==2.8.3 --no-build-isolation

if [ "$S2V" = "1" ]; then
  uv pip install -r requirements_s2v.txt
fi

if [ -n "$MODEL" ]; then
  huggingface-cli download "Wan-AI/Wan2.2-$MODEL" --local-dir "./Wan2.2-$MODEL"
fi

echo "Wan2.2 installed in $INSTALL_DIR (activate with: source $INSTALL_DIR/.venv/bin/activate)"
