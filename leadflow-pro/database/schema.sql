-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Lead Status Enum or Table
CREATE TYPE lead_status_enum AS ENUM ('DISCOVERED', 'STRATEGY_CREATED', 'PREVIEW_READY', 'CONTACTED', 'WON', 'LOST');

-- Leads Table: Stores potential clients found by Discovery Agent
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    website VARCHAR(255), -- Can be NULL if they don't have one (target audience)
    industry VARCHAR(100),
    location VARCHAR(255), -- e.g., "Zurich, CH"
    rating DECIMAL(2, 1), -- Google Maps rating
    review_count INT,
    phone VARCHAR(50),
    email VARCHAR(255),
    source VARCHAR(50) DEFAULT 'google_maps',
    status lead_status_enum DEFAULT 'DISCOVERED',
    strategy_brief JSONB, -- Stores LLM generated design strategy
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template Memory: HTML/CSS Snippets for Creator Agent
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- e.g., 'hero', 'gallery', 'contact', 'footer'
    content TEXT NOT NULL, -- HTML content
    css TEXT, -- Specific CSS if needed (though Tailwind is preferred)
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Memory: CRM/Interaction Logs
CREATE TABLE lead_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL, -- 'email', 'call', 'note', 'status_change', 'analysis'
    content TEXT, -- Email body, call transcript, analysis result
    sentiment VARCHAR(50),
    agent_id VARCHAR(50), -- Which agent performed the action (Discovery, Strategy, Contact)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Sites: Preview pages created by Strategy/Creator Agent
CREATE TABLE generated_sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    slug VARCHAR(255) UNIQUE NOT NULL, -- For the unique preview URL
    title VARCHAR(255),
    structure JSONB, -- Defines which sections/templates are used
    custom_content JSONB, -- Text/Images specific to this lead
    is_published BOOLEAN DEFAULT TRUE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_location ON leads(location);
CREATE INDEX idx_generated_sites_slug ON generated_sites(slug);

CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL, -- 'EMAIL', 'CALL'
    content TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
