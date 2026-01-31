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
        '.skill-card, .project-card, .counter-card, .stat-card, .repo-item, .info-card, .about-me, .github-stats-section h2, .languages-section, .recent-activity'
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
}

// Call initialization after DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
    initScrollAnimations();
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