import os
from typing import List, Dict, Any
from opensearchpy import OpenSearch

OPENSEARCH_URL = os.getenv("OPENSEARCH_URL", "http://localhost:9200")
INDEX_NAME = os.getenv("INDEX_NAME", "ml-docs")

def _client():
    return OpenSearch(OPENSEARCH_URL, timeout=10)

def bm25_search(query: str, service: str | None = None, k: int = 8) -> List[Dict[str, Any]]:
    should = [{"match": {"text": {"query": query, "operator": "and"}}}]
    must = [{"term": {"service": service}}] if service else []
    body = {"size": k, "query": {"bool": {"must": must, "should": should}}}
    client = _client()
    resp = client.search(index=INDEX_NAME, body=body)
    return [
        {"id": h.get("_id"), "score": h.get("_score"), **(h.get("_source", {}))}
        for h in resp.get("hits", {}).get("hits", [])
    ]
