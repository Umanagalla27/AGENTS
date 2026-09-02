output "ecr_repository_url" {
  description = "The URL of the Amazon ECR repository"
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  description = "The name of the Amazon ECS Cluster"
  value       = aws_ecs_cluster.main.name
}

output "knowledge_bucket" {
  description = "The S3 bucket for knowledge documents"
  value       = aws_s3_bucket.knowledge.id
}
