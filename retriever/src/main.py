from fastapi import FastAPI, Request, HTTPException
from search import bm25_search

app = FastAPI()

@app.get("/health")
async def health():
    return {"ok": True}

@app.post("/retrieve")
async def retrieve(req: Request):
    body = await req.json()
    q = body.get("query")
    service = body.get("service")
    user = req.headers.get("x-user-id", "anon")
    if not q:
        raise HTTPException(400, "query required")
    docs = bm25_search(q, service)
    return {"user": user, "query": q, "results": docs}
