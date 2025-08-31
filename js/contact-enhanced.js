// Enhanced contact form with email integration and database storage

class SupabaseContact {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Contact form submission
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactSubmission(e));
        }

        // Chapter selection auto-fill
        const chapterSelect = document.getElementById('chapter-interest');
        if (chapterSelect) {
            chapterSelect.addEventListener('change', (e) => {
                this.updateChapterInfo(e.target.value);
            });
        }
    }

    async handleContactSubmission(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const contactData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone') || null,
            chapter_interest: formData.get('chapter_interest') || null,
            message: formData.get('message'),
            source: 'website'
        };

        const submitBtn = e.target.querySelector('button[type="submit"]');
        this.showLoading(submitBtn, 'Sending message...');

        try {
            // Save to database
            await SupabaseAPI.submitContactForm(contactData);
            
            // Send email notification
            await this.sendEmailNotification(contactData);
            
            // Show success message
            this.showSuccess('Thank you for your message! A member of our leadership team will contact you soon.');
            
            // Reset form
            e.target.reset();
            
        } catch (error) {
            console.error('Contact form error:', error);
            this.showError('There was an error sending your message. Please try again or contact us directly.');
        } finally {
            this.hideLoading(submitBtn, 'Send Message');
        }
    }

    async sendEmailNotification(contactData) {
        // This would integrate with your email service
        // For now, we'll use Supabase Edge Functions or a webhook
        
        const emailData = {
            to: 'joe.lafilm@gmail.com',
            subject: `New Contact Form Submission - ${contactData.name}`,
            body: this.buildEmailBody(contactData)
        };

        try {
            // Call Supabase Edge Function for email sending
            const { data, error } = await supabaseClient.functions.invoke('send-contact-email', {
                body: emailData
            });
            
            if (error) throw error;
            console.log('Email sent successfully');
            
        } catch (error) {
            console.error('Email sending failed:', error);
            // Don't throw error - form submission was still successful
        }
    }

    buildEmailBody(contactData) {
        return `
            New contact form submission from the WCSC Brotherhood website:
            
            Name: ${contactData.name}
            Email: ${contactData.email}
            Phone: ${contactData.phone || 'Not provided'}
            Chapter Interest: ${contactData.chapter_interest || 'Not specified'}
            
            Message:
            ${contactData.message}
            
            ---
            Submitted: ${new Date().toLocaleString()}
            Source: Website Contact Form
            
            Please follow up with this inquiry promptly.
        `;
    }

    updateChapterInfo(chapter) {
        const infoDiv = document.getElementById('chapter-info');
        if (!infoDiv) return;

        const chapterInfo = {
            'Georgetown': {
                location: 'Georgetown, TX',
                meetingTime: 'Fridays at 7:00 PM',
                contact: 'Contact Georgetown leadership for details'
            },
            'Austin': {
                location: 'Austin, TX',
                meetingTime: 'Fridays at 7:30 PM',
                contact: 'Contact Austin leadership for details'
            },
            'Dallas': {
                location: 'Dallas, TX',
                meetingTime: 'Fridays at 7:00 PM',
                contact: 'Contact Dallas leadership for details'
            },
            'Houston': {
                location: 'Houston, TX',
                meetingTime: 'Fridays at 7:30 PM',
                contact: 'Contact Houston leadership for details'
            },
            'San Antonio': {
                location: 'San Antonio, TX',
                meetingTime: 'Fridays at 7:00 PM',
                contact: 'Contact San Antonio leadership for details'
            }
        };

        if (chapter && chapterInfo[chapter]) {
            const info = chapterInfo[chapter];
            infoDiv.innerHTML = `
                <div class="chapter-details">
                    <h4>${chapter} Chapter</h4>
                    <p><strong>Location:</strong> ${info.location}</p>
                    <p><strong>Meeting Time:</strong> ${info.meetingTime}</p>
                    <p><strong>Contact:</strong> ${info.contact}</p>
                </div>
            `;
            infoDiv.style.display = 'block';
        } else {
            infoDiv.style.display = 'none';
        }
    }

    showLoading(button, text) {
        button.disabled = true;
        button.innerHTML = `<span class="loading-spinner"></span> ${text}`;
    }

    hideLoading(button, originalText) {
        button.disabled = false;
        button.innerHTML = originalText;
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span>${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;

        document.body.appendChild(toast);

        // Auto remove after 8 seconds for success, 5 for error
        setTimeout(() => {
            toast.remove();
        }, type === 'success' ? 8000 : 5000);

        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
    }
}

// Initialize contact system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.contact = new SupabaseContact();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SupabaseContact };
}