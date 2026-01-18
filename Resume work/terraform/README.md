# Azure Cloud Resume Challenge

A serverless portfolio website showcasing cloud engineering skills, built entirely on Azure infrastructure with automated CI/CD deployment and Infrastructure as Code (Terraform).

## 🏗️ Architecture Overview

```
CI/CD Pipeline
├── GitHub Repo
│   └── Push
│       ├── GitHub Actions
│       │   ├── Build & Deploy Frontend → Azure Static Web App
│       │   └── Build & Deploy Backend → Azure Function API
│       │
│       └── Visitor Interaction
│           ├── Returns HTML/CSS/JS
│           ├── JS Fetch Calls
│           └── HTTPS Requests
│               ├── /api/GetVisitorCount → Azure Cosmos DB
│               ├── /api/GetGitHubStats → GitHub API
│               ├── /api/TrackResumeDownload → Azure Cosmos DB
│               ├── /api/GetResumeStats → Azure Cosmos DB
│               └── /api/SubmitContactForm → Azure Cosmos DB + Resend Email
```

## ✨ Features

### 1. **Visitor Counter**
- Real-time visitor tracking
- Azure Function API endpoint (`GetVisitorCount`)
- Data stored in Azure Cosmos DB
- Increments on each page load

### 2. **GitHub Stats Integration** 
- Live GitHub profile statistics
- Azure Function API endpoint (`GetGitHubStats`)
- Displays:
  - Total repositories, stars, followers, and forks
  - All programming languages with weighted percentages (based on actual code bytes)
  - Recent repository activity (last 30 days)
- Fetches data from GitHub REST API
- Auto-refreshes and caches for performance
- Fully responsive design matching site theme

### 3. **Resume Download Tracker**
- Tracks every resume download with timestamp
- Azure Function API endpoints (`TrackResumeDownload`, `GetResumeStats`)
- Displays total downloads with animated badge
- Stores analytics: total, daily, weekly downloads
- Optimistic UI updates for instant feedback

### 4. **Contact Form with Email Notifications**
- Professional contact form with validation
- Azure Function API endpoint (`SubmitContactForm`)
- Email notifications via Resend API
- Stores all messages in Cosmos DB
- Client and server-side validation
- Spam prevention with required fields

### 5. **Infrastructure as Code (Terraform)**
- Entire Azure infrastructure defined in code
- Version controlled and reproducible
- Manages: Resource Group, Cosmos DB, Containers
- Easy to deploy new environments (dev/staging)
- Professional DevOps best practices

### 6. **Serverless Architecture**
- Azure Static Web Apps for hosting
- Azure Functions for backend API
- No servers to manage or maintain
- Auto-scales based on demand

### 7. **Automated CI/CD**
- GitHub Actions workflow
- Automatic deployment on push to `main`
- Separate build processes for frontend and backend

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript
- Responsive design
- Dark theme with Azure branding

**Backend:**
- Python 3.9+
- Azure Functions (Serverless)
- Azure Cosmos DB (NoSQL database - Serverless)
- GitHub REST API integration
- Resend API for email notifications

**Infrastructure as Code:**
- Terraform
- Azure Provider (~> 3.0)
- Infrastructure versioned in Git

**DevOps:**
- GitHub Actions for CI/CD
- Infrastructure as Code principles
- Automated testing and deployment

**Azure Services:**
- Azure Static Web Apps
- Azure Functions
- Azure Cosmos DB (Serverless)
- Azure Application Insights (monitoring)

## 📁 Project Structure

```
Resume work/
├── .github/
│   └── workflows/
│       └── azure-static-web-apps.yml    # CI/CD pipeline
├── backend/
│   ├── function_app.py                   # Azure Functions
│   │   ├── GetVisitorCount()            # Visitor counter endpoint
│   │   ├── GetGitHubStats()             # GitHub stats endpoint
│   │   ├── TrackResumeDownload()        # Resume tracking endpoint
│   │   ├── GetResumeStats()             # Resume analytics endpoint
│   │   └── SubmitContactForm()          # Contact form endpoint
│   ├── requirements.txt                  # Python dependencies
│   ├── host.json                         # Function app config
│   └── local.settings.json              # Local dev settings (not committed)
├── frontend/
│   ├── Images/                           # Image assets
│   ├── index.html                        # Main page
│   ├── style.css                         # Styling
│   ├── github-stats.js                   # GitHub stats UI logic
│   ├── resume-tracker.js                 # Resume tracking UI logic
│   ├── contact-form.js                   # Contact form UI logic
│   └── resume.pdf                        # Downloadable resume
└── terraform/
    ├── providers.tf                      # Terraform provider config
    ├── variables.tf                      # Input variables
    ├── main.tf                           # Infrastructure resources
    ├── outputs.tf                        # Output values
    ├── terraform.tfvars                  # Variable values (not committed)
    ├── .gitignore                        # Protects sensitive files
    └── README.md                         # Terraform documentation
```

## 🚀 API Endpoints

### GET `/api/GetVisitorCount`
Returns and increments the visitor count.

**Response:**
```json
{
  "count": 1234
}
```

### GET `/api/GetGitHubStats`
Fetches real-time GitHub profile statistics with weighted language percentages.

**Query Parameters:**
- `username` (optional): GitHub username to fetch stats for

**Response:**
```json
{
  "username": "SeanC28",
  "name": "Sean Connell",
  "public_repos": 15,
  "followers": 50,
  "total_stars": 125,
  "total_forks": 45,
  "languages": [
    {"language": "Python", "bytes": 45230, "percentage": 67.5},
    {"language": "JavaScript", "bytes": 12450, "percentage": 18.3},
    {"language": "HTML", "bytes": 6890, "percentage": 10.2}
  ],
  "recent_activity": [...]
}
```

### POST `/api/TrackResumeDownload`
Records a resume download event.

**Response:**
```json
{
  "success": true,
  "total_downloads": 42,
  "timestamp": "2026-01-17T..."
}
```

### GET `/api/GetResumeStats`
Returns resume download analytics.

**Response:**
```json
{
  "total_downloads": 42,
  "downloads_today": 5,
  "downloads_this_week": 18,
  "daily_breakdown": [
    {"date": "2026-01-17", "count": 5}
  ]
}
```

### POST `/api/SubmitContactForm`
Handles contact form submissions, stores in database, and sends email.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Job Opportunity",
  "message": "Hi, I'd like to discuss..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your message!",
  "email_sent": true
}
```

## 💻 Local Development

### Prerequisites
- Python 3.9+
- Azure Functions Core Tools
- Azure account
- GitHub account
- Terraform (for infrastructure)

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SeanC28/your-repo-name.git
   cd your-repo-name/backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure local settings:**
   Create `backend/local.settings.json`:
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "UseDevelopmentStorage=true",
       "FUNCTIONS_WORKER_RUNTIME": "python",
       "AzureCosmosDBConnectionString": "YOUR_COSMOS_DB_CONNECTION_STRING",
       "GITHUB_USERNAME": "SeanC28",
       "GITHUB_TOKEN": "YOUR_GITHUB_TOKEN_OPTIONAL",
       "CONTACT_EMAIL": "your-email@example.com",
       "RESEND_API_KEY": "YOUR_RESEND_API_KEY"
     }
   }
   ```

4. **Run locally:**
   ```bash
   func start
   ```

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd ../frontend
   ```

2. **Start local server:**
   ```bash
   python -m http.server 8000
   # Or use VS Code Live Server extension
   ```

3. **Visit:** `http://localhost:8000`

### Infrastructure Setup (Terraform)

1. **Navigate to terraform folder:**
   ```bash
   cd ../terraform
   ```

2. **Initialize Terraform:**
   ```bash
   terraform init
   ```

3. **Review infrastructure:**
   ```bash
   terraform plan
   ```

4. **See [terraform/README.md](terraform/README.md) for full documentation**

## 🌐 Deployment

### Automated Deployment (Recommended)

Deployment is fully automated via GitHub Actions:

1. Push changes to `main` branch
2. GitHub Actions triggers automatically
3. Builds and deploys frontend to Azure Static Web Apps
4. Builds and deploys backend to Azure Functions
5. Live in 2-5 minutes!

### Infrastructure Deployment (Terraform)

Infrastructure is managed as code using Terraform:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

See [terraform/README.md](terraform/README.md) for detailed instructions.

### Manual Deployment (Not Recommended)

If needed, you can deploy manually:
- **Frontend**: Use Azure Static Web Apps CLI
- **Backend**: Use Azure Functions Core Tools
- **Infrastructure**: Use Azure Portal or Azure CLI

### Environment Variables (Azure Portal)

Set these in Azure Static Web App → Configuration:

- `AzureCosmosDBConnectionString`: Cosmos DB connection string
- `GITHUB_USERNAME`: Your GitHub username  
- `GITHUB_TOKEN`: (Optional) GitHub Personal Access Token
- `CONTACT_EMAIL`: Email to receive contact forms
- `RESEND_API_KEY`: Resend API key for emails

## 📊 Monitoring

- **Application Insights**: Performance metrics and error tracking
- **Azure Portal**: Function execution logs
- **GitHub Actions**: Build and deployment status

## 🔒 Security

- Connection strings stored in Azure Key Vault references
- `local.settings.json` excluded from Git via `.gitignore`
- CORS configured for Static Web App domain only
- Anonymous auth for public APIs (no sensitive data exposed)
- GitHub token optional (for rate limit increase only)

## 📈 Performance

- **GitHub Stats Caching**: 5-minute cache headers reduce API calls
- **Cosmos DB**: Single-digit millisecond latency
- **Static Web Apps**: Global CDN distribution
- **Serverless**: Auto-scales based on demand

## 🎯 Skills Demonstrated

- ☁️ **Azure Cloud Services** (Static Web Apps, Functions, Cosmos DB)
- 🐍 **Python Backend Development**
- 🌐 **RESTful API Design & Integration**
- 🔄 **CI/CD with GitHub Actions**
- 📊 **NoSQL Database Design (Cosmos DB)**
- 🎨 **Responsive Web Design**
- 🔐 **Security Best Practices**
- 📱 **API Integration** (GitHub REST API, Resend API)
- 🏗️ **Infrastructure as Code** (Terraform)
- 📦 **Version Control** (Git/GitHub)
- 🔧 **DevOps Practices**
- 📈 **Monitoring & Analytics**

## 🔗 Live Demo

**Website:** https://purple-bay-0a40cce1e.6.azurestaticapps.net/

## 📝 License

This project is open source and available under the MIT License.

## 👤 Author

**Sean Connell**
- GitHub: [@SeanC28](https://github.com/SeanC28)
- LinkedIn: [Sean Connell](https://www.linkedin.com/in/sean-connell-42947b214/)

---

Built with ☁️ on Azure