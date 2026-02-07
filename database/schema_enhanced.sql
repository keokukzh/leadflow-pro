-- ============================================
-- LeadFlow Pro - Enhanced Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    industry TEXT,
    location TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    google_rating FLOAT DEFAULT 0,
    google_reviews_count INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'DEMO_SENT', 'INTERESTED', 'PROPOSAL', 'CLOSED_WON', 'CLOSED_LOST', 'DO_NOT_CONTACT')),
    source TEXT,
    notes TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- VOICE CALLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS voice_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    provider TEXT NOT NULL DEFAULT 'vapi' CHECK (provider IN ('twilio', 'vapi')),
    call_sid TEXT,
    phone_number TEXT NOT NULL,
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'ringing', 'in_progress', 'completed', 'failed', 'busy', 'no_answer')),
    duration INTEGER, -- seconds
    recording_url TEXT,
    transcript TEXT,
    cost DECIMAL(10, 4) DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- EMAIL LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    provider TEXT NOT NULL DEFAULT 'resend',
    email TEXT NOT NULL,
    template TEXT CHECK (template IN ('lead_intro', 'demo_sent', 'follow_up', 'newsletter')),
    subject TEXT,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    message_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ACTIVITIES TABLE (Timeline)
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('call', 'email', 'note', 'status_change', 'website_created', 'demo_sent', 'proposal_sent')),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PREVIEW SENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS preview_sents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    template_id TEXT NOT NULL,
    preview_url TEXT NOT NULL,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'viewed', 'approved', 'rejected')),
    viewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES (Performance)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_location ON leads(location);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calls_lead ON voice_calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON voice_calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_created ON voice_calls(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_emails_lead ON email_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_emails_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_emails_created ON email_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_preview_sents_lead ON preview_sents(lead_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for leads
DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SAMPLE DATA (Optional)
-- ============================================
-- INSERT INTO leads (company_name, phone, industry, location, google_rating, google_reviews_count) VALUES
-- ('Restaurant Limmat', '+41791234567', 'restaurant', 'Zürich', 4.5, 127),
-- ('Hotel Adler', '+41441234567', 'hotel', 'Bern', 4.3, 89);

-- ============================================
-- RLS POLICIES (Security)
-- ============================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE preview_sents ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to access their data
CREATE POLICY "Users can CRUD their leads" ON leads
    FOR ALL USING (auth.uid() = assigned_to OR assigned_to IS NULL);

CREATE POLICY "Users can view their calls" ON voice_calls
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM leads WHERE leads.id = voice_calls.lead_id 
                AND (leads.assigned_to = auth.uid() OR leads.assigned_to IS NULL))
    );

CREATE POLICY "Users can view their emails" ON email_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM leads WHERE leads.id = email_logs.lead_id 
                AND (leads.assigned_to = auth.uid() OR leads.assigned_to IS NULL))
    );

-- ============================================
-- DONE!
-- ============================================
-- Run this in Supabase SQL Editor
-- Then update your .env.local with credentials
