#!/usr/bin/env bash
set -euo pipefail

NS="kube-system"
RELEASE="sealed-secrets"
KEY_BACKUP="./sealed-secrets-key.backup.yaml"

echo "== Ensuring Sealed Secrets controller is installed =="
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm repo update
helm upgrade --install "$RELEASE" sealed-secrets/sealed-secrets \
  -n "$NS" --create-namespace

# Restore only if backup exists and is non-empty
if [ -s "$KEY_BACKUP" ]; then
  echo "== Restoring sealed-secrets key from $KEY_BACKUP =="
  kubectl -n "$NS" delete secret sealed-secrets-key --ignore-not-found || true
  kubectl apply -f "$KEY_BACKUP"
  kubectl -n "$NS" rollout restart deploy/sealed-secrets
else
  echo "!! No usable backup key found ($KEY_BACKUP). Controller will generate a new keypair."
fi

echo "== Waiting for controller rollout =="
kubectl -n "$NS" rollout status deploy/sealed-secrets --timeout=180s

# Wait for the active key to appear (handles random suffixes)
echo "== Waiting for controller to generate key secret =="
SECRET_NAME=""
for i in {1..30}; do
  SECRET_NAME="$(kubectl -n "$NS" get secret \
    -l sealedsecrets.bitnami.com/sealed-secrets-key=active \
    -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)"
  if [ -n "$SECRET_NAME" ]; then break; fi
  sleep 2
done

if [ -z "$SECRET_NAME" ]; then
  echo "ERROR: Could not find active sealed-secrets key"
  kubectl -n "$NS" get secret | grep -i sealed || true
  exit 1
fi

echo "== Active key: $SECRET_NAME"
echo "== Backing up current key to $KEY_BACKUP =="
kubectl -n "$NS" get secret "$SECRET_NAME" -o yaml > "$KEY_BACKUP"
echo "✅ Backup saved. Keep $KEY_BACKUP safe (private repo or vault)."
