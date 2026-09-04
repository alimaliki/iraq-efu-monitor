-- TELEGRAM AUTH & USER MANAGEMENT EXTENSIONS
-- Supabase PostgreSQL

-- 1. EXTEND USERS TABLE FOR SECURE TELEGRAM LINKING & RBAC
ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS telegram_username TEXT,
    ADD COLUMN IF NOT EXISTS telegram_first_name TEXT,
    ADD COLUMN IF NOT EXISTS telegram_last_name TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES public.provinces(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMPTZ;

-- Ensure telegram_id has unique index if set
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telegram_id_unique ON public.users(telegram_user_id) WHERE telegram_user_id IS NOT NULL;

-- 2. TELEGRAM LINKING TOKENS TABLE (Secure 1-time single-use linking)
CREATE TABLE IF NOT EXISTS public.telegram_linking_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_linking_tokens_token ON public.telegram_linking_tokens(token);

-- 3. BOT MULTI-STEP WORKFLOW STATES (Database-backed serverless session state)
CREATE TABLE IF NOT EXISTS public.bot_states (
    telegram_id BIGINT PRIMARY KEY,
    state TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.telegram_linking_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Server bot access linking tokens" ON public.telegram_linking_tokens FOR ALL USING (true);
CREATE POLICY "Server bot access bot states" ON public.bot_states FOR ALL USING (true);
