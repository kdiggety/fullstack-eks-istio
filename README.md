# Fullstack Starter (Kubernetes + Istio + Helm)

A minimal React (Vite) + Node/Express app wired for **DevOps practice** on Kubernetes with **Istio** service mesh.  
Supports local clusters (Docker Desktop, minikube, kind) and can be extended to AWS EKS.

---

## What’s inside
- **frontend** → React + Vite, served by Nginx container
- **backend** → Node + Express, with Prometheus metrics at `/metrics`
- **helm/** → Umbrella Helm chart managing:
  - `api` (backend Deployment + Service)
  - `web` (frontend Deployment + Service)
  - `istio` (Gateway + VirtualService for routing)
  - `secrets` (Sealed Secrets for runtime env)
  - `redis` (Bitnami subchart, standalone mode for dev)
- **Istio** → ingress gateway + VirtualService (`/api` → backend, `/` → frontend)
- **GitHub Actions**:
  - `ci-backend.yml` / `ci-frontend.yml` → build & tag Docker images
  - `deploy.yml` → deploys umbrella chart into local cluster
  - `rollback.yml` → rollback Helm release
  - `promote.yml` → promote a tagged build into staging namespace
- **Secrets**:
  - Runtime → Kubernetes Sealed Secrets (`JWT_SECRET`, `API_BASE`, `redis-password`)
  - Build-time → GitHub Actions Secrets (`FRONTEND_API_BASE_URL`)

---

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (with Kubernetes enabled) OR [minikube](https://minikube.sigs.k8s.io/) OR [kind](https://kind.sigs.k8s.io/)  
- [kubectl](https://kubernetes.io/docs/tasks/tools/)  
- [helm](https://helm.sh/)  
- [istioctl](https://istio.io/latest/docs/setup/getting-started/)  
- [kubeseal](https://github.com/bitnami-labs/sealed-secrets)  

---

## One-time cluster setup
```bash
# Install Istio (demo profile is fine for local dev)
istioctl install --set profile=demo -y
kubectl -n istio-system get pods

# Install Sealed Secrets controller
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm upgrade --install sealed-secrets sealed-secrets/sealed-secrets -n kube-system

# Create and label namespace
kubectl create ns sample
kubectl label ns sample istio-injection=enabled --overwrite
```

---

## Local GitHub Actions Runner

The CI/CD workflows (`ci-backend.yml`, `ci-frontend.yml`, `deploy.yml`, etc.) are designed to run on a **self-hosted runner** connected to this repo.  
This runner must be running on the same machine that has Docker/Kubernetes installed (so it can build images and talk to your local cluster).

### One-time runner setup
1. Go to GitHub → **Settings → Actions → Runners → New self-hosted runner**.  
2. Download and extract the runner package into a directory (e.g., `~/actions-runner`).  
3. Configure the runner:
   ```bash
   ./config.sh --url https://github.com/<your-username>/<your-repo>                --token <REGISTRATION_TOKEN>
   ```
   > The token is generated in the GitHub UI when you click “New self-hosted runner”.

4. Add a custom label during setup, e.g. `local-k8s`.  

5. (Optional) Install as a service so it runs in the background:
   ```bash
   sudo ./svc.sh install
   sudo ./svc.sh start
   ```

### Running the runner
- Foreground (good for testing):
  ```bash
  cd ~/actions-runner
  ./run.sh
  ```
- You should see:
  ```
  √ Connected to GitHub
  Listening for Jobs
  ```

- In GitHub → **Actions → Runners**, the runner will show as **Idle** when ready.

---

## Local manual build (sanity check)
```bash
# Backend
docker build -t sample-api:dev backend
docker run --rm -p 3000:3000 sample-api:dev

# Frontend
docker build -t sample-frontend:dev frontend
docker run --rm -p 8080:80 sample-frontend:dev
```

---

## Helm deploy (preferred path)
```bash
helm dependency build ./helm/chart
TAG=dev

helm upgrade --install fullstack ./helm/chart   -n sample --create-namespace --dependency-update   --set api.image.repository=sample-api   --set api.image.tag=$TAG   --set web.image.repository=sample-frontend   --set web.image.tag=$TAG
```

## Validate pods are running
```bash
kubectl -n sample get pods
```

Access via Istio ingress:
```bash
kubectl -n istio-system port-forward svc/istio-ingressgateway 8080:80
# open http://localhost:8080/   (frontend)
# curl http://localhost:8080/api/health   (backend)
```

---

## CI/CD workflows

- **Build**: On push, `ci-backend.yml` and `ci-frontend.yml` build Docker images (`sample-api:<SHA>`, `sample-frontend:<SHA>`) and load them into the local cluster (minikube/kind).  
- **Deploy**: `deploy.yml` deploys the umbrella Helm chart (`fullstack` release in `sample` namespace) with rollout checks and Istio smoke tests.  
- **Rollback**: `rollback.yml` rolls back the Helm release to a previous revision.  
- **Promote**: `promote.yml` deploys the same tagged build into `staging` namespace (`fullstack-staging` release).  

> Workflows require the self-hosted runner with the label `local-k8s`.

---

## Working with Sealed Secrets

### Step 1: Generate a strong secret
```bash
  JWT=$(openssl rand -hex 32)
```

### Step 2: Create a Secret manifest on stdout, piping the value 
```bash
  kubectl -n sample create secret generic api-env \
    --from-literal=JWT_SECRET="$JWT" \
    --dry-run=client -o json \
  | kubeseal \
    --controller-name=sealed-secrets \
    --controller-namespace=kube-system \
    --format yaml \
    > helm/umbrella/chart-secrets/templates/api-env.sealed.yaml
```

### Step 3: Validate the Secret
```bash
  kubectl -n sample get sealedsecret api-env
  kubectl -n sample get secret api-env -o jsonpath='{.data.JWT_SECRET}' | grep . && echo "OK"
  kubectl -n sample describe pod <api-pod-name> | sed -n '/Environment:/,/Mounts:/p'
```

- **Runtime** (backend):  
  Managed via **Sealed Secrets** (`helm/chart-secrets`). Example: `JWT_SECRET`.

- **Build-time** (frontend):  
  Store `FRONTEND_API_BASE_URL` in GitHub Actions Secrets.  
  Passed into the Docker build with `--build-arg` so Vite picks it up as `import.meta.env.VITE_API_BASE`.

## Troubleshooting the Redis Sealed Secrets

- **Step 1: Pick a Redis pod**:
```bash
REDIS_POD=$(kubectl -n sample get pods -l app.kubernetes.io/name=redis -o jsonpath='{.items[0].metadata.name}')
```

- **Step 2: Get the password from the Secret**:
```bash
REDIS_PW=$(kubectl -n sample get secret redis-auth -o jsonpath='{.data.redis-password}' | base64 -d)
```

- **Step 3: Without a password you should see NOAUTH**:
```bash
kubectl -n sample exec -it "$REDIS_POD" -- redis-cli PING
```

- **Step 4: With the password you should see PONG**:
```bash
kubectl -n sample exec -it "$REDIS_POD" -- redis-cli -a "$REDIS_PW" PING
```

- **Step 5: Quick write/read**:
```bash
kubectl -n sample exec -it "$REDIS_POD" -- redis-cli -a "$REDIS_PW" SET probe "ok"
kubectl -n sample exec -it "$REDIS_POD" -- redis-cli -a "$REDIS_PW" GET probe
```
---

## Stretch goals
- Deploy to AWS EKS (Terraform skeleton exists in `terraform/` for ECR/EKS/OIDC role).
- Add TLS to Istio Gateway (with cert-manager).
- Add HPA, resource requests/limits.
- Add monitoring/logging (Prometheus, OpenSearch, Loki).
