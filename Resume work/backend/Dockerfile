# DOCKERFILE

# Stage 1: Install all Python dependencies and corpora
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

# Download NLTK data that TextBlob needs, using nltk directly
RUN PYTHONPATH=/home/site/wwwroot python -c " \
import nltk; \
nltk.download('punkt', download_dir='/home/site/wwwroot/nltk_data'); \
nltk.download('punkt_tab', download_dir='/home/site/wwwroot/nltk_data'); \
nltk.download('averaged_perceptron_tagger', download_dir='/home/site/wwwroot/nltk_data'); \
nltk.download('averaged_perceptron_tagger_eng', download_dir='/home/site/wwwroot/nltk_data'); \
nltk.download('movie_reviews', download_dir='/home/site/wwwroot/nltk_data'); \
nltk.download('stopwords', download_dir='/home/site/wwwroot/nltk_data')"

# Stage 2: Azure Functions runtime
FROM mcr.microsoft.com/azure-functions/base:4.0

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true \
    NLTK_DATA=/home/site/wwwroot/nltk_data \
    PYTHONPATH=/home/site/wwwroot

# Copy everything from Stage 1 (deps + corpora all inside wwwroot)
COPY --from=build /home/site/wwwroot /home/site/wwwroot

# Copy function code
COPY . /home/site/wwwroot