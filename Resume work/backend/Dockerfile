# DOCKERFILE

# Azure Functions Python 3.11 runtime - includes Python + Functions host
FROM mcr.microsoft.com/azure-functions/python:4.37.1-python3.11

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true \
    FUNCTIONS_WORKER_RUNTIME=python

WORKDIR /home/site/wwwroot

# System dependencies for compiling Python packages
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all function code
COPY . .