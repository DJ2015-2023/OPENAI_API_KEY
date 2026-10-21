# Agente de publicaciones · DR Веб-Дизайн

Bot de Telegram que **escribe, te deja aprobar y publica** tus posts en tu **canal de Telegram** y tu **comunidad de VK**, y que **responde automáticamente a los clientes** que escriben palabras clave (БОТ, САЙТ, ЦЕНА…).

## Cómo funciona

```
Tú mandas una foto/video al bot (+ nota opcional, ej. "#bots бот для барбершопа")
        ↓
La IA mira la foto y escribe el texto en ruso (gancho + beneficios + «Напишите «БОТ»» + hashtags)
        ↓
Te llega el borrador con botones:  ✅ Publicar ahora · 🕒 Programar · ✏️ Editar · 🔄 Otra versión · ❌ Descartar
        ↓
Se publica en el canal de Telegram + muro de VK, y te devuelve el texto para pegarlo en Instagram
```

**Clientes:** cuando alguien escribe al bot de Telegram o a la comunidad de VK, el agente responde según la palabra clave, guarda el contacto y te avisa. **Si respondes (reply) a ese aviso, tu respuesta le llega al cliente.**

**Calendario** (`brand.json → calendar`): lunes 19:00 bots · miércoles 19:00 tarjetas de producto · viernes 19:00 webs/apps · domingo 12:00 marca personal. «🕒 Programar» coloca el post en el próximo horario libre, y cada mañana a las 10:00 te recuerda qué toca hoy.

### Comandos

| Comando | Qué hace |
|---|---|
| foto / video | crea un borrador (rúbricas: `#bots` `#cards` `#web` `#personal`) |
| `/idea [rúbrica]` | borrador solo de texto con una idea del calendario |
| `/cola` | publicaciones programadas |
| `/leads` | últimos clientes que escribieron |
| ✏️ Editar → texto | reemplaza el texto; si empieza con `IA:` la IA lo reescribe (ej. `IA: más corto, añade oferta -50%`) |

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

### 3. Clave de IA
Pon `OPENAI_API_KEY` **o** `ANTHROPIC_API_KEY`. Ojo: OpenAI y Anthropic no dan servicio desde Rusia, así que el agente tiene que correr en un **servidor fuera de Rusia** (ver abajo) y la cuenta se paga con una tarjeta extranjera.

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
