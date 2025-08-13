# Fullstack Starter (EKS + Istio)

A minimal React + Node/Express app wired for DevOps practice on **AWS EKS** with **Istio**.

## What’s inside
- **frontend** (React + Vite) → served by Nginx container
- **backend** (Node + Express) → Prometheus metrics at `/metrics`
- **k8s** manifests with namespace labeled for **Istio sidecar injection**, Services, Deployments
- **Istio** Gateway + VirtualService for path-based routing (`/api` → backend, `/` → frontend)
- **GitHub Actions** skeletons for CI and deploy
- **Terraform** skeleton to provision ECR + EKS + OIDC role

## Quick start
1. Build locally:
   ```bash
   npm -C backend ci && npm -C backend test && docker build -t sample-api:dev backend
   npm -C frontend ci && npm -C frontend run build && docker build -t sample-frontend:dev frontend
   ```

2. Provision AWS infra (edit `terraform/variables.tf` or provide tfvars):
   ```bash
   cd terraform
   terraform init
   terraform apply -var='region=us-west-2' -var='cluster_name=fullstack-sample'
   ```

3. Install **Istio** on the cluster (outside of Terraform):
   ```bash
   istioctl install -y
   kubectl get pods -n istio-system
   ```

4. Update images in `k8s/*deployment.yaml` with your **ECR** repo URLs and a tag (e.g., git SHA).

5. Deploy app + Istio:
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/backend-deployment.yaml -f k8s/backend-service.yaml
   kubectl apply -f k8s/frontend-deployment.yaml -f k8s/frontend-service.yaml
   kubectl apply -f k8s/istio/gateway.yaml -f k8s/istio/virtualservice.yaml
   ```

6. Get the Istio ingress gateway address:
   ```bash
   kubectl -n istio-system get svc istio-ingressgateway
   # open http://<EXTERNAL-IP>/
   ```

## GitHub Actions OIDC → AWS
- Replace placeholders in `.github/workflows/deploy.yml` with your account/role/region.
- Optionally, create a dedicated IAM role for GH Actions and restrict `sub` to your repo/branch.

## Notes
- For production, add TLS to the Istio `Gateway`; consider cert-manager.
- Add HPA, resource limits, and proper logging stack (e.g., OpenSearch or Loki) as stretch goals.
