# Import existing Resource Group
resource "azurerm_resource_group" "portfolio" {
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
  
  lifecycle {
    prevent_destroy = true
  }
}

# Import existing Cosmos DB Account
resource "azurerm_cosmosdb_account" "portfolio" {
  name                = var.cosmosdb_account_name
  location            = azurerm_resource_group.portfolio.location
  resource_group_name = azurerm_resource_group.portfolio.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  capabilities {
    name = "EnableServerless"
  }

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = azurerm_resource_group.portfolio.location
    failover_priority = 0
  }

  tags = var.tags
  
  lifecycle {
    prevent_destroy = true
  }
}

# Fetch Cosmos DB keys
data "azurerm_cosmosdb_account" "portfolio" {
  name                = azurerm_cosmosdb_account.portfolio.name
  resource_group_name = azurerm_resource_group.portfolio.name
}

# Import existing Cosmos DB Database
resource "azurerm_cosmosdb_sql_database" "portfolio" {
  name                = "ProjectDB"
  resource_group_name = azurerm_cosmosdb_account.portfolio.resource_group_name
  account_name        = azurerm_cosmosdb_account.portfolio.name
  
  lifecycle {
    prevent_destroy = true
  }
}

resource "azurerm_cosmosdb_sql_container" "counter" {
  name                  = "Counter"
  resource_group_name   = azurerm_cosmosdb_account.portfolio.resource_group_name
  account_name          = azurerm_cosmosdb_account.portfolio.name
  database_name         = azurerm_cosmosdb_sql_database.portfolio.name
  partition_key_paths   = ["/id"]
  
  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      partition_key_version,
      indexing_policy,
      conflict_resolution_policy
    ]
  }
}

resource "azurerm_cosmosdb_sql_container" "resume_downloads" {
  name                  = "ResumeDownloads"
  resource_group_name   = azurerm_cosmosdb_account.portfolio.resource_group_name
  account_name          = azurerm_cosmosdb_account.portfolio.name
  database_name         = azurerm_cosmosdb_sql_database.portfolio.name
  partition_key_paths   = ["/id"]
  
  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      partition_key_version,
      indexing_policy,
      conflict_resolution_policy
    ]
  }
}

resource "azurerm_cosmosdb_sql_container" "contact_messages" {
  name                  = "ContactMessages"
  resource_group_name   = azurerm_cosmosdb_account.portfolio.resource_group_name
  account_name          = azurerm_cosmosdb_account.portfolio.name
  database_name         = azurerm_cosmosdb_sql_database.portfolio.name
  partition_key_paths   = ["/id"]
  
  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      partition_key_version,
      indexing_policy,
      conflict_resolution_policy
    ]
  }
}

# Application Insights for monitoring
resource "azurerm_application_insights" "portfolio" {
  name                = "appi-portfolio-prod"
  location            = azurerm_resource_group.portfolio.location
  resource_group_name = azurerm_resource_group.portfolio.name
  application_type    = "web"
  workspace_id        = "/subscriptions/1eb32a1d-22ad-4d63-956a-3454719749c4/resourceGroups/ai_appi-portfolio-prod_e6d44586-83c4-4f08-8d4c-1dec739debb2_managed/providers/Microsoft.OperationalInsights/workspaces/managed-appi-portfolio-prod-ws"
  tags                = var.tags
}

# Random string for unique ACR name
resource "random_string" "acr_suffix" {
  length  = 6
  special = false
  upper   = false
  numeric  = true
}

# Azure Container Registry
resource "azurerm_container_registry" "portfolio" {
  name                = "portfolioacr${random_string.acr_suffix.result}"
  resource_group_name = azurerm_resource_group.portfolio.name
  location            = azurerm_resource_group.portfolio.location
  sku                 = "Basic"
  admin_enabled       = true
  
  tags = var.tags
}

# Storage Account (required by Function App)
resource "azurerm_storage_account" "functions" {
  name                     = "funcstgportfolio"
  resource_group_name      = azurerm_resource_group.portfolio.name
  location                 = azurerm_resource_group.portfolio.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = var.tags
}

# App Service Plan - Consumption (Free Tier)
resource "azurerm_service_plan" "functions" {
  name                = "asp-portfolio-functions"
  location            = azurerm_resource_group.portfolio.location
  resource_group_name = azurerm_resource_group.portfolio.name
  os_type             = "Linux"
  sku_name            = "Y1"

  tags = var.tags
}

# Containerized Function App
resource "azurerm_linux_function_app" "portfolio" {
  name                       = "func-portfolio-${random_string.acr_suffix.result}"
  location                   = azurerm_resource_group.portfolio.location
  resource_group_name        = azurerm_resource_group.portfolio.name
  service_plan_id            = azurerm_service_plan.functions.id
  storage_account_name       = azurerm_storage_account.functions.name
  storage_account_access_key = azurerm_storage_account.functions.primary_access_key

  app_settings = {
    "DOCKER_REGISTRY_SERVER_URL"          = "https://${azurerm_container_registry.portfolio.login_server}"
    "DOCKER_REGISTRY_SERVER_USERNAME"     = azurerm_container_registry.portfolio.admin_username
    "DOCKER_REGISTRY_SERVER_PASSWORD"     = azurerm_container_registry.portfolio.admin_password
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "DOCKER_ENABLE_CI"                    = "true"

    "AzureCosmosDBConnectionString" = "DefaultEndpointsProtocol=https;AccountName=${data.azurerm_cosmosdb_account.portfolio.name};AccountKey=${data.azurerm_cosmosdb_account.portfolio.primary_key};TableEndpoint=https://${data.azurerm_cosmosdb_account.portfolio.name}.documents.azure.com:443/"
    "GITHUB_USERNAME"               = var.github_username
    "CONTACT_EMAIL"                 = var.contact_email
    "RESEND_API_KEY"                = var.resend_api_key
  }

  site_config {
    application_stack {
      docker {
        registry_url = "https://${azurerm_container_registry.portfolio.login_server}"
        image_name   = "portfolio-functions"
        image_tag    = "latest"
      }
    }

    cors {
      allowed_origins = ["*"]
    }
  }

  tags = var.tags
}

output "function_app_name" {
  value       = azurerm_linux_function_app.portfolio.name
  description = "Containerized Function App name"
}

output "function_app_url" {
  value       = "https://${azurerm_linux_function_app.portfolio.default_hostname}"
  description = "Containerized Function App URL"
}

# Outputs for ACR credentials
output "acr_name" {
  value       = azurerm_container_registry.portfolio.name
  description = "Azure Container Registry name"
}

output "acr_login_server" {
  value       = azurerm_container_registry.portfolio.login_server
  description = "ACR login server URL"
}

output "acr_admin_username" {
  value       = azurerm_container_registry.portfolio.admin_username
  description = "ACR admin username"
  sensitive   = true
}

output "acr_admin_password" {
  value       = azurerm_container_registry.portfolio.admin_password
  description = "ACR admin password"
  sensitive   = true
}