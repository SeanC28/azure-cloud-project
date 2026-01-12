#!/bin/bash
set -e
RG_NAME="MyStaticSiteRG"

# 1. FIND THE ROBOT
echo "--------------------------------------------------"
echo "1. Locating App..."
FUNC_APP_NAME=$(az functionapp list -g $RG_NAME --query "[?contains(name, 'sean-counter-node')].name | [0]" -o tsv)

if [ -z "$FUNC_APP_NAME" ]; then
    echo "ERROR: App not found. Please run 'Node_No_Zip.sh' first."
    exit 1
fi
echo "Targeting: $FUNC_APP_NAME"

# 2. REBUILD FROM SCRATCH
echo "--------------------------------------------------"
echo "2. Recreating ALL Files..."
# Delete everything to be safe
rm -rf LoveFunction
mkdir -p LoveFunction/updatecount

# A. The Code (Index.js) with the MATH FIX
cat <<EOF > LoveFunction/updatecount/index.js
const { TableClient } = require("@azure/data-tables");

module.exports = async function (context, req) {
    const connStr = process.env.AzureWebJobsStorage;
    const client = TableClient.fromConnectionString(connStr, "LoveCounter");
    const partitionKey = "Counter";
    const rowKey = "Main";

    let count = 0;
    try {
        const entity = await client.getEntity(partitionKey, rowKey);
        // Force conversion to Number
        let currentVal = parseInt(entity.Count, 10);
        if (isNaN(currentVal)) currentVal = 0;
        count = currentVal + 1;
    } catch (error) {
        count = 1;
    }

    // Save as Number
    await client.upsertEntity({ partitionKey, rowKey, Count: count }, "Replace");

    context.res = {
        body: { count: count },
        headers: { "Content-Type": "application/json" }
    };
}
EOF

# B. The Instructions (Package.json) - CRITICAL FOR 500 ERROR
cat <<EOF > LoveFunction/package.json
{
  "name": "love-counter",
  "version": "1.0.0",
  "dependencies": {
    "@azure/data-tables": "^13.2.2"
  }
}
EOF

# C. The Config (Function.json)
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
    }
  ]
}
EOF

# D. The Host Config
echo '{"version": "2.0","extensionBundle": {"id": "Microsoft.Azure.Functions.ExtensionBundle","version": "[4.*, 5.0.0)"}}' > LoveFunction/host.json

echo "--------------------------------------------------"
echo "3. PACKAGING & DEPLOYING..."
# Force Azure to install the dependencies from package.json
az functionapp config appsettings set --name $FUNC_APP_NAME -g $RG_NAME --settings "SCM_DO_BUILD_DURING_DEPLOYMENT=true" "ENABLE_ORYX_BUILD=true" >/dev/null

cd LoveFunction
rm -f function.zip
# Zip carefully using Python
python3 -c "import shutil; shutil.make_archive('function', 'zip', '.')"
cd ..

az functionapp deployment source config-zip -g $RG_NAME -n $FUNC_APP_NAME --src LoveFunction/function.zip

echo "--------------------------------------------------"
echo "DONE! Dependencies restored."
echo "Wait 30 seconds, then try the button."
echo "--------------------------------------------------"