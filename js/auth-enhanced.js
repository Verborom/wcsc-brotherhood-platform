// Enhanced Authentication System for WCSC Brotherhood Platform

class WCSCAuthentication {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.adminEmails = [
            'joe.lafilm@gmail.com',  // Your email
            'eitan@example.com'      // Eitan's email - UPDATE THIS TO HIS REAL EMAIL
        ];
        this.init();
    }

    async init() {
        // Wait for Supabase to be initialized
        await this.initializeSupabase();
        await this.checkAuthState();
        this.updateUI();
        this.setupProfileDropdown();
    }

    async initializeSupabase() {
        // Check if Supabase is available from the config file
        if (window.supabaseClient) {
            this.supabase = window.supabaseClient;
            console.log('✅ Using Supabase client from config');
        } else if (window.supabase) {
            // Fallback to global supabase
            this.supabase = window.supabase;
            console.log('✅ Using global Supabase client');
        } else {
            // Wait a bit for scripts to load
            console.log('⏳ Waiting for Supabase to initialize...');
            let attempts = 0;
            while (attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 500));
                if (window.supabaseClient) {
                    this.supabase = window.supabaseClient;
                    console.log('✅ Supabase client found after waiting');
                    break;
                } else if (window.supabase) {
                    this.supabase = window.supabase;
                    console.log('✅ Global Supabase found after waiting');
                    break;
                }
                attempts++;
            }
            
            if (!this.supabase) {
                console.warn('⚠️ Supabase not available - using fallback authentication');
            }
        }
    }

    async checkAuthState() {
        if (this.supabase) {
            try {
                const { data: { user } } = await this.supabase.auth.getUser();
                this.currentUser = user;
            } catch (error) {
                console.error('Auth state check failed:', error);
                this.currentUser = null;
            }
        } else {
            // Fallback for demo/development
            const userData = localStorage.getItem('wcsc_current_user');
            this.currentUser = userData ? JSON.parse(userData) : null;
        }
    }

    updateUI() {
        const guestElements = document.querySelectorAll('.guest-only');
        const memberElements = document.querySelectorAll('.member-only');
        
        if (this.currentUser) {
            // Hide guest elements, show member elements
            guestElements.forEach(el => el.style.display = 'none');
            memberElements.forEach(el => el.style.display = 'block');
            
            // Update profile information
            this.updateProfileDisplay();
            
            // Show admin features if user is admin
            this.updateAdminUI();
        } else {
            // Show guest elements, hide member elements
            guestElements.forEach(el => el.style.display = 'block');
            memberElements.forEach(el => el.style.display = 'none');
        }
    }

    updateProfileDisplay() {
        const profileName = document.getElementById('profileName');
        const profileAvatar = document.getElementById('profileAvatar');
        const memberName = document.getElementById('memberName');

        let firstName = 'Brother';
        
        if (this.supabase && this.currentUser?.user_metadata) {
            firstName = this.currentUser.user_metadata.firstName || 
                       this.currentUser.user_metadata.full_name?.split(' ')[0] || 
                       'Brother';
        } else if (this.currentUser?.firstName) {
            firstName = this.currentUser.firstName;
        }

        if (profileName) profileName.textContent = firstName;
        if (profileAvatar) profileAvatar.textContent = firstName.charAt(0).toUpperCase();
        if (memberName) memberName.textContent = firstName;
    }

    updateAdminUI() {
        if (this.isAdmin()) {
            // Show admin upload button on archives page
            const adminUploadBtn = document.getElementById('adminUploadBtn');
            if (adminUploadBtn) {
                adminUploadBtn.style.display = 'block';
            }
            
            // Show admin features on calendar
            const adminCalendarFeatures = document.querySelectorAll('.admin-only');
            adminCalendarFeatures.forEach(el => el.style.display = 'block');
        }
    }

    setupProfileDropdown() {
        const profileButton = document.getElementById('profileButton');
        const profileDropdown = document.getElementById('profileDropdown');
        const profileMenu = document.getElementById('profileMenu');

        if (profileButton && (profileDropdown || profileMenu)) {
            profileButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = profileDropdown || profileMenu;
                dropdown.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                const dropdown = profileDropdown || profileMenu;
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove('active');
                }
            });
        }
    }

    isAdmin() {
        if (!this.currentUser) return false;
        
        const userEmail = this.currentUser.email || this.currentUser.user_metadata?.email;
        return this.adminEmails.includes(userEmail);
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    async login(email, password) {
        if (this.supabase) {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            this.currentUser = data.user;
            this.updateUI();
            return data.user;
        } else {
            // Demo fallback
            return this.demoLogin(email, password);
        }
    }

    async signup(userData) {
        if (this.supabase) {
            // Map form data to the correct structure
            const { data, error } = await this.supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        full_name: userData.fullName || userData.full_name,
                        username: userData.username,
                        phone: userData.phone,
                        chapter: userData.chapter,
                        bio: userData.bio,
                        // Legacy support for other field names
                        firstName: userData.firstName || userData.fullName?.split(' ')[0] || userData.full_name?.split(' ')[0],
                        lastName: userData.lastName || userData.fullName?.split(' ').slice(1).join(' ') || userData.full_name?.split(' ').slice(1).join(' '),
                        city: userData.city,
                        state: userData.state,
                        age: userData.age,
                        occupation: userData.occupation,
                        church: userData.church,
                        referralSource: userData.referralSource,
                        motivation: userData.motivation,
                        role: 'member',
                        joinedAt: new Date().toISOString()
                    }
                }
            });
            
            if (error) throw error;
            return data;
        } else {
            // Demo fallback
            return this.demoSignup(userData);
        }
    }

    async logout() {
        if (this.supabase) {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
        }
        
        // Clear local storage
        localStorage.removeItem('wcsc_current_user');
        
        this.currentUser = null;
        this.updateUI();
        
        // Redirect to home
        window.location.href = 'index.html';
    }

    // Demo/Development fallback methods
    demoLogin(email, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const users = JSON.parse(localStorage.getItem('wcsc_users') || '{}');
                if (users[email] && users[email].password === password) {
                    this.currentUser = users[email];
                    localStorage.setItem('wcsc_current_user', JSON.stringify(users[email]));
                    this.updateUI();
                    resolve(users[email]);
                } else {
                    reject(new Error('Invalid email or password'));
                }
            }, 1000);
        });
    }

    demoSignup(userData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const users = JSON.parse(localStorage.getItem('wcsc_users') || '{}');
                    
                    // Check if user already exists
                    if (users[userData.email]) {
                        reject(new Error('User already exists'));
                        return;
                    }
                    
                    // Create new user
                    const newUser = {
                        ...userData,
                        id: Date.now().toString(),
                        createdAt: new Date().toISOString(),
                        role: 'member'
                    };
                    
                    users[userData.email] = newUser;
                    localStorage.setItem('wcsc_users', JSON.stringify(users));
                    
                    resolve({ user: newUser });
                } catch (error) {
                    reject(error);
                }
            }, 1500);
        });
    }

    // Route protection methods
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    requireAdmin() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        
        if (!this.isAdmin()) {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'dashboard.html';
            return false;
        }
        
        return true;
    }

    // Utility methods
    getUserData() {
        return this.currentUser;
    }

    getUserName() {
        if (!this.currentUser) return 'Guest';
        
        if (this.supabase && this.currentUser.user_metadata) {
            return this.currentUser.user_metadata.firstName || 
                   this.currentUser.user_metadata.full_name?.split(' ')[0] || 
                   'Brother';
        }
        
        return this.currentUser.firstName || 'Brother';
    }

    getUserEmail() {
        if (!this.currentUser) return null;
        return this.currentUser.email || this.currentUser.user_metadata?.email;
    }

    getUserRole() {
        if (!this.currentUser) return 'guest';
        return this.isAdmin() ? 'admin' : 'member';
    }

    // Event listeners for auth state changes
    onAuthStateChange(callback) {
        if (this.supabase) {
            this.supabase.auth.onAuthStateChange((event, session) => {
                this.currentUser = session?.user || null;
                this.updateUI();
                callback(event, session);
            });
        }
    }
}

// Global functions that can be called from HTML
async function logoutUser() {
    if (window.wcscAuth) {
        await window.wcscAuth.logout();
    }
}

function requireAuth() {
    return window.wcscAuth ? window.wcscAuth.requireAuth() : false;
}

function requireAdmin() {
    return window.wcscAuth ? window.wcscAuth.requireAdmin() : false;
}

function isAdmin() {
    return window.wcscAuth ? window.wcscAuth.isAdmin() : false;
}

function isAuthenticated() {
    return window.wcscAuth ? window.wcscAuth.isAuthenticated() : false;
}

function getUserData() {
    return window.wcscAuth ? window.wcscAuth.getUserData() : null;
}

// Initialize authentication system
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        window.wcscAuth = new WCSCAuthentication();
        
        // Set up auth state monitoring if Supabase is available
        if (window.wcscAuth.supabase) {
            window.wcscAuth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event, session);
                
                if (event === 'SIGNED_OUT') {
                    window.location.href = 'index.html';
                }
            });
        }
    }, 100);
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WCSCAuthentication;
}