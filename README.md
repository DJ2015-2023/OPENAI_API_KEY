# Agente de publicaciones · DR Веб-Дизайн

Bot de Telegram que **escribe, te deja aprobar y publica** tus posts en tu **canal de Telegram** y tu **comunidad de VK**, y que **responde automáticamente a los clientes** que escriben palabras clave (БОТ, САЙТ, ЦЕНА…).

## Cómo funciona

### 🎨 Carruseles: el agente dirige, tú diseñas
```
Cada mañana (o con /brief cards) el agente te manda el BRIEF del carrusel de mañana:
  🎯 objetivo · 🪝 gancho · 1️⃣…7️⃣ diapositivas (texto en ruso para la imagen + qué mostrar)
  ✍️ texto sugerido para el post
        ↓
Tú diseñas las imágenes (Canva, Figma, Photoshop…) siguiendo las instrucciones
        ↓
Le mandas las imágenes JUNTAS como álbum:
  – con tu texto en el pie → se publica tu texto tal cual
  – sin texto → se usa el texto sugerido del brief
        ↓
Borrador con botones:  ✅ Publicar ahora · 🕒 Programar · ✏️ Editar · ✨ Pulir · 🔄 Otra versión · ❌ Descartar
        ↓
Se publica el carrusel en el canal de Telegram + muro de VK, y te devuelve el texto para Instagram
```

Las reglas de diseño de los carruseles (formato 1080×1350, estilo claro azul, máximo 15 palabras por diapositiva, logo, llamada a la acción…) están en `brand.json → carousel` y salen del análisis de lo que mejor funcionó en tu perfil. Un carrusel se une al brief pendiente más antiguo de los últimos 3 días; si quieres otro, pon su rúbrica en el pie (`#web`).

### 📸 Post de una foto o video
Mándale una foto o video (+ nota opcional, ej. `#bots бот для барбершопа`) y la IA escribe el texto.

**Clientes:** cuando alguien escribe al bot de Telegram o a la comunidad de VK, el agente responde según la palabra clave, guarda el contacto y te avisa. **Si respondes (reply) a ese aviso, tu respuesta le llega al cliente.**

**Calendario** (`brand.json → calendar`): lunes 19:00 bots · miércoles 19:00 tarjetas de producto · viernes 19:00 webs/apps · domingo 12:00 marca personal. «🕒 Programar» coloca el post en el próximo horario libre. Cada mañana a las 10:00 te recuerda qué toca hoy y te manda el brief de mañana.

### Comandos

| Comando | Qué hace |
|---|---|
| `/brief [rúbrica]` | instrucciones de un carrusel (rúbricas: `bots` `cards` `web` `personal`) |
| álbum de fotos | carrusel listo para publicar |
| foto / video | post de una imagen; la IA escribe el texto |
| `/idea [rúbrica]` | borrador solo de texto con una idea del calendario |
| `/cola` | publicaciones programadas |
| `/leads` | últimos clientes que escribieron |
| ✏️ Editar → texto | reemplaza el texto; si empieza con `IA:` la IA lo reescribe (ej. `IA: más corto, añade oferta -50%`) |
| ✨ Pulir | la IA mejora tu texto sin cambiar el sentido |

## Instalación paso a paso

### 1. Bot y canal de Telegram
1. En Telegram abre **@BotFather** → `/newbot` → copia el token a `TELEGRAM_BOT_TOKEN`.
2. Crea tu canal (o usa el que tienes) y añade el bot como **administrador** con permiso de publicar. Pon `@nombre_del_canal` en `TELEGRAM_CHANNEL`.
3. Arranca el agente sin `OWNER_CHAT_ID`, escríbele cualquier cosa al bot: te responderá tu chat id. Ponlo en `OWNER_CHAT_ID` y reinicia.

### 2. VK
1. Usa tu **comunidad** de VK. Su ID numérico va en `VK_GROUP_ID`.
2. **Para responder mensajes:** Comunidad → Управление → Работа с API → *Создать ключ* con permiso «сообщения сообщества» → `VK_GROUP_TOKEN`. En *Long Poll API* actívalo y marca el evento «Входящее сообщение». En *Сообщения* activa los mensajes de la comunidad.
3. **Para publicar en el muro:** VK exige un token de **usuario administrador** (el de comunidad no puede subir fotos al muro). Crea una aplicación en [dev.vk.com](https://dev.vk.com) y obtén un token con permisos `wall, photos, video, groups, offline` → `VK_USER_TOKEN`.

> Si de momento solo configuras Telegram, el agente funciona igual; VK se activa en cuanto pongas sus variables.

### 3. Clave de IA (elige una)

**YandexGPT (recomendado en Rusia: se paga con tarjeta rusa y no necesita VPN)**
1. Entra en [console.yandex.cloud](https://console.yandex.cloud) con tu cuenta de Yandex y crea una **cuenta de facturación** (платёжный аккаунт). A las cuentas nuevas se les suele dar un saldo de prueba.
2. Abre la carpeta `default` y copia su **ID** (empieza por `b1g…`) → `YANDEX_FOLDER_ID`.
3. En esa carpeta: **Сервисные аккаунты → Создать** → nombre `agente-dr`, rol **`ai.languageModels.user`**.
4. Entra en el service account → **Создать новый ключ → Создать API-ключ** (área `yc.ai.languageModels.execute`) → copia el secreto (empieza por `AQVN…`) → `YANDEX_API_KEY`.
5. En `.env` pon `LLM_PROVIDER=yandex`.

> YandexGPT no ve las imágenes: el texto se escribe a partir de la nota que pongas en el pie de la foto y de la rúbrica. Escribe siempre una nota corta.

**OpenAI o Anthropic:** pon `OPENAI_API_KEY` o `ANTHROPIC_API_KEY` y `LLM_PROVIDER=openai`/`anthropic`. Ninguno da servicio desde Rusia: necesitan VPN o un servidor fuera de Rusia, y se pagan con tarjeta extranjera.

### 4. Ejecutar

```bash
cp .env.example .env      # y rellénalo
pip install -r requirements.txt
python -m agent.main
```

Con Docker, en un VPS (por ejemplo en Europa, desde ~5 €/mes):

```bash
docker build -t dr-agent .
docker run -d --restart=always --env-file .env -v $(pwd)/data:/app/data --name dr-agent dr-agent
```

## Personalizar
Todo el contenido de la marca está en **`brand.json`**: servicios, público, tono, hashtags, rúbricas e ideas, calendario y textos de respuesta automática. **Cambia `contact` por tu usuario real de Telegram.** Después de editarlo, reinicia el agente.

## Pruebas

```bash
pip install -r requirements-dev.txt
python -m pytest
```

## Límites conocidos y próximos pasos
- El bot de Telegram solo puede descargar archivos de **hasta 20 MB**: los videos más pesados se publican en Telegram, pero no se suben a VK.
- **Instagram:** por ahora el agente te da el texto listo para pegar. La publicación automática necesita la cuenta Business vinculada a una página de Facebook (Instagram Graph API).
- Ideas para la siguiente versión: informe semanal de vistas por rúbrica, generar las imágenes con IA según tu estilo, publicar también en MAX.
