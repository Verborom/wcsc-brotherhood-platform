-- WCSC Brotherhood Platform Database Schema
-- This file contains the complete database structure for Supabase

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE user_role AS ENUM ('member', 'leader', 'admin');
CREATE TYPE event_type AS ENUM ('meeting', 'service', 'fellowship', 'study');
CREATE TYPE meeting_type AS ENUM ('weekly', 'special', 'leadership');
CREATE TYPE contact_status AS ENUM ('new', 'contacted', 'scheduled', 'closed');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR NOT NULL,
    phone VARCHAR,
    role user_role DEFAULT 'member',
    chapter VARCHAR NOT NULL,
    profile_image TEXT,
    bio TEXT,
    prayer_requests TEXT[],
    emergency_contact JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Events/Calendar table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR NOT NULL,
    description TEXT,
    event_type event_type NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    location VARCHAR,
    chapter VARCHAR NOT NULL,
    created_by UUID REFERENCES users(id),
    attendees UUID[] DEFAULT ARRAY[]::UUID[],
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT,
    max_attendees INTEGER,
    requires_rsvp BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Meeting archives
CREATE TABLE meeting_archives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_date DATE NOT NULL,
    chapter VARCHAR NOT NULL,
    meeting_type meeting_type DEFAULT 'weekly',
    title VARCHAR,
    notes TEXT NOT NULL,
    transcript TEXT,
    ai_summary TEXT,
    scripture_references TEXT[],
    action_items JSONB DEFAULT '[]',
    attendees UUID[] DEFAULT ARRAY[]::UUID[],
    facilitator UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    tags VARCHAR[],
    attachments JSONB DEFAULT '[]',
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Scripture packages
CREATE TABLE scripture_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_date DATE NOT NULL,
    chapter VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    theme VARCHAR,
    primary_passages JSONB NOT NULL, -- {book, chapter, verses, translation}[]
    hebrew_analysis JSONB DEFAULT '{}',
    greek_analysis JSONB DEFAULT '{}',
    aramaic_analysis JSONB DEFAULT '{}',
    commentary TEXT,
    reflection_questions TEXT[],
    prayer_focus TEXT,
    practical_application TEXT,
    based_on_meeting UUID REFERENCES meeting_archives(id),
    created_by UUID REFERENCES users(id),
    status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Contact form submissions
CREATE TABLE contact_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR,
    chapter_interest VARCHAR,
    message TEXT NOT NULL,
    status contact_status DEFAULT 'new',
    assigned_to UUID REFERENCES users(id),
    response_notes TEXT,
    follow_up_date DATE,
    source VARCHAR DEFAULT 'website',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- User activity log
CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Spiritual progress tracking
CREATE TABLE spiritual_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_date DATE NOT NULL,
    scripture_study_completed BOOLEAN DEFAULT false,
    meeting_attended BOOLEAN DEFAULT false,
    prayer_time_minutes INTEGER DEFAULT 0,
    service_hours INTEGER DEFAULT 0,
    reflection_notes TEXT,
    goals_for_week TEXT[],
    challenges TEXT,
    growth_areas TEXT[],
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE(user_id, week_date)
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_chapter ON users(chapter);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_events_date_range ON events(start_date, end_date);
CREATE INDEX idx_events_chapter ON events(chapter);
CREATE INDEX idx_meeting_archives_date ON meeting_archives(meeting_date DESC);
CREATE INDEX idx_meeting_archives_chapter ON meeting_archives(chapter);
CREATE INDEX idx_scripture_packages_week ON scripture_packages(week_date DESC);
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_created ON contact_submissions(created_at DESC);

-- Full text search indexes
CREATE INDEX idx_meeting_archives_fts ON meeting_archives USING gin(to_tsvector('english', notes || ' ' || COALESCE(transcript, '')));
CREATE INDEX idx_scripture_packages_fts ON scripture_packages USING gin(to_tsvector('english', title || ' ' || theme || ' ' || COALESCE(commentary, '')));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meeting_archives_updated_at BEFORE UPDATE ON meeting_archives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scripture_packages_updated_at BEFORE UPDATE ON scripture_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_submissions_updated_at BEFORE UPDATE ON contact_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spiritual_progress_updated_at BEFORE UPDATE ON spiritual_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripture_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE spiritual_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile and leaders can view all" ON users
    FOR SELECT USING (
        auth.uid()::text = auth_id::text OR 
        auth.uid() IN (SELECT auth_id FROM users WHERE role IN ('leader', 'admin'))
    );

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = auth_id::text);

CREATE POLICY "Leaders can update member profiles" ON users
    FOR UPDATE USING (
        auth.uid() IN (SELECT auth_id FROM users WHERE role IN ('leader', 'admin'))
    );

-- RLS Policies for events table
CREATE POLICY "All authenticated users can view events" ON events
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only leaders can create events" ON events
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT auth_id FROM users WHERE role IN ('leader', 'admin'))
    );

CREATE POLICY "Only leaders can update events" ON events
    FOR UPDATE USING (
        auth.uid() IN (SELECT auth_id FROM users WHERE role IN ('leader', 'admin'))
    );

-- RLS Policies for meeting_archives table
CREATE POLICY "All authenticated users can view meeting archives" ON meeting_archives
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only leaders can create meeting archives" ON meeting_archives
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT auth_id FROM users WHERE role IN ('leader', 'admin'))
    );

CREATE POLICY "Only leaders can update meeting archives" ON meeting_archives
    FOR UPDATE USING (
        auth.uid() IN (SELECT auth_id FROM users WHERE role IN ('leader', 'admin'))
    );

-- RLS Policies for scripture_packages table
CREATE POLICY "All authenticated users can view scripture packages" ON scripture_packages
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only leaders can create scripture packages" ON scripture_packages
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT auth_id FROM users WHERE role IN ('leader', 'admin'))
    );

CREATE POLICY "Only leaders can update scripture packages" ON scripture_packages
    FOR UPDATE USING (
        auth.uid() IN (SELECT auth_id FROM users WHERE role IN ('leader', 'admin'))
    );

-- RLS Policies for contact_submissions table
CREATE POLICY "Anyone can create contact submissions" ON contact_submissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Only leaders can view contact submissions" ON contact_submissions
    FOR SELECT USING (
        auth.uid() IN (SELECT auth_id FROM users WHERE role IN ('leader', 'admin'))
    );

CREATE POLICY "Only leaders can update contact submissions" ON contact_submissions
    FOR UPDATE USING (
        auth.uid() IN (SELECT auth_id FROM users WHERE role IN ('leader', 'admin'))
    );

-- RLS Policies for user_activity table
CREATE POLICY "Users can view their own activity" ON user_activity
    FOR SELECT USING (
        auth.uid()::text = (SELECT auth_id::text FROM users WHERE id = user_id) OR
        auth.uid() IN (SELECT auth_id FROM users WHERE role IN ('leader', 'admin'))
    );

-- RLS Policies for spiritual_progress table
CREATE POLICY "Users can view and update their own progress" ON spiritual_progress
    FOR ALL USING (
        auth.uid()::text = (SELECT auth_id::text FROM users WHERE id = user_id)
    );

CREATE POLICY "Leaders can view all spiritual progress" ON spiritual_progress
    FOR SELECT USING (
        auth.uid() IN (SELECT auth_id FROM users WHERE role IN ('leader', 'admin'))
    );

-- Insert initial data (optional)
-- You can add initial admin user, chapters, etc. here

-- Functions for common operations

-- Function to get user by auth_id
CREATE OR REPLACE FUNCTION get_user_by_auth_id(user_auth_id UUID)
RETURNS TABLE(user_data JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT row_to_json(u.*)::jsonb as user_data
    FROM users u
    WHERE u.auth_id = user_auth_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (auth_id, email, username, full_name, chapter)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'chapter', 'Georgetown')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Function to search meeting archives
CREATE OR REPLACE FUNCTION search_meeting_archives(
    search_term TEXT,
    user_chapter TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(
    id UUID,
    meeting_date DATE,
    chapter VARCHAR,
    title VARCHAR,
    notes TEXT,
    tags VARCHAR[],
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ma.id,
        ma.meeting_date,
        ma.chapter,
        ma.title,
        ma.notes,
        ma.tags,
        ts_rank(to_tsvector('english', ma.notes || ' ' || COALESCE(ma.transcript, '')), plainto_tsquery('english', search_term)) as rank
    FROM meeting_archives ma
    WHERE 
        (user_chapter IS NULL OR ma.chapter = user_chapter) AND
        to_tsvector('english', ma.notes || ' ' || COALESCE(ma.transcript, '')) @@ plainto_tsquery('english', search_term)
    ORDER BY rank DESC, ma.meeting_date DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get weekly spiritual progress summary
CREATE OR REPLACE FUNCTION get_spiritual_progress_summary(
    user_auth_id UUID,
    weeks_back INTEGER DEFAULT 4
)
RETURNS TABLE(
    week_date DATE,
    scripture_completed BOOLEAN,
    meeting_attended BOOLEAN,
    prayer_minutes INTEGER,
    service_hours INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.week_date,
        sp.scripture_study_completed,
        sp.meeting_attended,
        sp.prayer_time_minutes,
        sp.service_hours
    FROM spiritual_progress sp
    JOIN users u ON u.id = sp.user_id
    WHERE 
        u.auth_id = user_auth_id AND
        sp.week_date >= CURRENT_DATE - INTERVAL '1 week' * weeks_back
    ORDER BY sp.week_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE users IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE events IS 'Calendar events and meetings';
COMMENT ON TABLE meeting_archives IS 'Archived meeting notes and transcripts';
COMMENT ON TABLE scripture_packages IS 'Weekly scripture study packages with analysis';
COMMENT ON TABLE contact_submissions IS 'Contact form submissions from website';
COMMENT ON TABLE user_activity IS 'User activity tracking for analytics';
COMMENT ON TABLE spiritual_progress IS 'Weekly spiritual growth tracking';