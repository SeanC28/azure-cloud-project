# Azure Cloud Portfolio

A serverless portfolio website showcasing cloud engineering skills, built on Azure with AI-powered features, automated CI/CD, and Infrastructure as Code.

**Live:** [purple-bay-0a40cce1e.6.azurestaticapps.net](https://purple-bay-0a40cce1e.6.azurestaticapps.net/)

## Architecture

```
Visitor ──HTTPS──▶ Azure Static Web App (CDN + Frontend)
                         │
                    API Routes
                         │
                  Azure Functions (Python 3.11, v2 model)
                   ┌─────┼──────────┬──────────────┐
                   │     │          │              │
              Cosmos DB  │   Sentiment Engine   GitHub API
              (Serverless)│  (TextBlob + Keyword  (Live stats)
               3 containers│   Fallback)
                   │     │          │
                   │  App Insights  │
                   │  (Telemetry)   │
                   │                │
              ─────┴────────────────┴─────
              Terraform (IaC)    GitHub Actions (CI/CD)
```

## Features

### Visitor Counter
Real-time visitor tracking stored in Cosmos DB. Increments and returns count on each page load.

### GitHub Stats Integration
Live GitHub profile statistics proxied through Azure Functions — total repos, stars, forks, weighted language percentages based on actual code bytes, and recent activity from the last 30 days.

### Resume Download Tracker
Tracks every resume download with timestamps. Displays total downloads with an animated badge and provides analytics breakdowns (daily, weekly).

### Contact Form with AI Analysis
Contact form submissions go through a full NLP pipeline before storage:
- **Sentiment Analysis** — TextBlob with a custom keyword-based fallback
- **Spam Detection** — Keyword matching + regex patterns (repeated characters, ALL CAPS, multiple URLs). Scores 0–1, flagged as spam above 0.5
- **Priority Scoring** — 1–10 scale based on urgency keywords, sentiment, and question marks
- **Email Notifications** — Delivered via Resend API

### Interactive Architecture Diagram
A live, clickable system map on the site itself. Visitors can click any node to inspect the tech stack, see API endpoints, and trace data flow between services.

### Infrastructure as Code
All Azure resources defined and managed through Terraform with lifecycle protection and imported existing resources for production stability.

### Automated CI/CD
GitHub Actions deploys frontend and backend to Azure Static Web Apps on every push to `main`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript, Devicon CDN |
| Backend | Python 3.11, Azure Functions v2 |
| Database | Azure Cosmos DB (Serverless, SQL API) |
| AI/NLP | TextBlob, Custom Keyword Analyzer |
| Hosting | Azure Static Web Apps |
| Monitoring | Azure Application Insights |
| IaC | Terraform (AzureRM Provider) |
| CI/CD | GitHub Actions |
| Email | Resend API |
| External APIs | GitHub REST API |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/GetVisitorCount` | Increment and return visitor count |
| GET | `/api/GetGitHubStats` | Live GitHub profile stats with language breakdown |
| GET | `/api/GetResumeStats` | Resume download analytics |
| POST | `/api/TrackResumeDownload` | Record a resume download event |
| POST | `/api/SubmitContactForm` | Sentiment analysis, spam detection, email notification |

## Project Structure

```
Resume work/
├── .github/workflows/
│   └── azure-static-web-apps-purple-bay-*.yml
├── backend/
│   ├── function_app.py              # All endpoints (v2 @app.route decorators)
│   ├── sentiment_analyzer.py        # NLP module (TextBlob + keyword fallback)
│   ├── requirements.txt
│   └── host.json
├── frontend/
│   ├── Images/
│   ├── index.html
│   ├── style.css
│   ├── github-stats.js
│   ├── resume-tracker.js
│   ├── contact-form.js
│   ├── architecture-diagram.js      # Interactive system map
│   └── animation.js
└── terraform/
    ├── main.tf                      # Resource Group, Cosmos DB, App Insights
    ├── variables.tf
    ├── outputs.tf
    ├── providers.tf
    └── terraform.tfvars             # Values (not committed)
```

## Azure Resources

| Resource | Name | Purpose |
|----------|------|---------|
| Resource Group | Cloud-Project | All resources (West US 2) |
| Static Web App | CloudAzureWork | Frontend + integrated Functions |
| Cosmos DB | cloud-project-sean | Serverless NoSQL (3 containers) |
| Application Insights | appi-portfolio-prod | Monitoring and telemetry |

### Cosmos DB Containers

- **Counter** — Visitor count (partition key: `/id`)
- **ResumeDownloads** — Download events with timestamps (partition key: `/id`)
- **ContactMessages** — Form submissions with sentiment, spam score, and priority (partition key: `/id`)

## Local Development

### Prerequisites
- Python 3.9+
- Azure Functions Core Tools
- Terraform

### Backend
```bash
cd "Resume work/backend"
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
func start
```

### Frontend
```bash
cd "Resume work/frontend"
python -m http.server 8000
```

### Infrastructure
```bash
cd "Resume work/terraform"
terraform init
terraform plan
terraform apply
```

### Environment Variables
Set in Azure Static Web App Configuration:
- `AzureCosmosDBConnectionString`
- `GITHUB_USERNAME`
- `CONTACT_EMAIL`
- `RESEND_API_KEY`

## Author

**Sean Connell**
- [GitHub](https://github.com/SeanC28)
- [LinkedIn](https://www.linkedin.com/in/sean-connell-42947b214/)
