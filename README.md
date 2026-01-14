# Azure Cloud Project

This project is a serverless resume hosted on Azure. It demonstrates a full cloud-native CI/CD workflow using infrastructure as code and automated testing.

## 🏗 Architecture

```mermaid
graph TD
    User(Visitor) -->|HTTPS Request| CDN[Azure Static Web App]
    CDN -->|Returns HTML/CSS/JS| User
    User -->|JS Fetch Call| API[Azure Function API]
    API -->|Python SDK| DB[(Azure Cosmos DB)]
    
    subgraph Azure Cloud
        CDN
        API
        DB
    end

    subgraph "CI/CD Pipeline"
        Git[GitHub Repo] -->|Push| Action[GitHub Actions]
        Action -->|Build & Deploy| CDN
        Action -->|Build & Deploy| API
    end