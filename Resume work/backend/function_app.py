import azure.functions as func
import logging
import json
import os
from azure.cosmos import CosmosClient
from datetime import datetime, timedelta
import requests
import uuid
from sentiment_analyzer import SentimentAnalyzer

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# ============================================================================
# EXISTING FUNCTIONS (Unchanged)
# ============================================================================

@app.route(route="GetVisitorCount", auth_level=func.AuthLevel.ANONYMOUS, methods=["GET", "POST"])
def GetVisitorCount(req: func.HttpRequest) -> func.HttpResponse:
    """Get and increment visitor counter"""
    logging.info('GetVisitorCount function triggered')
    
    try:
        connection_string = os.environ.get("AzureCosmosDBConnectionString")
        client = CosmosClient.from_connection_string(connection_string)
        database = client.get_database_client("ProjectDB")
        container = database.get_container_client("Counter")
        
        counter_id = "visitor-counter"
        
        try:
            item = container.read_item(item=counter_id, partition_key=counter_id)
            current_count = item.get('count', 0)
            new_count = current_count + 1
            item['count'] = new_count
            container.replace_item(item=counter_id, body=item)
        except:
            new_count = 1
            container.create_item(body={'id': counter_id, 'count': new_count})
        
        return func.HttpResponse(
            json.dumps({"count": new_count}),
            status_code=200,
            headers={
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST'
            }
        )
    except Exception as e:
        logging.error(f'Error in GetVisitorCount: {str(e)}')
        return func.HttpResponse(
            json.dumps({"error": "Failed to get visitor count", "details": str(e)}),
            status_code=500,
            headers={'Content-Type': 'application/json'}
        )


@app.route(route="GetGitHubStats", auth_level=func.AuthLevel.ANONYMOUS, methods=["GET"])
def GetGitHubStats(req: func.HttpRequest) -> func.HttpResponse:
    """Get GitHub profile statistics with weighted language analysis"""
    logging.info('GetGitHubStats function triggered')
    
    try:
        username = os.environ.get("GITHUB_USERNAME", "SeanC28")
        github_token = os.environ.get("GITHUB_TOKEN")
        
        headers = {}
        if github_token:
            headers['Authorization'] = f'token {github_token}'
        
        # Get user profile
        user_url = f"https://api.github.com/users/{username}"
        user_response = requests.get(user_url, headers=headers)
        user_data = user_response.json()
        
        # Get repositories
        repos_url = f"https://api.github.com/users/{username}/repos?per_page=100"
        repos_response = requests.get(repos_url, headers=headers)
        repos_data = repos_response.json()
        
        # Calculate weighted language statistics
        language_bytes = {}
        for repo in repos_data:
            if not repo.get('fork', False):
                lang_url = f"https://api.github.com/repos/{username}/{repo['name']}/languages"
                try:
                    lang_response = requests.get(lang_url, headers=headers)
                    repo_languages = lang_response.json()
                    for lang, bytes_count in repo_languages.items():
                        language_bytes[lang] = language_bytes.get(lang, 0) + bytes_count
                except:
                    continue
        
        # Calculate percentages
        total_bytes = sum(language_bytes.values())
        language_stats = []
        if total_bytes > 0:
            language_stats = [
                {
                    'language': lang,
                    'bytes': bytes_count,
                    'percentage': round((bytes_count / total_bytes) * 100, 2)
                }
                for lang, bytes_count in language_bytes.items()
            ]
            language_stats.sort(key=lambda x: x['percentage'], reverse=True)
        
        # Get recent activity
        events_url = f"https://api.github.com/users/{username}/events/public?per_page=5"
        events_response = requests.get(events_url, headers=headers)
        events_data = events_response.json()
        
        recent_activity = []
        for event in events_data[:5]:
            activity = {
                'type': event.get('type', 'Unknown'),
                'repo': event.get('repo', {}).get('name', 'Unknown'),
                'created_at': event.get('created_at', '')
            }
            recent_activity.append(activity)
        
        stats = {
            'username': username,
            'public_repos': user_data.get('public_repos', 0),
            'followers': user_data.get('followers', 0),
            'following': user_data.get('following', 0),
            'languages': language_stats,
            'recent_activity': recent_activity
        }
        
        return func.HttpResponse(
            json.dumps(stats),
            status_code=200,
            headers={
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        )
    except Exception as e:
        logging.error(f'Error in GetGitHubStats: {str(e)}')
        return func.HttpResponse(
            json.dumps({"error": "Failed to fetch GitHub stats", "details": str(e)}),
            status_code=500,
            headers={'Content-Type': 'application/json'}
        )


@app.route(route="TrackResumeDownload", auth_level=func.AuthLevel.ANONYMOUS, methods=["POST"])
def TrackResumeDownload(req: func.HttpRequest) -> func.HttpResponse:
    """Track resume download events"""
    logging.info('TrackResumeDownload function triggered')
    
    try:
        connection_string = os.environ.get("AzureCosmosDBConnectionString")
        client = CosmosClient.from_connection_string(connection_string)
        database = client.get_database_client("ProjectDB")
        container = database.get_container_client("ResumeDownloads")
        
        download_id = str(uuid.uuid4())
        download_data = {
            'id': download_id,
            'timestamp': datetime.utcnow().isoformat(),
            'user_agent': req.headers.get('User-Agent', 'Unknown')
        }
        
        container.create_item(body=download_data)
        
        return func.HttpResponse(
            json.dumps({"success": True, "download_id": download_id}),
            status_code=200,
            headers={
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        )
    except Exception as e:
        logging.error(f'Error in TrackResumeDownload: {str(e)}')
        return func.HttpResponse(
            json.dumps({"error": "Failed to track download", "details": str(e)}),
            status_code=500,
            headers={'Content-Type': 'application/json'}
        )


@app.route(route="GetResumeStats", auth_level=func.AuthLevel.ANONYMOUS, methods=["GET"])
def GetResumeStats(req: func.HttpRequest) -> func.HttpResponse:
    """Get resume download statistics"""
    logging.info('GetResumeStats function triggered')
    
    try:
        connection_string = os.environ.get("AzureCosmosDBConnectionString")
        client = CosmosClient.from_connection_string(connection_string)
        database = client.get_database_client("ProjectDB")
        container = database.get_container_client("ResumeDownloads")
        
        query = "SELECT * FROM c ORDER BY c.timestamp DESC"
        downloads = list(container.query_items(query=query, enable_cross_partition_query=True))
        
        total = len(downloads)
        
        now = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = today - timedelta(days=7)
        
        today_count = sum(1 for d in downloads if datetime.fromisoformat(d['timestamp'].replace('Z', '+00:00')) >= today)
        week_count = sum(1 for d in downloads if datetime.fromisoformat(d['timestamp'].replace('Z', '+00:00')) >= week_ago)
        
        stats = {
            'total': total,
            'today': today_count,
            'this_week': week_count,
            'recent_downloads': downloads[:10]
        }
        
        return func.HttpResponse(
            json.dumps(stats),
            status_code=200,
            headers={
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        )
    except Exception as e:
        logging.error(f'Error in GetResumeStats: {str(e)}')
        return func.HttpResponse(
            json.dumps({"error": "Failed to get stats", "details": str(e)}),
            status_code=500,
            headers={'Content-Type': 'application/json'}
        )


# ============================================================================
# UPDATED FUNCTION - Now with Auto-Analysis
# ============================================================================

@app.route(route="SubmitContactForm", auth_level=func.AuthLevel.ANONYMOUS, methods=["POST"])
def SubmitContactForm(req: func.HttpRequest) -> func.HttpResponse:
    """Submit contact form with automatic AI sentiment analysis"""
    logging.info('SubmitContactForm function triggered')
    
    try:
        # Try to get JSON from request body
        try:
            logging.info('Attempting to parse request body as JSON')
            req_body = req.get_json()
            logging.info(f'Successfully parsed JSON: {type(req_body)}')
        except Exception as json_error:
            logging.warning(f'get_json() failed: {str(json_error)}')
            # If get_json() fails, try parsing body as string
            try:
                body_str = req.get_body().decode('utf-8')
                logging.info(f'Raw body string: {body_str}')
                req_body = json.loads(body_str)
                logging.info(f'Successfully parsed body string as JSON: {type(req_body)}')
            except Exception as parse_error:
                logging.error(f'Failed to parse body: {str(parse_error)}')
                return func.HttpResponse(
                    json.dumps({"error": "Invalid JSON in request body"}),
                    status_code=400,
                    headers={'Content-Type': 'application/json'}
                )
        
        logging.info(f'Request body type: {type(req_body)}, content: {req_body}')
        
        name = req_body.get('name')
        email = req_body.get('email')
        subject = req_body.get('subject')
        message = req_body.get('message')
        
        logging.info(f'Extracted fields - name: {name}, email: {email}, subject: {subject}')
        
        # Validation
        if not all([name, email, subject, message]):
            return func.HttpResponse(
                json.dumps({"error": "All fields are required"}),
                status_code=400,
                headers={'Content-Type': 'application/json'}
            )
        
        # Connect to Cosmos DB
        logging.info('Connecting to Cosmos DB')
        connection_string = os.environ.get("AzureCosmosDBConnectionString")
        client = CosmosClient.from_connection_string(connection_string)
        database = client.get_database_client("ProjectDB")
        container = database.get_container_client("ContactMessages")
        logging.info('Successfully connected to Cosmos DB')
        
        message_id = str(uuid.uuid4())
        logging.info(f'Generated message ID: {message_id}')
        
        # Save message to database
        message_data = {
            'id': message_id,
            'name': name,
            'email': email,
            'subject': subject,
            'message': message,
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'new'
        }
        logging.info(f'Creating item in Cosmos DB with data: {message_data}')
        container.create_item(body=message_data)
        logging.info('Successfully created item in Cosmos DB')
        
        # **NEW: Auto-analyze the message with AI**
        logging.info('Starting AI sentiment analysis')
        try:
            analysis = SentimentAnalyzer.analyze(subject=subject, message=message)
            logging.info(f'Analysis complete: {analysis}')
            message_data['analysis'] = analysis
            message_data['analyzed_at'] = datetime.utcnow().isoformat()
            logging.info('Updating item in Cosmos DB with analysis')
            container.replace_item(item=message_id, body=message_data)
            logging.info(f'Message {message_id} auto-analyzed: sentiment={analysis["sentiment"]}, spam={analysis["is_spam"]}, priority={analysis["priority"]}')
        except Exception as analysis_error:
            logging.warning(f'Auto-analysis failed for message {message_id}: {str(analysis_error)}')
            logging.exception('Full analysis error traceback:')
            # Continue even if analysis fails - don't block message submission
        
        # Send email notification via Resend (only if not spam)
        logging.info('Checking spam status for email notification')
        is_spam = message_data.get('analysis', {}).get('is_spam', False)
        logging.info(f'Spam status: {is_spam}')
        
        if not is_spam:
            try:
                resend_api_key = os.environ.get("RESEND_API_KEY")
                contact_email = os.environ.get("CONTACT_EMAIL")
                
                email_data = {
                    "from": "onboarding@resend.dev",
                    "to": [contact_email],
                    "subject": f"New Contact Form Submission: {subject}",
                    "html": f"""
                    <h2>New Contact Form Message</h2>
                    <p><strong>From:</strong> {name} ({email})</p>
                    <p><strong>Subject:</strong> {subject}</p>
                    <p><strong>Message:</strong></p>
                    <p>{message}</p>
                    <hr>
                    <p><strong>AI Analysis:</strong></p>
                    <ul>
                        <li>Sentiment: {analysis.get('sentiment', 'N/A')}</li>
                        <li>Priority: {analysis.get('priority', 'N/A')} (Score: {analysis.get('priority_score', 'N/A')}/10)</li>
                        <li>Spam Score: {analysis.get('spam_score', 'N/A')}</li>
                    </ul>
                    <p><em>Received at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC</em></p>
                    """
                }
                
                email_response = requests.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {resend_api_key}",
                        "Content-Type": "application/json"
                    },
                    json=email_data
                )
                
                if email_response.status_code == 200:
                    logging.info(f'Email notification sent for message {message_id}')
                else:
                    logging.warning(f'Email notification failed: {email_response.text}')
            except Exception as email_error:
                logging.error(f'Error sending email notification: {str(email_error)}')
        else:
            logging.info(f'Email notification skipped for message {message_id} - marked as spam')
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "message": "Message received and analyzed successfully",
                "message_id": message_id
            }),
            status_code=200,
            headers={
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        )
        
    except Exception as e:
        logging.error(f'Error in SubmitContactForm: {str(e)}')
        return func.HttpResponse(
            json.dumps({"error": "Failed to submit form", "details": str(e)}),
            status_code=500,
            headers={'Content-Type': 'application/json'}
        )


# ============================================================================
# NEW AI-POWERED FUNCTIONS
# ============================================================================

@app.route(route="AnalyzeMessage", auth_level=func.AuthLevel.ANONYMOUS, methods=["POST"])
def AnalyzeMessage(req: func.HttpRequest) -> func.HttpResponse:
    """
    Manually analyze a specific contact message for spam, sentiment, and priority
    
    POST Body:
    {
        "message_id": "uuid-of-message"
    }
    
    Returns analysis results and updates the message in Cosmos DB
    """
    logging.info('AnalyzeMessage function triggered')
    
    try:
        # Get message ID from request
        req_body = req.get_json()
        message_id = req_body.get('message_id')
        
        if not message_id:
            return func.HttpResponse(
                json.dumps({"error": "message_id is required"}),
                status_code=400,
                headers={'Content-Type': 'application/json'}
            )
        
        # Connect to Cosmos DB
        connection_string = os.environ.get("AzureCosmosDBConnectionString")
        client = CosmosClient.from_connection_string(connection_string)
        database = client.get_database_client("ProjectDB")
        container = database.get_container_client("ContactMessages")
        
        # Get the message
        try:
            message = container.read_item(item=message_id, partition_key=message_id)
        except Exception as read_error:
            return func.HttpResponse(
                json.dumps({"error": "Message not found", "details": str(read_error)}),
                status_code=404,
                headers={'Content-Type': 'application/json'}
            )
        
        # Analyze the message
        analysis = SentimentAnalyzer.analyze(
            subject=message.get('subject', ''),
            message=message.get('message', '')
        )
        
        # Update message with analysis
        message['analysis'] = analysis
        message['analyzed_at'] = datetime.utcnow().isoformat()
        container.replace_item(item=message_id, body=message)
        
        logging.info(f'Message {message_id} analyzed: sentiment={analysis["sentiment"]}, spam={analysis["is_spam"]}, priority={analysis["priority"]}')
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "message_id": message_id,
                "analysis": analysis
            }),
            status_code=200,
            headers={
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        )
        
    except Exception as e:
        logging.error(f'Error analyzing message: {str(e)}')
        return func.HttpResponse(
            json.dumps({"error": "Failed to analyze message", "details": str(e)}),
            status_code=500,
            headers={'Content-Type': 'application/json'}
        )


@app.route(route="GetPrioritizedMessages", auth_level=func.AuthLevel.ANONYMOUS, methods=["GET"])
def GetPrioritizedMessages(req: func.HttpRequest) -> func.HttpResponse:
    """
    Get all contact messages sorted by AI-assigned priority, with optional spam filtering
    
    Query Parameters:
    - include_spam: true/false (default: false) - Include spam messages in results
    - limit: number of messages to return (default: 50, max: 100)
    
    Returns messages sorted by priority score (highest first)
    """
    logging.info('GetPrioritizedMessages function triggered')
    
    try:
        # Get query parameters
        include_spam = req.params.get('include_spam', 'false').lower() == 'true'
        limit = min(int(req.params.get('limit', '50')), 100)
        
        # Connect to Cosmos DB
        connection_string = os.environ.get("AzureCosmosDBConnectionString")
        client = CosmosClient.from_connection_string(connection_string)
        database = client.get_database_client("ProjectDB")
        container = database.get_container_client("ContactMessages")
        
        # Query all messages
        query = "SELECT * FROM c ORDER BY c.timestamp DESC"
        messages = list(container.query_items(query=query, enable_cross_partition_query=True))
        
        # Filter spam if requested
        if not include_spam:
            messages = [m for m in messages if not m.get('analysis', {}).get('is_spam', False)]
        
        # Separate analyzed and non-analyzed messages
        messages_analyzed = [m for m in messages if 'analysis' in m]
        messages_not_analyzed = [m for m in messages if 'analysis' not in m]
        
        # Sort analyzed messages by priority score (descending)
        messages_analyzed.sort(
            key=lambda x: x.get('analysis', {}).get('priority_score', 0),
            reverse=True
        )
        
        # Combine: analyzed (sorted by priority) + not analyzed (at the end)
        sorted_messages = messages_analyzed + messages_not_analyzed
        
        # Limit results
        sorted_messages = sorted_messages[:limit]
        
        # Calculate statistics
        spam_count = sum(1 for m in messages if m.get('analysis', {}).get('is_spam', False))
        high_priority_count = sum(1 for m in messages_analyzed if m.get('analysis', {}).get('priority') == 'high')
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "total": len(sorted_messages),
                "total_all_messages": len(messages),
                "spam_filtered": spam_count if not include_spam else 0,
                "high_priority_count": high_priority_count,
                "messages": sorted_messages
            }),
            status_code=200,
            headers={
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        )
        
    except Exception as e:
        logging.error(f'Error fetching prioritized messages: {str(e)}')
        return func.HttpResponse(
            json.dumps({"error": "Failed to fetch messages", "details": str(e)}),
            status_code=500,
            headers={'Content-Type': 'application/json'}
        )