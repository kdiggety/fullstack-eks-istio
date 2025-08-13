output "eks_cluster_name" { value = module.eks.cluster_name }
output "eks_cluster_endpoint" { value = module.eks.cluster_endpoint }
output "ecr_api" { value = aws_ecr_repository.api.repository_url }
output "ecr_frontend" { value = aws_ecr_repository.frontend.repository_url }
