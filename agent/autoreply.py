"""Respuestas automáticas a clientes por palabras clave (Telegram y VK)."""


def normalize(text: str) -> str:
    return (text or "").lower().replace("ё", "е")


def match_rule(text: str, rules: list[dict]) -> dict | None:
    """Devuelve la primera regla cuyo disparador aparece en el texto."""
    t = normalize(text)
    for rule in rules:
        if any(normalize(trigger) in t for trigger in rule["triggers"]):
            return rule
    return None


def is_greeting(text: str) -> bool:
    return normalize(text).strip() in {"/start", "start", "начать"}
