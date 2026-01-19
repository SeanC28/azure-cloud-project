# Azure Cloud Resume Project

A production-ready cloud portfolio demonstrating full-stack serverless architecture, Infrastructure as Code (Terraform), CI/CD automation, and real-time API integrations on Microsoft Azure.

## 🏗 Architecture

```mermaid
graph TD
    User(Visitor) -->|HTTPS Request| CDN[Azure Static Web App]
    CDN -->|Returns HTML/CSS/JS| User
    
    %% Frontend Calls
    User -->|GET: Visitor Count| API[Azure Function API]
    User -->|GET: GitHub Stats| API
    User -->|POST: Resume Download| API
    User -->|GET: Resume Stats| API
    User -->|POST: Contact Form| API
    
    %% Backend Logic
    API -->|Python SDK| DB[(Azure Cosmos DB)]
    API -->|HTTP Request| ExtGit[GitHub Public API]
    API -->|HTTP Request| Email[Resend Email API]
    
    %% Monitoring
    API -.->|Telemetry| AppInsights[Application Insights]
    
    subgraph Azure Cloud
        CDN
        API
        DB
        AppInsights
    end

    subgraph "CI/CD Pipeline"
        Git[GitHub Repository] -->|Push to main| Action[GitHub Actions]
        Action -->|Build & Deploy Frontend| CDN
        Action -->|Build & Deploy Backend| API
    end
    
    subgraph "Infrastructure as Code"
        Terraform[Terraform] -.->|Provisions & Manages| Azure
    end
