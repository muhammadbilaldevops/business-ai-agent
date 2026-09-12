"""Gemini streaming adapter. Credentials remain on the backend only."""
import json
import re
import httpx
from localops.llm.ollama_client import ModelError

class GeminiClient:
    def __init__(self, settings):
        self.settings = settings

    def health(self):
        return {"available": bool(self.settings.gemini_api_key), "configured": bool(self.settings.gemini_api_key), "models": [self.settings.gemini_model]}

    def stream(self, messages):
        if not self.settings.gemini_api_key:
            raise ModelError("Add GEMINI_API_KEY to the backend environment to enable Gemini chat.")
        if not re.fullmatch(r"[a-zA-Z0-9.-]+", self.settings.gemini_model):
            raise ModelError("Invalid GEMINI_MODEL configuration")
        if sum(len(m.get("content", "")) for m in messages) > 48000:
            raise ModelError("Context is too large; start a new conversation")
        system = "\n".join(m["content"] for m in messages if m["role"] == "system")
        payload = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["content"]}]} for m in messages if m["role"] != "system"],
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 4096},
        }
        url = "https://generativelanguage.googleapis.com/v1beta/models/" + self.settings.gemini_model + ":streamGenerateContent?alt=sse"
        try:
            with httpx.Client(timeout=self.settings.llm_timeout) as client:
                with client.stream("POST", url, headers={"x-goog-api-key": self.settings.gemini_api_key}, json=payload) as response:
                    if response.status_code == 429:
                        raise ModelError("Gemini quota reached. Check your API quota and retry later.")
                    if response.status_code in (400, 401, 403):
                        raise ModelError("Gemini access failed. Check the backend API key and model access.")
                    response.raise_for_status()
                    for line in response.iter_lines():
                        if not line.startswith("data:"):
                            continue
                        data = json.loads(line[5:])
                        for candidate in data.get("candidates", []):
                            for part in candidate.get("content", {}).get("parts", []):
                                if part.get("text") and not part.get("thought"):
                                    yield {"message": {"content": part["text"]}}
        except (httpx.HTTPError, ValueError) as exc:
            raise ModelError("Gemini could not respond. Check the connection and model configuration, then retry.") from exc
