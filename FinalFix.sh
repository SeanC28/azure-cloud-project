#!/bin/bash
set -e
RG_NAME="MyStaticSiteRG"

# 1. FIND THE APP
# We find the Node app you just tested
FUNC_APP_NAME=$(az functionapp list -g $RG_NAME --query "[?contains(name, 'sean-counter-node')].name | [0]" -o tsv)

if [ -z "$FUNC_APP_NAME" ]; then
    echo "ERROR: App not found."
    exit 1
fi
echo "Targeting: $FUNC_APP_NAME"

# 2. RESTORE COUNTER LOGIC (NO LIBRARIES)
echo "--------------------------------------------------"
echo "2. Injecting Native Binding Code..."
rm -rf LoveFunction
mkdir -p LoveFunction/updatecount

# A. Function.json (The "Magical Wiring")
# This tells Azure to fetch the DB data for us, so we don't need a library to do it.
cat <<EOF > LoveFunction/updatecount/function.json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get", "post"]
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    },
    {
      "name": "inputTable",
      "type": "table",
      "tableName": "LoveCounter",
      "partitionKey": "Counter",
      "rowKey": "Main",
      "connection": "AzureWebJobsStorage",
      "direction": "in"
    },
    {
      "name": "outputTable",
      "type": "table",
      "tableName": "LoveCounter",
      "connection": "AzureWebJobsStorage",
      "direction": "out"
    }
  ]
}
EOF

# B. Index.js (The Logic)
# Pure JavaScript. No 'require'. No 'npm'.
cat <<EOF > LoveFunction/updatecount/index.js
module.exports = async function (context, req) {
    // 1. Get current count from the Binding
    const currentEntity = context.bindings.inputTable;

    let count = 1;
    if (currentEntity && currentEntity.Count) {
        // Force it to be a number to fix the "11" bug
        count = parseInt(currentEntity.Count) + 1;
    }

    // 2. Save new count via Binding
    context.bindings.outputTable = {
        PartitionKey: "Counter",
        RowKey: "Main",
        Count: count
    };

    // 3. Reply to website
    context.res = {
        body: { count: count },
        headers: { "Content-Type": "application/json" }
    };
}
EOF

# C. Host Config
echo '{"version": "2.0","extensionBundle": {"id": "Microsoft.Azure.Functions.ExtensionBundle","version": "[4.*, 5.0.0)"}}' > LoveFunction/host.json

# D. Package.json (EMPTY - To prevent build errors)
cat <<EOF > LoveFunction/package.json
{
  "name": "love-counter",
  "version": "1.0.0",
  "dependencies": {}
}
EOF

echo "--------------------------------------------------"
echo "3. DEPLOYING..."
# Ensure Build is OFF (The setting that made your test work)
az functionapp config appsettings set --name $FUNC_APP_NAME -g $RG_NAME --settings "SCM_DO_BUILD_DURING_DEPLOYMENT=false" "ENABLE_ORYX_BUILD=false" >/dev/null

cd LoveFunction
rm -f function.zip
python3 -c "import shutil; shutil.make_archive('function', 'zip', '.')"
cd ..

az functionapp deployment source config-zip -g $RG_NAME -n $FUNC_APP_NAME --src LoveFunction/function.zip

echo "--------------------------------------------------"
echo "4. VERIFYING..."
BACKEND_URL="https://$FUNC_APP_NAME.azurewebsites.net/api/updatecount"
echo "Testing: $BACKEND_URL"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL)
if [ "$STATUS" == "200" ]; then
    echo "SUCCESS! The Counter is Restored."
else
    echo "Status: $STATUS. Wait 10s and try the website."
fi