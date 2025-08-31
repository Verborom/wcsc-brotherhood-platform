// Supabase configuration for WCSC Brotherhood Platform
const SUPABASE_URL = 'https://eynupzbomhcmbuiscxtl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bnVwemJvbWhjbWJ1aXNjeHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2ODIzMDEsImV4cCI6MjA3MjI1ODMwMX0.0UWrebB0t9o5JtFs7vui9Yu95l4BMopugq0-AogNg3o';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.supabaseClient = supabaseClient;
    window.SUPABASE_URL = SUPABASE_URL;
    window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
}

// Test connection function
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabaseClient.from('users').select('count').limit(1);
        if (error && error.code === 'PGRST116') {
            console.log('✅ Supabase connected! (Empty table is expected)');
            return true;
        } else if (error) {
            console.error('❌ Supabase connection error:', error);
            return false;
        } else {
            console.log('✅ Supabase connected successfully!');
            return true;
        }
    } catch (err) {
        console.error('❌ Supabase connection failed:', err);
        return false;
    }
}

// Auto-test connection when loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(testSupabaseConnection, 1000);
});
