#!/bin/bash
set -e
RG_NAME="MyStaticSiteRG"

# 1. FIND THE APP
echo "--------------------------------------------------"
echo "1. Locating App..."
FUNC_APP_NAME=$(az functionapp list -g $RG_NAME --query "[?contains(name, 'sean-counter-node')].name | [0]" -o tsv)

if [ -z "$FUNC_APP_NAME" ]; then
    echo "ERROR: App not found."
    exit 1
fi
echo "Targeting: $FUNC_APP_NAME"

# 2. REMOVE DATABASE CONNECTIONS (No more 500 Errors)
echo "--------------------------------------------------"
echo "2. Writing In-Memory Code..."
rm -rf LoveFunction
mkdir -p LoveFunction/updatecount

# A. Function.json (Trigger Only - No Database)
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

# B. Index.js (The Magic Global Variable)
# In Azure Functions, variables outside the function persist 
# as long as the server is awake.
cat <<EOF > LoveFunction/updatecount/index.js
// This variable lives in the server's RAM
let globalCount = 0;

module.exports = async function (context, req) {
    // Increment the count
    globalCount = globalCount + 1;

    context.res = {
        body: { count: globalCount },
        headers: { "Content-Type": "application/json" }
    };
}
EOF

# C. Host/Package (Standard)
echo '{"version": "2.0","extensionBundle": {"id": "Microsoft.Azure.Functions.ExtensionBundle","version": "[4.*, 5.0.0)"}}' > LoveFunction/host.json
cat <<EOF > LoveFunction/package.json
{ "name": "love-counter", "version": "1.0.0", "dependencies": {} }
EOF

# 3. DEPLOY
echo "--------------------------------------------------"
echo "3. Deploying..."
# Ensure Build is OFF
az functionapp config appsettings set --name $FUNC_APP_NAME -g $RG_NAME --settings "SCM_DO_BUILD_DURING_DEPLOYMENT=false" "ENABLE_ORYX_BUILD=false" >/dev/null

cd LoveFunction
rm -f function.zip
python3 -c "import shutil; shutil.make_archive('function', 'zip', '.')"
cd ..

az functionapp deployment source config-zip -g $RG_NAME -n $FUNC_APP_NAME --src LoveFunction/function.zip

echo "--------------------------------------------------"
echo "DONE! The database is disconnected."
echo "Refresh your website."
echo "1. Click -> Should say '1'"
echo "2. Click -> Should say '2'"
echo "--------------------------------------------------"