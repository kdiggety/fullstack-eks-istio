# chart-kserve-models

**Purpose:** Optional KServe model deployments (Inferenceservices) that the stack can call via HTTP.

## Prerequisites
- KServe CRDs installed cluster-wide.
- Istio sidecar injection enabled in the namespace (if you want mesh controls).

## Enabling
```bash
helm upgrade --install ml helm/apps/chart-ml -n ml --set kserveModels.enabled=true
```

## Common issues
- Missing CRDs → install KServe before enabling this chart.
