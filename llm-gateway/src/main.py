import hashlib, os
from fastapi import FastAPI, Request, HTTPException
from policy import enforce, PolicyViolation
from cache import get_cache
from providers.bedrock import bedrock_chat
from providers.openai_ import openai_chat

app = FastAPI()
_cache = None

@app.on_event("startup")
async def _startup():
    global _cache
    _cache = await get_cache()

@app.get("/health")
def health(): return {"ok": True}

@app.post("/chat")
async def chat(req: Request):
    body = await req.json()
    prompt = (body.get("prompt") or "").strip()
    model = (body.get("model") or os.getenv("DEFAULT_MODEL", "mistral:7b")).strip()
    provider = (body.get("provider") or os.getenv("PROVIDER", "openai")).strip()
    user = req.headers.get("x-user-id") or req.headers.get("x-forwarded-email")
    if not user: raise HTTPException(401, "user identity missing")
    try:
        enforce(user=user, model=model, prompt=prompt)
    except PolicyViolation as e:
        raise HTTPException(403, str(e))

    key = f"cache:{model}:{hashlib.sha256(prompt.encode()).hexdigest()}"
    if (resp := await _cache.get(key)): return {"cached": True, **resp}

    messages = body.get("messages") or [{"role": "user", "content": prompt}]
    resp = await (openai_chat if provider == "openai" else bedrock_chat)(model=model, messages=messages)
    await _cache.set(key, resp, ttl=60)
    return resp
