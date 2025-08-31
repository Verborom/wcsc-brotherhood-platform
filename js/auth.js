// Authentication system

class Auth {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Protect member-only pages
        this.protectMemberPages();
    }

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        showLoading(submitBtn);

        try {
            // TODO: Replace with actual API call
            const response = await this.mockLogin(credentials);
            
            if (response.success) {
                this.setAuthData(response.token, response.user);
                this.redirectAfterLogin();
            } else {
                this.showError('Invalid credentials');
            }
        } catch (error) {
            this.showError('Login failed. Please try again.');
        } finally {
            hideLoading(submitBtn, 'Login');
        }
    }

    async mockLogin(credentials) {
        // Mock authentication - replace with real API
        return new Promise((resolve) => {
            setTimeout(() => {
                if (credentials.username === 'member' && credentials.password === 'wcsc2025') {
                    resolve({
                        success: true,
                        token: 'mock-jwt-token',
                        user: {
                            id: 1,
                            username: 'member',
                            role: 'member',
                            chapter: 'Georgetown'
                        }
                    });
                } else if (credentials.username === 'leader' && credentials.password === 'leadership') {
                    resolve({
                        success: true,
                        token: 'mock-jwt-token-leader',
                        user: {
                            id: 2,
                            username: 'leader',
                            role: 'leader',
                            chapter: 'Georgetown'
                        }
                    });
                } else {
                    resolve({ success: false });
                }
            }, 1000);
        });
    }

    setAuthData(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/';
    }

    checkAuthStatus() {
        if (this.isAuthenticated()) {
            this.updateUIForAuthenticatedUser();
        }
    }

    isAuthenticated() {
        return this.token && this.user;
    }

    isLeader() {
        return this.user && this.user.role === 'leader';
    }

    updateUIForAuthenticatedUser() {
        // Update navigation
        const authButtons = document.querySelector('.auth-buttons');
        if (authButtons) {
            authButtons.innerHTML = `
                <span class="user-greeting">Welcome, ${this.user.username}</span>
                <button id="logout-btn" class="btn btn-secondary">Logout</button>
            `;
        }

        // Show member-only content
        document.querySelectorAll('.member-only').forEach(el => {
            el.style.display = 'block';
        });

        // Show leader-only content
        if (this.isLeader()) {
            document.querySelectorAll('.leader-only').forEach(el => {
                el.style.display = 'block';
            });
        }
    }

    protectMemberPages() {
        const memberPages = ['archives.html', 'calendar.html', 'scripture.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (memberPages.includes(currentPage) && !this.isAuthenticated()) {
            window.location.href = '/login.html';
        }
    }

    redirectAfterLogin() {
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || '/calendar.html';
        window.location.href = redirect;
    }

    showError(message) {
        // Create or update error message
        let errorDiv = document.getElementById('auth-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'auth-error';
            errorDiv.className = 'error-message';
            const form = document.getElementById('login-form');
            if (form) {
                form.insertBefore(errorDiv, form.firstChild);
            }
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

// User permissions helper
const Permissions = {
    canEditCalendar: (user) => {
        return user && user.role === 'leader';
    },
    
    canViewArchives: (user) => {
        return user && (user.role === 'member' || user.role === 'leader');
    },
    
    canViewScripture: (user) => {
        return user && (user.role === 'member' || user.role === 'leader');
    }
};

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.auth = new Auth();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Auth, Permissions };
}