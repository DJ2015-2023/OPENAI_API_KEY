#!/usr/bin/env bash
# Install MeiGen-AI/InfiniteTalk (https://github.com/MeiGen-AI/InfiniteTalk).
#
# Usage:
#   ./install_infinitetalk.sh [install_dir]
#
# Environment variables:
#   DEVICE=cuda|cpu      cuda (default) installs CUDA 12.1 torch + xformers + flash-attn;
#                        cpu installs CPU torch only (code imports, no real inference).
#   DOWNLOAD_WEIGHTS=1   also download model weights (~80 GB of disk; needs a GPU with
#                        enough VRAM to actually run inference).
#   TORCH_INDEX_URL=...  override the PyTorch wheel index (empty string = use PyPI).
set -euo pipefail

INSTALL_DIR="${1:-$HOME/InfiniteTalk}"
DEVICE="${DEVICE:-cuda}"
DOWNLOAD_WEIGHTS="${DOWNLOAD_WEIGHTS:-0}"

if ! command -v uv >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi

if [ ! -d "$INSTALL_DIR/.git" ]; then
  git clone --depth 1 https://github.com/MeiGen-AI/InfiniteTalk.git "$INSTALL_DIR"
fi
cd "$INSTALL_DIR"

# Upstream targets Python 3.10 (numpy<2 has no wheels for 3.13).
uv venv --python 3.10 .venv
# shellcheck disable=SC1091
source .venv/bin/activate

if [ "$DEVICE" = "cuda" ]; then
  TORCH_INDEX_URL="${TORCH_INDEX_URL-https://download.pytorch.org/whl/cu121}"
else
  TORCH_INDEX_URL="${TORCH_INDEX_URL-https://download.pytorch.org/whl/cpu}"
fi
INDEX_ARGS=()
[ -n "$TORCH_INDEX_URL" ] && INDEX_ARGS=(--index-url "$TORCH_INDEX_URL")

uv pip install torch==2.4.1 torchvision==0.19.1 torchaudio==2.4.1 "${INDEX_ARGS[@]}"
if [ "$DEVICE" = "cuda" ]; then
  uv pip install xformers==0.0.28 "${INDEX_ARGS[@]}"
  uv pip install ninja psutil packaging wheel setuptools
  uv pip install flash_attn==2.7.4.post1 --no-build-isolation
fi

# Upstream requirements are unpinned; newer releases (transformers 5, huggingface_hub 1+,
# xfuser 0.4.4+ which needs torch>=2.5) break imports, so constrain them.
uv pip install "misaki[en]" -r requirements.txt librosa \
  "transformers>=4.49,<4.53" "diffusers>=0.31,<0.35" "huggingface_hub[cli]<1.0" \
  "peft<0.16" "xfuser>=0.4.1,<0.4.4" "yunchang<0.6.4"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "WARNING: ffmpeg not found; install it with your package manager (e.g. apt install ffmpeg)." >&2
fi

if [ "$DOWNLOAD_WEIGHTS" = "1" ]; then
  huggingface-cli download Wan-AI/Wan2.1-I2V-14B-480P --local-dir ./weights/Wan2.1-I2V-14B-480P
  huggingface-cli download TencentGameMate/chinese-wav2vec2-base --local-dir ./weights/chinese-wav2vec2-base
  huggingface-cli download TencentGameMate/chinese-wav2vec2-base model.safetensors \
    --revision refs/pr/1 --local-dir ./weights/chinese-wav2vec2-base
  huggingface-cli download MeiGen-AI/InfiniteTalk --local-dir ./weights/InfiniteTalk
fi

echo "InfiniteTalk installed in $INSTALL_DIR (activate with: source $INSTALL_DIR/.venv/bin/activate)"
