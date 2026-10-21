"""Cliente mínimo de IA: funciona con OpenAI o con Anthropic (Claude), con imagen opcional."""
import base64

import requests


class LLMError(RuntimeError):
    pass


class LLM:
    def __init__(self, provider: str, api_key: str, model: str, session: requests.Session | None = None):
        self.provider = provider
        self.api_key = api_key
        self.model = model
        self.http = session or requests.Session()

    def complete(self, system: str, prompt: str, image: bytes | None = None,
                 media_type: str = "image/jpeg", max_tokens: int = 1200) -> str:
        if self.provider == "anthropic":
            return self._anthropic(system, prompt, image, media_type, max_tokens)
        return self._openai(system, prompt, image, media_type, max_tokens)

    def _anthropic(self, system, prompt, image, media_type, max_tokens) -> str:
        content = []
        if image:
            content.append({"type": "image", "source": {
                "type": "base64", "media_type": media_type, "data": base64.b64encode(image).decode()}})
        content.append({"type": "text", "text": prompt})
        r = self.http.post(
            "https://api.anthropic.com/v1/messages",
            headers={"x-api-key": self.api_key, "anthropic-version": "2023-06-01"},
            json={"model": self.model, "max_tokens": max_tokens, "system": system,
                  "messages": [{"role": "user", "content": content}]},
            timeout=120,
        )
        data = r.json()
        if r.status_code != 200:
            raise LLMError(f"Anthropic {r.status_code}: {data}")
        return "".join(b.get("text", "") for b in data["content"] if b.get("type") == "text").strip()

    def _openai(self, system, prompt, image, media_type, max_tokens) -> str:
        content = [{"type": "text", "text": prompt}]
        if image:
            url = f"data:{media_type};base64,{base64.b64encode(image).decode()}"
            content.append({"type": "image_url", "image_url": {"url": url}})
        r = self.http.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={"model": self.model, "max_completion_tokens": max_tokens,
                  "messages": [{"role": "system", "content": system},
                               {"role": "user", "content": content}]},
            timeout=120,
        )
        data = r.json()
        if r.status_code != 200:
            raise LLMError(f"OpenAI {r.status_code}: {data}")
        return (data["choices"][0]["message"]["content"] or "").strip()
