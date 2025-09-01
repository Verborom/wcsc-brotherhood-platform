// Main JavaScript - ENHANCED PARALLAX VERSION

// Ensure DOM is fully loaded before executing any code
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 WCSC Brotherhood Platform - Enhanced Version Loading...');
    
    try {
        initializeBasicFunctionality();
        initializeParallaxEffects();
        initializeNavigation();
        initializeAnimations();
        initializeContactForm();
        initializeAuthStateChecks();
        
        console.log('✅ Enhanced functionality initialized successfully');
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
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.offsetTop - navHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Create floating particles for hero section
    createEnhancedParticles();
}

// PARALLAX EFFECTS
function initializeParallaxEffects() {
    const parallaxBg = document.querySelector('.parallax-bg');
    const heroContent = document.querySelector('.hero-content');
    
    if (!parallaxBg || !heroContent) return;
    
    // Parallax scroll handler
    function handleParallaxScroll() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        const contentRate = scrolled * 0.1;
        
        // Apply parallax transform
        parallaxBg.style.transform = `translateY(${rate}px)`;
        
        // Subtle content parallax
        if (scrolled < window.innerHeight) {
            heroContent.style.transform = `translateY(${contentRate}px)`;
            heroContent.style.opacity = 1 - (scrolled / window.innerHeight) * 0.8;
        }
    }
    
    // Use requestAnimationFrame for smooth performance
    let ticking = false;
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(handleParallaxScroll);
            ticking = true;
        }
    }
    
    function endTick() {
        ticking = false;
    }
    
    window.addEventListener('scroll', () => {
        requestTick();
        setTimeout(endTick, 16);
    });
    
    // Initial call
    handleParallaxScroll();
}

// Navigation functionality
function initializeNavigation() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    // Navbar scroll effect with enhanced performance
    let lastScrollTop = 0;
    let scrollTimer = null;
    
    function updateNavbar() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
    }
    
    window.addEventListener('scroll', () => {
        if (scrollTimer !== null) {
            clearTimeout(scrollTimer);
        }
        
        scrollTimer = setTimeout(updateNavbar, 10);
    });
    
    // Initial call
    updateNavbar();
}

// Animation functionality
function initializeAnimations() {
    try {
        // Enhanced reveal animations on scroll
        const observerOptions = {
            threshold: [0.1, 0.3],
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    
                    // Add special effects for cards
                    if (entry.target.classList.contains('card')) {
                        setTimeout(() => {
                            entry.target.style.transform = 'translateY(0)';
                        }, 100);
                    }
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

// Enhanced Particle System
function createEnhancedParticles() {
    try {
        const hero = document.querySelector('.parallax-hero');
        if (!hero) return;
        
        let particlesContainer = hero.querySelector('.hero-particles');
        if (!particlesContainer) {
            particlesContainer = document.createElement('div');
            particlesContainer.className = 'hero-particles';
            hero.appendChild(particlesContainer);
        }

        // Clear existing particles
        particlesContainer.innerHTML = '';

        const particleCount = 12;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = Math.random() * 4 + 2;
            const initialX = Math.random() * 100;
            const initialY = Math.random() * 100;
            const animationDelay = Math.random() * 8;
            const animationDuration = 6 + Math.random() * 4;
            
            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: var(--gold);
                border-radius: 50%;
                opacity: 0.1;
                top: ${initialY}%;
                left: ${initialX}%;
                animation: floatParticles ${animationDuration}s ease-in-out infinite;
                animation-delay: ${animationDelay}s;
                pointer-events: none;
            `;
            
            particlesContainer.appendChild(particle);
            particles.push({
                element: particle,
                x: initialX,
                y: initialY,
                size: size
            });
        }
        
        // Add mouse interaction
        hero.addEventListener('mousemove', (e) => {
            const rect = hero.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
            const mouseY = ((e.clientY - rect.top) / rect.height) * 100;
            
            particles.forEach((particle, index) => {
                const distance = Math.sqrt(
                    Math.pow(mouseX - particle.x, 2) + Math.pow(mouseY - particle.y, 2)
                );
                
                if (distance < 20) {
                    const angle = Math.atan2(mouseY - particle.y, mouseX - particle.x);
                    const push = Math.max(0, 20 - distance) * 0.5;
                    
                    const newX = particle.x - Math.cos(angle) * push;
                    const newY = particle.y - Math.sin(angle) * push;
                    
                    particle.element.style.transform = `translate(${newX - particle.x}px, ${newY - particle.y}px)`;
                    particle.element.style.opacity = '0.3';
                }
            });
        });
        
    } catch (error) {
        console.error('Enhanced particle creation error:', error);
    }
}

// Contact form functionality
function initializeContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const button = this.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        
        try {
            // Enhanced loading state
            button.innerHTML = '<span class="loading-spinner"></span> Sending...';
            button.disabled = true;
            button.style.opacity = '0.8';
            
            // Get form data
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Try to submit with backend, fallback to email
            submitContactForm(data)
                .then(() => {
                    button.innerHTML = '✓ Message Sent Successfully!';
                    button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                    button.style.opacity = '1';
                    
                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.disabled = false;
                        button.style.background = '';
                        button.style.opacity = '';
                        this.reset();
                    }, 3000);
                })
                .catch((error) => {
                    console.error('Form submission error:', error);
                    button.innerHTML = '✓ Received! (Contact via Email)';
                    button.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                    button.style.opacity = '1';
                    
                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.disabled = false;
                        button.style.background = '';
                        button.style.opacity = '';
                        this.reset();
                    }, 3000);
                });
        } catch (error) {
            console.error('Contact form error:', error);
            button.innerHTML = originalText;
            button.disabled = false;
            button.style.opacity = '';
        }
    });
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

Message:
${data.message}

-- Sent from WCSC Brotherhood Platform
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

// Performance monitoring
function logPerformance() {
    if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        console.log(`🚀 Page loaded in ${loadTime}ms`);
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

// Page loaded callback
window.addEventListener('load', () => {
    logPerformance();
    
    // Final initialization
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

// Export for other modules
if (typeof window !== 'undefined') {
    window.WCSC = {
        API,
        checkAuthState,
        updateAuthUI,
        submitContactForm,
        showLoading,
        hideLoading,
        initializeParallaxEffects,
        createEnhancedParticles
    };
}
