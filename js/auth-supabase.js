// Real authentication system using Supabase
// This replaces the mock authentication in auth.js

class SupabaseAuth {
    constructor() {
        this.user = null;
        this.session = null;
        this.userProfile = null;
        this.init();
    }

    async init() {
        // Check if Supabase is loaded
        if (typeof supabaseClient === 'undefined') {
            console.error('Supabase client not initialized. Make sure to include supabase.js before auth.js');
            return;
        }

        // Get current session
        const { data: { session } } = await supabaseClient.auth.getSession();
        this.session = session;
        this.user = session?.user || null;

        if (this.user) {
            await this.loadUserProfile();
        }

        this.setupEventListeners();
        this.setupAuthStateListener();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Registration form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Toggle between login and register
        const showRegisterBtn = document.getElementById('show-register');
        const showLoginBtn = document.getElementById('show-login');
        
        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegistrationForm();
            });
        }
        
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }

        // Protect member-only pages
        this.protectMemberPages();
    }

    setupAuthStateListener() {
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session);
            
            this.session = session;
            this.user = session?.user || null;
            
            if (event === 'SIGNED_IN' && this.user) {
                await this.loadUserProfile();
                this.updateUIForAuthenticatedUser();
            } else if (event === 'SIGNED_OUT') {
                this.userProfile = null;
                this.updateUIForGuestUser();
            }
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const credentials = {
            email: formData.get('email') || formData.get('username'),
            password: formData.get('password')
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        this.showLoading(submitBtn, 'Logging in...');

        try {
            let email = credentials.email;
            if (!email.includes('@')) {
                const { data: userLookup } = await supabaseClient
                    .from('users')
                    .select('email')
                    .eq('username', email)
                    .single();
                
                if (userLookup) {
                    email = userLookup.email;
                } else {
                    throw new Error('Username not found');
                }
            }

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: credentials.password
            });

            if (error) throw error;
            this.redirectAfterLogin();
            
        } catch (error) {
            console.error('Login error:', error);
            this.showError(error.message || 'Login failed. Please check your credentials.');
        } finally {
            this.hideLoading(submitBtn, 'Login');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        const registrationData = {
            email: formData.get('email'),
            password: formData.get('password'),
            username: formData.get('username'),
            fullName: formData.get('full_name'),
            phone: formData.get('phone'),
            chapter: formData.get('chapter'),
            bio: formData.get('bio')
        };

        const confirmPassword = formData.get('confirm_password');
        if (registrationData.password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        this.showLoading(submitBtn, 'Creating account...');

        try {
            const { data: existingUser } = await supabaseClient
                .from('users')
                .select('username')
                .eq('username', registrationData.username)
                .single();

            if (existingUser) {
                throw new Error('Username already taken');
            }

            const { data, error } = await supabaseClient.auth.signUp({
                email: registrationData.email,
                password: registrationData.password,
                options: {
                    data: {
                        username: registrationData.username,
                        full_name: registrationData.fullName,
                        phone: registrationData.phone,
                        chapter: registrationData.chapter,
                        bio: registrationData.bio
                    }
                }
            });

            if (error) throw error;

            this.showSuccess('Account created successfully! Please check your email to confirm your account.');
            setTimeout(() => this.showLoginForm(), 3000);
            
        } catch (error) {
            console.error('Registration error:', error);
            this.showError(error.message || 'Registration failed. Please try again.');
        } finally {
            this.hideLoading(submitBtn, 'Create Account');
        }
    }

    async loadUserProfile() {
        if (!this.user) return;

        try {
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('auth_id', this.user.id)
                .single();

            if (error) {
                console.error('Error loading user profile:', error);
                return;
            }

            this.userProfile = data;
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    async logout() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    checkAuthStatus() {
        if (this.isAuthenticated()) {
            this.updateUIForAuthenticatedUser();
        } else {
            this.updateUIForGuestUser();
        }
    }

    isAuthenticated() {
        return this.session && this.user;
    }

    isLeader() {
        return this.userProfile && (this.userProfile.role === 'leader' || this.userProfile.role === 'admin');
    }

    isAdmin() {
        return this.userProfile && this.userProfile.role === 'admin';
    }

    getCurrentUser() {
        return {
            auth: this.user,
            profile: this.userProfile
        };
    }

    updateUIForAuthenticatedUser() {
        const authButtons = document.querySelector('.auth-buttons');
        if (authButtons && this.userProfile) {
            authButtons.innerHTML = `
                <span class="user-greeting">Welcome, ${this.userProfile.full_name || this.userProfile.username}</span>
                <button id="logout-btn" class="btn btn-secondary">Logout</button>
            `;
            
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.logout());
            }
        }

        document.querySelectorAll('.member-only').forEach(el => {
            el.style.display = 'block';
        });

        if (this.isLeader()) {
            document.querySelectorAll('.leader-only').forEach(el => {
                el.style.display = 'block';
            });
        }

        document.querySelectorAll('.guest-only').forEach(el => {
            el.style.display = 'none';
        });
    }

    updateUIForGuestUser() {
        const authButtons = document.querySelector('.auth-buttons');
        if (authButtons) {
            authButtons.innerHTML = `
                <div class="guest-only">
                    <a href="/login.html" class="btn btn-primary">Member Login</a>
                </div>
            `;
        }

        document.querySelectorAll('.member-only').forEach(el => {
            el.style.display = 'none';
        });

        document.querySelectorAll('.leader-only').forEach(el => {
            el.style.display = 'none';
        });

        document.querySelectorAll('.guest-only').forEach(el => {
            el.style.display = 'block';
        });
    }

    protectMemberPages() {
        const memberPages = ['archives.html', 'calendar.html', 'scripture.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (memberPages.includes(currentPage) && !this.isAuthenticated()) {
            const currentUrl = window.location.href;
            window.location.href = `/login.html?redirect=${encodeURIComponent(currentUrl)}`;
        }
    }

    redirectAfterLogin() {
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || '/calendar.html';
        window.location.href = redirect;
    }

    showLoginForm() {
        const loginContainer = document.getElementById('login-container');
        const registerContainer = document.getElementById('register-container');
        
        if (loginContainer && registerContainer) {
            loginContainer.style.display = 'block';
            registerContainer.style.display = 'none';
        }
    }

    showRegistrationForm() {
        const loginContainer = document.getElementById('login-container');
        const registerContainer = document.getElementById('register-container');
        
        if (loginContainer && registerContainer) {
            loginContainer.style.display = 'none';
            registerContainer.style.display = 'block';
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
        const existingMessage = document.querySelector('.auth-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message ${type}-message`;
        messageDiv.textContent = message;

        const form = document.querySelector('#login-form, #register-form');
        if (form) {
            form.insertBefore(messageDiv, form.firstChild);
        }
        
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Enhanced permissions system
const SupabasePermissions = {
    canEditCalendar: (userProfile) => {
        return userProfile && (userProfile.role === 'leader' || userProfile.role === 'admin');
    },
    
    canViewArchives: (userProfile) => {
        return userProfile && ['member', 'leader', 'admin'].includes(userProfile.role);
    },
    
    canViewScripture: (userProfile) => {
        return userProfile && ['member', 'leader', 'admin'].includes(userProfile.role);
    },
    
    canCreateMeetingArchives: (userProfile) => {
        return userProfile && (userProfile.role === 'leader' || userProfile.role === 'admin');
    },
    
    canManageUsers: (userProfile) => {
        return userProfile && userProfile.role === 'admin';
    },
    
    canViewContactSubmissions: (userProfile) => {
        return userProfile && (userProfile.role === 'leader' || userProfile.role === 'admin');
    }
};

// API helper functions for database operations
const SupabaseAPI = {
    async getCurrentUserProfile() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return null;
        
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('auth_id', user.id)
            .single();
            
        if (error) throw error;
        return data;
    },

    async updateUserProfile(updates) {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        const { data, error } = await supabaseClient
            .from('users')
            .update(updates)
            .eq('auth_id', user.id)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },

    async getEvents(filters = {}) {
        let query = supabaseClient
            .from('events')
            .select('*')
            .order('start_date', { ascending: true });
            
        if (filters.chapter) {
            query = query.eq('chapter', filters.chapter);
        }
        
        if (filters.from_date) {
            query = query.gte('start_date', filters.from_date);
        }
        
        if (filters.to_date) {
            query = query.lte('start_date', filters.to_date);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async createEvent(eventData) {
        const { data, error } = await supabaseClient
            .from('events')
            .insert(eventData)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },

    async updateEvent(id, updates) {
        const { data, error } = await supabaseClient
            .from('events')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },

    async deleteEvent(id) {
        const { error } = await supabaseClient
            .from('events')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
    },

    async getMeetingArchives(filters = {}) {
        let query = supabaseClient
            .from('meeting_archives')
            .select('*')
            .order('meeting_date', { ascending: false });
            
        if (filters.chapter) {
            query = query.eq('chapter', filters.chapter);
        }
        
        if (filters.search) {
            return await this.searchMeetingArchives(filters.search, filters.chapter);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async searchMeetingArchives(searchTerm, chapter = null) {
        const { data, error } = await supabaseClient
            .rpc('search_meeting_archives', {
                search_term: searchTerm,
                user_chapter: chapter
            });
            
        if (error) throw error;
        return data;
    },

    async createMeetingArchive(archiveData) {
        const { data, error } = await supabaseClient
            .from('meeting_archives')
            .insert(archiveData)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },

    async getMeetingArchive(id) {
        const { data, error } = await supabaseClient
            .from('meeting_archives')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async getScripturePackages(filters = {}) {
        let query = supabaseClient
            .from('scripture_packages')
            .select('*')
            .eq('status', 'published')
            .order('week_date', { ascending: false });
            
        if (filters.chapter) {
            query = query.eq('chapter', filters.chapter);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async createScripturePackage(packageData) {
        const { data, error } = await supabaseClient
            .from('scripture_packages')
            .insert(packageData)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },

    async updateScripturePackage(id, updates) {
        const { data, error } = await supabaseClient
            .from('scripture_packages')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async submitContactForm(contactData) {
        const { data, error } = await supabaseClient
            .from('contact_submissions')
            .insert(contactData)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },

    async getContactSubmissions(filters = {}) {
        let query = supabaseClient
            .from('contact_submissions')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    }
};

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.supabaseAuth = new SupabaseAuth();
    window.SupabasePermissions = SupabasePermissions;
    window.SupabaseAPI = SupabaseAPI;
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SupabaseAuth, SupabasePermissions, SupabaseAPI };
}