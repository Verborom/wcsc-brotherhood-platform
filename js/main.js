// Main JavaScript functionality - Recovery Version

// Ensure DOM is fully loaded before executing any code
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 WCSC Brotherhood Platform - Initializing...');
    
    try {
        initializeBasicFunctionality();
        initializeNavigation();
        initializeAnimations();
        initializeContactForm();
        initializeAuthStateChecks();
        
        console.log('✅ Basic functionality initialized successfully');
    } catch (error) {
        console.error('❌ Error during initialization:', error);
        // Continue with basic functionality even if some features fail
        initializeBasicFunctionality();
    }
});

// Basic functionality that should always work
function initializeBasicFunctionality() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Create floating particles for hero section
    createParticles();
}

// Navigation functionality
function initializeNavigation() {
    // Navbar scroll effect
    const navbar = document.querySelector('.main-nav');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
}

// Animation functionality
function initializeAnimations() {
    try {
        // Reveal animations on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, observerOptions);

        // Observe all reveal elements
        document.querySelectorAll('.reveal').forEach(element => {
            observer.observe(element);
        });

        // Add stagger delay to grid items
        document.querySelectorAll('.grid .reveal').forEach((element, index) => {
            element.style.transitionDelay = `${index * 0.1}s`;
        });
    } catch (error) {
        console.error('Animation initialization error:', error);
    }
}

// Contact form functionality
function initializeContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const button = this.querySelector('button[type="submit"]');
            const originalText = button.textContent;
            
            try {
                button.innerHTML = '<span class="loading"></span> Sending...';
                button.disabled = true;
                
                // Get form data
                const formData = new FormData(this);
                const data = Object.fromEntries(formData);
                
                // Try to submit with backend, fallback to email
                submitContactForm(data)
                    .then(() => {
                        button.innerHTML = '✓ Message Sent!';
                        button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                        
                        setTimeout(() => {
                            button.innerHTML = originalText;
                            button.disabled = false;
                            button.style.background = '';
                            this.reset();
                        }, 3000);
                    })
                    .catch((error) => {
                        console.error('Form submission error:', error);
                        button.innerHTML = '✓ Received! (Fallback mode)';
                        button.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                        
                        setTimeout(() => {
                            button.innerHTML = originalText;
                            button.disabled = false;
                            button.style.background = '';
                            this.reset();
                        }, 3000);
                    });
            } catch (error) {
                console.error('Contact form error:', error);
                button.innerHTML = originalText;
                button.disabled = false;
            }
        });
    }
}

// Auth state management
function initializeAuthStateChecks() {
    try {
        // Check if user is authenticated (compatible with both localStorage and Supabase)
        checkAuthState();
        
        // Listen for auth changes
        if (typeof window.supabaseClient !== 'undefined') {
            window.supabaseClient.auth.onAuthStateChange((event, session) => {
                updateAuthUI(!!session);
            });
        }
    } catch (error) {
        console.error('Auth initialization error:', error);
        // Default to guest mode
        updateAuthUI(false);
    }
}

// Check authentication state
function checkAuthState() {
    try {
        // Check multiple auth methods
        let isAuthenticated = false;
        
        // Method 1: Check localStorage
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
            isAuthenticated = true;
        }
        
        // Method 2: Check Supabase session
        if (typeof window.supabaseClient !== 'undefined') {
            window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
                updateAuthUI(!!session);
            });
            return;
        }
        
        // Update UI based on auth state
        updateAuthUI(isAuthenticated);
    } catch (error) {
        console.error('Auth state check error:', error);
        updateAuthUI(false);
    }
}

// Update UI based on authentication state
function updateAuthUI(isAuthenticated) {
    try {
        const guestElements = document.querySelectorAll('.guest-only');
        const memberElements = document.querySelectorAll('.member-only');
        
        if (isAuthenticated) {
            guestElements.forEach(el => el.style.display = 'none');
            memberElements.forEach(el => el.style.display = 'block');
        } else {
            guestElements.forEach(el => el.style.display = 'block');
            memberElements.forEach(el => el.style.display = 'none');
        }
    } catch (error) {
        console.error('UI update error:', error);
    }
}

// Particle animation for hero section
function createParticles() {
    try {
        const hero = document.querySelector('.hero');
        if (!hero) return;
        
        // Create particles container if it doesn't exist
        let particlesContainer = hero.querySelector('.hero-particles');
        if (!particlesContainer) {
            particlesContainer = document.createElement('div');
            particlesContainer.className = 'hero-particles';
            particlesContainer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1;
            `;
            hero.appendChild(particlesContainer);
        }

        const particleCount = 8;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                background: var(--gold);
                border-radius: 50%;
                opacity: 0.1;
                animation: float 6s ease-in-out infinite;
                width: ${Math.random() * 6 + 2}px;
                height: ${Math.random() * 6 + 2}px;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                animation-delay: ${Math.random() * 6}s;
            `;
            particlesContainer.appendChild(particle);
        }
        
        // Add CSS animation if not already present
        if (!document.getElementById('particle-animations')) {
            const style = document.createElement('style');
            style.id = 'particle-animations';
            style.textContent = `
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    33% { transform: translateY(-20px) rotate(120deg); }
                    66% { transform: translateY(20px) rotate(240deg); }
                }
            `;
            document.head.appendChild(style);
        }
    } catch (error) {
        console.error('Particle creation error:', error);
    }
}

// Contact form submission
async function submitContactForm(data) {
    try {
        // Try Supabase first
        if (typeof window.supabaseClient !== 'undefined') {
            const { error } = await window.supabaseClient
                .from('contact_submissions')
                .insert([{
                    name: data.name,
                    email: data.email,
                    phone: data.phone || null,
                    chapter_interest: data.chapter_interest || null,
                    message: data.message,
                    created_at: new Date().toISOString()
                }]);
            
            if (error) throw error;
            return true;
        }
        
        // Fallback: Create mailto link
        const subject = encodeURIComponent(`WCSC Brotherhood Contact: ${data.name}`);
        const body = encodeURIComponent(`
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}
Chapter Interest: ${data.chapter_interest || 'Not specified'}

Message:
${data.message}
        `);
        
        window.open(`mailto:joe.lafilm@gmail.com?subject=${subject}&body=${body}`);
        return true;
        
    } catch (error) {
        console.error('Contact form submission error:', error);
        throw error;
    }
}

// Utility functions
function showLoading(element) {
    if (element) {
        element.innerHTML = '<div class="loading-spinner"></div>';
        element.disabled = true;
    }
}

function hideLoading(element, originalText) {
    if (element) {
        element.innerHTML = originalText;
        element.disabled = false;
    }
}

// Enhanced API helper functions (backwards compatible)
const API = {
    baseURL: '/api',
    
    async get(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            return await response.json();
        } catch (error) {
            console.error('API GET error:', error);
            throw error;
        }
    },
    
    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API POST error:', error);
            throw error;
        }
    }
};

// Export for other modules
if (typeof window !== 'undefined') {
    window.WCSC = {
        API,
        checkAuthState,
        updateAuthUI,
        submitContactForm,
        showLoading,
        hideLoading
    };
}
