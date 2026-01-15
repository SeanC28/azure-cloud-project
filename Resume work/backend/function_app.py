import azure.functions as func
import logging
import json
import os
from azure.cosmos import CosmosClient
from datetime import datetime, timedelta
import requests

app = func.FunctionApp()

# ========== EXISTING VISITOR COUNTER (UNCHANGED) ==========
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


# ========== NEW GITHUB STATS FUNCTION ==========
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