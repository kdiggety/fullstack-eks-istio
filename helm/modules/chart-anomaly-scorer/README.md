# chart-anomaly-scorer

**Purpose:** Scores gateway responses/requests for anomalies (latency spikes, outliers, etc.) so you can alert or throttle.

## Quick install (from parent app)
```bash
helm upgrade --install ml helm/apps/chart-ml -n ml \
  --set anomalyScorer.enabled=true \
  --set anomalyScorer.image.repository="ghcr.io/<owner>/anomaly-scorer" \
  --set anomalyScorer.image.tag="$SHA"
```

## Key values
| Path | Type | Default | Notes |
|------|------|---------|------|
| image.repository | string | — | Optional if `global.image.*` provided. |
| image.tag        | string | latest |  |
| service.port     | int    | 8080 |  |

## Common issues
- If you see `spec.template.spec.containers[0].image: Required value`, provide either `anomalyScorer.image.repository`/`tag` **or** `global.image.owner`/`tag`.
