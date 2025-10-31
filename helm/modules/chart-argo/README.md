# chart-argo

**Purpose:** Installs Argo Workflows (controller + server) for running batch/data pipelines.

## Quick install
```bash
helm dependency build helm/modules/chart-argo
helm upgrade --install ml helm/apps/chart-ml -n ml --set argo.enabled=true
```

## Key values
| Path | Type | Default | Notes |
|------|------|---------|------|
| server.enabled     | bool | true | Argo UI/API server. |
| controller.enabled | bool | true | Workflow controller. |
| artifactRepository | map  | —    | Configure MinIO/S3 (bucket, accessKey, secretKey, endpoint). |

## Common issues
- `CrashLoopBackOff` on server: often missing artifact repo config or credentials secret.
- Ensure RBAC lets the server list/get workflows in `ml` namespace.
