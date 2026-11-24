-- ==============================================================================
-- DEAR YOU — MIGRATION: DEVELOPER MODERATION SYSTEM & EMAIL VERIFICATION
-- ==============================================================================

-- 1. Extend gifts table with moderation and soft-deletion tracking
ALTER TABLE public.gifts
ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'active' CHECK (moderation_status IN ('active', 'paused', 'unpublished', 'deleted')),
ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- 2. Extend admin_users table with email verification & suspension details
ALTER TABLE public.admin_users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- 3. Create performance indexes for moderation status and account status
CREATE INDEX IF NOT EXISTS idx_gifts_moderation_status ON public.gifts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_gifts_deleted_at ON public.gifts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_admin_users_account_status ON public.admin_users(account_status);
CREATE INDEX IF NOT EXISTS idx_admin_users_email_verified ON public.admin_users(email_verified);

-- 4. Update Row Level Security Policies for gifts
-- Public recipients can ONLY view gifts that are published, active (not paused/unpublished), and not soft-deleted
DROP POLICY IF EXISTS "Public can view published active gifts metadata" ON public.gifts;
CREATE POLICY "Public can view published active gifts metadata"
    ON public.gifts FOR SELECT
    USING (
        status = 'published' AND
        moderation_status = 'active' AND
        deleted_at IS NULL
    );

-- Creators can access their own gifts provided they are not soft-deleted by platform moderation
DROP POLICY IF EXISTS "Admins have full access to their own gifts" ON public.gifts;
CREATE POLICY "Admins have full access to their own gifts"
    ON public.gifts FOR ALL
    USING (
        owner_id = auth.uid() AND
        deleted_at IS NULL
    );

-- Authorized developers have unrestricted moderation access over all gifts
CREATE POLICY "Developers have full moderation access to all gifts"
    ON public.gifts FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE id = auth.uid() AND role = 'developer'
    ));

-- Refresh schema permissions for Supabase PostgREST roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
