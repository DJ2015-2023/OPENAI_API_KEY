# 🎬 GUÍA DE CONFIGURACIÓN Y RENDERIZADO

## ✅ Estado Actual

Tu proyecto Remotion **está 100% listo** para renderizar. Todas las 14 fotos están incluidas y configuradas.

### 📊 Lo que tienes:

```
✓ 14 fotos en orden (S 01.png - S 14.png)
✓ Transiciones profesionales (zoom, fade, pan)
✓ Animaciones dinámicas (Ken Burns effect)
✓ Formato vertical 9:16 (1080x1920px)
✓ Duración: ~35 segundos
✓ Resolución: 30 FPS
✓ Effecto vignette + overlays profesionales
✓ Todas las dependencias instaladas
```

---

## 🚀 PASO 1: Descargar el Proyecto

El proyecto se encuentra en:
```
/home/user/OPENAI_API_KEY/video-anuncio/
```

**Descarga esta carpeta completa a tu computadora**

---

## 💻 PASO 2: Requisitos en tu PC

Necesitas tener instalado:
- **Node.js** (v16 o superior) → https://nodejs.org
- **npm** (viene con Node.js)

Verifica que están instalados:
```bash
node --version  # Debe mostrar v16+
npm --version   # Debe mostrar 8+
```

---

## 📥 PASO 3: Instalar Dependencias (en tu PC)

1. Abre terminal en la carpeta del proyecto
2. Ejecuta:

```bash
npm install
```

---

## 🎥 PASO 4: VER PREVIEW EN TIEMPO REAL

Para ver cómo se ve el video ANTES de renderizar:

```bash
npm run start
```

Se abrirá en tu navegador en `http://localhost:3000`

**Puedes:**
- ▶️ Reproducir el video
- ⏸️ Pausar
- 🔍 Ver cada fotograma
- 📊 Ajustar velocidad

---

## 🎬 PASO 5: RENDERIZAR EL VIDEO FINAL

### Opción A: ALTA CALIDAD (recomendado)

Genera un MP4 profesional de ~50-80MB:

```bash
npm run build
```

**Salida:** `output.mp4`

### Opción B: ARCHIVO MÁS PEQUEÑO

Usa codec H.265 para archivo más compacto (~30-50MB):

```bash
npm run render-h265
```

**Salida:** `output.mp4`

---

## ⏱️ TIEMPO DE RENDERIZADO

- **Primera renderización:** 2-5 minutos (depende de tu PC)
- **Renderizaciones siguientes:** 1-2 minutos (más rápido)

---

## 🎨 PERSONALIZACIÓN (Opcional)

Si quieres modificar el video DESPUÉS de verlo:

### Editar duración de cada foto:

Archivo: `src/AnuncioVideo.tsx` (línea 8)

```typescript
const DURATION_PER_SLIDE = 2.5; // Cambia a 3 para 3 segundos por foto
```

### Editar colores/efectos:

Archivo: `src/Slide.tsx` - Puedes ajustar:
- Velocidad de zoom (línea 56)
- Intensidad de vignette
- Blur/sombras

Después de cambios:
1. Guarda el archivo
2. El preview se actualiza automáticamente
3. Renderiza de nuevo con `npm run build`

---

## 📱 COMPATIBILIDAD

El video final funciona en:
✅ Instagram Reels (9:16 vertical)
✅ TikTok
✅ YouTube Shorts
✅ Facebook Stories
✅ WhatsApp Status
✅ Cualquier reproductor de video

---

## 🛠️ SOLUCIÓN DE PROBLEMAS

### "ffmpeg no encontrado"
- Windows: Descarga ffmpeg desde https://ffmpeg.org/download.html
- Mac: `brew install ffmpeg`
- Linux: `sudo apt-get install ffmpeg`

### "Error de permisos"
- Asegúrate de que la carpeta tiene permisos de lectura/escritura
- En Mac/Linux: `chmod -R 755 ./`

### "La renderización es lenta"
- Normal en renderización 4K
- Puedes cerrar otras apps
- Si tienes GPU, Remotion la usará automáticamente

---

## 📦 Próximos Pasos

1. ✅ **Descarga** esta carpeta a tu PC
2. ✅ **Abre terminal** en la carpeta
3. ✅ **Ejecuta:** `npm install`
4. ✅ **Visualiza:** `npm run start`
5. ✅ **Renderiza:** `npm run build`
6. ✅ **Sube** el `output.mp4` a tu red social

---

## 📞 Soporte

Para más información sobre Remotion:
- Documentación: https://www.remotion.dev/
- Discord: https://discord.gg/remotion

---

**¡Tu video anuncio profesional está listo! 🎉**

Generado con Remotion v4
