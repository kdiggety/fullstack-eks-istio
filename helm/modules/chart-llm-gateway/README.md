# chart-llm-gateway

**Purpose:** Deploys the LLM Gateway (REST) that fronts model providers (e.g., Ollama or Bedrock) and fans out to the Retriever and Anomaly Scorer when enabled.

## Quick install (from parent app)
```bash
helm upgrade --install ml helm/apps/chart-ml -n ml \
  --set llmGateway.enabled=true \
  --set llmGateway.image.repository="ghcr.io/<owner>/llm-gateway" \
  --set llmGateway.image.tag="$SHA"
```

## Key values
| Path | Type | Default | Notes |
|------|------|---------|------|
| image.repository | string | — | If empty, the template will synthesize from `global.image.*`. |
| image.tag        | string | latest | Can be overridden globally via `global.image.tag`. |
| service.port     | int    | 8080   | HTTP port. |
| provider.type    | string | bedrock | Set `ollama` for local testing. |
| provider.baseUrl | string | — | Required for `ollama` (e.g., `http://ollama.ml.svc.cluster.local:11434`). |
| provider.model   | string | — | Example: `llama3.1:8b`. |
| provider.disableAutoDetect | bool | false | If true, skips provider autodetect. |

## Env / integration
- `REDIS_URL` (optional): e.g., `redis://fullstack-redis-master.sample.svc.cluster.local:6379`
- `OPENSEARCH_ENDPOINT` (optional): e.g., `http://opensearch.ml.svc.cluster.local:9200`

## Common issues
- If `image.repository` is not set, ensure `global.image.owner` is provided (or set `image.repository` directly).
- When using Ollama, confirm service DNS and port and set `provider.baseUrl`.
