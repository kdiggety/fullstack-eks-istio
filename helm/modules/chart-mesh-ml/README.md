# chart-mesh-ml

**Purpose:** Istio-facing pieces for the AI/ML stack (Gateway, VirtualServices, optional OIDC/AuthZ, optional local rate-limits).

## Quick install
```bash
helm upgrade --install ml helm/apps/chart-ml -n ml \
  --set meshMl.enabled=true \
  --set meshMl.host="*" \
  --set meshMl.gateway="istio-system/web-gateway"
```

## Key values
| Path | Type | Default | Notes |
|------|------|---------|------|
| host            | string | * | External host for Gateway/VS. |
| gateway         | string | istio-system/web-gateway | Namespace/name of existing Gateway. |
| oidc            | map    | {} | Leave `{}` to disable, or set `issuer`, `jwksUri`, `audiences[].` |
| authz           | map    | {} | Leave `{}` to disable, or set `allowedDomains[]`, `allowedRoles[]`. |
| rateLimit       | map    | off  | (Optional) knobs for local rate-limit filter on ingress and/or sidecars. |

## Common issues
- If you disable OIDC/AuthZ, pass `--set-json meshMl.oidc={} --set-json meshMl.authz={}` (don’t pass empty strings).
- To use per-user rate-limits, ensure filter config includes a `token_bucket` **inside** each descriptor block.
