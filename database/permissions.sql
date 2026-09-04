-- PERMISSIONS & RBAC SCHEMA
-- Supabase PostgreSQL

-- 1. PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ROLE PERMISSIONS DEFAULT MATRIX
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL CHECK (role IN ('DEVELOPER', 'LEADER', 'MEMBER')),
    permission_key TEXT NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(role, permission_key)
);

-- 3. USER PERMISSION INDIVIDUAL OVERRIDES
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
    allowed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, permission_key)
);

-- SEED SYSTEM PERMISSIONS
INSERT INTO public.permissions (key, name, description) VALUES
  ('VIEW_DASHBOARD', 'View Dashboard', 'Allows user to view operational dashboard metrics'),
  ('VIEW_CASES', 'View Cases', 'Allows user to view authorized cases'),
  ('VIEW_CASE_DETAILS', 'View Case Details', 'Allows user to view full case specifications'),
  ('VIEW_MAP', 'View Map', 'Allows user to view Iraq threat map'),
  ('VIEW_NOTIFICATIONS', 'View Notifications', 'Allows user to view threat alerts'),
  ('CREATE_CASE', 'Create Case', 'Allows user to log new incident cases'),
  ('EDIT_CASE', 'Edit Case', 'Allows user to modify existing cases'),
  ('RESOLVE_CASE', 'Resolve Case', 'Allows user to resolve or close cases'),
  ('DELETE_CASE', 'Delete Case', 'Allows user to permanently delete cases'),
  ('ASSIGN_CASE', 'Assign Team', 'Allows user to assign maintenance teams to cases'),
  ('ADD_CASE_NOTE', 'Add Case Note', 'Allows user to attach field notes'),
  ('VIEW_ALL_CASES', 'View All Cases', 'Allows user to view cases across all regions'),
  ('VIEW_TEAM_CASES', 'View Team Cases', 'Allows user to view team cases'),
  ('VIEW_REGION_CASES', 'View Region Cases', 'Allows user to view region cases'),
  ('MANAGE_USERS', 'Manage Users', 'Allows developer to manage users & link accounts'),
  ('MANAGE_ROLES', 'Manage Roles', 'Allows developer to assign roles'),
  ('MANAGE_PERMISSIONS', 'Manage Permissions', 'Allows developer to override permissions'),
  ('MANAGE_TEAMS', 'Manage Teams', 'Allows developer to create & assign teams'),
  ('MANAGE_REGIONS', 'Manage Regions', 'Allows developer to manage region mappings'),
  ('VIEW_STATISTICS', 'View System Statistics', 'Allows user to view analytics'),
  ('VIEW_AUDIT_LOG', 'View Audit Logs', 'Allows developer to view security audit logs'),
  ('VIEW_ARCHIVE', 'View Task Archive', 'Allows user to view closed task archive'),
  ('SEARCH_ARCHIVE', 'Search Archive', 'Allows user to search archived historical cases'),
  ('RESTORE_TASK', 'Restore Task', 'Allows developer to restore archived cases back to active')
ON CONFLICT (key) DO NOTHING;

-- SEED ROLE PERMISSION DEFAULTS
-- DEVELOPER: All permissions
INSERT INTO public.role_permissions (role, permission_key)
SELECT 'DEVELOPER', key FROM public.permissions
ON CONFLICT (role, permission_key) DO NOTHING;

-- LEADER: Operational + Team + Region + Archive permissions
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('LEADER', 'VIEW_DASHBOARD'),
  ('LEADER', 'VIEW_CASES'),
  ('LEADER', 'VIEW_CASE_DETAILS'),
  ('LEADER', 'VIEW_MAP'),
  ('LEADER', 'VIEW_NOTIFICATIONS'),
  ('LEADER', 'CREATE_CASE'),
  ('LEADER', 'EDIT_CASE'),
  ('LEADER', 'RESOLVE_CASE'),
  ('LEADER', 'DELETE_CASE'),
  ('LEADER', 'ASSIGN_CASE'),
  ('LEADER', 'ADD_CASE_NOTE'),
  ('LEADER', 'VIEW_TEAM_CASES'),
  ('LEADER', 'VIEW_REGION_CASES'),
  ('LEADER', 'VIEW_STATISTICS'),
  ('LEADER', 'VIEW_ARCHIVE'),
  ('LEADER', 'SEARCH_ARCHIVE')
ON CONFLICT (role, permission_key) DO NOTHING;

-- MEMBER: Operational viewing + notes + creating
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('MEMBER', 'VIEW_DASHBOARD'),
  ('MEMBER', 'VIEW_CASES'),
  ('MEMBER', 'VIEW_CASE_DETAILS'),
  ('MEMBER', 'VIEW_MAP'),
  ('MEMBER', 'VIEW_NOTIFICATIONS'),
  ('MEMBER', 'CREATE_CASE'),
  ('MEMBER', 'ADD_CASE_NOTE'),
  ('MEMBER', 'DELETE_CASE')
ON CONFLICT (role, permission_key) DO NOTHING;

-- RLS POLICIES
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read permissions" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "Public read role_permissions" ON public.role_permissions FOR SELECT USING (true);
CREATE POLICY "Public read user_permissions" ON public.user_permissions FOR SELECT USING (true);
CREATE POLICY "Public write user_permissions" ON public.user_permissions FOR ALL USING (true);
