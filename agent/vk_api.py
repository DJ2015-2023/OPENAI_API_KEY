"""Cliente mínimo de la API de VK: publicar en el muro de la comunidad y responder mensajes."""
import logging
import random
import threading
import time

import requests

API_URL = "https://api.vk.com/method/"
API_VERSION = "5.199"
log = logging.getLogger(__name__)


class VKError(RuntimeError):
    pass


class VKAPI:
    def __init__(self, token: str, session: requests.Session | None = None):
        self.token = token
        self.http = session or requests.Session()

    def call(self, method: str, **params):
        params.update(access_token=self.token, v=API_VERSION)
        data = self.http.post(API_URL + method, data=params, timeout=60).json()
        if "error" in data:
            err = data["error"]
            raise VKError(f"{method}: [{err.get('error_code')}] {err.get('error_msg')}")
        return data["response"]


class VKPublisher:
    """Publica en el muro. Requiere token de USUARIO (administrador) con permisos wall, photos, video."""

    def __init__(self, api: VKAPI, group_id: int):
        self.api = api
        self.group_id = group_id

    def upload_photo(self, content: bytes) -> str:
        server = self.api.call("photos.getWallUploadServer", group_id=self.group_id)
        up = self.api.http.post(server["upload_url"], files={"photo": ("photo.jpg", content)}, timeout=120).json()
        saved = self.api.call("photos.saveWallPhoto", group_id=self.group_id,
                              server=up["server"], photo=up["photo"], hash=up["hash"])[0]
        return f"photo{saved['owner_id']}_{saved['id']}"

    def upload_video(self, content: bytes, title: str) -> str:
        saved = self.api.call("video.save", group_id=self.group_id, name=title[:100], wallpost=0)
        self.api.http.post(saved["upload_url"], files={"video_file": ("video.mp4", content)}, timeout=600)
        return f"video{saved['owner_id']}_{saved['video_id']}"

    def post(self, text: str, media_type: str | None = None, content: bytes | None = None) -> str:
        return self.post_album(text, [(media_type, content)] if content else [])

    def post_album(self, text: str, items: list[tuple[str, bytes]]) -> str:
        """Publica en el muro con 0..10 fotos/videos: items = [("photo", bytes), ...]."""
        title = text.split("\n", 1)[0]
        attachments = [self.upload_video(c, title) if t == "video" else self.upload_photo(c) for t, c in items[:10]]
        res = self.api.call("wall.post", owner_id=-self.group_id, from_group=1,
                            message=text, attachments=",".join(attachments) or None)
        return f"https://vk.com/wall-{self.group_id}_{res['post_id']}"


class VKMessenger:
    """Escucha y responde mensajes de la comunidad (Bots Long Poll). Requiere token de COMUNIDAD."""

    def __init__(self, api: VKAPI, group_id: int):
        self.api = api
        self.group_id = group_id

    def send(self, peer_id: int, text: str) -> None:
        self.api.call("messages.send", peer_id=peer_id, message=text,
                      random_id=random.randint(1, 2**31 - 1))

    def user_name(self, user_id: int) -> str:
        try:
            u = self.api.call("users.get", user_ids=user_id)[0]
            return f"{u.get('first_name', '')} {u.get('last_name', '')}".strip()
        except (VKError, IndexError, KeyError):
            return f"id{user_id}"

    def listen(self, on_message, stop: threading.Event) -> None:
        server = None
        while not stop.is_set():
            try:
                if server is None:
                    server = self.api.call("groups.getLongPollServer", group_id=self.group_id)
                data = self.api.http.get(server["server"], params={
                    "act": "a_check", "key": server["key"], "ts": server["ts"], "wait": 25,
                }, timeout=40).json()
                if "failed" in data:
                    if data["failed"] == 1:
                        server["ts"] = data["ts"]
                    else:
                        server = None
                    continue
                server["ts"] = data["ts"]
                for upd in data.get("updates", []):
                    if upd.get("type") == "message_new":
                        on_message(upd["object"]["message"])
            except Exception:  # noqa: BLE001 — el listener nunca debe morir
                log.exception("Error en VK Long Poll; reintentando en 5 s")
                server = None
                time.sleep(5)
