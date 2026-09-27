#!/bin/bash

# Script de renderizado profesional para Remotion

set -e

echo "🎬 Video Anuncio - Remotion Renderer"
echo "===================================="
echo ""

# Opciones
QUALITY=${1:-"high"}
OUTPUT=${2:-"output.mp4"}

case $QUALITY in
  "fast")
    echo "⚡ Modo: RÁPIDO (archivo más pequeño)"
    npm run render-h265
    ;;
  "high"|*)
    echo "🎥 Modo: ALTA CALIDAD (archivo estándar)"
    npm run build
    ;;
esac

echo ""
echo "✅ Renderización completada!"
echo "📁 Archivo guardado: $OUTPUT"
echo ""
echo "📊 Especificaciones:"
echo "   • Resolución: 1080x1920 (9:16)"
echo "   • Duración: ~35 segundos"
echo "   • Fotogramas: 30 FPS"
echo "   • Fotos: 14"
echo ""
