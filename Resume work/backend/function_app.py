import azure.functions as func
import logging
import json
import os
from azure.cosmos import CosmosClient
from datetime import datetime, timedelta
import requests

app = func.FunctionApp()

# ========== VISITOR COUNTER ==========
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


# ========== GITHUB STATS ==========
@app.route(route="GetGitHubStats", auth_level=func.AuthLevel.ANONYMOUS)
def GetGitHubStats(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('GitHub stats function triggered')
    
    # Get GitHub username from environment variable or query parameter
    github_username = os.environ.get('GITHUB_USERNAME', 'SeanC28')
    username = req.params.get('username', github_username)
    
    try:
        # GitHub API token (optional but recommended for higher rate limits)
        github_token = os.environ.get('GITHUB_TOKEN', '')
        headers = {
            'Accept': 'application/vnd.github.v3+json',
        }
        if github_token:
            headers['Authorization'] = f'token {github_token}'
        
        # Fetch user data
        user_response = requests.get(
            f'https://api.github.com/users/{username}',
            headers=headers,
            timeout=10
        )
        user_response.raise_for_status()
        user_data = user_response.json()
        
        # Fetch repositories
        repos_response = requests.get(
            f'https://api.github.com/users/{username}/repos?per_page=100&sort=updated',
            headers=headers,
            timeout=10
        )
        repos_response.raise_for_status()
        repos_data = repos_response.json()
        
        # Calculate statistics
        total_stars = sum(repo['stargazers_count'] for repo in repos_data)
        total_forks = sum(repo['forks_count'] for repo in repos_data)
        
        # Get languages
        languages = {}
        for repo in repos_data:
            if repo['language']:
                languages[repo['language']] = languages.get(repo['language'], 0) + 1
        
        # Sort languages by count
        top_languages = sorted(languages.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Get recent activity (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_repos = [
            {
                'name': repo['name'],
                'description': repo['description'],
                'language': repo['language'],
                'stars': repo['stargazers_count'],
                'url': repo['html_url'],
                'updated': repo['updated_at']
            }
            for repo in repos_data
            if datetime.strptime(repo['updated_at'], '%Y-%m-%dT%H:%M:%SZ') > thirty_days_ago
        ][:5]
        
        # Compile stats
        stats = {
            'username': username,
            'name': user_data.get('name', ''),
            'bio': user_data.get('bio', ''),
            'avatar_url': user_data.get('avatar_url', ''),
            'profile_url': user_data.get('html_url', ''),
            'public_repos': user_data.get('public_repos', 0),
            'followers': user_data.get('followers', 0),
            'following': user_data.get('following', 0),
            'total_stars': total_stars,
            'total_forks': total_forks,
            'top_languages': [{'language': lang, 'count': count} for lang, count in top_languages],
            'recent_activity': recent_repos,
            'last_updated': datetime.now().isoformat()
        }
        
        return func.HttpResponse(
            body=json.dumps(stats, indent=2),
            status_code=200,
            headers={
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Cache-Control': 'public, max-age=300'
            }
        )
        
    except requests.exceptions.RequestException as e:
        logging.error(f'GitHub API error: {str(e)}')
        return func.HttpResponse(
            body=json.dumps({'error': 'Failed to fetch GitHub data', 'details': str(e)}),
            status_code=500,
            headers={'Content-Type': 'application/json'}
        )
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')
        return func.HttpResponse(
            body=json.dumps({'error': 'Internal server error', 'details': str(e)}),
            status_code=500,
            headers={'Content-Type': 'application/json'}
        )


# ========== RESUME DOWNLOAD TRACKER ==========
@app.route(route="TrackResumeDownload", auth_level=func.AuthLevel.ANONYMOUS, methods=["POST"])
def TrackResumeDownload(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Resume download tracker triggered')
    
    # Get Connection String from Environment Variables
    connection_string = os.environ.get("AzureCosmosDBConnectionString")
    if not connection_string:
        return func.HttpResponse(
            json.dumps({"error": "Database connection string missing"}),
            status_code=500,
            headers={'Content-Type': 'application/json'}
        )
    
    try:
        # Connect to Database (container already exists)
        client = CosmosClient.from_connection_string(connection_string)
        database = client.get_database_client("ProjectDB")
        container = database.get_container_client("ResumeDownloads")
        
        # Get current timestamp
        timestamp = datetime.now().isoformat()
        
        # Create download record
        download_record = {
            "id": str(datetime.now().timestamp()).replace(".", ""),
            "timestamp": timestamp,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "type": "resume_download"
        }
        
        # Store the download
        container.create_item(download_record)
        
        # Get total download count
        query = "SELECT VALUE COUNT(1) FROM c WHERE c.type = 'resume_download'"
        items = list(container.query_items(query=query, enable_cross_partition_query=True))
        total_downloads = items[0] if items else 0
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "total_downloads": total_downloads,
                "timestamp": timestamp
            }),
            status_code=200,
            headers={
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST'
            }
        )
        
    except Exception as e:
        logging.error(f'Error tracking download: {str(e)}')
        return func.HttpResponse(
            json.dumps({"error": "Failed to track download", "details": str(e)}),
            status_code=500,
            headers={'Content-Type': 'application/json'}
        )


# ========== RESUME STATS ==========
@app.route(route="GetResumeStats", auth_level=func.AuthLevel.ANONYMOUS)
def GetResumeStats(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Resume stats request triggered')
    
    # Get Connection String from Environment Variables
    connection_string = os.environ.get("AzureCosmosDBConnectionString")
    if not connection_string:
        return func.HttpResponse(
            json.dumps({"error": "Database connection string missing"}),
            status_code=500,
            headers={'Content-Type': 'application/json'}
        )
    
    try:
        # Connect to Database
        client = CosmosClient.from_connection_string(connection_string)
        database = client.get_database_client("ProjectDB")
        container = database.get_container_client("ResumeDownloads")
        
        # Get total downloads
        total_query = "SELECT VALUE COUNT(1) FROM c WHERE c.type = 'resume_download'"
        total_items = list(container.query_items(query=total_query, enable_cross_partition_query=True))
        total_downloads = total_items[0] if total_items else 0
        
        # Get downloads in last 7 days
        seven_days_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        week_query = f"SELECT VALUE COUNT(1) FROM c WHERE c.type = 'resume_download' AND c.date >= '{seven_days_ago}'"
        week_items = list(container.query_items(query=week_query, enable_cross_partition_query=True))
        downloads_this_week = week_items[0] if week_items else 0
        
        # Get downloads today
        today = datetime.now().strftime("%Y-%m-%d")
        today_query = f"SELECT VALUE COUNT(1) FROM c WHERE c.type = 'resume_download' AND c.date = '{today}'"
        today_items = list(container.query_items(query=today_query, enable_cross_partition_query=True))
        downloads_today = today_items[0] if today_items else 0
        
        # Get daily breakdown for last 7 days (manually count by date)
        all_downloads_query = f"SELECT c.date FROM c WHERE c.type = 'resume_download' AND c.date >= '{seven_days_ago}'"
        all_downloads = list(container.query_items(query=all_downloads_query, enable_cross_partition_query=True))
        
        # Count downloads per date
        daily_counts = {}
        for item in all_downloads:
            date = item.get('date')
            if date:
                daily_counts[date] = daily_counts.get(date, 0) + 1
        
        # Format as list of objects
        daily_items = [{"date": date, "count": count} for date, count in sorted(daily_counts.items())]
        
        return func.HttpResponse(
            json.dumps({
                "total_downloads": total_downloads,
                "downloads_today": downloads_today,
                "downloads_this_week": downloads_this_week,
                "daily_breakdown": daily_items,
                "last_updated": datetime.now().isoformat()
            }),
            status_code=200,
            headers={
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET'
            }
        )
        
    except Exception as e:
        logging.error(f'Error getting resume stats: {str(e)}')
        return func.HttpResponse(
            json.dumps({
                "total_downloads": 0,
                "downloads_today": 0,
                "downloads_this_week": 0,
                "daily_breakdown": [],
                "error": str(e)
            }),
            status_code=200,
            headers={'Content-Type': 'application/json'}
        )
    
# ========== Contact Form ==========

@app.route(route="SubmitContactForm", auth_level=func.AuthLevel.ANONYMOUS, methods=["POST"])
def SubmitContactForm(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Contact form submission received')
    
    # Get Connection String and Resend API Key from Environment Variables
    connection_string = os.environ.get("AzureCosmosDBConnectionString")
    resend_api_key = os.environ.get("RESEND_API_KEY")
    recipient_email = os.environ.get("CONTACT_EMAIL", "seanconnell23@yahoo.com")
    
    if not connection_string:
        return func.HttpResponse(
            json.dumps({"error": "Database connection string missing"}),
            status_code=500,
            headers={'Content-Type': 'application/json'}
        )
    
    if not resend_api_key:
        logging.warning('Resend API key missing - email notification will be skipped')
    
    try:
        # Parse form data
        req_body = req.get_json()
        name = req_body.get('name', '').strip()
        email = req_body.get('email', '').strip()
        subject = req_body.get('subject', '').strip()
        message = req_body.get('message', '').strip()
        
        # Validate required fields
        if not all([name, email, subject, message]):
            return func.HttpResponse(
                json.dumps({"error": "All fields are required"}),
                status_code=400,
                headers={'Content-Type': 'application/json'}
            )
        
        # Basic email validation
        if '@' not in email or '.' not in email:
            return func.HttpResponse(
                json.dumps({"error": "Invalid email address"}),
                status_code=400,
                headers={'Content-Type': 'application/json'}
            )
        
        # Connect to Database
        client = CosmosClient.from_connection_string(connection_string)
        database = client.get_database_client("ProjectDB")
        
        # Create ContactMessages container if it doesn't exist
        try:
            container = database.get_container_client("ContactMessages")
            # Test if container exists
            list(container.query_items(query="SELECT TOP 1 * FROM c", enable_cross_partition_query=True))
        except:
            # Container doesn't exist, create it (without throughput for serverless)
            logging.info("Creating ContactMessages container")
            container = database.create_container(
                id="ContactMessages",
                partition_key={"paths": ["/id"], "kind": "Hash"}
                # No offer_throughput for serverless accounts
            )
        
        # Create message record
        timestamp = datetime.now().isoformat()
        message_record = {
            "id": str(datetime.now().timestamp()).replace(".", ""),
            "name": name,
            "email": email,
            "subject": subject,
            "message": message,
            "timestamp": timestamp,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "status": "new",
            "type": "contact_message"
        }
        
        # Store in database
        container.create_item(message_record)
        logging.info(f"Message stored in database from {email}")
        
        # Send email notification via Resend
        email_sent = False
        if resend_api_key:
            try:
                import requests
                
                resend_url = "https://api.resend.com/emails"
                headers = {
                    "Authorization": f"Bearer {resend_api_key}",
                    "Content-Type": "application/json"
                }
                
                email_data = {
                    "from": "Portfolio Contact <onboarding@resend.dev>",
                    "to": [recipient_email],
                    "subject": f"New Contact Form: {subject}",
                    "html": f"""
                    <h2>New Contact Form Submission</h2>
                    <p><strong>From:</strong> {name}</p>
                    <p><strong>Email:</strong> {email}</p>
                    <p><strong>Subject:</strong> {subject}</p>
                    <p><strong>Message:</strong></p>
                    <p>{message.replace(chr(10), '<br>')}</p>
                    <hr>
                    <p><small>Received: {timestamp}</small></p>
                    <p><small>Reply to: {email}</small></p>
                    """
                }
                
                response = requests.post(resend_url, headers=headers, json=email_data, timeout=10)
                
                if response.status_code in [200, 201]:
                    email_sent = True
                    logging.info(f"Email notification sent successfully to {recipient_email}")
                else:
                    logging.error(f"Resend API error: {response.status_code} - {response.text}")
                    
            except Exception as email_error:
                logging.error(f"Error sending email: {str(email_error)}")
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "message": "Thank you for your message! I'll get back to you soon.",
                "email_sent": email_sent
            }),
            status_code=200,
            headers={
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        )
        
    except Exception as e:
        logging.error(f'Error processing contact form: {str(e)}')
        return func.HttpResponse(
            json.dumps({
                "error": "Failed to send message. Please try again later.",
                "details": str(e)
            }),
            status_code=500,
            headers={'Content-Type': 'application/json'}
        )