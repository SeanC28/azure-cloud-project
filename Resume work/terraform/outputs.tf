# Resource Group
output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.portfolio.name
}

output "resource_group_location" {
  description = "Location of the resource group"
  value       = azurerm_resource_group.portfolio.location
}

# Cosmos DB
output "cosmosdb_endpoint" {
  description = "Cosmos DB endpoint URL"
  value       = azurerm_cosmosdb_account.portfolio.endpoint
}

output "cosmosdb_primary_key" {
  description = "Cosmos DB primary key"
  value       = azurerm_cosmosdb_account.portfolio.primary_key
  sensitive   = true
}

output "cosmosdb_database_name" {
  description = "Cosmos DB database name"
  value       = azurerm_cosmosdb_sql_database.portfolio.name
}

# Summary
output "deployment_summary" {
  description = "Summary of managed resources"
  value = {
    resource_group   = azurerm_resource_group.portfolio.name
    cosmosdb_account = azurerm_cosmosdb_account.portfolio.name
    database         = azurerm_cosmosdb_sql_database.portfolio.name
    containers       = [
      azurerm_cosmosdb_sql_container.counter.name,
      azurerm_cosmosdb_sql_container.resume_downloads.name,
      azurerm_cosmosdb_sql_container.contact_messages.name
    ]
  }
}

# Application Insights
output "app_insights_instrumentation_key" {
  description = "Application Insights instrumentation key"
  value       = azurerm_application_insights.portfolio.instrumentation_key
  sensitive   = true
}

output "app_insights_connection_string" {
  description = "Application Insights connection string"
  value       = azurerm_application_insights.portfolio.connection_string
  sensitive   = true
}