"""Redacción de publicaciones en ruso según el perfil de marca."""
from .llm import LLM

MAX_CHARS = 900
CAPTION_MARKER = "=== ТЕКСТ ПОСТА ==="


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


def brief_system(brand: dict) -> str:
    return (f"Eres el director creativo y SMM de «{brand['name']}» ({brand['owner']}, {brand['city']}). "
            f"Público: {brand['audience']}. Tono de los textos: {brand['tone']}. "
            "Escribes instrucciones claras para que el dueño diseñe él mismo un carrusel que atraiga clientes. "
            "Las instrucciones van en español; los textos que aparecen en las imágenes y el texto del post, en ruso. "
            "Sin Markdown ni asteriscos. No inventes cifras, precios ni clientes: si hace falta un dato real, "
            "pide al dueño que lo ponga entre [corchetes].")


def write_brief(llm: LLM, brand: dict, pillar: str, idea: str) -> tuple[str, str]:
    """Devuelve (instrucciones del carrusel, texto del post sugerido)."""
    p = brand["pillars"][pillar]
    c = brand["carousel"]
    rules = "\n".join(f"- {r}" for r in c["rules"])
    prompt = f"""Prepara el BRIEF de un carrusel para Telegram, VK e Instagram.

Rúbrica: {p['name']} — {p['description']}
Tema: {idea}
Palabra clave de la llamada a la acción: «{p['cta_keyword']}»
Formato: {c['format']}, {c['slides']} diapositivas.

Reglas de diseño:
{rules}

Responde exactamente con este formato:
🎯 Objetivo: (1 línea)
🪝 Gancho: (por qué alguien dejaría de deslizar, 1 línea)

1️⃣ PORTADA
Texto: «texto en ruso para la imagen»
Visual: qué mostrar en la imagen

(sigue igual hasta la diapositiva {c['slides']}; la última es la llamada a la acción con «{p['cta_keyword']}»)

Después escribe sola esta línea:
{CAPTION_MARKER}
y debajo el texto del post en ruso: gancho, valor, призыв написать «{p['cta_keyword']}» в личные сообщения y 5–8 хэштегов de {' '.join(brand['hashtags'])}. Máximo {MAX_CHARS} caracteres.
Todo el brief debe ocupar menos de 3000 caracteres."""
    text = llm.complete(brief_system(brand), prompt, max_tokens=2000)
    brief, _, caption = text.partition(CAPTION_MARKER)
    return brief.strip(), caption.strip()


def polish_post(llm: LLM, brand: dict, caption: str) -> str:
    return rewrite_post(llm, brand, caption,
                        "mejora la redacción y el gancho sin cambiar el sentido, los datos ni el estilo del autor")
