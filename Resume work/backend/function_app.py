import azure.functions as func
import logging
import json
import os
from azure.cosmos import CosmosClient

app = func.FunctionApp()

@app.route(route="GetVisitorCount", auth_level=func.AuthLevel.ANONYMOUS)
def GetVisitorCount(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    # 1. Get Connection String from Environment Variables
    connection_string = os.environ.get("AzureCosmosDBConnectionString")
    if not connection_string:
        return func.HttpResponse("Database connection string missing", status_code=500)

    try:
        # 2. Connect to Database
        client = CosmosClient.from_connection_string(connection_string)
        database = client.get_database_client("ProjectDB")
        container = database.get_container_client("Counter")

        # 3. Read the Item (ID "1")
        item = container.read_item("1", partition_key="1")
        
        # 4. Increment Count
        item['count'] = item['count'] + 1
        
        # 5. Save Back to DB
        container.upsert_item(item)

        # 6. Return New Count to Frontend
        return func.HttpResponse(
            json.dumps({"count": item['count']}),
            mimetype="application/json",
            status_code=200
        )

    except Exception as e:
        logging.error(str(e))
        return func.HttpResponse(f"Error accessing database: {str(e)}", status_code=500)