# DOCKERFILE
FROM mcr.microsoft.com/azure-functions/python:4-3.11

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Set working directory (Azure Functions standard)S
WORKDIR /home/site/wwwroot

# Install system dependencies needed for building Python packages
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (Docker layer caching optimization)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install Azure Functions Core Tools
RUN pip install azure-functions-core-tools

# Download TextBlob corpora (needed for sentiment analysis)
RUN python -m textblob.download_corpora

# Copy all function code
COPY . .

# Azure Functions specific environment variables
ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

