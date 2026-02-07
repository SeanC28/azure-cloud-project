(function architectureDiagram() {
    'use strict';

    const GROUPS = {
        client:   { color: '#64748b', label: 'Client' },
        compute:  { color: '#0078d4', label: 'Compute' },
        data:     { color: '#f59e0b', label: 'Data' },
        ai:       { color: '#a855f7', label: 'AI / NLP' },
        external: { color: '#10b981', label: 'External' },
        infra:    { color: '#f43f5e', label: 'Infrastructure' }
    };

    const NODES = [
        { id: 'user',       label: 'Visitor',            icon: '👤', x: 50, y: 7,  group: 'client',   desc: 'Portfolio visitors & recruiters hitting the live site.' },
        { id: 'swa',        label: 'Static Web App',     icon: '⚡', x: 50, y: 24, group: 'compute',  desc: 'Azure Static Web Apps — hosts frontend + integrated serverless Functions behind a global CDN.', tech: 'Azure Static Web Apps · West US 2' },
        { id: 'functions',  label: 'Azure Functions',    icon: 'λ',  x: 24, y: 44, group: 'compute',  desc: '5 Python serverless endpoints using the v2 programming model with @app.route decorators.', tech: 'Python 3.11 · v2 Decorators',
            endpoints: [
                { method: 'GET',  path: '/api/GetVisitorCount' },
                { method: 'GET',  path: '/api/GetGitHubStats' },
                { method: 'GET',  path: '/api/GetResumeStats' },
                { method: 'POST', path: '/api/TrackResumeDownload' },
                { method: 'POST', path: '/api/SubmitContactForm' }
            ]
        },
        { id: 'cosmos',     label: 'Cosmos DB',          icon: '🪐', x: 76, y: 44, group: 'data',     desc: 'Azure Cosmos DB (Serverless, SQL API) — 3 containers for visitor counts, resume downloads, and contact messages.', tech: 'SQL API · Serverless · Partition /id',
            containers: ['Counter', 'ResumeDownloads', 'ContactMessages']
        },
        { id: 'sentiment',  label: 'Sentiment Engine',   icon: '🧠', x: 24, y: 66, group: 'ai',       desc: 'NLP pipeline: TextBlob sentiment analysis with a custom keyword fallback, spam detection via regex + keyword scoring, and priority ranking 1–10.', tech: 'TextBlob · Keyword Fallback · Spam Detection' },
        { id: 'github_api', label: 'GitHub API',         icon: '🐙', x: 76, y: 66, group: 'external', desc: 'Live repo stats proxied through GetGitHubStats — stars, forks, languages, and recent activity.', tech: 'REST API · Proxied via Azure Function' },
        { id: 'terraform',  label: 'Terraform',          icon: '🏗️', x: 16, y: 88, group: 'infra',    desc: 'All Azure resources managed as code — imported existing resources with lifecycle protection to prevent accidental deletion.', tech: 'AzureRM Provider · prevent_destroy' },
        { id: 'actions',    label: 'GitHub Actions',     icon: '🔄', x: 50, y: 88, group: 'infra',    desc: 'CI/CD pipeline triggers on push to main — builds and deploys frontend + backend to Azure Static Web Apps automatically.', tech: 'Auto-Deploy on Push to Main' },
        { id: 'insights',   label: 'App Insights',       icon: '📊', x: 84, y: 88, group: 'data',     desc: 'Application performance monitoring — tracks request rates, response times, failures, and dependencies across all endpoints.', tech: 'appi-portfolio-prod · West US 2' }
    ];

    const EDGES = [
        { from: 'user',      to: 'swa',        label: 'HTTPS',        live: true },
        { from: 'swa',       to: 'functions',   label: 'API Routes',   live: true },
        { from: 'functions', to: 'cosmos',      label: 'Read / Write', live: true },
        { from: 'functions', to: 'sentiment',   label: 'Analyze',      live: false },
        { from: 'functions', to: 'github_api',  label: 'Proxy',        live: false },
        { from: 'actions',   to: 'swa',         label: 'Deploy',       live: false },
        { from: 'functions', to: 'insights',    label: 'Telemetry',    live: false },
        { from: 'terraform', to: 'cosmos',      label: 'Provision',    live: false },
        { from: 'terraform', to: 'swa',         label: 'Provision',    live: false }
    ];

    const section   = document.querySelector('.architecture-section');
    const diagram   = document.getElementById('arch-diagram');
    const canvas    = document.getElementById('arch-canvas');
    const nodesDiv  = document.getElementById('arch-nodes');
    const legendDiv = document.getElementById('arch-legend');
    const detailDiv = document.getElementById('arch-detail');
    if (!section || !canvas || !nodesDiv) return;

    const ctx = canvas.getContext('2d');
    let selected = null;
    let hoveredEdgeIdx = null;
    let diagramW = 0;
    let diagramH = 0;
    let nodePositions = {};

    Object.entries(GROUPS).forEach(([key, g]) => {
        const dot = document.createElement('span');
        dot.className = 'arch-legend-item';
        dot.innerHTML = `<span class="arch-legend-dot" style="background:${g.color};box-shadow:0 0 6px ${g.color}66"></span>${g.label}`;
        legendDiv.appendChild(dot);
    });

    NODES.forEach(node => {
        const el = document.createElement('div');
        el.className = 'arch-node';
        el.dataset.id = node.id;
        el.dataset.group = node.group;

        const isLambda = node.icon === 'λ';
        el.innerHTML = `
            <div class="arch-node-ring" style="--node-color:${GROUPS[node.group].color}">
                <span class="arch-node-icon ${isLambda ? 'arch-lambda' : ''}">${node.icon}</span>
            </div>
            <span class="arch-node-label">${node.label}</span>
        `;

        el.addEventListener('click', () => selectNode(node.id === selected ? null : node.id));
        nodesDiv.appendChild(el);
    });

    function selectNode(id) {
        selected = id;

        document.querySelectorAll('.arch-node').forEach(el => {
            const nid = el.dataset.id;
            const isSelected = nid === id;
            const isConnected = id && EDGES.some(e =>
                (e.from === id && e.to === nid) || (e.to === id && e.from === nid)
            );
            el.classList.toggle('arch-node--selected', isSelected);
            el.classList.toggle('arch-node--dimmed', id != null && !isSelected && !isConnected);
        });

        drawEdges();
        renderDetail(id);
    }

    function renderDetail(id) {
        if (!id) {
            detailDiv.innerHTML = '<div class="arch-detail-empty">Select a component to see details</div>';
            return;
        }
        const node = NODES.find(n => n.id === id);
        const color = GROUPS[node.group].color;

        let extra = '';

        if (node.endpoints) {
            extra = '<div class="arch-endpoints">' + node.endpoints.map(ep =>
                `<div class="arch-ep">
                    <span class="arch-ep-method arch-ep-method--${ep.method.toLowerCase()}">${ep.method}</span>
                    <span class="arch-ep-path">${ep.path}</span>
                    <span class="arch-ep-status">✅</span>
                </div>`
            ).join('') + '</div>';
        }

        if (node.containers) {
            extra = '<div class="arch-chips">' + node.containers.map(c =>
                `<span class="arch-chip" style="--chip-color:${color}">${c}</span>`
            ).join('') + '</div>';
        }

        detailDiv.innerHTML = `
            <div class="arch-detail-card" style="--detail-color:${color}">
                <div class="arch-detail-header">
                    <span class="arch-detail-icon">${node.icon}</span>
                    <div>
                        <h3 class="arch-detail-title" style="color:${color}">${node.label}</h3>
                        ${node.tech ? `<p class="arch-detail-tech">${node.tech}</p>` : ''}
                    </div>
                </div>
                <p class="arch-detail-desc">${node.desc}</p>
                ${extra}
            </div>
        `;
    }

    function resize() {
        const rect = diagram.getBoundingClientRect();
        diagramW = rect.width;
        diagramH = rect.height;
        canvas.width  = diagramW * window.devicePixelRatio;
        canvas.height = diagramH * window.devicePixelRatio;
        canvas.style.width  = diagramW + 'px';
        canvas.style.height = diagramH + 'px';
        ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

        NODES.forEach(node => {
            const el = nodesDiv.querySelector(`[data-id="${node.id}"]`);
            if (!el) return;
            const px = (node.x / 100) * diagramW;
            const py = (node.y / 100) * diagramH;
            el.style.left = px + 'px';
            el.style.top  = py + 'px';
            nodePositions[node.id] = { x: px, y: py };
        });

        drawEdges();
    }

    function drawEdges() {
        ctx.clearRect(0, 0, diagramW, diagramH);

        EDGES.forEach((edge, i) => {
            const from = nodePositions[edge.from];
            const to   = nodePositions[edge.to];
            if (!from || !to) return;

            const isHighlighted = selected === edge.from || selected === edge.to;
            const isDimmed = selected && !isHighlighted;

            const mx = (from.x + to.x) / 2;
            const my = (from.y + to.y) / 2;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const cx = mx + (-dy / len) * 18;
            const cy = my + ( dx / len) * 18;

            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.quadraticCurveTo(cx, cy, to.x, to.y);

            if (isDimmed) {
                ctx.strokeStyle = 'rgba(30,41,59,0.3)';
                ctx.lineWidth = 1;
                ctx.setLineDash([]);
            } else if (isHighlighted) {
                ctx.strokeStyle = 'rgba(0,120,212,0.6)';
                ctx.lineWidth = 2;
                ctx.setLineDash([]);
            } else {
                ctx.strokeStyle = edge.live ? 'rgba(0,120,212,0.25)' : 'rgba(100,116,139,0.2)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash(edge.live ? [] : [4, 4]);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            if (isHighlighted) {
                ctx.font = '11px "Segoe UI", sans-serif';
                ctx.fillStyle = '#94a3b8';
                ctx.textAlign = 'center';
                ctx.fillText(edge.label, cx, cy - 6);
            }
        });
    }

    let animFrame;
    function animateFlow(timestamp) {
        drawEdges();

        const t = (timestamp || 0) * 0.001;

        EDGES.forEach(edge => {
            if (!edge.live) return;
            if (selected && selected !== edge.from && selected !== edge.to) return;

            const from = nodePositions[edge.from];
            const to   = nodePositions[edge.to];
            if (!from || !to) return;

            const mx = (from.x + to.x) / 2;
            const my = (from.y + to.y) / 2;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const cx = mx + (-dy / len) * 18;
            const cy = my + ( dx / len) * 18;

            const progress = ((t * 0.3) % 1);
            const inv = 1 - progress;
            const px = inv * inv * from.x + 2 * inv * progress * cx + progress * progress * to.x;
            const py = inv * inv * from.y + 2 * inv * progress * cy + progress * progress * to.y;

            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 162, 255, 0.7)';
            ctx.fill();
        });

        animFrame = requestAnimationFrame(animateFlow);
    }

    const visibilityObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!animFrame) animFrame = requestAnimationFrame(animateFlow);
            } else {
                if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
            }
        });
    }, { threshold: 0.05 });
    visibilityObserver.observe(section);

    resize();
    window.addEventListener('resize', () => { clearTimeout(window._archResize); window._archResize = setTimeout(resize, 120); });

    diagram.addEventListener('click', (e) => {
        if (e.target === diagram || e.target === canvas) selectNode(null);
    });

})();
