
//3D Hover effect 
const skillImg = document.querySelector('.skills-image img');
const container = document.querySelector('.skills-image');

container.addEventListener('mousemove', (e) => {
    // Get the dimensions and position of the container
    const rect = container.getBoundingClientRect();
    
    // Calculate mouse position relative to the center of the image (0 to 1)
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Convert to degrees (tilting up to 20 degrees in either direction)
    const moveX = (x - 0.5) * 40; 
    const moveY = (y - 0.5) * -40; // Negative to tilt "toward" the mouse

    skillImg.style.transform = `rotateY(${moveX}deg) rotateX(${moveY}deg) scale(1.05)`;
});

// Reset the position when the mouse leaves
container.addEventListener('mouseleave', () => {
    skillImg.style.transform = `rotateY(0deg) rotateX(0deg) scale(1)`;
});

//Pixel man animation 
const counterCard = document.querySelector('.counter-card');
const pixelManContainer = document.querySelector('.pixelman-pop-up');
const pixelManImg = pixelManContainer.querySelector('img');

let animationFrameId;
let startTime;

counterCard.addEventListener('mouseenter', () => {
    pixelManContainer.classList.add('active');
    // Start the high-performance animation loop
    startTime = performance.now();
    animateWave();
});

counterCard.addEventListener('mouseleave', () => {
    pixelManContainer.classList.remove('active');
    // Cancel the frame request to save CPU/Battery
    cancelAnimationFrame(animationFrameId);
    pixelManImg.style.transform = 'rotate(0deg)';
});

function animateWave() {
    const elapsed = performance.now() - startTime;
    
    // Smooth Sine Wave calculation
    // 0.005 controls the speed, 10 controls the tilt degrees
    const rotation = Math.sin(elapsed * 0.008) * 10;
    
    pixelManImg.style.transform = `rotate(${rotation}deg)`;
    
    // Requests the next frame from the browser for 60fps+ smoothness
    animationFrameId = requestAnimationFrame(animateWave);
}

// Existing elements
const resumeLink = document.getElementById('resume-download-link');

// 1. BACKFLIP LOGIC
if (resumeLink) {
    resumeLink.addEventListener('click', (e) => {
        // Prevent multiple rapid clicks from breaking the animation
        if (pixelManImg.classList.contains('backflip')) return;

        // Force the man to pop up if he isn't already
        pixelManContainer.classList.add('active');

        // Add the flip class
        pixelManImg.classList.add('backflip');

        // Remove it after animation finishes so it can be re-triggered
        setTimeout(() => {
            pixelManImg.classList.remove('backflip');
        }, 800);
    });
}

// 2. CELEBRATION JUMP (Integrate this into your existing fetch)
const getVisitCount = () => {
    fetch('/api/GetVisitorCount')
    .then(response => response.json())
    .then(response => {
        document.getElementById("counter").innerText = response.count;
        
        // Celebration: Pixel Man pops up and does a quick "hooray" jump
        pixelManContainer.classList.add('active');
        pixelManImg.animate([
            { transform: 'translateY(0)' },
            { transform: 'translateY(-40px)' },
            { transform: 'translateY(0)' }
        ], { duration: 500, easing: 'ease-out' });

        // Hide him again after 2 seconds unless the user is hovering
        setTimeout(() => {
            if (!counterCard.matches(':hover')) {
                pixelManContainer.classList.remove('active');
            }
        }, 2000);
    }).catch(error => {
        console.log(error);
        document.getElementById("counter").innerText = "Error";
    });
}