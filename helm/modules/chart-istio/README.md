# chart-istio

**Purpose:** Base mesh manifests for the app (e.g., Namespace label for injection, Gateway, DestinationRules, VirtualServices for `web` and `api`).

> If you are using `chart-mesh-ml` for the AI/ML stack routing, keep the responsibilities separate: `chart-istio` for base app, `chart-mesh-ml` for the ML paths.

## Key values
| Path | Type | Default | Notes |
|------|------|---------|------|
| gateway.name      | string | web-gateway | Name of the shared Gateway. |
| gateway.namespace | string | istio-system | Where the gateway lives. |
| hosts[]           | list   | * | Hostnames. |
