# chart-secrets

**Purpose:** SealedSecrets and plain Secrets used by the stack (e.g., GHCR pull secret, provider credentials).

## Notes
- Prefer Bitnami Sealed Secrets for anything non-local.
- Example flow:
```bash
kubectl -n ml create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username="$GHCR_USER" \
  --docker-password="$GHCR_TOKEN" \
  --dry-run=client -o yaml | kubeseal --format yaml > helm/modules/chart-secrets/templates/ghcr-pull.sealedsecret.yaml
```
