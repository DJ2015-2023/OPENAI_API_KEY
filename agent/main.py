"""Punto de entrada: python -m agent.main"""
import logging

from .app import App
from .config import load_settings
from .llm import LLM
from .storage import Store
from .telegram_api import TelegramAPI
from .vk_api import VKAPI, VKMessenger, VKPublisher


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    s = load_settings()
    app = App(
        settings=s,
        store=Store(s.db_path),
        llm=LLM(s.llm_provider, s.llm_api_key, s.llm_model),
        tg=TelegramAPI(s.telegram_token),
        vk_publisher=VKPublisher(VKAPI(s.vk_user_token), s.vk_group_id) if s.vk_posting_enabled else None,
        vk_messenger=VKMessenger(VKAPI(s.vk_group_token), s.vk_group_id) if s.vk_messages_enabled else None,
    )
    if not s.owner_chat_id:
        logging.warning("OWNER_CHAT_ID vacío: escribe al bot en Telegram para obtener tu chat id.")
    app.run()


if __name__ == "__main__":
    main()
