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
RUN pip install --target /home/site/wwwroot -r requirements.txt

# Download TextBlob corpora
RUN python -m textblob.download_corpora

# Stage 2: Azure Functions runtime
FROM mcr.microsoft.com/azure-functions/base:4.0

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

# Copy installed dependencies from Stage 1
COPY --from=build /home/site/wwwroot /home/site/wwwroot

# Copy TextBlob corpora from Stage 1
COPY --from=build /root/nltk_data /root/nltk_data

# Copy function code
COPY . /home/site/wwwroot