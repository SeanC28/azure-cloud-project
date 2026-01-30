async function loadResumeStats() {
    try {
        const response = await fetch('/api/GetResumeStats');
        const data = await response.json();
        
        document.getElementById('download-count').textContent = data.total;
    } catch (error) {
        console.error('Error loading resume stats:', error);
        document.getElementById('download-count').textContent = '0';
    }
}

// Track resume download
async function trackResumeDownload() {
    try {
        await fetch('/api/TrackResumeDownload', {
            method: 'POST'
        });
        console.log('Resume download tracked successfully');
    } catch (error) {
        console.error('Error tracking download:', error);
    }
}

// Handle resume download
document.addEventListener('DOMContentLoaded', function() {
    // Load initial stats
    loadResumeStats();
    
    // Get the resume download link
    const resumeLink = document.getElementById('resume-download-link');
    
    if (resumeLink) {
        resumeLink.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Track the download
            await trackResumeDownload();
            
            // Update the counter immediately (optimistic update)
            const currentCount = document.getElementById('download-count');
            const count = parseInt(currentCount.textContent) || 0;
            currentCount.textContent = count + 1;
            
            // Trigger the actual download
            const link = document.createElement('a');
            link.href = 'resume.pdf';
            link.download = 'Sean_Connell_Resume.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show a subtle confirmation
            const badge = document.querySelector('.download-badge');
            if (badge) {
                badge.style.animation = 'pulse 0.5s ease';
                setTimeout(() => {
                    badge.style.animation = '';
                }, 500);
            }
        });
    }
});

// Add pulse animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
`;
document.head.appendChild(style);