"""Configuración del agente: variables de entorno (o archivo .env) + perfil de marca."""
import json
import os
from dataclasses import dataclass
from pathlib import Path

DEFAULT_MODELS = {
    "anthropic": "claude-sonnet-5-5",
    "openai": "gpt-4o-mini",
}


def load_dotenv(path: str = ".env") -> None:
    """Carga un .env simple (CLAVE=valor) sin pisar variables ya definidas."""
    p = Path(path)
    if not p.exists():
        return
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


@dataclass
class Settings:
    telegram_token: str
    owner_chat_id: int  # 0 = modo configuración (el bot solo responde con el chat id)
    telegram_channel: str
    vk_user_token: str
    vk_group_token: str
    vk_group_id: int
    llm_provider: str
    llm_api_key: str
    llm_model: str
    timezone: str
    db_path: str
    brand: dict

    @property
    def vk_posting_enabled(self) -> bool:
        return bool(self.vk_user_token and self.vk_group_id)

    @property
    def vk_messages_enabled(self) -> bool:
        return bool(self.vk_group_token and self.vk_group_id)


def load_settings() -> Settings:
    load_dotenv()
    env = os.environ

    provider = env.get("LLM_PROVIDER", "").lower() or (
        "anthropic" if env.get("ANTHROPIC_API_KEY") else "openai"
    )
    if provider not in DEFAULT_MODELS:
        raise SystemExit(f"LLM_PROVIDER debe ser 'openai' o 'anthropic', no '{provider}'")
    api_key = env.get("ANTHROPIC_API_KEY" if provider == "anthropic" else "OPENAI_API_KEY", "")

    missing = [name for name, value in [
        ("TELEGRAM_BOT_TOKEN", env.get("TELEGRAM_BOT_TOKEN")),
        ("OPENAI_API_KEY o ANTHROPIC_API_KEY", api_key),
    ] if not value]
    if missing:
        raise SystemExit("Faltan variables de entorno: " + ", ".join(missing))

    brand_path = env.get("BRAND_PATH", "brand.json")
    brand = json.loads(Path(brand_path).read_text(encoding="utf-8"))

    db_path = env.get("DB_PATH", "data/agent.db")
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)

    return Settings(
        telegram_token=env["TELEGRAM_BOT_TOKEN"],
        owner_chat_id=int(env.get("OWNER_CHAT_ID") or 0),
        telegram_channel=env.get("TELEGRAM_CHANNEL", ""),
        vk_user_token=env.get("VK_USER_TOKEN", ""),
        vk_group_token=env.get("VK_GROUP_TOKEN", ""),
        vk_group_id=int(env.get("VK_GROUP_ID") or 0),
        llm_provider=provider,
        llm_api_key=api_key,
        llm_model=env.get("LLM_MODEL") or DEFAULT_MODELS[provider],
        timezone=env.get("TIMEZONE", "Europe/Moscow"),
        db_path=db_path,
        brand=brand,
    )
