# chart-minio

**Purpose:** Local S3-compatible storage for artifacts (Argo), model blobs, and debug dumps.

## Quick install
```bash
helm dependency build helm/modules/chart-minio
helm upgrade --install ml helm/apps/chart-ml -n ml --set minio.enabled=true
```

## Key values
| Path | Type | Default | Notes |
|------|------|---------|------|
| auth.rootUser      | string | minioadmin |  |
| auth.rootPassword  | string | minioadmin | Change in production. |
| resources          | map    | small      |  |
| persistence.size   | string | 10Gi       | PVC size. |

## Common issues
- `ImagePullBackOff`: verify chart repository and image tag, and that the node can reach Docker/Quay.
- If using the console, expose Service/Ingress accordingly.
