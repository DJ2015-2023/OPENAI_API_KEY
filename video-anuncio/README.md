# 🎬 Video Anuncio Profesional - Remotion

Proyecto Remotion para crear videos de anuncio profesionales con 14 fotos en formato vertical 9:16.

## 📋 Características

✅ **Transiciones profesionales** - Zoom Ken Burns, fade suave
✅ **Aspect ratio 9:16** - Optimizado para Instagram Reels, TikTok
✅ **Efectos visuales** - Vignette, overlay, sombras sutiles
✅ **Animaciones dinámicas** - Pan effects, zoom smooth
✅ **Duración calculada** - 2.5s por foto + transiciones
✅ **Calidad profesional** - 1080x1920 @ 30fps, H.264 codec

## 🚀 Instalación y Uso

```bash
# Instalar dependencias
npm install

# Ver preview en tiempo real
npm run start

# Renderizar video final (MP4)
npm run build

# Renderizar con codec H.265 (archivo más pequeño)
npm run render-h265
```

## 📁 Estructura

```
video-anuncio/
├── src/
│   ├── index.tsx          # Entrada principal
│   ├── AnuncioVideo.tsx   # Composición principal
│   └── Slide.tsx          # Componente para cada foto
├── public/
│   └── images/            # 14 fotos (S 01.png - S 14.png)
├── package.json
├── tsconfig.json
└── remotion.config.ts     # Configuración de Remotion
```

## 🎨 Personalización

Puedes editar en `src/AnuncioVideo.tsx`:
- `DURATION_PER_SLIDE`: Duración de cada foto (segundos)
- `WIDTH` / `HEIGHT`: Resolución
- `FPS`: Fotogramas por segundo
- Colores de gradientes y overlays

## 📊 Especificaciones Finales

- **Duración total**: ~35 segundos (14 fotos × 2.5s)
- **Resolución**: 1080x1920 (9:16)
- **FPS**: 30
- **Codec**: H.264 (compatible con todas las plataformas)
- **Tamaño estimado**: ~50-80 MB

---

**Creado con Remotion** 🎥
