resource "aws_ecr_repository" "api" {
  name = "sample-api"
  image_tag_mutability = "MUTABLE"
  tags = var.tags
}

resource "aws_ecr_repository" "frontend" {
  name = "sample-frontend"
  image_tag_mutability = "MUTABLE"
  tags = var.tags
}

output "ecr_api_url" { value = aws_ecr_repository.api.repository_url }
output "ecr_frontend_url" { value = aws_ecr_repository.frontend.repository_url }
