"""Cliente mínimo de la Telegram Bot API (sin dependencias extra)."""
import json

import requests

CAPTION_LIMIT = 1024  # límite de Telegram para el texto bajo una foto/video


class TelegramError(RuntimeError):
    pass


def keyboard(rows: list[list[tuple[str, str]]]) -> dict:
    """[[(texto, callback_data), ...], ...] -> inline_keyboard."""
    return {"inline_keyboard": [[{"text": t, "callback_data": d} for t, d in row] for row in rows]}


class TelegramAPI:
    def __init__(self, token: str, session: requests.Session | None = None):
        self.token = token
        self.base = f"https://api.telegram.org/bot{token}/"
        self.http = session or requests.Session()

    def call(self, method: str, timeout: int = 60, **params):
        params = {k: v for k, v in params.items() if v is not None}
        if "reply_markup" in params:
            params["reply_markup"] = json.dumps(params["reply_markup"])
        r = self.http.post(self.base + method, data=params, timeout=timeout)
        data = r.json()
        if not data.get("ok"):
            raise TelegramError(f"{method}: {data.get('description', data)}")
        return data["result"]

    def get_updates(self, offset: int | None, timeout: int = 25) -> list[dict]:
        # No usa call(): el parámetro "timeout" de Telegram choca con el timeout HTTP.
        r = self.http.post(self.base + "getUpdates", data={
            "offset": offset or 0, "timeout": timeout,
            "allowed_updates": json.dumps(["message", "callback_query"]),
        }, timeout=timeout + 10)
        data = r.json()
        if not data.get("ok"):
            raise TelegramError(f"getUpdates: {data.get('description', data)}")
        return data["result"]

    def send_message(self, chat_id, text: str, reply_markup: dict | None = None) -> dict:
        return self.call("sendMessage", chat_id=chat_id, text=text, reply_markup=reply_markup,
                         disable_web_page_preview="true")

    def send_media(self, chat_id, media_type: str, file_id: str, caption: str | None = None,
                   reply_markup: dict | None = None) -> dict:
        method = "sendVideo" if media_type == "video" else "sendPhoto"
        return self.call(method, chat_id=chat_id, **{media_type: file_id},
                         caption=caption, reply_markup=reply_markup)

    def post(self, chat_id, text: str, media_type: str | None = None, file_id: str | None = None) -> dict:
        """Publica texto con o sin foto/video, partiendo el texto si supera el límite del pie."""
        if not file_id:
            return self.send_message(chat_id, text)
        if len(text) <= CAPTION_LIMIT:
            return self.send_media(chat_id, media_type, file_id, caption=text)
        self.send_media(chat_id, media_type, file_id)
        return self.send_message(chat_id, text)

    def answer_callback(self, callback_id: str, text: str = "") -> None:
        self.call("answerCallbackQuery", callback_query_id=callback_id, text=text)

    def download(self, file_id: str) -> bytes:
        info = self.call("getFile", file_id=file_id)
        r = self.http.get(f"https://api.telegram.org/file/bot{self.token}/{info['file_path']}", timeout=120)
        r.raise_for_status()
        return r.content
