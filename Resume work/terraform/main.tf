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

