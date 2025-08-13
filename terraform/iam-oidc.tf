data "aws_iam_openid_connect_provider" "eks" {
  arn = module.eks.oidc_provider_arn
}

# Example role for GitHub Actions OIDC (adjust conditions to your org/repo/branch)
resource "aws_iam_role" "gh_actions" {
  name = "${var.cluster_name}-gha-oidc"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Federated = module.eks.oidc_provider_arn
      },
      Action = "sts:AssumeRoleWithWebIdentity",
      Condition = {
        # Placeholder - you will replace with your GitHub OIDC provider if using that flow
        StringLike = {
          "token.actions.githubusercontent.com:sub" : "repo:YOUR_ORG/YOUR_REPO:*"
        }
      }
    }]
  })
  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "gh_ecr_pull" {
  role = aws_iam_role.gh_actions.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
}

output "gh_actions_role_arn" { value = aws_iam_role.gh_actions.arn }
