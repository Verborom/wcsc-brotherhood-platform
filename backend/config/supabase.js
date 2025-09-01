// Secure Supabase configuration for WCSC Brotherhood Platform
// This version includes proper error handling and fallbacks

// Configuration - move to environment variables in production
const SUPABASE_CONFIG = {
    // These should be environment variables in production
    url: 'https://eynupzbomhcmbuiscxtl.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bnVwemJvbWhjbWJ1aXNjeHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2ODIzMDEsImV4cCI6MjA3MjI1ODMwMX0.0UWrebB0t9o5JtFs7vui9Yu95l4BMopugq0-AogNg3o'
};

// Initialize Supabase client with error handling
let supabaseClient = null;
let isSupabaseAvailable = false;

function initializeSupabase() {
    try {
        // Check if Supabase library is loaded
        if (typeof supabase === 'undefined') {
            console.warn('⚠️ Supabase library not loaded. Running in fallback mode.');
            return false;
        }

        // Create Supabase client
        supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });

        isSupabaseAvailable = true;
        
        // Export to global scope for other scripts
        if (typeof window !== 'undefined') {
            window.supabaseClient = supabaseClient;
            window.supabase = supabaseClient; // Also provide as window.supabase for consistency
            window.isSupabaseAvailable = isSupabaseAvailable;
        }

        console.log('✅ Supabase client initialized successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Supabase initialization error:', error);
        isSupabaseAvailable = false;
        return false;
    }
}

// Test Supabase connection with comprehensive error handling
async function testSupabaseConnection() {
    if (!supabaseClient) {
        console.log('⚠️ Supabase client not initialized. Running in fallback mode.');
        return false;
    }

    try {
        // Test with a simple query that should work even with empty tables
        const { data, error } = await supabaseClient.from('users').select('count', { count: 'exact', head: true });
        
        if (error) {
            // Handle specific error codes
            if (error.code === 'PGRST116') {
                // Table not found - expected for new setups
                console.log('✅ Supabase connected! Database tables will be created as needed.');
                return true;
            } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
                // Table doesn't exist yet - this is fine
                console.log('✅ Supabase connected! Tables will be created on first use.');
                return true;
            } else {
                console.error('❌ Supabase connection error:', error.message);
                return false;
            }
        } else {
            console.log('✅ Supabase connected successfully!');
            return true;
        }
    } catch (err) {
        console.error('❌ Supabase connection test failed:', err.message);
        return false;
    }
}

// Safe Supabase operations with fallback handling
const SafeSupabase = {
    // Check if Supabase is available
    isAvailable() {
        return isSupabaseAvailable && supabaseClient !== null;
    },

    // Get the client
    getClient() {
        return supabaseClient;
    },

    // Safe authentication check
    async getUser() {
        if (!this.isAvailable()) {
            return { user: null, session: null };
        }

        try {
            const { data, error } = await supabaseClient.auth.getUser();
            if (error) throw error;
            return { user: data.user, session: null };
        } catch (error) {
            console.error('Auth check error:', error);
            return { user: null, session: null };
        }
    },

    // Safe session check
    async getSession() {
        if (!this.isAvailable()) {
            return { session: null };
        }

        try {
            const { data, error } = await supabaseClient.auth.getSession();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Session check error:', error);
            return { session: null };
        }
    },

    // Safe database insert
    async insert(table, data) {
        if (!this.isAvailable()) {
            throw new Error('Supabase not available - using fallback method');
        }

        try {
            const { data: result, error } = await supabaseClient
                .from(table)
                .insert(data);
            
            if (error) throw error;
            return result;
        } catch (error) {
            console.error(`Database insert error (${table}):`, error);
            throw error;
        }
    },

    // Safe database select
    async select(table, query = '*', filters = {}) {
        if (!this.isAvailable()) {
            throw new Error('Supabase not available');
        }

        try {
            let queryBuilder = supabaseClient.from(table).select(query);
            
            // Apply filters
            Object.entries(filters).forEach(([key, value]) => {
                queryBuilder = queryBuilder.eq(key, value);
            });
            
            const { data, error } = await queryBuilder;
            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`Database select error (${table}):`, error);
            throw error;
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Initializing Supabase configuration...');
    
    const initialized = initializeSupabase();
    
    if (initialized) {
        // Test connection after a brief delay
        setTimeout(async () => {
            const connected = await testSupabaseConnection();
            if (connected) {
                console.log('🚀 Backend ready for full functionality');
                // Trigger any auth-dependent UI updates
                if (typeof window.WCSC !== 'undefined' && window.WCSC.checkAuthState) {
                    window.WCSC.checkAuthState();
                }
            } else {
                console.log('⚠️ Backend connection issues - running in fallback mode');
            }
        }, 1000);
    } else {
        console.log('⚠️ Supabase unavailable - all features will use fallback methods');
    }
});

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.SafeSupabase = SafeSupabase;
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SafeSupabase, SUPABASE_CONFIG };
}