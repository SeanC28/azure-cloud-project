# Azure Authentication
variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
  sensitive   = true
}

variable "client_id" {
  description = "Azure Service Principal App ID"
  type        = string
  sensitive   = true
}

variable "client_secret" {
  description = "Azure Service Principal Password"
  type        = string
  sensitive   = true
}

variable "tenant_id" {
  description = "Azure Tenant ID"
  type        = string
  sensitive   = true
}

# Existing Resource Names
variable "resource_group_name" {
  description = "Existing resource group name"
  type        = string
}

variable "cosmosdb_account_name" {
  description = "Existing Cosmos DB account name"
  type        = string
}

variable "static_web_app_name" {
  description = "Existing Static Web App name"
  type        = string
}

variable "location" {
  description = "Azure region for resources"
  type        = string
}

# Application Settings
variable "github_username" {
  description = "GitHub username for stats"
  type        = string
  default     = "SeanC28"
}

variable "contact_email" {
  description = "Email address to receive contact form submissions"
  type        = string
  default     = "seanconnell23@yahoo.com"
}

variable "resend_api_key" {
  description = "Resend API key for email notifications"
  type        = string
  sensitive   = true
}

# Tags
variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "Cloud Resume Challenge"
    ManagedBy   = "Terraform"
    Environment = "Production"
  }
}