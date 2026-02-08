-- Supabase Schema for LeadFlow Pro
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT,
    status TEXT DEFAULT 'NEW',
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    industry TEXT,
    location TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    rating FLOAT,
    review_count INTEGER,
    analysis JSONB -- For storing AI-generated strategies
);
-- Index for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);