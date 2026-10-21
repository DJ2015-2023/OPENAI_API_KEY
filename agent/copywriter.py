"""Redacción de publicaciones en ruso según el perfil de marca."""
from .llm import LLM

MAX_CHARS = 900


def system_prompt(brand: dict) -> str:
    services = "\n".join(f"- {s}" for s in brand["services"])
    return f"""Ты — SMM-копирайтер компании «{brand['name']}» ({brand['owner']}, {brand['city']}).

Услуги:
{services}

Целевая аудитория: {brand['audience']}
Тон: {brand['tone']}

Правила поста:
- Пиши только на русском языке.
- Первая строка — цепляющий заголовок про боль или выгоду клиента (до 60 символов).
- Короткие абзацы, одна мысль на абзац, 2–4 эмодзи на весь текст.
- Не выдумывай цифры, цены, названия клиентов и результаты — используй только факты из подсказки автора и то, что реально видно на фото.
- В конце — призыв написать ключевое слово в личные сообщения (слово дано ниже), затем 5–8 хэштегов.
- Не более {MAX_CHARS} символов. Без звёздочек и разметки Markdown.
- Верни только готовый текст поста, без пояснений."""


def _pillar_block(brand: dict, pillar: str) -> str:
    p = brand["pillars"][pillar]
    return (f"Рубрика: {p['name']} — {p['description']}\n"
            f"Ключевое слово для призыва: «{p['cta_keyword']}»\n"
            f"Хэштеги бренда (выбери подходящие): {' '.join(brand['hashtags'])}")


def write_post(llm: LLM, brand: dict, pillar: str, hint: str = "",
               image: bytes | None = None, has_video: bool = False, has_photo: bool = False) -> str:
    parts = [_pillar_block(brand, pillar),
             f"Подсказка автора: {hint.strip() or 'нет — опирайся на рубрику и фото'}"]
    if image:
        parts.append("К посту приложено фото — опиши то, что на нём действительно изображено.")
    elif has_photo:
        parts.append("К посту будет приложено фото; его содержание описано в подсказке автора — не додумывай детали.")
    elif has_video:
        parts.append("К посту будет приложено видео (Reels); текст должен его дополнять.")
    return llm.complete(system_prompt(brand), "\n\n".join(parts), image=image)


def rewrite_post(llm: LLM, brand: dict, caption: str, instruction: str) -> str:
    prompt = (f"Вот текст поста:\n\n{caption}\n\n"
              f"Перепиши его по инструкции автора (автор пишет по-испански или по-русски): {instruction}\n"
              "Сохрани призыв и хэштеги, соблюдай все правила.")
    return llm.complete(system_prompt(brand), prompt)
