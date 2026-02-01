# DOCKERFILE

# Stage 1: Install Python dependencies
FROM python:3.11-slim AS build

WORKDIR /home/site/wwwroot

# Install system dependencies for building packages
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install all packages into the wwwroot directory
RUN pip install --target /home/site/wwwroot -r requirements.txt

# Stage 2: Azure Functions runtime
FROM mcr.microsoft.com/azure-functions/base:4.0

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true \
    PYTHONPATH=/home/site/wwwroot \
    NLTK_DATA=/home/site/wwwroot/nltk_data

# Copy installed dependencies from Stage 1
COPY --from=build /home/site/wwwroot /home/site/wwwroot

# Copy function code
COPY . /home/site/wwwroot