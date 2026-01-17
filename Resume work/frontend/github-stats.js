async function loadGitHubStats() {
    const container = document.getElementById('stats-container');
    
    try {
        // Fetch from your Azure Function
        const response = await fetch('/api/GetGitHubStats');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        const statsHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="number">${data.public_repos}</div>
                    <div class="label">Repositories</div>
                </div>
                <div class="stat-card">
                    <div class="number">${data.total_stars}</div>
                    <div class="label">Total Stars</div>
                </div>
                <div class="stat-card">
                    <div class="number">${data.followers}</div>
                    <div class="label">Followers</div>
                </div>
                <div class="stat-card">
                    <div class="number">${data.total_forks}</div>
                    <div class="label">Total Forks</div>
                </div>
            </div>
            
            <div class="languages-section">
                <h3>🚀 Programming Languages</h3>
                <div class="language-bars">
                    ${data.languages.map(lang => {
                        return `
                            <div class="language-item">
                                <div class="language-name">${lang.language}</div>
                                <div class="language-bar">
                                    <div class="language-fill" style="width: ${lang.percentage}%">
                                        ${lang.percentage}%
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <div class="recent-activity">
                <h3>📊 Recent Activity (Last 30 Days)</h3>
                <div class="repo-list">
                    ${data.recent_activity.length > 0 ? data.recent_activity.map(repo => `
                        <div class="repo-item">
                            <div class="repo-name">
                                <a href="${repo.url}" target="_blank" rel="noopener noreferrer">${repo.name}</a>
                            </div>
                            <div class="repo-description">${repo.description || 'No description available'}</div>
                            <div class="repo-meta">
                                ${repo.language ? `<span>📝 ${repo.language}</span>` : ''}
                                <span>⭐ ${repo.stars} stars</span>
                                <span>🕐 Updated ${new Date(repo.updated).toLocaleDateString()}</span>
                            </div>
                        </div>
                    `).join('') : '<p style="text-align: center; color: #888;">No recent activity in the last 30 days</p>'}
                </div>
            </div>
        `;
        
        container.innerHTML = statsHTML;
        
    } catch (error) {
        console.error('Error loading GitHub stats:', error);
        container.innerHTML = `
            <div class="error">
                ⚠️ Failed to load GitHub statistics. Please try again later.
            </div>
        `;
    }
}

// Load stats when page loads
document.addEventListener('DOMContentLoaded', loadGitHubStats);