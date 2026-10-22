"""Lógica del agente: borradores con IA, aprobación por Telegram, publicación y atención a clientes."""
import json
import logging
import random
import threading
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from . import copywriter
from .autoreply import is_greeting, match_rule
from .config import Settings
from .llm import LLM
from .scheduler import next_free_slot, next_pillar, slots_on
from .storage import Store, iso, utcnow
from .telegram_api import TelegramAPI, keyboard
from .vk_api import VKMessenger, VKPublisher

log = logging.getLogger(__name__)

HELP = """🤖 Agente de publicaciones DR

🎨 CARRUSELES (tú diseñas, yo dirijo y publico)
• /brief [rúbrica] → te doy las instrucciones del carrusel: texto e idea visual de cada diapositiva + texto del post
  (además, cada mañana te mando el brief del carrusel de mañana)
• Mándame el carrusel como ÁLBUM (varias fotos a la vez):
  – con tu texto en el pie → publico tu texto tal cual
  – sin texto → uso el texto del brief
• ✨ Pulir → la IA mejora tu texto sin cambiar el sentido

📸 POST DE UNA FOTO / VIDEO
• Mándame una FOTO o VIDEO → escribo el texto en ruso y te lo muestro para aprobar.
  En el pie puedes poner una nota y la rúbrica: #bots #cards #web #personal
  Ej.: «#bots бот для барбершопа, запись 24/7»
• /idea [rúbrica] → borrador solo de texto con una idea del calendario
• /cola → publicaciones programadas
• /leads → últimos clientes que escribieron
• Responde (reply) a un aviso de cliente → le envío tu respuesta

Botones del borrador: ✅ publicar ya · 🕒 programar en el próximo horario · ✏️ editar · ✨ pulir · 🔄 otra versión · ❌ descartar"""

ALBUM_WAIT = 3  # segundos sin nuevas fotos para dar por completo un álbum
BRIEF_MAX_AGE_DAYS = 3  # un carrusel se une al brief pendiente más antiguo de estos días


def post_items(post: dict) -> list[dict]:
    """Fotos/videos de una publicación como [{"type", "file_id"}]."""
    if post["media_type"] == "album":
        return json.loads(post["media_file_id"])
    if post["media_file_id"]:
        return [{"type": post["media_type"], "file_id": post["media_file_id"]}]
    return []


def first_photo(post: dict) -> str | None:
    return next((i["file_id"] for i in post_items(post) if i["type"] == "photo"), None)


class App:
    def __init__(self, settings: Settings, store: Store, llm: LLM, tg: TelegramAPI,
                 vk_publisher: VKPublisher | None = None, vk_messenger: VKMessenger | None = None,
                 clock=utcnow):
        self.s = settings
        self.brand = settings.brand
        self.tz = ZoneInfo(settings.timezone)
        self.store = store
        self.llm = llm
        self.tg = tg
        self.vk_publisher = vk_publisher
        self.vk_messenger = vk_messenger
        self.clock = clock
        self.owner = settings.owner_chat_id
        self.lock = threading.Lock()
        self.stop = threading.Event()
        self.offset: int | None = None
        self.albums: dict[str, dict] = {}  # media_group_id -> fotos recibidas del álbum en curso
        self.monotonic = time.monotonic

    # ------------------------------------------------------------------ Telegram
    def handle_update(self, upd: dict) -> None:
        with self.lock:
            if "callback_query" in upd:
                return self.on_callback(upd["callback_query"])
            msg = upd.get("message")
            if not msg or msg["chat"].get("type") != "private":
                return
            chat_id = msg["chat"]["id"]
            if not self.owner or (chat_id != self.owner and (msg.get("text") or "").strip() == "/id"):
                self.tg.send_message(chat_id, f"Tu chat id es {chat_id}. Ponlo en OWNER_CHAT_ID y reinicia el agente.")
            elif chat_id == self.owner:
                self.on_owner_message(msg)
            else:
                user = msg.get("from", {})
                name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
                link = f"@{user['username']}" if user.get("username") else f"tg://user?id={chat_id}"
                self.on_client_message("telegram", chat_id, name, msg.get("text") or msg.get("caption") or "",
                                       link, lambda text: self.tg.send_message(chat_id, text))

    def on_owner_message(self, msg: dict) -> None:
        text = (msg.get("text") or "").strip()

        if "photo" in msg or "video" in msg:
            self.store.kv_del("editing")
            media_type = "photo" if "photo" in msg else "video"
            file_id = msg["photo"][-1]["file_id"] if media_type == "photo" else msg["video"]["file_id"]
            if msg.get("media_group_id"):
                album = self.albums.setdefault(msg["media_group_id"], {"items": [], "caption": ""})
                album["items"].append({"type": media_type, "file_id": file_id})
                album["caption"] = album["caption"] or msg.get("caption", "")
                album["last"] = self.monotonic()
                return
            pillar, hint = self.parse_hint(msg.get("caption", ""))
            return self.create_draft(pillar or self.default_pillar(), hint, media_type, file_id)

        reply_to = msg.get("reply_to_message")
        target = reply_to and self.store.kv_get(f"notif:{reply_to['message_id']}")
        if target and text:
            return self.reply_to_client(target, text)

        if text.startswith("/"):
            cmd, _, arg = text.partition(" ")
            cmd = cmd.split("@")[0].lower()
            if cmd == "/brief":
                return self.cmd_brief(arg.strip())
            if cmd == "/idea":
                return self.cmd_idea(arg.strip())
            if cmd == "/cola":
                return self.cmd_queue()
            if cmd == "/leads":
                return self.cmd_leads()
            if cmd == "/id":
                return self.tg.send_message(self.owner, f"Tu chat id es {self.owner}")
            return self.tg.send_message(self.owner, HELP)

        editing = self.store.kv_get("editing")
        if editing and text:
            return self.apply_edit(int(editing), text)
        self.tg.send_message(self.owner, "Mándame un carrusel (álbum), una foto o un video, o /help.")

    def default_pillar(self) -> str:
        return next_pillar(self.brand["calendar"], self.tz, self.clock(), next(iter(self.brand["pillars"])))

    def parse_hint(self, caption: str) -> tuple[str | None, str]:
        """Separa la etiqueta de rúbrica (#bots…) del resto del texto. Rúbrica None si no hay etiqueta."""
        pillars = self.brand["pillars"]
        pillar = None
        words = []
        for word in caption.split():
            key = word.lstrip("#").lower()
            if word.startswith("#") and key in pillars and pillar is None:
                pillar = key
            else:
                words.append(word)
        return pillar, " ".join(words)

    # ------------------------------------------------------------------ borradores
    def create_draft(self, pillar: str, hint: str, media_type: str | None, file_id: str | None) -> None:
        self.tg.send_message(self.owner, "⏳ Escribiendo el texto…")
        try:
            caption = self.generate(pillar, hint, media_type, file_id)
        except Exception as e:  # noqa: BLE001
            log.exception("Error generando el texto")
            return self.tg.send_message(self.owner, f"⚠️ No pude generar el texto: {e}")
        post_id = self.store.add_post(caption, pillar=pillar, hint=hint,
                                      media_type=media_type, media_file_id=file_id)
        self.send_preview(self.store.get_post(post_id))

    def flush_albums(self, force: bool = False) -> None:
        for gid, album in list(self.albums.items()):
            if force or self.monotonic() - album["last"] >= ALBUM_WAIT:
                del self.albums[gid]
                self.create_carousel(album["items"], album["caption"])

    def create_carousel(self, items: list[dict], raw_caption: str) -> None:
        """Carrusel diseñado por el dueño. Su texto se publica tal cual; sin texto se usa el del brief."""
        tag, text = self.parse_hint(raw_caption)
        brief = self.store.open_brief(self.clock() - timedelta(days=BRIEF_MAX_AGE_DAYS), tag)
        pillar = tag or (brief and brief["pillar"]) or self.default_pillar()

        if text and not text.lower().startswith("ia:"):
            caption = text
        elif brief and brief["caption"] and not text:
            caption = brief["caption"]
        else:
            self.tg.send_message(self.owner, "⏳ Escribiendo el texto…")
            hint = text[3:].strip() if text else (brief["hint"] if brief else "")
            photo = next((i["file_id"] for i in items if i["type"] == "photo"), None)
            try:
                caption = self.generate(pillar, hint, "photo" if photo else None, photo)
            except Exception as e:  # noqa: BLE001
                log.exception("Error generando el texto")
                caption = ""
                self.tg.send_message(self.owner, f"⚠️ No pude generar el texto ({e}). Usa ✏️ Editar para escribirlo.")

        media = json.dumps(items)
        if brief:
            self.store.update_post(brief["id"], pillar=pillar, media_type="album", media_file_id=media,
                                   caption=caption, status="pending")
            post_id = brief["id"]
        else:
            post_id = self.store.add_post(caption, pillar=pillar, hint=text, media_type="album", media_file_id=media)
        self.send_preview(self.store.get_post(post_id))

    def generate(self, pillar: str, hint: str, media_type: str | None, file_id: str | None) -> str:
        has_photo = media_type == "photo" and bool(file_id)
        image = self.tg.download(file_id) if has_photo and self.llm.supports_images else None
        return copywriter.write_post(self.llm, self.brand, pillar, hint, image=image,
                                     has_video=media_type == "video", has_photo=has_photo)

    def send_preview(self, post: dict) -> None:
        if post["media_type"] == "album":
            self.tg.send_media_group(self.owner, post_items(post))
        elif post["media_file_id"]:
            self.tg.send_media(self.owner, post["media_type"], post["media_file_id"])
        pillar = self.brand["pillars"].get(post["pillar"], {}).get("name", post["pillar"])
        pid = post["id"]
        self.tg.send_message(
            self.owner,
            f"📝 Borrador #{pid} · {pillar} · {len(post['caption'])} caracteres\n\n{post['caption']}",
            reply_markup=keyboard([
                [("✅ Publicar ahora", f"pub:{pid}"), ("🕒 Programar", f"sch:{pid}")],
                [("✏️ Editar", f"edit:{pid}"), ("✨ Pulir", f"polish:{pid}"), ("🔄 Otra versión", f"regen:{pid}")],
                [("❌ Descartar", f"del:{pid}")],
            ]),
        )

    def on_callback(self, cq: dict) -> None:
        if cq.get("from", {}).get("id") != self.owner:
            return self.tg.answer_callback(cq["id"], "Solo el dueño puede hacer esto")
        action, _, raw = (cq.get("data") or "").partition(":")
        post = self.store.get_post(int(raw)) if raw.isdigit() else None
        if not post:
            return self.tg.answer_callback(cq["id"], "Esa publicación ya no existe")
        if post["status"] in ("published", "rejected"):
            return self.tg.answer_callback(cq["id"], f"La publicación #{post['id']} ya está cerrada")
        if post["status"] == "brief" and action not in ("rebrief", "del"):
            return self.tg.answer_callback(cq["id"], "Primero mándame el carrusel")
        self.tg.answer_callback(cq["id"])
        pid = post["id"]

        if action == "rebrief":
            self.store.update_post(pid, status="rejected")
            self.send_brief(post["pillar"], random.choice(self.brand["pillars"][post["pillar"]]["ideas"]))
        elif action == "polish":
            try:
                caption = copywriter.polish_post(self.llm, self.brand, post["caption"])
            except Exception as e:  # noqa: BLE001
                return self.tg.send_message(self.owner, f"⚠️ No pude pulir el texto: {e}")
            self.store.update_post(pid, caption=caption, status="pending", scheduled_at=None)
            self.send_preview(self.store.get_post(pid))
        elif action == "pub":
            self.publish(post)
        elif action == "sch":
            slot = next_free_slot(self.brand["calendar"], self.tz, self.clock(), self.store.taken_slots())
            self.store.update_post(pid, status="approved", scheduled_at=iso(slot))
            local = slot.astimezone(self.tz)
            self.tg.send_message(self.owner, f"🕒 #{pid} programada para el {local:%d.%m a las %H:%M} (hora de Moscú).")
        elif action == "edit":
            self.store.kv_set("editing", str(pid))
            self.tg.send_message(self.owner, f"✏️ Envíame el texto nuevo de #{pid}.\n"
                                             "O una instrucción para la IA empezando con «IA:», "
                                             "ej.: IA: más corto y con una oferta del 50%")
        elif action == "regen":
            try:
                photo = first_photo(post)
                media_type = "photo" if photo else (post["media_type"] if post["media_type"] != "album" else None)
                caption = self.generate(post["pillar"], post["hint"] or "", media_type,
                                        photo or (post["media_file_id"] if media_type else None))
            except Exception as e:  # noqa: BLE001
                return self.tg.send_message(self.owner, f"⚠️ No pude generar otra versión: {e}")
            self.store.update_post(pid, caption=caption, status="pending", scheduled_at=None)
            self.send_preview(self.store.get_post(pid))
        elif action == "del":
            self.store.update_post(pid, status="rejected")
            self.tg.send_message(self.owner, f"❌ #{pid} descartada.")

    def apply_edit(self, post_id: int, text: str) -> None:
        post = self.store.get_post(post_id)
        self.store.kv_del("editing")
        if not post:
            return
        if text.lower().startswith("ia:"):
            try:
                text = copywriter.rewrite_post(self.llm, self.brand, post["caption"], text[3:].strip())
            except Exception as e:  # noqa: BLE001
                return self.tg.send_message(self.owner, f"⚠️ No pude reescribir: {e}")
        self.store.update_post(post_id, caption=text, status="pending", scheduled_at=None)
        self.send_preview(self.store.get_post(post_id))

    # ------------------------------------------------------------------ publicación
    def publish(self, post: dict) -> None:
        caption, items = post["caption"], post_items(post)
        results, ok = [], False
        if self.s.telegram_channel:
            try:
                self.tg.post(self.s.telegram_channel, caption, items=items)
                results.append("Telegram: ✅")
                ok = True
            except Exception as e:  # noqa: BLE001
                results.append(f"Telegram: ❌ {e}")
        if self.vk_publisher:
            try:
                media = [(i["type"], self.tg.download(i["file_id"])) for i in items]
                results.append(f"VK: ✅ {self.vk_publisher.post_album(caption, media)}")
                ok = True
            except Exception as e:  # noqa: BLE001
                results.append(f"VK: ❌ {e}")
        if not results:
            results.append("No hay canales configurados (TELEGRAM_CHANNEL / VK_USER_TOKEN).")

        self.store.update_post(post["id"], status="published" if ok else "failed",
                               published_at=iso(self.clock()) if ok else None, result="\n".join(results))
        title = f"✅ Publicada #{post['id']}" if ok else f"⚠️ No se pudo publicar #{post['id']}"
        self.tg.send_message(self.owner, title + "\n" + "\n".join(results))
        if ok:
            self.tg.send_message(self.owner, "📋 Texto para Instagram (cópialo al subir la publicación):\n\n" + caption)

    # ------------------------------------------------------------------ comandos
    def pillar_arg(self, arg: str) -> str:
        key = arg.lstrip("#").lower()
        return key if key in self.brand["pillars"] else self.default_pillar()

    def cmd_idea(self, arg: str) -> None:
        pillar = self.pillar_arg(arg)
        self.create_draft(pillar, random.choice(self.brand["pillars"][pillar]["ideas"]), None, None)

    def cmd_brief(self, arg: str) -> None:
        pillar = self.pillar_arg(arg)
        self.send_brief(pillar, random.choice(self.brand["pillars"][pillar]["ideas"]))

    def send_brief(self, pillar: str, idea: str, intro: str = "") -> None:
        """Pide a la IA las instrucciones del carrusel y las guarda como brief pendiente."""
        self.tg.send_message(self.owner, "⏳ Preparando las instrucciones del carrusel…")
        try:
            brief, caption = copywriter.write_brief(self.llm, self.brand, pillar, idea)
        except Exception as e:  # noqa: BLE001
            log.exception("Error generando el brief")
            return self.tg.send_message(self.owner, f"⚠️ No pude preparar el brief: {e}")
        post_id = self.store.add_post(caption, pillar=pillar, hint=f"{idea}\n\n{brief}")
        self.store.update_post(post_id, status="brief")
        name = self.brand["pillars"][pillar]["name"]
        self.tg.send_message(
            self.owner,
            f"{intro}🎨 Brief #{post_id} · {name}\nTema: {idea}\n\n{brief}",
            reply_markup=keyboard([[("🔄 Otra idea", f"rebrief:{post_id}"), ("❌ Descartar", f"del:{post_id}")]]),
        )
        if caption:
            self.tg.send_message(self.owner, "✍️ Texto sugerido para el post (si me mandas el carrusel sin texto, uso este):"
                                             f"\n\n{caption}")
        self.tg.send_message(self.owner, "📤 Cuando lo tengas, mándame las imágenes juntas como ÁLBUM. "
                                         "Si escribes tu propio texto en el pie, publico el tuyo.")

    def cmd_queue(self) -> None:
        posts = self.store.scheduled_posts()
        if not posts:
            return self.tg.send_message(self.owner, "No hay publicaciones programadas.")
        lines = [f"#{p['id']} · {datetime.fromisoformat(p['scheduled_at']).astimezone(self.tz):%d.%m %H:%M}"
                 f" · {p['pillar']} · {p['caption'].splitlines()[0][:50]}" for p in posts]
        self.tg.send_message(self.owner, "🕒 Programadas:\n" + "\n".join(lines))

    def cmd_leads(self) -> None:
        leads = self.store.recent_leads(10)
        if not leads:
            return self.tg.send_message(self.owner, "Todavía no ha escrito ningún cliente.")
        lines = [f"{datetime.fromisoformat(l['created_at']).astimezone(self.tz):%d.%m %H:%M} · {l['channel']} · "
                 f"{l['name']} · {l['keyword'] or '—'} · {(l['text'] or '')[:60]}" for l in leads]
        self.tg.send_message(self.owner, "🔥 Últimos clientes:\n" + "\n".join(lines))

    # ------------------------------------------------------------------ clientes
    def on_client_message(self, channel: str, user_id, name: str, text: str, link: str, reply) -> None:
        replies = self.brand["auto_replies"]
        rule = match_rule(text, replies["rules"])
        first_today = not self.store.has_lead_since(channel, str(user_id), self.clock() - timedelta(hours=24))
        try:
            if is_greeting(text):
                reply(replies["greeting"])
            elif rule:
                reply(rule["reply"])
            elif first_today:
                reply(replies["default"])
        except Exception:  # noqa: BLE001
            log.exception("No se pudo responder al cliente %s/%s", channel, user_id)
        self.store.add_lead(channel, str(user_id), name, text, rule["key"] if rule else None)

        notice = self.tg.send_message(
            self.owner,
            f"🔥 Cliente · {'Telegram' if channel == 'telegram' else 'VK'}\n{name or 'Sin nombre'} — {link}\n"
            f"Palabra clave: {rule['key'] if rule else '—'}\nMensaje: {text[:500]}\n\n"
            "↩️ Responde a este mensaje y se lo envío.",
        )
        self.store.kv_set(f"notif:{notice['message_id']}", f"{channel}:{user_id}")

    def reply_to_client(self, target: str, text: str) -> None:
        channel, _, peer = target.partition(":")
        try:
            if channel == "vk" and self.vk_messenger:
                self.vk_messenger.send(int(peer), text)
            else:
                self.tg.send_message(int(peer), text)
            self.tg.send_message(self.owner, "✅ Enviado")
        except Exception as e:  # noqa: BLE001
            self.tg.send_message(self.owner, f"⚠️ No se pudo enviar: {e}")

    def on_vk_message(self, m: dict) -> None:
        from_id, peer_id = m.get("from_id", 0), m.get("peer_id")
        if from_id <= 0:
            return
        with self.lock:
            self.on_client_message("vk", peer_id, self.vk_messenger.user_name(from_id), m.get("text", ""),
                                   f"https://vk.com/id{from_id}", lambda text: self.vk_messenger.send(peer_id, text))

    # ------------------------------------------------------------------ calendario
    def tick(self) -> None:
        with self.lock:
            now = self.clock()
            self.flush_albums()
            for post in self.store.due_posts(now):
                self.publish(post)
            self.remind(now)

    def remind(self, now: datetime) -> None:
        local = now.astimezone(self.tz)
        today = local.date().isoformat()
        if local.hour < self.brand.get("reminder_hour", 10) or self.store.kv_get("reminded") == today:
            return
        self.store.kv_set("reminded", today)
        scheduled_days = {datetime.fromisoformat(p["scheduled_at"]).astimezone(self.tz).date()
                          for p in self.store.scheduled_posts()}

        # Hoy: recordar que toca publicar si aún no hay nada programado.
        if local.date() not in scheduled_days:
            upcoming = [(dt, slot) for dt, slot in slots_on(self.brand["calendar"], local.date(), self.tz) if dt > local]
            if upcoming:
                dt, slot = upcoming[0]
                p = self.brand["pillars"][slot["pillar"]]
                self.tg.send_message(
                    self.owner,
                    f"📅 Hoy a las {dt:%H:%M} toca «{p['name']}».\n"
                    f"Mándame el carrusel como álbum (o /brief {slot['pillar']} si aún no tienes instrucciones).",
                )

        # Mañana: mandar ya el brief para que haya tiempo de diseñar el carrusel.
        tomorrow = local.date() + timedelta(days=1)
        for dt, slot in slots_on(self.brand["calendar"], tomorrow, self.tz)[:1]:
            p = self.brand["pillars"][slot["pillar"]]
            self.send_brief(slot["pillar"], random.choice(p["ideas"]),
                            intro=f"📅 Mañana a las {dt:%H:%M} se publica el carrusel «{p['name']}».\n\n")

    # ------------------------------------------------------------------ bucle principal
    def run(self) -> None:
        if self.vk_messenger:
            threading.Thread(target=self.vk_messenger.listen, args=(self.on_vk_message, self.stop),
                             daemon=True).start()
            log.info("Escuchando mensajes de VK")
        log.info("Agente en marcha")
        while not self.stop.is_set():
            try:
                for upd in self.tg.get_updates(self.offset, timeout=1 if self.albums else 25):
                    self.offset = upd["update_id"] + 1
                    try:
                        self.handle_update(upd)
                    except Exception:  # noqa: BLE001
                        log.exception("Error procesando update %s", upd.get("update_id"))
                if self.owner:
                    self.tick()
            except KeyboardInterrupt:
                self.stop.set()
            except Exception:  # noqa: BLE001
                log.exception("Error en el bucle principal; reintentando en 5 s")
                time.sleep(5)
