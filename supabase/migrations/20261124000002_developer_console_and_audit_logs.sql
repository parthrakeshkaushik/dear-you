-- ==============================================================================
-- DEAR YOU — MIGRATION: DEVELOPER CONSOLE, RBAC, AUDIT LOGS & POLICY ACCEPTANCE
-- ==============================================================================

-- 1. Extend admin_users / users table with roles and account status
ALTER TABLE public.admin_users
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'creator' CHECK (role IN ('developer', 'creator')),
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended')),
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Policy Acceptances Table
CREATE TABLE IF NOT EXISTS public.policy_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    terms_accepted BOOLEAN NOT NULL DEFAULT TRUE,
    terms_version TEXT NOT NULL DEFAULT 'v1.0',
    terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    privacy_policy_version TEXT NOT NULL DEFAULT 'v1.0',
    privacy_policy_accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Developer Audit Logs Table
CREATE TABLE IF NOT EXISTS public.developer_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    developer_email TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_user_id UUID,
    target_gift_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    action_result TEXT NOT NULL DEFAULT 'success',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Platform Activity Events (for aggregated analytics)
CREATE TABLE IF NOT EXISTS public.platform_activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    gift_id UUID REFERENCES public.gifts(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    device_type TEXT, -- 'mobile', 'tablet', 'desktop'
    event_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_policy_acceptances_user ON public.policy_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_developer ON public.developer_audit_logs(developer_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.developer_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_events_type ON public.platform_activity_events(event_type);

-- RLS
ALTER TABLE public.policy_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_activity_events ENABLE ROW LEVEL SECURITY;

-- Developers can view all audit logs, regular users cannot
CREATE POLICY "Developers can view audit logs"
    ON public.developer_audit_logs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE id = auth.uid() AND role = 'developer'
    ));

-- System service can insert audit logs
CREATE POLICY "Admins can insert audit logs"
    ON public.developer_audit_logs FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy acceptances policies
CREATE POLICY "Users can view their own policy acceptances"
    ON public.policy_acceptances FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Developers can view all policy acceptances"
    ON public.policy_acceptances FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE id = auth.uid() AND role = 'developer'
    ));
