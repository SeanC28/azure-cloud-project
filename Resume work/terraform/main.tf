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