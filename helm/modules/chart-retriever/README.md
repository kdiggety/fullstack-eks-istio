# chart-retriever

**Purpose:** Vector retrieval microservice (ANN + reranking) backed by OpenSearch and local embedding/reranker models.

## Quick install (from parent app)
```bash
helm upgrade --install ml helm/apps/chart-ml -n ml \
  --set retriever.enabled=true \
  --set retriever.image.repository="ghcr.io/<owner>/retriever" \
  --set retriever.image.tag="$SHA"
```

## Key values
| Path | Type | Default | Notes |
|------|------|---------|------|
| image.repository    | string | — | Optional if `global.image.*` provided. |
| image.tag           | string | latest |  |
| service.port        | int    | 8080 |  |
| embedder.provider   | string | local | `local` for on-pod models. |
| embedder.model      | string | all-MiniLM-L6-v2 | Sentence embedding model. |
| reranker.provider   | string | local |  |
| reranker.model      | string | cross-encoder/ms-marco-MiniLM-L-6-v2 | Reranker model id. |

## Env
- `OPENSEARCH_URL` (or `OPENSEARCH_ENDPOINT` depending on your image)  
- `INDEX_NAME` (e.g., `ml-docs`), `ANN_FIELD` (e.g., `embedding`), `MIN_SCORE` (string number)

## Common issues
- Ensure OpenSearch service is reachable in the `ml` namespace.
