#!/bin/bash
set -e
# --- VARIABLES ---
location="eastus"
rgName="lab-vscode-rg"
# Using $RANDOM to ensure unique name
storageName="localstore$RANDOM"

echo "--- Starting Lab ---"
echo "Creating Resource Group: $rgName..."

# 1. Create Resource Group
az group create --name $rgName --location $location

echo "Creating Storage Account: $storageName (this may take a minute)..."

# 2. Create Storage Account
az storage account create \
  --name $storageName \
  --resource-group $rgName \
  --location $location \
  --sku Standard_LRS \
  --kind StorageV2

# 3. Create Container
echo "Creating Container..."
az storage container create \
  --account-name $storageName \
  --name "local-uploads" \
  --auth-mode login

# 4. Create a local dummy file
echo "Shin Chan is the best" > local_hello.txt

# 5. Upload the file
echo "Uploading file..."
az storage blob upload \
  --account-name $storageName \
  --container-name "local-uploads" \
  --name "uploaded_from_vscode.txt" \
  --file "local_hello.txt" \
  --auth-mode key

echo "--- Success! File uploaded. ---"