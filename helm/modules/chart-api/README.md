# chart-api

**Purpose:** Backend API (Node/Express) behind Istio, typically served at `/api` with the SPA at `/`.

## Key values
| Path | Type | Default | Notes |
|------|------|---------|------|
| image.repository | string | — |  |
| image.tag        | string | latest |  |
| service.port     | int    | 3000 |  |
| env[]            | map    | —    | Common: `REDIS_HOST`, `REDIS_PASSWORD`, etc. |

## Mesh routing
- Ingress routes `/api` to this service; `/` → `web`.
