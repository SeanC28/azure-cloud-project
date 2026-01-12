#!/bin/bash
set -e

# --- 1. SET YOUR STATIC NAME HERE ---
# This is the "Permanent Identity" of your robot.
FUNC_APP_NAME="sean-counter-static-2025" 
RG_NAME="MyStaticSiteRG"
LOCATION="centralus" 

echo "--------------------------------------------------"
echo "Deploying to Static App: $FUNC_APP_NAME"
echo "--------------------------------------------------"

# 2. Get Storage Name (Auto-detect)
STORAGE_NAME=$(az storage account list -g $RG_NAME --query "[0].name" -o tsv)

# 3. Create or Update the App
# Since the name is static, running this again just ensures it exists.
az functionapp create \
  --resource-group $RG_NAME \
  --consumption-plan-location $LOCATION \
  --runtime python \
  --runtime-version 3.11 \
  --functions-version 4 \
  --name $FUNC_APP_NAME \
  --storage-account $STORAGE_NAME \
  --os-type Linux

# 4. Prepare Code
rm -rf LoveFunction
mkdir -p LoveFunction/UpdateCount

# Write Python Code
cat <<EOF > LoveFunction/UpdateCount/__init__.py
import logging
import json
import os
from azure.functions import HttpRequest, HttpResponse
from azure.data.tables import TableClient

def main(req: HttpRequest) -> HttpResponse:
    try:
        conn_str = os.environ['AzureWebJobsStorage']
        table_client = TableClient.from_connection_string(conn_str, "LoveCounter")
        try:
            entity = table_client.get_entity(partition_key="Counter", row_key="Main")
            new_count = entity["Count"] + 1
        except:
            new_count = 1
            entity = {"PartitionKey": "Counter", "RowKey": "Main", "Count": 1}

        entity["Count"] = new_count
        table_client.upsert_entity(entity=entity)
        
        return HttpResponse(json.dumps({"count": new_count}), mimetype="application/json")
    except Exception as e:
        return HttpResponse(f"Error: {str(e)}", status_code=500)
EOF

# Write Configs
echo "azure-functions" > LoveFunction/requirements.txt
echo "azure-data-tables" >> LoveFunction/requirements.txt
echo '{"version": "2.0","logging": {"applicationInsights": {"samplingSettings": {"isEnabled": true,"excludedTypes": "Request"}}},"extensionBundle": {"id": "Microsoft.Azure.Functions.ExtensionBundle","version": "[4.*, 5.0.0)"}}' > LoveFunction/host.json
echo '{"scriptFile": "__init__.py","bindings": [{"authLevel": "anonymous","type": "httpTrigger","direction": "in","name": "req","methods": ["get", "post"]},{"type": "http","direction": "out","name": "$return"}]}' > LoveFunction/UpdateCount/function.json

# 5. Deploy
cd LoveFunction
python3 -c "import shutil; shutil.make_archive('function', 'zip', '.')"
cd ..

az functionapp deployment source config-zip \
  --resource-group $RG_NAME \
  --name $FUNC_APP_NAME \
  --src LoveFunction/function.zip

az functionapp cors add --resource-group $RG_NAME --name $FUNC_APP_NAME --allowed-origins "*"

echo "--------------------------------------------------"
echo "SUCCESS! Your PERMANENT Backend URL is:"
echo "https://$FUNC_APP_NAME.azurewebsites.net/api/UpdateCount"
echo "--------------------------------------------------"