// Registration handler for WCSC Brotherhood Platform
// This script handles both login and registration forms

class RegistrationHandler {
    constructor() {
        this.init();
    }

    init() {
        this.setupFormHandlers();
        this.setupFormToggle();
        
        // Wait for auth system to initialize
        this.waitForAuth();
    }

    async waitForAuth() {
        let attempts = 0;
        while (!window.wcscAuth && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }
        
        if (window.wcscAuth) {
            console.log('✅ Auth system ready for registration');
        } else {
            console.warn('⚠️ Auth system not available, using fallback');
        }
    }

    setupFormHandlers() {
        // Registration form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegistration(e));
        }

        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    setupFormToggle() {
        const showRegisterBtn = document.getElementById('show-register');
        const showLoginBtn = document.getElementById('show-login');
        const loginContainer = document.getElementById('login-container');
        const registerContainer = document.getElementById('register-container');

        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (loginContainer) loginContainer.style.display = 'none';
                if (registerContainer) registerContainer.style.display = 'block';
            });
        }

        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (registerContainer) registerContainer.style.display = 'none';
                if (loginContainer) loginContainer.style.display = 'block';
            });
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        const email = formData.get('email');
        const password = formData.get('password');

        const submitBtn = form.querySelector('button[type="submit"]');
        this.showLoading(submitBtn, 'Logging in...');

        try {
            if (window.wcscAuth) {
                const user = await window.wcscAuth.login(email, password);
                this.showSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                throw new Error('Authentication system not available');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError(error.message || 'Login failed. Please check your credentials.');
        } finally {
            this.hideLoading(submitBtn, 'Login');
        }
    }

    async handleRegistration(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        // Get form data
        const registrationData = {
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirm_password'),
            fullName: formData.get('full_name'),
            username: formData.get('username'),
            phone: formData.get('phone'),
            chapter: formData.get('chapter'),
            bio: formData.get('bio')
        };

        // Validation
        if (!this.validateRegistration(registrationData)) {
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        this.showLoading(submitBtn, 'Creating account...');

        try {
            if (window.wcscAuth) {
                const result = await window.wcscAuth.signup(registrationData);
                
                if (result.user) {
                    this.showSuccess('Account created successfully! Please check your email to verify your account.');
                    // Clear the form
                    form.reset();
                    // Switch to login form after 3 seconds
                    setTimeout(() => {
                        this.switchToLogin();
                    }, 3000);
                } else {
                    throw new Error('Registration failed - no user returned');
                }
            } else {
                // Fallback registration
                await this.fallbackRegistration(registrationData);
                this.showSuccess('Account created successfully! You can now log in.');
                setTimeout(() => {
                    this.switchToLogin();
                }, 2000);
            }
        } catch (error) {
            console.error('Registration error:', error);
            
            let errorMessage = error.message || 'Registration failed. Please try again.';
            
            // Handle common Supabase errors
            if (errorMessage.includes('already registered')) {
                errorMessage = 'An account with this email already exists.';
            } else if (errorMessage.includes('password')) {
                errorMessage = 'Password must be at least 8 characters long.';
            } else if (errorMessage.includes('email')) {
                errorMessage = 'Please enter a valid email address.';
            }
            
            this.showError(errorMessage);
        } finally {
            this.hideLoading(submitBtn, 'Create Account');
        }
    }

    validateRegistration(data) {
        // Check required fields
        if (!data.email || !data.password || !data.fullName || !data.username || !data.chapter) {
            this.showError('Please fill in all required fields.');
            return false;
        }

        // Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            this.showError('Please enter a valid email address.');
            return false;
        }

        // Check password length
        if (data.password.length < 8) {
            this.showError('Password must be at least 8 characters long.');
            return false;
        }

        // Check password confirmation
        if (data.password !== data.confirmPassword) {
            this.showError('Passwords do not match.');
            return false;
        }

        // Check terms agreement
        const termsCheckbox = document.getElementById('terms-agreement');
        if (termsCheckbox && !termsCheckbox.checked) {
            this.showError('Please agree to the brotherhood principles.');
            return false;
        }

        return true;
    }

    async fallbackRegistration(data) {
        // Fallback registration for when Supabase is not available
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const users = JSON.parse(localStorage.getItem('wcsc_users') || '{}');
                    
                    if (users[data.email]) {
                        reject(new Error('User already exists'));
                        return;
                    }
                    
                    const newUser = {
                        id: Date.now().toString(),
                        email: data.email,
                        password: data.password, // In real app, this would be hashed
                        fullName: data.fullName,
                        username: data.username,
                        phone: data.phone,
                        chapter: data.chapter,
                        bio: data.bio,
                        role: 'member',
                        createdAt: new Date().toISOString()
                    };
                    
                    users[data.email] = newUser;
                    localStorage.setItem('wcsc_users', JSON.stringify(users));
                    
                    resolve({ user: newUser });
                } catch (error) {
                    reject(error);
                }
            }, 1000);
        });
    }

    switchToLogin() {
        const loginContainer = document.getElementById('login-container');
        const registerContainer = document.getElementById('register-container');
        
        if (loginContainer && registerContainer) {
            registerContainer.style.display = 'none';
            loginContainer.style.display = 'block';
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
        // Remove existing messages
        const existingMessage = document.querySelector('.auth-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message ${type}-message`;
        messageDiv.textContent = message;

        // Insert message at the top of the visible form
        const visibleContainer = document.getElementById('login-container').style.display !== 'none' 
            ? document.getElementById('login-container')
            : document.getElementById('register-container');
            
        if (visibleContainer) {
            visibleContainer.insertBefore(messageDiv, visibleContainer.firstChild);
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    new RegistrationHandler();
});

// Make it available globally if needed
window.RegistrationHandler = RegistrationHandler;