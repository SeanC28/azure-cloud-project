//===============================================
// HERO SECTION - TYPING ANIMATION
//===============================================
class TypingAnimation {
    constructor(element, words, options = {}) {
        this.element = element;
        this.words = words;
        this.wordIndex = 0;
        this.charIndex = 0;
        this.isDeleting = false;
        
        // Options with defaults
        this.typingSpeed = options.typingSpeed || 150;
        this.deletingSpeed = options.deletingSpeed || 100;
        this.delayBetweenWords = options.delayBetweenWords || 2000;
        this.loop = options.loop !== false;
        
        this.type();
    }
    
    type() {
        const currentWord = this.words[this.wordIndex];
        
        if (this.isDeleting) {
            this.element.textContent = currentWord.substring(0, this.charIndex - 1);
            this.charIndex--;
        } else {
            this.element.textContent = currentWord.substring(0, this.charIndex + 1);
            this.charIndex++;
        }
        
        let typeSpeed = this.isDeleting ? this.deletingSpeed : this.typingSpeed;
        
        if (!this.isDeleting && this.charIndex === currentWord.length) {
            typeSpeed = this.delayBetweenWords;
            this.isDeleting = true;
        } else if (this.isDeleting && this.charIndex === 0) {
            this.isDeleting = false;
            this.wordIndex++;
            
            if (this.wordIndex === this.words.length) {
                if (this.loop) {
                    this.wordIndex = 0;
                } else {
                    return;
                }
            }
            
            typeSpeed = 500;
        }
        
        setTimeout(() => this.type(), typeSpeed);
    }
}

// Initialize typing animation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const typingElement = document.querySelector('.typing-text');
    
    if (typingElement) {
        const words = [
            'Cloud & DevOps',
            'Azure Infrastructure',
            'Python Automation',
            'CI/CD Pipelines',
            'Docker & Containers'
        ];
        
        new TypingAnimation(typingElement, words, {
            typingSpeed: 100,
            deletingSpeed: 50,
            delayBetweenWords: 2000,
            loop: true
        });
    }
    
    // Add fade-in animation for hero elements
    const heroText = document.querySelector('.hero-text');
    const heroImage = document.querySelector('.hero-image');
    
    if (heroText) {
        heroText.style.opacity = '0';
        heroText.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            heroText.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            heroText.style.opacity = '1';
            heroText.style.transform = 'translateY(0)';
        }, 100);
    }
    
    if (heroImage) {
        heroImage.style.opacity = '0';
        heroImage.style.transform = 'translateX(30px)';
        
        setTimeout(() => {
            heroImage.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            heroImage.style.opacity = '1';
            heroImage.style.transform = 'translateX(0)';
        }, 300);
    }
});

//===============================================
// 3D HOVER EFFECT (SKILLS IMAGE)
//===============================================
const skillImg = document.querySelector('.skills-image img');
const container = document.querySelector('.skills-image');

if (container && skillImg) {
    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        
        const moveX = (x - 0.5) * 40; 
        const moveY = (y - 0.5) * -40;

        skillImg.style.transform = `rotateY(${moveX}deg) rotateX(${moveY}deg) scale(1.05)`;
    });

    container.addEventListener('mouseleave', () => {
        skillImg.style.transform = `rotateY(0deg) rotateX(0deg) scale(1)`;
    });
}

//===============================================
// PIXEL MAN ANIMATION (VISITOR COUNTER)
//===============================================
const counterCard = document.querySelector('.counter-card');
const pixelManContainer = document.querySelector('.pixelman-pop-up');
const pixelManImg = pixelManContainer ? pixelManContainer.querySelector('img') : null;

let animationFrameId;
let startTime;

if (counterCard && pixelManContainer && pixelManImg) {
    counterCard.addEventListener('mouseenter', () => {
        pixelManContainer.classList.add('active');
        startTime = performance.now();
        animateWave();
    });

    counterCard.addEventListener('mouseleave', () => {
        pixelManContainer.classList.remove('active');
        cancelAnimationFrame(animationFrameId);
        pixelManImg.style.transform = 'rotate(0deg)';
    });

    function animateWave() {
        const elapsed = performance.now() - startTime;
        const rotation = Math.sin(elapsed * 0.008) * 10;
        
        pixelManImg.style.transform = `rotate(${rotation}deg)`;
        animationFrameId = requestAnimationFrame(animateWave);
    }

    //===============================================
    // BACKFLIP ANIMATION (RESUME DOWNLOAD)
    //===============================================
    const resumeLink = document.getElementById('resume-download-link');

    if (resumeLink) {
        resumeLink.addEventListener('click', (e) => {
            if (pixelManImg.classList.contains('backflip')) return;

            pixelManContainer.classList.add('active');
            pixelManImg.classList.add('backflip');

            setTimeout(() => {
                pixelManImg.classList.remove('backflip');
            }, 800);
        });
    }
}

//===============================================
// VISITOR COUNT WITH CELEBRATION
//===============================================
const getVisitCount = () => {
    fetch('/api/GetVisitorCount')
    .then(response => response.json())
    .then(response => {
        document.getElementById("counter").innerText = response.count;
        
        if (pixelManContainer && pixelManImg && counterCard) {
            pixelManContainer.classList.add('active');
            pixelManImg.animate([
                { transform: 'translateY(0)' },
                { transform: 'translateY(-40px)' },
                { transform: 'translateY(0)' }
            ], { duration: 500, easing: 'ease-out' });

            setTimeout(() => {
                if (!counterCard.matches(':hover')) {
                    pixelManContainer.classList.remove('active');
                }
            }, 2000);
        }
    }).catch(error => {
        console.log(error);
        document.getElementById("counter").innerText = "Error";
    });
};

//===============================================
// SCROLL REVEAL ANIMATIONS
//===============================================

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.15, // Trigger when 15% of element is visible
    rootMargin: '0px 0px -50px 0px' // Start animation slightly before element enters viewport
};

// Create the observer
const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            
            // Optional: Stop observing after animation (performance optimization)
            // scrollObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Initialize scroll animations when DOM is ready
function initScrollAnimations() {
    // Select all elements to animate
    const animatedElements = document.querySelectorAll(
        '.skill-card, .project-card, .counter-card, .stat-card, .repo-item, .info-card, .about-me, .github-stats-section h2, .recent-activity'
    );
    
    // Add 'scroll-animate' class and observe each element
    animatedElements.forEach((element, index) => {
        element.classList.add('scroll-animate');
        
        // Add staggered delay for elements in the same section
        const delay = (index % 6) * 0.1; // Stagger up to 6 items
        element.style.transitionDelay = `${delay}s`;
        
        scrollObserver.observe(element);
    });
    
    // Animate section titles
    const sectionTitles = document.querySelectorAll('.section-title');
    sectionTitles.forEach(title => {
        title.classList.add('scroll-animate-title');
        scrollObserver.observe(title);
    });
    
    // Special animation for skills grid items (staggered)
    const skillCards = document.querySelectorAll('.skill-card');
    skillCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
    });

    // Languages section: only add .revealed (no scroll-animate on parent)
    // so the child .language-item stagger rules can fire independently.
    // Note: .languages-section is injected dynamically by github-stats.js,
    // so it may not exist yet — the MutationObserver below handles that case.
    const languagesSection = document.querySelector('.languages-section');
    if (languagesSection) {
        scrollObserver.observe(languagesSection);
    }
}

// Call initialization after DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
    initScrollAnimations();
}

//===============================================
// DYNAMIC ELEMENT OBSERVER
// github-stats.js injects .languages-section and
// .recent-activity after the page loads.  This
// MutationObserver watches #stats-container and
// hands any new elements to the scroll observer
// as soon as they appear.
//===============================================
const dynamicRoot = document.querySelector('#stats-container');
if (dynamicRoot) {
    const dynamicObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType !== Node.ELEMENT_NODE) return;

                // .languages-section: observe for .revealed only (no scroll-animate)
                const langSection = node.classList && node.classList.contains('languages-section')
                    ? node
                    : node.querySelector && node.querySelector('.languages-section');
                if (langSection && !langSection.dataset.observed) {
                    langSection.dataset.observed = 'true';
                    scrollObserver.observe(langSection);
                }

                // .recent-activity + .repo-item: full scroll-animate treatment
                const recentActivity = node.classList && node.classList.contains('recent-activity')
                    ? node
                    : node.querySelector && node.querySelector('.recent-activity');
                if (recentActivity && !recentActivity.dataset.observed) {
                    recentActivity.dataset.observed = 'true';
                    recentActivity.classList.add('scroll-animate');
                    scrollObserver.observe(recentActivity);
                }

                // Individual repo items inside recent-activity
                const repoItems = node.querySelectorAll ? node.querySelectorAll('.repo-item') : [];
                repoItems.forEach((item, i) => {
                    if (!item.dataset.observed) {
                        item.dataset.observed = 'true';
                        item.classList.add('scroll-animate');
                        item.style.transitionDelay = `${i * 0.1}s`;
                        scrollObserver.observe(item);
                    }
                });

                // Stat cards
                const statCards = node.querySelectorAll ? node.querySelectorAll('.stat-card') : [];
                statCards.forEach((card, i) => {
                    if (!card.dataset.observed) {
                        card.dataset.observed = 'true';
                        card.classList.add('scroll-animate');
                        card.style.transitionDelay = `${i * 0.1}s`;
                        scrollObserver.observe(card);
                    }
                });
            });
        });
    });

    dynamicObserver.observe(dynamicRoot, { childList: true, subtree: true });
}

//===============================================
// SMOOTH SCROLL FOR NAVIGATION LINKS
//===============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        
        // Ignore empty hash or hash-only links
        if (href === '#' || href === '#!') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
            const headerOffset = 80; // Account for sticky header
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

//===============================================
// PROGRESS BAR ON SCROLL
//===============================================
function updateScrollProgress() {
    const scrollProgress = document.querySelector('.scroll-progress');
    if (!scrollProgress) return;
    
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight - windowHeight;
    const scrolled = window.pageYOffset;
    const progress = (scrolled / documentHeight) * 100;
    
    scrollProgress.style.width = `${progress}%`;
}

// Add scroll progress bar to header
function createScrollProgressBar() {
    const header = document.querySelector('header');
    if (!header || document.querySelector('.scroll-progress')) return;
    
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    header.appendChild(progressBar);
    
    window.addEventListener('scroll', updateScrollProgress);
}

// Initialize progress bar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createScrollProgressBar);
} else {
    createScrollProgressBar();
}

//===============================================
// PARALLAX EFFECT FOR HERO IMAGE
//===============================================
function parallaxHeroImage() {
    const heroImage = document.querySelector('.hero-image img');
    if (!heroImage) return;
    
    const scrolled = window.pageYOffset;
    const parallaxSpeed = 0.3; // Adjust for more/less parallax
    
    if (scrolled < window.innerHeight) {
        heroImage.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
    }
}

window.addEventListener('scroll', () => {
    requestAnimationFrame(parallaxHeroImage);
});

//===============================================
// NUMBER COUNTER ANIMATION
//===============================================
function animateCounters() {
    const counters = document.querySelectorAll('.stat-card .number');
    
    counters.forEach(counter => {
        // Skip if already animated
        if (counter.classList.contains('counted')) return;
        
        const target = parseInt(counter.textContent);
        if (isNaN(target)) return;
        
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60fps
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.ceil(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
                counter.classList.add('counted');
            }
        };
        
        updateCounter();
    });
}

// Trigger counter animation when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

const statsSection = document.querySelector('.github-stats-section');
if (statsSection) {
    statsObserver.observe(statsSection);
}


//===============================================
// HERO PARTICLE FIELD
// Canvas sits behind the hero image.  Particles
// drift, pulse opacity on a sine wave, and wrap
// at canvas edges.  The loop pauses automatically
// when the hero scrolls out of view.
//===============================================
(function heroParticles() {
    const heroImage = document.querySelector('.hero-image');
    if (!heroImage) return;

    // ── canvas setup ──────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.className = 'hero-particles';
    heroImage.insertBefore(canvas, heroImage.firstChild); // behind <img>
    const ctx = canvas.getContext('2d');

    // ── colour palette ────────────────────────────
    // Matches the indigo system used across the site
    const COLOURS = [
        { r: 79,  g: 70,  b: 229 }, // indigo base
        { r: 99,  g: 102, b: 241 }, // indigo mid
        { r: 139, g: 92,  b: 246 }, // violet accent
        { r: 0,   g: 162, b: 255 }, // glow-blue
        { r: 165, g: 180, b: 252 }  // lavender highlight
    ];

    // ── particle class ────────────────────────────
    class Particle {
        constructor(w, h) { this.reset(w, h, true); }

        reset(w, h, randomPos) {
            this.x = randomPos ? Math.random() * w : (Math.random() < 0.5 ? -4 : w + 4);
            this.y = randomPos ? Math.random() * h : Math.random() * h;

            // size: mostly small, occasionally bigger
            this.baseSize = Math.random() < 0.85 ? Math.random() * 2 + 0.5 : Math.random() * 3 + 2;

            // slow random drift
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 0.4 + 0.1;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;

            // pick a colour
            this.colour = COLOURS[Math.floor(Math.random() * COLOURS.length)];

            // sine-wave opacity pulse: each particle gets its own phase & speed
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.pulseSpeed = Math.random() * 0.8 + 0.4; // cycles per second (approx)
            this.baseAlpha = Math.random() * 0.4 + 0.15; // 0.15 – 0.55
        }

        update(w, h, time) {
            this.x += this.vx;
            this.y += this.vy;

            // wrap edges
            if (this.x < -4)  this.x = w + 4;
            if (this.x > w + 4) this.x = -4;
            if (this.y < -4)  this.y = h + 4;
            if (this.y > h + 4) this.y = -4;

            // pulsed alpha
            this.alpha = this.baseAlpha * (0.5 + 0.5 * Math.sin(time * this.pulseSpeed + this.pulsePhase));
        }

        draw(ctx) {
            const c = this.colour;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.baseSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${this.alpha})`;
            ctx.fill();
        }
    }

    // ── state ─────────────────────────────────────
    let particles = [];
    let animId = null;
    let lastTime = 0;

    // ── sizing ────────────────────────────────────
    function resize() {
        const rect = heroImage.getBoundingClientRect();
        canvas.width  = rect.width;
        canvas.height = rect.height;
        rebuildParticles();
    }

    function particleCount() {
        // scale with area; ~1 particle per 4 800 px²; min 40, max 120
        const area = canvas.width * canvas.height;
        return Math.min(120, Math.max(40, Math.floor(area / 4800)));
    }

    function rebuildParticles() {
        const count = particleCount();
        particles = [];
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(canvas.width, canvas.height));
        }
    }

    // ── render loop ───────────────────────────────
    function loop(timestamp) {
        // pause if hero is scrolled away
        const heroRect = heroImage.getBoundingClientRect();
        if (heroRect.bottom < 0 || heroRect.top > window.innerHeight) {
            animId = requestAnimationFrame(loop);
            return;
        }

        const time = timestamp * 0.001; // seconds
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update(w, h, time);
            particles[i].draw(ctx);
        }

        animId = requestAnimationFrame(loop);
    }

    // ── init ──────────────────────────────────────
    resize();
    animId = requestAnimationFrame(loop);

    // resize on window change (covers rotation too)
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 120);
    });
})();