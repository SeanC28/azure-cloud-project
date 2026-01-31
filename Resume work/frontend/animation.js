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