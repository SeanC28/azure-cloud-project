// Contact Form Handler
// Handles form submission, validation, and user feedback

document.addEventListener('DOMContentLoaded', function() {
    const contactFormElement = document.getElementById('contact-form');
    const formMessage = document.getElementById('form-message');
    
    if (contactFormElement) {
        const submitBtn = contactFormElement.querySelector('.submit-btn');
        
        contactFormElement.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                subject: document.getElementById('subject').value.trim(),
                message: document.getElementById('message').value.trim()
            };
            
            // Client-side validation
            if (!formData.name || !formData.email || !formData.subject || !formData.message) {
                showMessage('Please fill in all fields', 'error');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                showMessage('Please enter a valid email address', 'error');
                return;
            }
            
            // Show loading state
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            formMessage.style.display = 'none';
            
            try {
                // Submit to Azure Function
                const response = await fetch('/api/SubmitContactForm', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    // Success
                    showMessage(data.message || 'Message sent successfully!', 'success');
                    contactFormElement.reset();
                    
                    // Log if email was sent
                    if (data.email_sent) {
                        console.log('Email notification sent successfully');
                    } else {
                        console.log('Message stored, but email notification failed');
                    }
                } else {
                    // Error from server
                    showMessage(data.error || 'Failed to send message. Please try again.', 'error');
                }
                
            } catch (error) {
                console.error('Error submitting form:', error);
                showMessage('Network error. Please check your connection and try again.', 'error');
            } finally {
                // Remove loading state
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        });
        
        // Show message function
        function showMessage(message, type) {
            formMessage.textContent = message;
            formMessage.className = `form-message ${type}`;
            formMessage.style.display = 'block';
            
            // Auto-hide success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    formMessage.style.display = 'none';
                }, 5000);
            }
        }
    }
});