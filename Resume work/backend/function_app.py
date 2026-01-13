import azure.functions as func
import logging
import json

app = func.FunctionApp()

@app.route(route="GetVisitorCount", auth_level=func.AuthLevel.ANONYMOUS)
def GetVisitorCount(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    # Mock data
    response_data = {
        "count": 0,
        "message": "Backend is connected!"
    }

    return func.HttpResponse(
        json.dumps(response_data),
        mimetype="application/json",
        status_code=200
    )