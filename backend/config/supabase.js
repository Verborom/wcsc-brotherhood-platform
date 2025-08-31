// Supabase configuration and initialization
// This file handles the connection to your Supabase backend

// Supabase credentials (you'll need to replace these with your actual project details)
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database configuration
const DB_CONFIG = {
    // User management
    users: {
        table: 'users',
        fields: {
            id: 'uuid PRIMARY KEY DEFAULT uuid_generate_v4()',
            email: 'varchar UNIQUE NOT NULL',
            username: 'varchar UNIQUE NOT NULL',
            full_name: 'varchar NOT NULL',
            phone: 'varchar',
            role: "varchar DEFAULT 'member' CHECK (role IN ('member', 'leader', 'admin'))",
            chapter: 'varchar NOT NULL',
            profile_image: 'text',
            bio: 'text',
            prayer_requests: 'text[]',
            created_at: 'timestamp DEFAULT now()',
            updated_at: 'timestamp DEFAULT now()'
        }
    },
    
    // Calendar events
    events: {
        table: 'events',
        fields: {
            id: 'uuid PRIMARY KEY DEFAULT uuid_generate_v4()',
            title: 'varchar NOT NULL',
            description: 'text',
            event_type: "varchar CHECK (event_type IN ('meeting', 'service', 'fellowship', 'study'))",
            start_date: 'timestamp NOT NULL',
            end_date: 'timestamp',
            location: 'varchar',
            chapter: 'varchar NOT NULL',
            created_by: 'uuid REFERENCES users(id)',
            attendees: 'uuid[] DEFAULT ARRAY[]::uuid[]',
            is_recurring: 'boolean DEFAULT false',
            recurrence_rule: 'text',
            created_at: 'timestamp DEFAULT now()',
            updated_at: 'timestamp DEFAULT now()'
        }
    },
    
    // Meeting archives
    meeting_archives: {
        table: 'meeting_archives',
        fields: {
            id: 'uuid PRIMARY KEY DEFAULT uuid_generate_v4()',
            meeting_date: 'date NOT NULL',
            chapter: 'varchar NOT NULL',
            meeting_type: "varchar DEFAULT 'weekly' CHECK (meeting_type IN ('weekly', 'special', 'leadership'))",
            notes: 'text NOT NULL',
            transcript: 'text',
            ai_summary: 'text',
            scripture_references: 'text[]',
            action_items: 'jsonb DEFAULT \'[]\'::\"jsonb\"',
            attendees: 'uuid[] DEFAULT ARRAY[]::uuid[]',
            created_by: 'uuid REFERENCES users(id)',
            tags: 'varchar[]',
            created_at: 'timestamp DEFAULT now()',
            updated_at: 'timestamp DEFAULT now()'
        }
    },
    
    // Scripture packages
    scripture_packages: {
        table: 'scripture_packages',
        fields: {
            id: 'uuid PRIMARY KEY DEFAULT uuid_generate_v4()',
            week_date: 'date NOT NULL',
            chapter: 'varchar NOT NULL',
            title: 'varchar NOT NULL',
            theme: 'varchar',
            primary_passages: 'jsonb NOT NULL', // {book, chapter, verses, translation}
            hebrew_analysis: 'jsonb DEFAULT \'{}\'::\"jsonb\"',
            greek_analysis: 'jsonb DEFAULT \'{}\'::\"jsonb\"',
            aramaic_analysis: 'jsonb DEFAULT \'{}\'::\"jsonb\"',
            commentary: 'text',
            reflection_questions: 'text[]',
            prayer_focus: 'text',
            based_on_meeting: 'uuid REFERENCES meeting_archives(id)',
            created_by: 'uuid REFERENCES users(id)',
            created_at: 'timestamp DEFAULT now()',
            updated_at: 'timestamp DEFAULT now()'
        }
    },
    
    // Contact submissions
    contact_submissions: {
        table: 'contact_submissions',
        fields: {
            id: 'uuid PRIMARY KEY DEFAULT uuid_generate_v4()',
            name: 'varchar NOT NULL',
            email: 'varchar NOT NULL',
            phone: 'varchar',
            chapter_interest: 'varchar',
            message: 'text NOT NULL',
            status: "varchar DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'closed'))",
            assigned_to: 'uuid REFERENCES users(id)',
            notes: 'text',
            created_at: 'timestamp DEFAULT now()',
            updated_at: 'timestamp DEFAULT now()'
        }
    }
};

// Row Level Security Policies
const RLS_POLICIES = {
    users: {
        select: 'auth.uid()::text = id::text OR role = \'leader\' OR role = \'admin\'',
        insert: 'auth.uid() IS NOT NULL',
        update: 'auth.uid()::text = id::text OR role = \'leader\' OR role = \'admin\'',
        delete: 'role = \'admin\''
    },
    events: {
        select: 'TRUE', // All authenticated users can view events
        insert: 'auth.uid() IN (SELECT id FROM users WHERE role IN (\'leader\', \'admin\'))',
        update: 'auth.uid() IN (SELECT id FROM users WHERE role IN (\'leader\', \'admin\'))',
        delete: 'auth.uid() IN (SELECT id FROM users WHERE role IN (\'leader\', \'admin\'))'
    },
    meeting_archives: {
        select: 'auth.uid() IS NOT NULL', // All members can view
        insert: 'auth.uid() IN (SELECT id FROM users WHERE role IN (\'leader\', \'admin\'))',
        update: 'auth.uid() IN (SELECT id FROM users WHERE role IN (\'leader\', \'admin\'))',
        delete: 'auth.uid() IN (SELECT id FROM users WHERE role IN (\'admin\'))'
    },
    scripture_packages: {
        select: 'auth.uid() IS NOT NULL',
        insert: 'auth.uid() IN (SELECT id FROM users WHERE role IN (\'leader\', \'admin\'))',
        update: 'auth.uid() IN (SELECT id FROM users WHERE role IN (\'leader\', \'admin\'))',
        delete: 'auth.uid() IN (SELECT id FROM users WHERE role IN (\'admin\'))'
    },
    contact_submissions: {
        select: 'auth.uid() IN (SELECT id FROM users WHERE role IN (\'leader\', \'admin\'))',
        insert: 'TRUE', // Anyone can submit contact forms
        update: 'auth.uid() IN (SELECT id FROM users WHERE role IN (\'leader\', \'admin\'))',
        delete: 'auth.uid() IN (SELECT id FROM users WHERE role IN (\'admin\'))'
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.supabaseClient = supabaseClient;
    window.DB_CONFIG = DB_CONFIG;
    window.RLS_POLICIES = RLS_POLICIES;
} else if (typeof module !== 'undefined') {
    module.exports = { supabaseClient, DB_CONFIG, RLS_POLICIES };
}