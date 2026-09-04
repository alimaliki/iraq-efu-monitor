-- IRAQ EFU MONITOR Database Schema
-- Supabase PostgreSQL

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PROVINCES TABLE
CREATE TABLE IF NOT EXISTS public.provinces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    name_ar TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. REGION MAPPINGS TABLE
CREATE TABLE IF NOT EXISTS public.region_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_name TEXT NOT NULL UNIQUE,
    province_id UUID NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_user_id BIGINT UNIQUE,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL DEFAULT 'OPERATOR' CHECK (role IN ('ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'VIEWER')),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    team_id UUID,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    leader_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    province_id UUID REFERENCES public.provinces(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key back to users for team_id
ALTER TABLE public.users 
    DROP CONSTRAINT IF EXISTS fk_users_team,
    ADD CONSTRAINT fk_users_team FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- 6. CASES TABLE (Main source of truth with exact real incoming fields)
CREATE TABLE IF NOT EXISTS public.cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id TEXT NOT NULL UNIQUE, -- SRC
    fms_url TEXT, -- FMS ID URL
    department TEXT DEFAULT 'Support', -- Department
    region TEXT, -- Region (e.g. Nasria)
    province_id UUID REFERENCES public.provinces(id) ON DELETE SET NULL, -- Resolved governorate
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    fdt TEXT NOT NULL, -- FDT
    description TEXT NOT NULL, -- Description
    efu INT NOT NULL DEFAULT 0, -- EFU
    affected_users INT NOT NULL DEFAULT 0, -- Affected users
    maintenance TEXT DEFAULT 'WNS', -- Maintenance (Company / Operator)
    status TEXT NOT NULL DEFAULT 'Last Mile', -- Task status (e.g. Last Mile, In Progress)
    escalation TEXT NOT NULL DEFAULT 'Open', -- Escalation (Open / Closed)
    gr_request BOOLEAN NOT NULL DEFAULT FALSE, -- GR Request (Yes/No => true/false)
    priority TEXT NOT NULL DEFAULT 'MEDIUM', -- Derived Priority (LOW, MEDIUM, HIGH, CRITICAL)
    assigned_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CASE EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.case_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. CASE NOTES TABLE
CREATE TABLE IF NOT EXISTS public.case_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'INFO' CHECK (type IN ('INFO', 'WARNING', 'CRITICAL', 'SUCCESS')),
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TELEGRAM USERS TABLE
CREATE TABLE IF NOT EXISTS public.telegram_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT NOT NULL UNIQUE,
    raw_data JSONB,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR FAST QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_escalation ON public.cases(escalation);
CREATE INDEX IF NOT EXISTS idx_cases_province ON public.cases(province_id);
CREATE INDEX IF NOT EXISTS idx_cases_region ON public.cases(region);
CREATE INDEX IF NOT EXISTS idx_cases_maintenance ON public.cases(maintenance);
CREATE INDEX IF NOT EXISTS idx_cases_created ON public.cases(created_at DESC);

-- REALTIME CONFIGURATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.cases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Public read provinces" ON public.provinces FOR SELECT USING (true);
CREATE POLICY "Public read region_mappings" ON public.region_mappings FOR SELECT USING (true);
CREATE POLICY "Public read cases" ON public.cases FOR SELECT USING (true);
CREATE POLICY "Public write cases" ON public.cases FOR ALL USING (true);
CREATE POLICY "Public read case_events" ON public.case_events FOR SELECT USING (true);
CREATE POLICY "Public insert case_events" ON public.case_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read case_notes" ON public.case_notes FOR SELECT USING (true);
CREATE POLICY "Public insert case_notes" ON public.case_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public update users" ON public.users FOR ALL USING (true);
CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Public write notifications" ON public.notifications FOR ALL USING (true);
CREATE POLICY "Public read telegram_users" ON public.telegram_users FOR SELECT USING (true);
CREATE POLICY "Public write telegram_users" ON public.telegram_users FOR ALL USING (true);
