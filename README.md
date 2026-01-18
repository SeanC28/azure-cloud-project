# Azure Cloud Resume Project

This a Cloud project hosted on Azure. It demonstrates a full cloud-native CI/CD workflow using infrastructure as code, automated testing, and real-time API integrations.

## 🏗 Architecture

```mermaid
graph TD
    User(Visitor) -->|HTTPS Request| CDN[Azure Static Web App]
    CDN -->|Returns HTML/CSS/JS| User
    
    %% Frontend Calls
    User -->|Fetch: Visitor Count| API[Azure Function API]
    User -->|Fetch: GitHub Stats| API
    
    %% Backend Logic
    API -->|Python SDK| DB[(Azure Cosmos DB)]
    API -->|HTTP Request| ExtGit[GitHub Public API]
    
    subgraph Azure Cloud
        CDN
        API
        DB
    end

    subgraph "CI/CD Pipeline"
        Git[Your GitHub Repo] -->|Push| Action[GitHub Actions]
        Action -->|Build & Deploy| CDN
        Action -->|Build & Deploy| API
    end
