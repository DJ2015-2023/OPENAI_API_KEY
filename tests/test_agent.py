import json
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

from agent.app import App
from agent.autoreply import match_rule
from agent.config import Settings
from agent.scheduler import next_free_slot
from agent.storage import Store
from agent.telegram_api import TelegramAPI
from agent.vk_api import VKAPI, VKPublisher

BRAND = json.loads((Path(__file__).parent.parent / "brand.json").read_text(encoding="utf-8"))
MSK = ZoneInfo("Europe/Moscow")
OWNER = 111
CLIENT = 222
# Lunes 19.10.2026 08:00 UTC = 11:00 en Moscú
NOW = datetime(2026, 10, 19, 8, 0, tzinfo=timezone.utc)


class FakeTG:
    def __init__(self):
        self.sent = []      # (chat_id, text, reply_markup)
        self.media = []     # (chat_id, media_type, file_id, caption)
        self.posts = []     # (chat_id, text, media_type, file_id)
        self.next_id = 1000

    def send_message(self, chat_id, text, reply_markup=None):
        self.sent.append((chat_id, text, reply_markup))
        self.next_id += 1
        return {"message_id": self.next_id}

    def send_media(self, chat_id, media_type, file_id, caption=None, reply_markup=None):
        self.media.append((chat_id, media_type, file_id, caption))

    def post(self, chat_id, text, media_type=None, file_id=None):
        self.posts.append((chat_id, text, media_type, file_id))

    def answer_callback(self, callback_id, text=""):
        pass

    def download(self, file_id):
        return b"IMG"


class FakeLLM:
    supports_images = True

    def __init__(self):
        self.calls = []

    def complete(self, system, prompt, image=None, **kw):
        self.calls.append((system, prompt, image))
        return f"Пост номер {len(self.calls)}\n\nНапишите «БОТ» в личные сообщения\n#чатбот"


class FakeVKPublisher:
    def __init__(self):
        self.posts = []

    def post(self, text, media_type=None, content=None):
        self.posts.append((text, media_type, content))
        return "https://vk.com/wall-1_1"


def make_app(tmp_path, clock=lambda: NOW):
    settings = Settings(
        telegram_token="t", owner_chat_id=OWNER, telegram_channel="@canal",
        vk_user_token="u", vk_group_token="", vk_group_id=1,
        llm_provider="openai", llm_api_key="k", llm_model="m",
        timezone="Europe/Moscow", db_path=str(tmp_path / "db.sqlite"), brand=BRAND,
    )
    app = App(settings, Store(settings.db_path), FakeLLM(), FakeTG(),
              vk_publisher=FakeVKPublisher(), clock=clock)
    return app


def owner_msg(**extra):
    return {"message": {"chat": {"id": OWNER, "type": "private"}, "from": {"id": OWNER}, **extra}}


def callback(data):
    return {"callback_query": {"id": "cb", "from": {"id": OWNER}, "data": data}}


def last_text(app):
    return app.tg.sent[-1][1]


# ---------------------------------------------------------------- reglas sueltas
def test_match_rule_finds_keywords_in_russian_forms():
    rules = BRAND["auto_replies"]["rules"]
    assert match_rule("Здравствуйте, нужен чат-БОТ для салона", rules)["key"] == "БОТ"
    assert match_rule("Сколько стоит?", rules)["key"] == "ЦЕНА"
    assert match_rule("хочу карточки на вайлдберриз", rules)["key"] == "КАРТОЧКА"
    assert match_rule("привет", rules) is None


def test_next_free_slot_skips_past_and_taken_slots():
    cal = BRAND["calendar"]
    monday_19 = datetime(2026, 10, 19, 19, 0, tzinfo=MSK).astimezone(timezone.utc)
    wednesday_19 = datetime(2026, 10, 21, 19, 0, tzinfo=MSK).astimezone(timezone.utc)
    assert next_free_slot(cal, MSK, NOW, set()) == monday_19
    assert next_free_slot(cal, MSK, NOW, {monday_19}) == wednesday_19


# ---------------------------------------------------------------- flujo del dueño
def test_photo_creates_draft_with_pillar_from_hashtag(tmp_path):
    app = make_app(tmp_path)
    app.handle_update(owner_msg(photo=[{"file_id": "small"}, {"file_id": "big"}],
                                caption="#cards карточка для крема"))
    post = app.store.get_post(1)
    assert post["pillar"] == "cards"
    assert post["hint"] == "карточка для крема"
    assert post["media_file_id"] == "big"
    system, prompt, image = app.llm.calls[0]
    assert "DR Веб-Дизайн" in system and "КАРТОЧКА" in prompt and image == b"IMG"
    assert app.tg.media[-1][2] == "big"
    assert "Borrador #1" in last_text(app)
    assert app.tg.sent[-1][2]["inline_keyboard"][0][0]["callback_data"] == "pub:1"


def test_publish_now_posts_to_telegram_and_vk(tmp_path):
    app = make_app(tmp_path)
    app.handle_update(owner_msg(photo=[{"file_id": "f1"}], caption=""))
    app.handle_update(callback("pub:1"))
    assert app.tg.posts == [("@canal", app.store.get_post(1)["caption"], "photo", "f1")]
    assert app.vk_publisher.posts[0][1:] == ("photo", b"IMG")
    assert app.store.get_post(1)["status"] == "published"
    assert "Texto para Instagram" in last_text(app)


def test_schedule_then_tick_publishes_when_due(tmp_path):
    clock = {"now": NOW}
    app = make_app(tmp_path, clock=lambda: clock["now"])
    app.handle_update(owner_msg(photo=[{"file_id": "f1"}]))
    app.handle_update(callback("sch:1"))
    assert app.store.get_post(1)["status"] == "approved"
    assert "19.10 a las 19:00" in last_text(app)

    app.tick()
    assert app.tg.posts == []
    clock["now"] = datetime(2026, 10, 19, 16, 1, tzinfo=timezone.utc)  # 19:01 Moscú
    app.tick()
    assert len(app.tg.posts) == 1
    assert app.store.get_post(1)["status"] == "published"


def test_edit_replaces_caption_or_rewrites_with_ai(tmp_path):
    app = make_app(tmp_path)
    app.handle_update(owner_msg(photo=[{"file_id": "f1"}]))
    app.handle_update(callback("edit:1"))
    app.handle_update(owner_msg(text="Мой собственный текст"))
    assert app.store.get_post(1)["caption"] == "Мой собственный текст"

    app.handle_update(callback("edit:1"))
    app.handle_update(owner_msg(text="IA: más corto"))
    assert "más corto" in app.llm.calls[-1][1]
    assert app.store.get_post(1)["caption"].startswith("Пост номер")


def test_closed_post_ignores_buttons(tmp_path):
    app = make_app(tmp_path)
    app.handle_update(owner_msg(photo=[{"file_id": "f1"}]))
    app.handle_update(callback("del:1"))
    app.handle_update(callback("pub:1"))
    assert app.tg.posts == []
    assert app.store.get_post(1)["status"] == "rejected"


def test_idea_command_creates_text_only_draft(tmp_path):
    app = make_app(tmp_path)
    app.handle_update(owner_msg(text="/idea web"))
    post = app.store.get_post(1)
    assert post["pillar"] == "web" and post["media_file_id"] is None
    assert post["hint"] in BRAND["pillars"]["web"]["ideas"]


def test_daily_reminder_sent_once(tmp_path):
    app = make_app(tmp_path)
    app.tick()
    app.tick()
    reminders = [t for _, t, _ in app.tg.sent if t.startswith("📅")]
    assert len(reminders) == 1 and "Чат-боты" in reminders[0]


# ---------------------------------------------------------------- clientes
def client_msg(text):
    return {"message": {"chat": {"id": CLIENT, "type": "private"},
                        "from": {"id": CLIENT, "first_name": "Иван", "username": "ivan"}, "text": text}}


def test_client_keyword_gets_auto_reply_and_owner_is_notified(tmp_path):
    app = make_app(tmp_path)
    app.handle_update(client_msg("Нужен бот для записи"))
    to_client = [t for chat, t, _ in app.tg.sent if chat == CLIENT]
    assert to_client and "чат-ботов" in to_client[0]
    assert "@ivan" in last_text(app) and "БОТ" in last_text(app)
    assert app.store.recent_leads()[0]["keyword"] == "БОТ"


def test_default_reply_only_once_per_day(tmp_path):
    app = make_app(tmp_path)
    app.handle_update(client_msg("привет"))
    app.handle_update(client_msg("вы тут?"))
    assert len([1 for chat, _, _ in app.tg.sent if chat == CLIENT]) == 1


def test_owner_reply_to_notification_reaches_client(tmp_path):
    app = make_app(tmp_path)
    app.handle_update(client_msg("сайт"))
    notice_id = app.tg.next_id
    app.handle_update(owner_msg(text="Здравствуйте, Иван!", reply_to_message={"message_id": notice_id}))
    assert (CLIENT, "Здравствуйте, Иван!", None) in app.tg.sent


def test_setup_mode_tells_chat_id(tmp_path):
    app = make_app(tmp_path)
    app.owner = 0
    app.handle_update(client_msg("hola"))
    assert "Tu chat id es 222" in last_text(app)


# ---------------------------------------------------------------- clientes HTTP
class FakeResponse:
    def __init__(self, data, content=b""):
        self._data, self.content, self.status_code = data, content, 200

    def json(self):
        return self._data

    def raise_for_status(self):
        pass


class FakeSession:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def post(self, url, **kw):
        self.calls.append((url, kw))
        return self.responses.pop(0)

    get = post


def test_telegram_post_splits_long_caption():
    s = FakeSession([FakeResponse({"ok": True, "result": {}})] * 2)
    TelegramAPI("T", session=s).post("@c", "x" * 1500, "photo", "fid")
    assert s.calls[0][0].endswith("/sendPhoto") and "caption" not in s.calls[0][1]["data"]
    assert s.calls[1][0].endswith("/sendMessage")


def test_vk_post_uploads_photo_then_posts_to_wall():
    s = FakeSession([
        FakeResponse({"response": {"upload_url": "https://up"}}),
        FakeResponse({"server": 1, "photo": "p", "hash": "h"}),
        FakeResponse({"response": [{"owner_id": -5, "id": 9}]}),
        FakeResponse({"response": {"post_id": 77}}),
    ])
    url = VKPublisher(VKAPI("tok", session=s), 5).post("texto", "photo", b"IMG")
    assert url == "https://vk.com/wall-5_77"
    wall = s.calls[-1][1]["data"]
    assert wall["owner_id"] == -5 and wall["attachments"] == "photo-5_9" and wall["from_group"] == 1


def test_vk_error_is_raised():
    s = FakeSession([FakeResponse({"error": {"error_code": 15, "error_msg": "Access denied"}})])
    with pytest.raises(Exception, match="Access denied"):
        VKAPI("tok", session=s).call("wall.post")


@pytest.mark.parametrize("provider", ["openai", "anthropic"])
def test_llm_sends_image_in_provider_format(provider):
    from agent.llm import LLM
    reply = ({"choices": [{"message": {"content": " hola "}}]} if provider == "openai"
             else {"content": [{"type": "text", "text": " hola "}]})
    s = FakeSession([FakeResponse(reply)])
    assert LLM(provider, "key", "model", session=s).complete("sys", "prompt", image=b"IMG") == "hola"
    body = json.dumps(s.calls[0][1]["json"])
    assert "SU1H" in body  # b"IMG" en base64


def test_client_id_command_returns_chat_id_without_lead(tmp_path):
    app = make_app(tmp_path)
    app.handle_update(client_msg("/id"))
    assert "Tu chat id es 222" in last_text(app)
    assert app.store.recent_leads() == []


def test_channel_id_as_owner_is_rejected(monkeypatch):
    from agent.config import load_settings
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "t")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "k")
    monkeypatch.setenv("OWNER_CHAT_ID", "-1001234567890")
    with pytest.raises(SystemExit, match="canal o grupo"):
        load_settings()


def test_yandex_request_format():
    from agent.llm import LLM
    reply = {"result": {"alternatives": [{"message": {"role": "assistant", "text": " привет "}}]}}
    s = FakeSession([FakeResponse(reply)])
    llm = LLM("yandex", "AQVN-key", "yandexgpt/latest", session=s, folder_id="b1gfolder")
    assert not llm.supports_images
    assert llm.complete("sys", "prompt", image=b"IMG") == "привет"
    url, kw = s.calls[0]
    assert url.endswith("/foundationModels/v1/completion")
    assert kw["headers"] == {"Authorization": "Api-Key AQVN-key", "x-folder-id": "b1gfolder"}
    assert kw["json"]["modelUri"] == "gpt://b1gfolder/yandexgpt/latest"
    assert kw["json"]["messages"][0] == {"role": "system", "text": "sys"}
    assert "SU1H" not in json.dumps(kw["json"])


def test_photo_with_text_only_llm_uses_hint_and_skips_download(tmp_path):
    app = make_app(tmp_path)
    app.llm.supports_images = False
    app.tg.download = lambda file_id: pytest.fail("no debe descargar la foto")
    app.handle_update(owner_msg(photo=[{"file_id": "f1"}], caption="#cards крем для рук"))
    _, prompt, image = app.llm.calls[0]
    assert image is None and "крем для рук" in prompt and "не додумывай" in prompt


def test_yandex_settings_require_folder(monkeypatch):
    from agent.config import load_settings
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "t")
    monkeypatch.setenv("LLM_PROVIDER", "yandex")
    monkeypatch.setenv("YANDEX_API_KEY", "k")
    monkeypatch.delenv("YANDEX_FOLDER_ID", raising=False)
    with pytest.raises(SystemExit, match="YANDEX_FOLDER_ID"):
        load_settings()
