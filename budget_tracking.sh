# Set environment variables for Azure resources
export RESOURCE_GROUP="Sean-Cost-tracking-${RANDOM_SUFFIX}"
export LOCATION="eastus"
export SUBSCRIPTION_ID=$(az account show --query id --output tsv)

# Generate unique suffix for resource names
RANDOM_SUFFIX=$(openssl rand -hex 3)

# Set budget configuration variables
export BUDGET_NAME="monthly-cost-budget-${RANDOM_SUFFIX}"
export BUDGET_AMOUNT="100"
export EMAIL_ADDRESS="seanconnel23@yahoo.com"
export ACTION_GROUP_NAME="cost-alert-group-${RANDOM_SUFFIX}"

# Create resource group for monitoring resources
az group create \
    --name ${RESOURCE_GROUP} \
    --location ${LOCATION} \
    --tags purpose=cost-monitoring environment=demo

echo "✅ Resource group created: ${RESOURCE_GROUP}"
echo "📧 Configure your email: ${EMAIL_ADDRESS}"

# Create action group with email notification
az monitor action-group create \
    --name ${ACTION_GROUP_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --short-name "CostAlert" \
    --action email "budget-admin" ${EMAIL_ADDRESS}

# Get action group resource ID for budget configuration
ACTION_GROUP_ID=$(az monitor action-group show \
    --name ${ACTION_GROUP_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --query id --output tsv)

echo "✅ Action group created with email notifications enabled"
echo "📧 Email alerts will be sent to: ${EMAIL_ADDRESS}"

# Create JSON configuration for budget alerts
cat > budget-alerts.json << EOF
[
  {
    "enabled": true,
    "operator": "GreaterThan",
    "threshold": 50,
    "contactEmails": ["${EMAIL_ADDRESS}"],
    "contactRoles": [],
    "contactGroups": ["${ACTION_GROUP_ID}"],
    "thresholdType": "Actual"
  },
  {
    "enabled": true,
    "operator": "GreaterThan", 
    "threshold": 80,
    "contactEmails": ["${EMAIL_ADDRESS}"],
    "contactRoles": [],
    "contactGroups": ["${ACTION_GROUP_ID}"],
    "thresholdType": "Actual"
  },
  {
    "enabled": true,
    "operator": "GreaterThan",
    "threshold": 100,
    "contactEmails": ["${EMAIL_ADDRESS}"],
    "contactRoles": [],
    "contactGroups": ["${ACTION_GROUP_ID}"],
    "thresholdType": "Forecasted"
  }
]
EOF

echo "✅ Budget alert thresholds configured: 50%, 80%, 100%"

START_DATE="$(date +%Y-%m-01)"
# Calculate next year using bash arithmetic
NEXT_YEAR=$(($(date +%Y) + 1))
CURRENT_MONTH=$(date +%m)
END_DATE="${NEXT_YEAR}-${CURRENT_MONTH}-01"

echo "📅 Budget Start: ${START_DATE}"
echo "📅 Budget End:   ${END_DATE}"

# Create monthly budget using REST API with latest version
BUDGET_JSON=$(cat << EOF
{
  "properties": {
    "category": "Cost",
    "amount": ${BUDGET_AMOUNT},
    "timeGrain": "Monthly",
    "timePeriod": {
     "startDate": "${START_DATE}",
      "endDate": "${END_DATE}"
    },
    "notifications": $(cat budget-alerts.json)
  }
}
EOF
)

# Create budget using Azure REST API with latest version
az rest \
    --method PUT \
    --url "https://management.azure.com/subscriptions/${SUBSCRIPTION_ID}/providers/Microsoft.Consumption/budgets/${BUDGET_NAME}?api-version=2023-11-01" \
    --body "${BUDGET_JSON}"

echo "✅ Monthly budget created: \$${BUDGET_AMOUNT}"
echo "📊 Budget scope: Subscription ${SUBSCRIPTION_ID}"

# Create filtered budget for specific resource types (optional)
FILTERED_BUDGET_JSON=$(cat << EOF
{
  "properties": {
    "category": "Cost",
    "amount": ${BUDGET_AMOUNT},
    "timeGrain": "Monthly",
    "timePeriod": {
      "startDate": "${START_DATE}",
      "endDate": "${END_DATE}"
    },
    "filter": {
      "dimensions": {
        "name": "ResourceGroupName",
        "operator": "In",
        "values": ["${RESOURCE_GROUP}"]
      }
    },
    "notifications": $(cat budget-alerts.json)
  }
}
EOF
)

# Update budget with resource group filter
FILTERED_BUDGET_NAME="rg-budget-${RANDOM_SUFFIX}"
az rest \
    --method PUT \
    --url "https://management.azure.com/subscriptions/${SUBSCRIPTION_ID}/providers/Microsoft.Consumption/budgets/${FILTERED_BUDGET_NAME}?api-version=2023-11-01" \
    --body "${FILTERED_BUDGET_JSON}"

echo "✅ Resource group budget created with filters"
echo "🎯 Monitoring costs for resource group: ${RESOURCE_GROUP}"

# Verify budget creation and get status
az rest \
    --method GET \
    --url "https://management.azure.com/subscriptions/${SUBSCRIPTION_ID}/providers/Microsoft.Consumption/budgets/${BUDGET_NAME}?api-version=2023-11-01" \
    --query "properties.{Amount:amount,TimeGrain:timeGrain,Category:category}" \
    --output table

# List all budgets for verification
az rest \
    --method GET \
    --url "https://management.azure.com/subscriptions/${SUBSCRIPTION_ID}/providers/Microsoft.Consumption/budgets?api-version=2023-11-01" \
    --query "value[].{Name:name,Amount:properties.amount,Status:properties.currentSpend}" \
    --output table

echo "✅ Budget monitoring active"
echo "🌐 View in Azure portal: https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/overview"

# Test action group notification delivery using updated command
az monitor action-group test-notifications create \
    --action-group-name ${ACTION_GROUP_NAME} \
    --resource-group ${RESOURCE_GROUP} \
    --alert-type "servicehealth"

echo "📧 Test email sent to verify notification delivery"