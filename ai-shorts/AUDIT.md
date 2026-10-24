# Solicitud de auditoría de la API de YouTube

Mientras Google no audite el proyecto, todo lo que se sube por la API queda **privado**. La
auditoría es gratuita y suele tardar **de 1 a 4 semanas**. Google puede responder por correo
pidiendo aclaraciones: contesta en inglés con los textos de abajo.

## Antes de enviar (5 minutos)

1. **Número del proyecto:** en <https://console.cloud.google.com/> elige el proyecto
   "AI Shorts" → **Panel / Dashboard** → copia el **Número del proyecto** (*Project number*,
   solo dígitos). No es el ID ni el secreto: no es confidencial.
2. **ID del canal:** en <https://www.youtube.com/account_advanced> copia el **ID del canal**
   (empieza por `UC…`).
3. **Pantalla de consentimiento:** en Google Cloud → **Google Auth Platform → Branding**,
   comprueba que estén puestos estos enlaces:
   - Página principal: `https://dj2015-2023.github.io/OPENAI_API_KEY/`
   - Política de privacidad: `https://dj2015-2023.github.io/OPENAI_API_KEY/privacy.html`
   - Condiciones del servicio: `https://dj2015-2023.github.io/OPENAI_API_KEY/terms.html` (nuevo)
4. **Vídeo de demostración (lo piden casi siempre):** graba la pantalla del móvil o del PC,
   1–2 minutos, y súbelo a YouTube como **oculto** (*unlisted*). Muestra:
   - la pantalla de permisos de Google al autorizar la app (OAuth Playground → *Authorize APIs*);
   - un Short subido por la app en YouTube Studio (aparece como privado);
   - la descripción del Short, con las fuentes y la marca de contenido sintético.

## El formulario

Abre <https://support.google.com/youtube/contact/yt_api_form> con la cuenta del canal y
elige **"I want to have my API client audited"** (o *Audit and quota extension*). Rellena
así (en inglés):

| Campo | Qué poner |
| --- | --- |
| Name / Email | Tu nombre y el correo de la cuenta del canal |
| Organization name | AI Shorts (individual developer) |
| Organization address / country | Tu ciudad y país |
| Organization website | `https://dj2015-2023.github.io/OPENAI_API_KEY/` |
| Google Cloud project number | El número del paso 1 |
| API client name | AI Shorts |
| YouTube channel(s) | `https://www.youtube.com/channel/<ID del paso 2>` |
| Is the client publicly available? | **No** — internal tool used only by the channel owner |
| Number of users | 1 |
| Privacy policy URL | `https://dj2015-2023.github.io/OPENAI_API_KEY/privacy.html` |
| Terms of service URL | `https://dj2015-2023.github.io/OPENAI_API_KEY/terms.html` |
| APIs used | YouTube Data API v3, YouTube Analytics API |
| Demo video / screencast | El enlace oculto del paso 4 |
| Quota requested | Deja la de siempre (10 000 unidades/día bastan para ~6 subidas) |

### Use case description

```
AI Shorts is a private, internal tool used only by the owner of one YouTube channel
(1 user). It produces original 30-second motion-graphics videos about artificial
intelligence news, narrated with a synthetic voice, and uploads them to the owner's own
channel. It is not offered to the public and has no sign-up.

The owner authorizes the tool once with OAuth 2.0 on their own Google account. Each day the
tool writes up to three short news videos, each based on at least two cited sources (listed
in the video description), and uploads them with videos.insert, with
selfDeclaredMadeForKids=false and containsSyntheticMedia=true.

API calls, all on the owner's own channel only:
- videos.insert: upload the day's videos (up to 3-5 per day).
- channels.list (mine=true) and playlistItems.list: read the titles of recent uploads so the
  same story is never covered twice.
- videos.list (statistics) and YouTube Analytics reports (views, average view duration):
  measure which topics work, to pick better stories. Not stored beyond the run.
- commentThreads.insert: post the channel's own question as the first comment on its own
  public videos, to invite discussion.

No data from other users or channels is collected, stored or shared. Credentials are kept
privately by the owner and access can be revoked at any time.

We request an audit so uploads can be published as public, as described in the YouTube API
Services Terms of Service, instead of being locked to private.
```

## Después

Cuando Google confirme la auditoría, dímelo y activo la publicación en público: se configura
la variable `YT_PRIVACY=public` en el entorno (Google Cloud no cambia nada más).
