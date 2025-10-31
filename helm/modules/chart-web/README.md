# chart-web

**Purpose:** React SPA (Vite) served (often via Nginx) with runtime `config.js` injection.

## Key values
| Path | Type | Default | Notes |
|------|------|---------|------|
| image.repository | string | — |  |
| image.tag        | string | latest |  |
| service.port     | int    | 80 | Nginx HTTP port. |
| runtimeConfig    | map    | —  | Rendered to `/config.js` at container start (if implemented). |

## Mesh routing
- Ingress routes `/` to `web`, `/api` to `api`.
