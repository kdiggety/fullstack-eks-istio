# Fullstack Helm Bundle (umbrella + subcharts)

## Structure
- `chart/`         Umbrella chart (depends on api, web, istio)
- `chart-api/`     Minimal API chart (port 3000, /api/health probes)
- `chart-web/`     Minimal Web chart (Nginx on port 80)
- `chart-istio/`   Istio Gateway + VirtualService

## Usage
### 1) (Optional) vendor dependencies
helm dependency update ./chart

### 2) Install/upgrade all at once
TAG=<your_tag>  # e.g., v0.1.0 or short SHA built in CI
helm upgrade --install fullstack ./chart           -n sample --create-namespace           --set api.image.repository=sample-api           --set api.image.tag="$TAG"           --set web.image.repository=sample-frontend           --set web.image.tag="$TAG"

### 3) If you prefer separate installs
helm upgrade --install api ./chart-api -n sample --create-namespace           --set image.repository=sample-api --set image.tag="$TAG"

helm upgrade --install web ./chart-web -n sample --create-namespace           --set image.repository=sample-frontend --set image.tag="$TAG"

helm upgrade --install istio ./chart-istio -n sample --create-namespace

## Notes
- Services are named after their charts: `api`, `web`.
- Istio VirtualService routes `/api` -> `api:80` and `/` -> `web:80`.
- Adjust `istio/values.yaml` if you want host-based routing instead of path-based.
