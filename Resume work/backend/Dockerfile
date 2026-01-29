# Use Python 3.11 slim image (smaller, faster)
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Set working directory (Azure Functions standard)
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

# Download TextBlob corpora (needed for sentiment analysis)
RUN python -m textblob.download_corpora

# Copy all function code
COPY . .

# Azure Functions specific environment variables
ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

# Expose port 80 (Azure Functions default)
EXPOSE 80

# Health check (optional but good practice)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"

# Start Azure Functions runtime
CMD ["python", "-m", "azure.functions.worker"]
