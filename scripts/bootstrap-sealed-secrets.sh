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

# Optional: restore backup key if you have one
if [ -f "$KEY_BACKUP" ]; then
  echo "== Restoring sealed-secrets key from $KEY_BACKUP =="
  # delete any auto-generated key
  kubectl -n "$NS" delete secret sealed-secrets-key --ignore-not-found
  # apply the backed-up key
  kubectl apply -f "$KEY_BACKUP"
  # restart the controller so it picks up the restored key
  kubectl -n "$NS" rollout restart deploy/sealed-secrets
else
  echo "!! No backup key found ($KEY_BACKUP)."
  echo "   SealedSecrets will use a fresh keypair."
  echo "   If you reseal secrets now, commit the new ciphertexts and back up the new key:"
  echo "     kubectl -n $NS get secret sealed-secrets-key -o yaml > sealed-secrets-key.backup.yaml"
fi

# Wait for controller to be ready
echo "== Waiting for controller to be Ready =="
kubectl -n "$NS" rollout status deploy/sealed-secrets --timeout=120s

# --- NEW: Always back up the current key after controller is ready ---
echo "== Backing up current sealed-secrets-key to $KEY_BACKUP =="
kubectl -n "$NS" get secret sealed-secrets-key -o yaml > "$KEY_BACKUP"
echo "✅ Backup complete. Keep $KEY_BACKUP safe (private repo or vault)."

# Optional sanity check: print key versions in the secret (if present)
echo "== Sanity: show secret metadata =="
kubectl -n "$NS" get secret sealed-secrets-key -o jsonpath='{.metadata.name}{"  created: "}{.metadata.creationTimestamp}{"\n"}' || true

echo "✅ Sealed Secrets bootstrap complete."

