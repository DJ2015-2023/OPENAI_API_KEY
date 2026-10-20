# Conectar tu canal de YouTube (una sola vez, ~15 minutos)

Al final tendrás tres valores que guardarás como **variables de entorno** del entorno de
Claude Code. Nunca los pegues en el chat.

| Variable | Qué es |
|---|---|
| `YT_CLIENT_ID` | ID de cliente OAuth de tu proyecto de Google Cloud |
| `YT_CLIENT_SECRET` | Secreto de ese cliente |
| `YT_REFRESH_TOKEN` | Permiso permanente para subir videos a tu canal |
| `YT_PRIVACY` (opcional) | `private` (por defecto), `unlisted` o `public` |

## 1. Proyecto y API

1. Entra en <https://console.cloud.google.com/> con la cuenta de Google de tu canal.
2. Crea un proyecto nuevo (por ejemplo, "AI Shorts").
3. Ve a **APIs y servicios → Biblioteca**, busca **YouTube Data API v3** y pulsa **Habilitar**.

## 2. Pantalla de consentimiento

1. **APIs y servicios → Pantalla de consentimiento de OAuth** (o "Google Auth Platform").
2. Tipo de usuario: **Externo**. Rellena nombre de la app y tu correo.
3. En **Usuarios de prueba**, añade tu propio correo.
4. Muy importante: en **Estado de publicación**, pulsa **Publicar app / Pasar a producción**.
   Si se queda en "Prueba", el permiso caduca cada 7 días y las subidas dejarán de funcionar.
   No hace falta que Google la verifique: al autorizar verás un aviso de "app no verificada";
   pulsa **Configuración avanzada → Ir a AI Shorts**.

## 3. Credenciales

1. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**.
2. Tipo: **Aplicación web**.
3. En **URI de redireccionamiento autorizados** añade exactamente:
   `https://developers.google.com/oauthplayground`
4. Crea y copia el **ID de cliente** y el **Secreto del cliente**.

## 4. Obtener el refresh token

1. Abre <https://developers.google.com/oauthplayground/>.
2. Pulsa el engranaje ⚙️ (arriba a la derecha), marca **Use your own OAuth credentials** y pega
   tu ID de cliente y tu secreto.
3. A la izquierda, en el cuadro **Input your own scopes**, pega:
   `https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly`
4. Pulsa **Authorize APIs**, elige la cuenta del canal y acepta.
5. Pulsa **Exchange authorization code for tokens** y copia el **Refresh token**.

## 5. Guardarlos en el entorno

En la app de Claude: menú del entorno en la barra de título de la sesión → **Editar** →
variables de entorno. Añade `YT_CLIENT_ID`, `YT_CLIENT_SECRET` y `YT_REFRESH_TOKEN`
(y, si quieres, `YT_PRIVACY`). Las sesiones nuevas las tendrán disponibles.

Para comprobarlo, en una sesión nueva: `node ai-shorts/scripts/youtube.mjs check`
debería responder con el nombre de tu canal.

## Videos en privado al principio

YouTube deja en **privado** todo lo que sube una app de API que no ha pasado su auditoría.
Mientras tanto, cada Short se sube en privado y tú lo cambias a público en YouTube Studio
con un clic. Para publicar directamente en público, solicita la auditoría (gratuita) en
<https://support.google.com/youtube/contact/yt_api_form> y, cuando la aprueben, pon
`YT_PRIVACY=public`.
