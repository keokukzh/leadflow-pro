-- ============================================
-- LeadFlow Pro Database Optimization
-- Generated: 2026-02-05
-- P0 Features - Database Indexes
-- ====================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- ============================================
-- LEADS TABLE INDEXES
-- ============================================

-- Single column indexes
CREATE INDEX IF NOT EXISTS idx_leads_location 
ON leads(location(50));

CREATE INDEX IF NOT EXISTS idx_leads_industry 
ON leads(industry(50));

CREATE INDEX IF NOT EXISTS idx_leads_rating 
ON leads(rating DESC);

CREATE INDEX IF NOT EXISTS idx_leads_created 
ON leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_website_status 
ON leads(website_status);

CREATE INDEX IF NOT EXISTS idx_leads_score 
ON leads(calculated_score DESC);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_leads_city_industry 
ON leads(location(50), industry(50));

CREATE INDEX IF NOT EXISTS idx_leads_no_website 
ON leads(website_status) 
WHERE website_status IN ('KEINE WEBSITE', 'KEINE', 'fehlt');

-- Partial index for high-value leads
CREATE INDEX IF NOT EXISTS idx_leads_high_value 
ON leads(location, calculated_score DESC) 
WHERE calculated_score >= 75;

-- Text search index
CREATE INDEX IF NOT EXISTS idx_leads_search 
ON leads USING GIN (to_tsvector('german', company_name || ' ' || industry));

-- ============================================
-- USERS TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_created 
ON users(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_role 
ON users(role);

-- ============================================
-- TEMPLATES TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_templates_type 
ON templates(template_type);

CREATE INDEX IF NOT EXISTS idx_templates_industry 
ON templates(industry(50));

-- ============================================
-- AUDIT LOGS TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_audit_created 
ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_user 
ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_action 
ON audit_logs(action);

-- ============================================
-- FOREIGN KEYS
-- ============================================

ALTER TABLE leads 
ADD CONSTRAINT IF NOT EXISTS fk_leads_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE templates 
ADD CONSTRAINT IF NOT EXISTS fk_templates_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE audit_logs 
ADD CONSTRAINT IF NOT EXISTS fk_audit_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- VIEWS FOR PERFORMANCE
-- ============================================

CREATE OR REPLACE VIEW v_leads_high_value AS
SELECT * FROM leads 
WHERE calculated_score >= 75
ORDER BY calculated_score DESC;

CREATE OR REPLACE VIEW v_leads_no_website AS
SELECT id, company_name, location, industry, rating, phone, email, calculated_score
FROM leads 
WHERE website_status IN ('KEINE WEBSITE', 'KEINE', 'fehlt')
ORDER BY calculated_score DESC;

CREATE OR REPLACE VIEW v_leads_by_city AS
SELECT location, COUNT(*) as count, AVG(calculated_score) as avg_score
FROM leads 
GROUP BY location
ORDER BY count DESC;

CREATE OR REPLACE VIEW v_leads_by_industry AS
SELECT industry, COUNT(*) as count, AVG(calculated_score) as avg_score, AVG(rating) as avg_rating
FROM leads 
WHERE industry IS NOT NULL
GROUP BY industry
ORDER BY count DESC;

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(array['leads', 'users', 'templates', 'audit_logs'])
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s', t, t);
        EXECUTE format('
            CREATE TRIGGER trg_%s_updated_at 
            BEFORE UPDATE ON %s 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at()', t, t);
    END LOOP;
END;
$$;

-- ============================================
-- PERFORMANCE FUNCTIONS
-- ============================================

-- Calculate lead score function
CREATE OR REPLACE FUNCTION calculate_lead_score(lead_row leads)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
BEGIN
    -- Website status (0-30 points)
    CASE lead_row.website_status
        WHEN 'KEINE WEBSITE' THEN score := score + 30;
        WHEN 'veraltet' THEN score := score + 20;
        WHEN 'gut' THEN score := score + 5;
        ELSE score := score + 10;
    END CASE;
    
    -- Rating (0-20 points)
    IF lead_row.rating >= 4.5 THEN score := score + 20;
    ELSIF lead_row.rating >= 4.0 THEN score := score + 15;
    ELSIF lead_row.rating >= 3.5 THEN score := score + 10;
    ELSE score := score + 5;
    END IF;
    
    -- Review count (0-15 points)
    IF lead_row.review_count >= 100 THEN score := score + 15;
    ELSIF lead_row.review_count >= 50 THEN score := score + 12;
    ELSIF lead_row.review_count >= 20 THEN score := score + 8;
    ELSIF lead_row.review_count >= 10 THEN score := score + 5;
    ELSE score := score + 2;
    END IF;
    
    -- Location value (0-15 points)
    IF lead_row.location ILIKE ANY(ARRAY['%zürich%', '%bern%', '%basel%', '%genf%']) THEN
        score := score + 15;
    ELSIF lead_row.location ILIKE ANY(ARRAY['%luzern%', '%winterthur%', '%st. gallen%']) THEN
        score := score + 10;
    ELSE
        score := score + 5;
    END IF;
    
    -- Contact availability (0-10 points)
    IF lead_row.phone IS NOT NULL THEN score := score + 10;
    ELSIF lead_row.email IS NOT NULL THEN score := score + 5;
    ELSE score := score + 2;
    END IF;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Update all lead scores
UPDATE leads SET calculated_score = calculate_lead_score(leads);

-- Create index on calculated score
CREATE INDEX IF NOT EXISTS idx_leads_calc_score 
ON leads(calculated_score DESC);

-- ============================================
-- ANALYZE
-- ============================================

ANALYZE;
VACUUM ANALYZE;

-- ============================================
-- DONE
-- ============================================

SELECT 'Migration complete: ' || now() AS status;
