# replace stub with a real call
import os, httpx
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "http://ollama.ml.svc.cluster.local:11434/v1")
OPENAI_API_KEY  = os.getenv("OPENAI_API_KEY", "ollama-no-key")

async def openai_chat(model, messages):
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(
            f"{OPENAI_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            json={"model": model, "messages": messages, "stream": False},
        )
        r.raise_for_status()
        data = r.json()
        return {
            "provider": "openai",
            "model": model,
            "output": data["choices"][0]["message"]["content"]
        }

