variable "aws_region" {
  type        = string
  description = "AWS region for deployment"
  default     = "us-east-1"
}

variable "app_name" {
  type        = string
  description = "Application name prefix for resources"
  default     = "enterprise-agent"
}

variable "environment" {
  type        = string
  description = "Deployment environment"
  default     = "production"
}

variable "gemini_api_key" {
  type        = string
  description = "Google Gemini API Key"
  sensitive   = true
  default     = "placeholder_gemini_key"
}

variable "openrouter_api_key" {
  type        = string
  description = "OpenRouter API Key"
  sensitive   = true
  default     = "placeholder_openrouter_key"
}
